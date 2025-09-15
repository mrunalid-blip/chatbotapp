const fs = require("fs");
const path = require("path");

const coursesDir = path.join(__dirname, "../data/courses");

// Load all courses from the folder
let courses = [];
try {
  const files = fs.readdirSync(coursesDir);
  courses = files
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const rawData = fs.readFileSync(path.join(coursesDir, file), "utf-8");
      return JSON.parse(rawData);
    });

  console.log(`✅ Loaded ${courses.length} courses`);
} catch (err) {
  console.error("❌ Failed to load courses:", err.message);
}

/**
 * Find the best matching course based on the question
 * @param {string} question
 * @returns {string|null}
 */
function findBestMatch(question) {
  if (!courses.length) return null;

  const q = question.toLowerCase();

  // Try to match course by name
  const matchedCourse =
    courses.find((c) => q.includes(c.course_name.toLowerCase())) || courses[0];

  if (!matchedCourse) return null;

  // General info
  if (
    q.includes("tell me about") ||
    q.includes("course details") ||
    q.includes("overview")
  ) {
    return `
      <h2>📘 ${matchedCourse.course_name}</h2>
      <p><b>Duration:</b> ${matchedCourse.duration}<br/>
      <b>Fees:</b> ${matchedCourse.formatted_price}</p>
      <p>${matchedCourse.one_line_description}</p>
    `;
  }

  // Duration
  if (q.includes("duration")) {
    return `<p><b>${matchedCourse.course_name}</b> has a duration of <b>${matchedCourse.duration}</b>.</p>`;
  }

  // Fees
  if (q.includes("fee") || q.includes("cost") || q.includes("price")) {
    return `<p><b>${matchedCourse.course_name}</b> costs <b>${matchedCourse.formatted_price}</b>.</p>`;
  }

  // Eligibility
  if (q.includes("eligibility")) {
    if (matchedCourse.eligibilities?.length > 0) {
      return `
        <h3>Eligibility for ${matchedCourse.course_name}</h3>
        <ul>
          ${matchedCourse.eligibilities
            .map((e) => `<li>${e.eligibility}</li>`)
            .join("")}
        </ul>
      `;
    }
    return `<p>Eligibility details are not available for <b>${matchedCourse.course_name}</b>.</p>`;
  }

  // Curriculum
  if (q.includes("curriculum") || q.includes("modules") || q.includes("syllabus")) {
    if (matchedCourse.curriculum?.length > 0) {
      return `
        <h3>📚 Curriculum for ${matchedCourse.course_name}</h3>
        <ul>
          ${matchedCourse.curriculum
            .map((c) => `<li><b>${c.module}:</b> ${c.description}</li>`)
            .join("")}
        </ul>
      `;
    }
    return `<p>Curriculum details are not available for <b>${matchedCourse.course_name}</b>.</p>`;
  }

  return null; // fallback to Gemini
}

module.exports = { findBestMatch };
