const axios = require("axios");
const { marked } = require("marked"); // ✅ convert markdown → HTML

async function askGemini(question) {
  if (!process.env.GEMINI_API_KEY) {
    return `<p>Mock answer (no GEMINI_API_KEY): ${question}</p>`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: question }] }]
    };

    const resp = await axios.post(url, payload);

    // ✅ Extract Gemini reply
    const rawText =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Gemini did not return text.";

    // ✅ Convert to HTML
    const html = marked.parse(rawText);

    return html;
  } catch (err) {
    console.error("geminiService.askGemini error", err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { askGemini };
