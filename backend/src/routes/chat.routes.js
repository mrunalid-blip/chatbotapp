const express = require("express");
const router = express.Router();
const courseService = require("../services/courseService");
const { askGemini } = require("../services/geminiService"); // ✅ correct import

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    console.log("💬 Incoming question:", question);

    // 1️⃣ First try to match course
    const courseAnswer = courseService.findBestMatch(question);

    if (courseAnswer && courseAnswer !== courseService.COURSE_NOT_FOUND) {
      return res.json({ answer: courseAnswer });
    }

    // 2️⃣ Otherwise fallback to Gemini
    const geminiAnswer = await askGemini(question); // ✅ use askGemini
    return res.json({ answer: geminiAnswer });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ error: "⚠️ Chat route failed." });
  }
});

module.exports = router;
