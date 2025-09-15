require("dotenv").config();
const axios = require("axios");

async function testGemini() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await axios.post(url, {
      contents: [
        {
          parts: [{ text: "Hello Gemini! Are you working?" }]
        }
      ]
    });

    console.log("✅ Gemini Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("❌ Gemini Test Failed:");
    console.error(err.response?.data || err.message);
  }
}

testGemini();
