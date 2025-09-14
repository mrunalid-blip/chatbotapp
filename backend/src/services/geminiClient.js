const axios = require('axios');

async function askGemini(question) {
  if (!process.env.GEMINI_API_KEY) {
    return `Mock answer (no GEMINI_API_KEY): ${question}`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{ role: 'user', parts: [{ text: question }] }]
    };

    const resp = await axios.post(url, payload);

    // ✅ Extract text safely
    const text =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Gemini did not return text.";

    return text;
  } catch (err) {
    console.error('geminiClient.askGemini error', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { askGemini };
