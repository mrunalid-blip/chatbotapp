// backend/src/routes/chat.routes.js
const express = require("express");
const router = express.Router();
const courseService = require("../services/courseService");
const { findBestCourseName, askGeminiGeneral } = require("../services/geminiService");

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    console.log("💬 Incoming question:", question);

    // 1️⃣ Special case: list all courses
    if (/all courses|list of courses|available courses|show courses/i.test(question)) {
      const courseList = courseService.courses.map((c) => c.course_name || c.name).filter(Boolean);

      if (courseList.length === 0) {
        return res.json({ answer: "<p>⚠️ No courses found in database.</p>" });
      }

      const html = `
        <div>
          <h3><strong>Available Courses at Medvarsity</strong></h3>
          <ul>
            ${courseList.map((name) => `<li>${name}</li>`).join("\n")}
          </ul>
        </div>
      `;
      return res.json({ answer: html });
    }

    // 2️⃣ Ask Gemini for best matching course name
    let matchedName = null;
    try {
      matchedName = await findBestCourseName(question);
      console.log("🔎 Gemini suggested course name:", matchedName);
    } catch {
      matchedName = null;
    }

    // 3️⃣ If Gemini gave a match → fetch full details
    if (matchedName) {
      const course = courseService.getCourseByName(matchedName);
      if (course) {
        // If user asks only for fees/duration → short response
        if (/fee|fees|cost|price|duration/i.test(question)) {
          return res.json({
            answer: courseService.formatCourseSummaries([course]),
          });
        }
        // Otherwise → full course details
        return res.json({ answer: courseService.formatCourseDetails(course) });
      }
    }

    // 4️⃣ Try keyword search for multiple courses
    const keywordMatches = courseService.searchCoursesByKeywords(question);

    if (keywordMatches.length > 1) {
      // If asking about fees/duration → summaries
      if (/fee|fees|cost|price|duration/i.test(question)) {
        return res.json({
          answer: courseService.formatCourseSummaries(keywordMatches),
        });
      }

      // Otherwise list multiple courses
      return res.json({
        answer: courseService.formatCourseSummaries(keywordMatches),
      });
    }

    // 5️⃣ If exactly one keyword match → full details
    if (keywordMatches.length === 1) {
      const course = keywordMatches[0];
      if (/fee|fees|cost|price|duration/i.test(question)) {
        return res.json({
          answer: courseService.formatCourseSummaries([course]),
        });
      }
      return res.json({
        answer: courseService.formatCourseDetails(course),
      });
    }

    // 6️⃣ Fallback to Gemini for general queries
    const geminiAnswer = await askGeminiGeneral(question);
    return res.json({ answer: geminiAnswer });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ error: "⚠️ Chat route failed." });
  }
});

module.exports = router;
