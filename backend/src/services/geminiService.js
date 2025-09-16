const axios = require("axios");
const courseService = require("./courseService");
const stringSimilarity = require("string-similarity");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL_BASE =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildUrlWithKey() {
  if (!GEMINI_API_KEY) throw new Error("❌ GEMINI_API_KEY missing in .env");
  return `${GEMINI_URL_BASE}?key=${GEMINI_API_KEY}`;
}

/**
 * 🔎 Ask Gemini to pick the best matching course name
 * Returns exact course title (from CSV list) or null
 */
async function findBestCourseName(question) {
  const names = courseService.courseNames.slice(0, 800); // limit for prompt safety
  if (!names.length) return null;

  const namesText = names.join("\n");

  const prompt = `
You are a precise assistant. 
Given the following list of available course titles (one per line), and a user's question:

Available course titles:
${namesText}

User question: "${question}"

Respond with EXACTLY ONE of:
- The exact course title (must match one from the list, case-sensitive)
- Or the word NO_MATCH if none are relevant.

Return ONLY that single line. Do not explain.
`;

  try {
    const url = buildUrlWithKey();
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    const resp = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const firstLine = raw.split(/\r?\n/)[0].trim();

    if (/^NO_MATCH$/i.test(firstLine)) return null;

    // Exact match
    const exact = courseService.courseNames.find((n) => n === firstLine);
    if (exact) return exact;

    // Case-insensitive match
    const ci = courseService.courseNames.find(
      (n) => n.toLowerCase() === firstLine.toLowerCase()
    );
    if (ci) return ci;

    // Fuzzy match fallback (⚠️ stricter threshold now)
    const best = stringSimilarity.findBestMatch(
      firstLine.toLowerCase(),
      courseService.courseNames.map((n) => n.toLowerCase())
    ).bestMatch;

    if (best.rating >= 0.6) { // 🔑 Only accept strong matches
      const idx = courseService.courseNames
        .map((n) => n.toLowerCase())
        .indexOf(best.target);
      return courseService.courseNames[idx] || null;
    }

    return null; // ❌ Reject weak / wrong matches
  } catch (err) {
    console.error(
      "geminiService.findBestCourseName error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * 🌐 General Gemini fallback (for non-course queries)
 * Returns plain HTML (never wrapped in ```html fences)
 */
async function askGeminiGeneral(question) {
  try {
    const url = buildUrlWithKey();

    const prompt = `
You are Medvarsity assistant.
Answer the user's question using only simple HTML tags (<p>, <ul>, <li>, <strong>).

Important:
- DO NOT use backticks.
- DO NOT wrap your answer in code fences.
- Just return plain HTML tags.

User question: "${question}"
`;

    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    const resp = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    let raw =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "<p>⚠️ Gemini did not return text.</p>";

    // Cleanup: remove accidental ```html fences
    raw = raw.replace(/```html|```/gi, "").trim();

    return raw;
  } catch (err) {
    console.error(
      "geminiService.askGeminiGeneral error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  findBestCourseName,
  askGeminiGeneral,
};
