// backend/src/services/geminiService.js
const axios = require("axios");
const courseService = require("./courseService");
const stringSimilarity = require("string-similarity");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL_BASE =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildUrlWithKey() {
  const key = GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing in env");
  return `${GEMINI_URL_BASE}?key=${key}`;
}

// 🔎 Ask Gemini to choose the best course name from CSV list
async function findBestCourseName(question) {
  const names = courseService.courseNames.slice(0, 800); // limit
  if (!names.length) return null;

  const namesText = names.join("\n");

  const prompt = `
You are a precise assistant. Given the following list of available course titles (one per line), and a user's question, respond with exactly ONE of the following on the first line only:
- The exact matching course title from the list (case-sensitive, exactly as in the list).
- Or the single token NO_MATCH if none of the listed courses are relevant.

Available course titles:
${namesText}

User question: "${question}"

Return ONLY the exact course title or NO_MATCH. No extra text.
`;

  try {
    const url = buildUrlWithKey();
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const resp = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const raw =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const firstLine = raw.split(/\r?\n/)[0].trim();

    if (/^NO_MATCH$/i.test(firstLine)) return null;

    const exact = courseService.courseNames.find((n) => n === firstLine);
    if (exact) return exact;

    const ci = courseService.courseNames.find(
      (n) => n.toLowerCase() === firstLine.toLowerCase()
    );
    if (ci) return ci;

    const best = stringSimilarity.findBestMatch(
      firstLine.toLowerCase(),
      courseService.courseNames.map((n) => n.toLowerCase())
    ).bestMatch;
    if (best.rating >= 0.3) {
      const idx = courseService.courseNames
        .map((n) => n.toLowerCase())
        .indexOf(best.target);
      return courseService.courseNames[idx] || null;
    }

    return null;
  } catch (err) {
    console.error(
      "geminiService.findBestCourseName error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

// 🌐 General Gemini fallback (non-course queries)
async function askGeminiGeneral(question) {
  try {
    const url = buildUrlWithKey();
    const prompt = `
You are Medvarsity assistant.
Answer the user's question using simple HTML tags (<p>, <ul>, <li>, <strong>).
Important:
- DO NOT wrap the answer inside code blocks or backticks.
- Just return raw HTML only.
User question: "${question}"
`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const resp = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const raw =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Gemini did not return text.";

    return raw.trim();
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
