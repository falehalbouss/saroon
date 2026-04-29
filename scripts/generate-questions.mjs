import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const QUESTIONS_PATH = resolve(ROOT, "questions.js");
const OUTPUT_PATH = resolve(ROOT, "questions-ai.js");

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const COUNT = parseInt(args.count ?? "25", 10);
const MODEL = args.model ?? "gemini-2.0-flash";
const MAX_RETRIES = 4;

if (!process.env.GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY missing — copy .env.example to .env and paste your key.");
  process.exit(1);
}

function loadBank() {
  const code = readFileSync(QUESTIONS_PATH, "utf8");
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.window.QUESTION_BANK;
}

const SYSTEM_PROMPT = `أنت كاتب أسئلة محترف للعبة مسابقات عربية اسمها "سارونة". مهمتك توليد أسئلة بالعربية الفصحى أصيلة (ليست مترجمة)، متنوعة في الصعوبة، تناسب جمهور خليجي/عربي.

أنواع الأسئلة:
- mcq: { type: "mcq", q: "نص السؤال", options: ["خيار1","خيار2","خيار3","خيار4"], answer: <0-3> }
- tf: { type: "tf", q: "عبارة قابلة للحكم", answer: <true|false> }
- text: { type: "text", q: "نص السؤال", answer: ["بديل1","بديل2",...] }
- image: { type: "image", q: "نص السؤال", emoji: "🎯", options: ["خيار1","خيار2","خيار3","خيار4"], answer: <0-3> }

قواعد إجبارية:
- ضمان صحة الإجابة 100%
- خيارات MCQ مميزة، لا تكرار
- text يحتاج بدائل متعددة (مثلاً ["الرياض","رياض"] أو ["11","١١","احد عشر","أحد عشر"])
- لا تكرر أسئلة موجودة في البنك
- وزّع الأنواع: ~50% mcq، ~25% tf، ~15% text، ~10% image
- تجنّب الأسئلة الإشكالية سياسياً أو مذهبياً
- استخدم وقائع موثقة فقط

أرجع JSON صرف بالشكل التالي بدون أي شرح أو نص قبل/بعد:
{
  "questions": [ ... ]
}`;

function userPrompt(catKey, catName, catIcon, existing, count) {
  const existingList = existing.map((q, i) => `${i + 1}. [${q.type}] ${q.q}`).join("\n");
  return `الفئة: ${catName} ${catIcon} (مفتاح: ${catKey})

أسئلة موجودة في البنك (لا تكررها):
${existingList}

ولّد ${count} سؤالاً جديداً لهذه الفئة. أرجع JSON فقط.`;
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function callWithRetry(catKey, userMsg) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await ai.models.generateContent({
        model: MODEL,
        contents: userMsg,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      });
    } catch (err) {
      lastErr = err;
      const msg = String(err.message || err);
      const transient = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overload") || msg.includes("429");
      if (!transient || attempt === MAX_RETRIES) throw err;
      const wait = Math.min(2 ** attempt * 1000, 30000);
      process.stdout.write(`(retry ${attempt} in ${wait / 1000}s) `);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function generateForCategory(catKey, catData, count) {
  const userMsg = userPrompt(catKey, catData.name, catData.icon, catData.questions, count);
  const response = await callWithRetry(catKey, userMsg);

  const text = response.text;
  if (!text) throw new Error(`Empty response for ${catKey}`);

  const parsed = JSON.parse(text);
  return {
    questions: parsed.questions || [],
    usage: response.usageMetadata,
  };
}

function validate(questions, catKey) {
  const errors = [];
  questions.forEach((q, i) => {
    const where = `${catKey}[${i}]`;
    if (q.type === "mcq" || q.type === "image") {
      if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${where}: needs 4 options`);
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) errors.push(`${where}: bad answer index`);
      if (q.type === "image" && !q.emoji) errors.push(`${where}: image missing emoji`);
    } else if (q.type === "tf") {
      if (typeof q.answer !== "boolean") errors.push(`${where}: tf needs boolean answer`);
    } else if (q.type === "text") {
      if (!Array.isArray(q.answer) || q.answer.length === 0) errors.push(`${where}: text needs answer array`);
    } else {
      errors.push(`${where}: unknown type ${q.type}`);
    }
  });
  return errors;
}

function emitFile(byCategory) {
  const lines = [
    "// مولّد آلياً عبر Google Gemini API — لا تعدله يدوياً.",
    "// لإعادة التوليد: npm run generate",
    "// يدمج في window.QUESTION_BANK الموجود من questions.js",
    "(function () {",
    "  const ai = " + JSON.stringify(byCategory, null, 2) + ";",
    "  if (!window.QUESTION_BANK) return;",
    "  for (const [key, extra] of Object.entries(ai)) {",
    "    if (window.QUESTION_BANK[key]) {",
    "      window.QUESTION_BANK[key].questions.push(...extra);",
    "    }",
    "  }",
    "})();",
    "",
  ];
  writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");
}

async function main() {
  const bank = loadBank();
  const categoryKeys = Object.keys(bank);
  console.log(`Generating ${COUNT} questions × ${categoryKeys.length} categories using ${MODEL}…`);
  console.log("(Free tier: 15 requests/min, 1500/day — well within limits)\n");

  const byCategory = {};
  let totalIn = 0, totalOut = 0;

  for (const catKey of categoryKeys) {
    const cat = bank[catKey];
    process.stdout.write(`  ${catKey} (${cat.name})… `);
    try {
      const { questions, usage } = await generateForCategory(catKey, cat, COUNT);
      const errors = validate(questions, catKey);
      if (errors.length) {
        console.log(`⚠️  ${questions.length} questions, ${errors.length} validation errors`);
        errors.slice(0, 3).forEach((e) => console.log(`     ${e}`));
      } else {
        console.log(`✓ ${questions.length} questions`);
      }
      byCategory[catKey] = questions;
      totalIn += usage?.promptTokenCount ?? 0;
      totalOut += usage?.candidatesTokenCount ?? 0;
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }

    // Stay well under 15 RPM (free tier limit)
    await new Promise((r) => setTimeout(r, 5000));
  }

  emitFile(byCategory);

  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(`Tokens: ${totalIn} in / ${totalOut} out`);
  console.log(`Cost: $0.00 (free tier)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
