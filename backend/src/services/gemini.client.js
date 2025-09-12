const axios = require('axios');

async function askGemini({ question, systemInstruction = '', history = [] } = {}) {
  // If no API key set, return a mock response for development
  if (!process.env.GEMINI_API_KEY) {
    return `Mock answer (no GEMINI_API_KEY): ${question}`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    // NOTE: adjust payload to match the exact Gemini request shape you will use in production
    const payload = {
      model: 'gemini-2.5-flash',
      // send systemInstruction, history and contents as needed by your setup
      systemInstruction,
      config: { temperature: 0.5, maxOutputTokens: 300 },
      history,
      contents: [{ role: 'user', parts: [{ text: question }] }]
    };

    const resp = await axios.post(url, payload);
    // adapt parsing to the real Gemini response shape
    // Try common fields then fallback to raw JSON
    const text =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      resp.data?.output_text ||
      JSON.stringify(resp.data);
    return text;
  } catch (err) {
    console.error('gemini.client.askGemini error', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { askGemini };
