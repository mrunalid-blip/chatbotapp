const fs = require("fs");
const path = require("path");

// Path to your JSON file
const courseFile = path.join(
  __dirname,
  "../data/courses/fellowship-in-critical-care-medicine.json"
);

// Load the course JSON
let course = null;
try {
  const rawData = fs.readFileSync(courseFile, "utf-8");
  course = JSON.parse(rawData);
  console.log("✅ Course loaded:", course.course_name);
} catch (err) {
  console.error("❌ Failed to load course:", err.message);
}

/**
 * Search for an answer in the course JSON
 * @param {string} question
 * @returns {string|null}
 */
function findBestMatch(question) {
  if (!course) return null;

  const q = question.toLowerCase();

  // General info about the course
  if (
    q.includes("fellowship in critical care medicine") ||
    q.includes("tell me about") ||
    q.includes("course details")
  ) {
    return `
      📘 <b>${course.course_name}</b><br/>
      <b>Duration:</b> ${course.duration}<br/>
      <b>Fees:</b> ${course.formatted_price}<br/><br/>
      ${course.one_line_description}
    `;
  }

  // Duration
  if (q.includes("duration")) {
    return `<b>${course.course_name}</b> has a duration of <b>${course.duration}</b>.`;
  }

  // Fees
  if (q.includes("fee") || q.includes("cost") || q.includes("price")) {
    return `<b>${course.course_name}</b> costs <b>${course.formatted_price}</b>.`;
  }

  // Eligibility
  if (q.includes("eligibility")) {
    if (course.eligibilities && course.eligibilities.length > 0) {
      return `Eligibility for <b>${course.course_name}</b>: ${course.eligibilities
        .map((e) => e.eligibility)
        .join(", ")}`;
    }
    return `Eligibility details are not available for <b>${course.course_name}</b>.`;
  }

  // Curriculum
  if (q.includes("curriculum") || q.includes("modules") || q.includes("syllabus")) {
    if (course.curriculum && course.curriculum.length > 0) {
      return `
        📚 <b>Curriculum for ${course.course_name}</b>:<br/>
        ${course.curriculum.map((c) => `• ${c.module}: ${c.description}`).join("<br/>")}
      `;
    }
    return `Curriculum details are not available for <b>${course.course_name}</b>.`;
  }

  return null; // fallback to Gemini
}

module.exports = { findBestMatch };
