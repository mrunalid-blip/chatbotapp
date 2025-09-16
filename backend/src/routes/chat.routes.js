// backend/src/routes/chat.routes.js
const express = require("express");
const router = express.Router();
const courseService = require("../services/courseService");
const { findBestCourseName, askGeminiGeneral } = require("../services/geminiService");
const stringSimilarity = require("string-similarity");

// ✅ Normalize question text (fix typos)
function normalizeQuestion(q) {
  return q
    .toLowerCase()
    .replace(/cousrse|cource|cours|coursee/gi, "course")
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ Detect if query is course-related
function isCourseRelated(question) {
  const q = question.toLowerCase();
  if (/(course|fees?|duration|price|certificate|fellowship|diploma|program)/i.test(q)) {
    return true;
  }
  return courseService.courseNames.some(
    (name) => name.toLowerCase().includes(q) || q.includes(name.toLowerCase())
  );
}

// ✅ Fuzzy match course names
function fuzzyMatchCourseName(query) {
  if (!query) return null;
  const best = stringSimilarity.findBestMatch(
    query.toLowerCase(),
    courseService.courseNames.map((n) => n.toLowerCase())
  ).bestMatch;

  if (best.rating >= 0.35) {
    const idx = courseService.courseNames.map((n) => n.toLowerCase()).indexOf(best.target);
    return courseService.courseNames[idx] || null;
  }
  return null;
}

// ✅ Chat endpoint
router.post("/", async (req, res) => {
  try {
    let { question } = req.body;
    question = normalizeQuestion(question);
    console.log("💬 Incoming question:", question);

    // 1️⃣ Special case: list ALL courses (from CSV file)
    if (/all courses|list of courses|list of all courses|available courses|show courses|list of courses available/i.test(question)) {
      const courseList = courseService.courseNames.filter(Boolean);

      if (courseList.length === 0) {
        return res.json({ answer: "<p>⚠️ No courses found in course_names.csv.</p>" });
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

    // 2️⃣ Special case: list ALL courses in a specialty (e.g., pediatric, cardio)
    if (/all\s+([a-z]+)\s+courses?/i.test(question)) {
      const specialty = question.match(/all\s+([a-z]+)\s+courses?/i)[1].toLowerCase();

      const matches = courseService.courses.filter((c) =>
        (c.course_name || c.name || "").toLowerCase().includes(specialty)
      );

      if (matches.length > 0) {
        return res.json({
          answer: courseService.formatCourseSummaries(matches),
        });
      } else {
        return res.json({
          answer: `<p>❌ No ${specialty} courses found in database.</p>`,
        });
      }
    }

    // 3️⃣ If course-related → try JSON first
    if (isCourseRelated(question)) {
      let matchedName = null;

      try {
        matchedName = await findBestCourseName(question);
        console.log("🔎 Gemini suggested course name:", matchedName);
      } catch {
        matchedName = null;
      }

      if (!matchedName) {
        matchedName = fuzzyMatchCourseName(question);
        console.log("🔍 Fuzzy matched course name:", matchedName);
      }

      if (matchedName) {
        const course = courseService.getCourseByName(matchedName);
        if (course) {
          if (/fee|fees|cost|price|duration/i.test(question)) {
            return res.json({
              answer: courseService.formatCourseSummaries([course]),
            });
          }
          return res.json({
            answer: courseService.formatCourseDetails(course),
          });
        }
      }

      // Keyword matches in JSON
      const keywordMatches = courseService.searchCoursesByKeywords(question);

      if (keywordMatches.length > 1) {
        return res.json({
          answer: courseService.formatCourseSummaries(keywordMatches),
        });
      }

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

      return res.json({
        answer: "<p>❌ Course not available. Please contact Medvarsity support for more details.</p>",
      });
    }

    // 4️⃣ Otherwise → fallback to Gemini
    const geminiAnswer = await askGeminiGeneral(question);
    return res.json({ answer: geminiAnswer });

  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ error: "⚠️ Chat route failed." });
  }
});

module.exports = router;
