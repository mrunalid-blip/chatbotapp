const express = require("express");
const router = express.Router();
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");
const courseService = require("../services/courseService"); // your course loader
const { askGemini } = require("../services/geminiService"); // your LLM call

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    console.log("💬 Incoming question:", question);

    if (!question) {
      return res.status(400).json({ reply: "⚠️ No question provided." });
    }

    let rawReply;

    // 1️⃣ Try to match a course
    const course = courseService.findBestMatch(question);
    if (course) {
      rawReply = `
# ${course.title}

- **Duration:** ${course.duration}  
- **Fees:** ${course.fees}  

${course.description}
      `;
    } else {
      // 2️⃣ Otherwise, fallback to Gemini
      const geminiRes = await askGemini(question);
      rawReply = geminiRes || "⚠️ I couldn't find an answer.";
    }

    // 3️⃣ Convert Markdown → HTML
    let htmlReply = marked.parse(rawReply);
    htmlReply = sanitizeHtml(htmlReply, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3"]),
      allowedAttributes: false,
    });

    res.json({ reply: htmlReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Server error while processing your request." });
  }
});

module.exports = router;
