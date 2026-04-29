// opentdb-loader.js — Live fetch from OpenTDB API
// Docs: https://opentdb.com/api_config.php
// Fetches at runtime, caches in localStorage 24h, merges into window.QUESTION_BANK
(async function () {
  const CACHE_KEY = "saroon_opentdb_v1";
  const CACHE_HOURS = 24;

  // Map OpenTDB category names → game category keys
  const NAME_TO_GAME = {
    "General Knowledge": "general",
    "Mythology": "general",
    "Sports": "sports",
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
    "Celebrities": "celebs",
    "Science & Nature": "science",
    "Science: Computers": "science",
    "Science: Mathematics": "science",
    "Science: Gadgets": "science",
    "Animals": "science",
    "Vehicles": "science",
    "Art": "general",
  };

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
      return {
        type: "tf",
        q: question,
        answer: q.correct_answer === "True",
        source: "opentdb",
      };
    }
    const correct = decodeHtml(q.correct_answer);
    const incorrect = q.incorrect_answers.map(decodeHtml);
    const options = shuffle([correct, ...incorrect]);
    return {
      type: "mcq",
      q: question,
      options,
      answer: options.indexOf(correct),
      source: "opentdb",
    };
  }

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
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), byCategory }),
      );
    } catch {}
  }

  async function fetchBatch(amount) {
    const url = `https://opentdb.com/api.php?amount=${amount}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.response_code !== 0) throw new Error(`OpenTDB code ${data.response_code}`);
    return data.results;
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

  function merge(byCategory) {
    if (!window.QUESTION_BANK) return { total: 0, perCategory: {} };
    let total = 0;
    const perCategory = {};
    for (const [key, extras] of Object.entries(byCategory)) {
      if (window.QUESTION_BANK[key]) {
        window.QUESTION_BANK[key].questions.push(...extras);
        perCategory[key] = extras.length;
        total += extras.length;
      }
    }
    return { total, perCategory };
  }

  // Expose status for diagnostics
  window.__opentdb = { status: "starting", total: 0, perCategory: {} };

  const cached = loadCache();
  if (cached) {
    const merged = merge(cached);
    window.__opentdb = { status: "loaded_from_cache", ...merged };
    console.info(`OpenTDB: loaded ${merged.total} cached questions`, merged.perCategory);
    return;
  }

  async function fetchBatchWithRetry(amount, maxAttempts = 4) {
    let lastErr;
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        return await fetchBatch(amount);
      } catch (err) {
        lastErr = err;
        const wait = 6000 * i;
        console.info(`OpenTDB: attempt ${i} failed (${err.message}), retrying in ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    throw lastErr;
  }

  console.info("OpenTDB: fetching fresh questions from api.opentdb.com...");
  window.__opentdb.status = "fetching";
  try {
    const batch1 = await fetchBatchWithRetry(50);
    await new Promise((r) => setTimeout(r, 6000));
    const batch2 = await fetchBatchWithRetry(50);
    const byCategory = bucketize([...batch1, ...batch2]);
    saveCache(byCategory);
    const merged = merge(byCategory);
    window.__opentdb = { status: "fetched", ...merged };
    console.info(`OpenTDB: fetched and merged ${merged.total} new questions`, merged.perCategory);
  } catch (err) {
    window.__opentdb = { status: "error", error: String(err) };
    console.warn("OpenTDB fetch failed:", err);
  }
})();
