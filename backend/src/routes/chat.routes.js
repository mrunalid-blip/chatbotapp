const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');
const { askGemini } = require('../services/geminiClient');

// notice it’s just `/`, not `/api/chat`
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    console.log("💬 Incoming question:", question);

    const match = courseService.findBestMatch(question);

    if (match) {
      return res.json({ reply: match });
    }

    const aiReply = await askGemini(question);
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Error connecting to backend." });
  }
});

module.exports = router;
