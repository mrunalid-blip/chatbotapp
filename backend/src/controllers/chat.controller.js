// src/controllers/chat.controller.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

async function handleChat(req, res, next) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    const result = await model.generateContent(question);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    next(err);
  }
}

module.exports = { handleChat };
