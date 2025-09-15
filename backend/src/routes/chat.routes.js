const express = require("express");
const router = express.Router();
const courseService = require("../services/courseService");
const { findBestCourseName, askGeminiGeneral } = require("../services/geminiService");

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    console.log("💬 Incoming question:", question);

    // 1️⃣ Ask Gemini for best matching course name
    let matchedName = null;
    try {
      matchedName = await findBestCourseName(question);
      console.log("🔎 Gemini suggested course name:", matchedName);
    } catch {
      matchedName = null;
    }

    // 2️⃣ If Gemini gave a match → fetch full details
    if (matchedName) {
      const course = courseService.getCourseByName(matchedName);
      if (course) {
        return res.json({ answer: courseService.formatCourseDetails(course) });
      }
    }

    // 3️⃣ Try keyword search for multiple courses
    const keywordMatches = courseService.searchCoursesByKeywords(question);

    if (keywordMatches.length > 1) {
      // ✅ If user asks about fees/duration → show summaries
      if (/fee|fees|cost|price|duration/i.test(question)) {
        return res.json({
          answer: courseService.formatCourseSummaries(keywordMatches),
        });
      }

      // Otherwise → show multiple course summaries
      return res.json({
        answer: courseService.formatCourseSummaries(keywordMatches),
      });
    }

    // 4️⃣ If exactly one keyword match → full details
    if (keywordMatches.length === 1) {
      return res.json({
        answer: courseService.formatCourseDetails(keywordMatches[0]),
      });
    }

    // 5️⃣ Fallback to Gemini for general queries
    const geminiAnswer = await askGeminiGeneral(question);
    return res.json({ answer: geminiAnswer });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ error: "⚠️ Chat route failed." });
  }
});

module.exports = router;
