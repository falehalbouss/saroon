// opentdb-loader.js — Sole data source for the game (no embedded content)
// Docs: https://opentdb.com/api_config.php
// Builds window.QUESTION_BANK live from OpenTDB API + caches in localStorage 24h

// ─── 1. Sync init: define category metadata + empty bank ────────────────────
window.QUESTION_BANK = {
  general: { name: "ثقافة عامة", icon: "🧠", questions: [] },
  history: { name: "تاريخ", icon: "📜", questions: [] },
  geography: { name: "جغرافيا", icon: "🌍", questions: [] },
  movies: { name: "ترفيه", icon: "🎬", questions: [] },
  science: { name: "علوم", icon: "🔬", questions: [] },
};

// Status flag — checked by app.jsx for loading/error UI
window.__opentdb = { status: "idle", total: 0, perCategory: {}, error: null };

// ─── 2. OpenTDB category mapping ────────────────────────────────────────────
// Sports and Celebrities questions are remapped to general so they're not lost
const NAME_TO_GAME = {
  "General Knowledge": "general",
  "Mythology": "general",
  "Art": "general",
  "Sports": "general",
  "Celebrities": "general",
  "History": "history",
  "Politics": "history",
  "Geography": "geography",
  "Entertainment: Film": "movies",
  "Entertainment: Television": "movies",
  "Entertainment: Japanese Anime & Manga": "movies",
  "Entertainment: Cartoon & Animations": "movies",
  "Entertainment: Books": "movies",
  "Entertainment: Music": "movies",
  "Entertainment: Musicals & Theatres": "movies",
  "Entertainment: Video Games": "movies",
  "Entertainment: Board Games": "movies",
  "Entertainment: Comics": "movies",
  "Science & Nature": "science",
  "Science: Computers": "science",
  "Science: Mathematics": "science",
  "Science: Gadgets": "science",
  "Animals": "science",
  "Vehicles": "science",
};

// ─── 3. Helpers ─────────────────────────────────────────────────────────────
function decodeHtml(s) {
  const t = document.createElement("textarea");
  t.innerHTML = s;
  return t.value;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function convertQuestion(q) {
  const question = decodeHtml(q.question);
  if (q.type === "boolean") {
    return { type: "tf", q: question, answer: q.correct_answer === "True", source: "opentdb" };
  }
  const correct = decodeHtml(q.correct_answer);
  const incorrect = q.incorrect_answers.map(decodeHtml);
  const options = shuffle([correct, ...incorrect]);
  return { type: "mcq", q: question, options, answer: options.indexOf(correct), source: "opentdb" };
}

function notifyReady() {
  window.dispatchEvent(new CustomEvent("opentdb:ready", { detail: window.__opentdb }));
}

// ─── 4. Cache ───────────────────────────────────────────────────────────────
const CACHE_KEY = "saroon_opentdb_v3";
const CACHE_HOURS = 24;

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_HOURS * 3600 * 1000) return null;
    return data.byCategory;
  } catch {
    return null;
  }
}

function saveCache(byCategory) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), byCategory }));
  } catch {}
}

// ─── 5. Fetch ───────────────────────────────────────────────────────────────
async function fetchBatch(amount) {
  const url = `https://opentdb.com/api.php?amount=${amount}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.response_code !== 0) throw new Error(`OpenTDB code ${data.response_code}`);
  return data.results;
}

async function fetchBatchWithRetry(amount, maxAttempts = 4) {
  let lastErr;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await fetchBatch(amount);
    } catch (err) {
      lastErr = err;
      const wait = 6000 * i;
      console.info(`OpenTDB: attempt ${i} failed (${err.message}), retry in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function bucketize(rawQuestions) {
  const result = {};
  for (const raw of rawQuestions) {
    const gameKey = NAME_TO_GAME[raw.category];
    if (!gameKey) continue;
    if (!result[gameKey]) result[gameKey] = [];
    result[gameKey].push(convertQuestion(raw));
  }
  return result;
}

function applyToBank(byCategory) {
  let total = 0;
  const perCategory = {};
  for (const [key, list] of Object.entries(byCategory)) {
    if (window.QUESTION_BANK[key]) {
      window.QUESTION_BANK[key].questions = list;
      perCategory[key] = list.length;
      total += list.length;
    }
  }
  return { total, perCategory };
}

// ─── 6. Main flow ───────────────────────────────────────────────────────────
async function fetchAndApply() {
  console.info("OpenTDB: fetching live from api.opentdb.com...");
  window.__opentdb = { status: "fetching", total: 0, perCategory: {}, error: null, retry: window.__opentdb.retry };
  notifyReady();

  try {
    const batch1 = await fetchBatchWithRetry(50);
    await new Promise((r) => setTimeout(r, 6000));
    const batch2 = await fetchBatchWithRetry(50);
    const byCategory = bucketize([...batch1, ...batch2]);
    saveCache(byCategory);
    const { total, perCategory } = applyToBank(byCategory);
    window.__opentdb = { status: "fetched", total, perCategory, error: null, retry: window.__opentdb.retry };
    console.info(`OpenTDB: fetched and applied ${total} questions`, perCategory);
    notifyReady();
  } catch (err) {
    window.__opentdb = { status: "error", total: 0, perCategory: {}, error: String(err.message || err), retry: window.__opentdb.retry };
    console.warn("OpenTDB fetch failed:", err);
    notifyReady();
  }
}

// Retry hook — clears cache, resets bank, refetches
window.__opentdb.retry = async function () {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
  for (const cat of Object.values(window.QUESTION_BANK)) cat.questions = [];
  await fetchAndApply();
};

(async function () {
  const cached = loadCache();
  if (cached) {
    const { total, perCategory } = applyToBank(cached);
    window.__opentdb = { status: "loaded_from_cache", total, perCategory, error: null, retry: window.__opentdb.retry };
    console.info(`OpenTDB: loaded ${total} cached questions`, perCategory);
    notifyReady();
    return;
  }
  await fetchAndApply();
})();
