const fs = require("fs");
const path = require("path");
const stringSimilarity = require("string-similarity");

const courseFile = path.join(__dirname, "../data/courses/futurecources.json");

let courses = [];
try {
  const rawData = fs.readFileSync(courseFile, "utf-8");
  const parsed = JSON.parse(rawData);

  // ✅ Merge all possible arrays
  courses = [
    ...(parsed.featured_course || []),
    ...(parsed.all_courses || []),
    ...(parsed.courses || []),
    ...(parsed.categories || []).flatMap(cat => cat.courses || []),
  ];

  console.log("✅ Loaded", courses.length, "courses");
} catch (err) {
  console.error("❌ Failed to load courses:", err.message);
}

// Utility: strip HTML from LMS descriptions
function stripHTML(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ✅ Format course details into clean HTML
function formatCourseDetails(course) {
  if (!course) return "<p>No course details found.</p>";

  const duration = course.duration?.trim() || "Not specified";

  let fees = "Not specified";
  if (course.formatted_price) {
    fees = course.formatted_price;
  } else if (course.prices?.length > 0) {
    fees =
      course.prices[0].formatted_price ||
      `${course.prices[0].currency} ${course.prices[0].price}`;
  }

  const description = stripHTML(
    course.one_line_description || course.description || "No description available."
  );

  return `
    <div>
      <h3><strong>${course.course_name}</strong></h3>
      <p><strong>Duration:</strong> ${duration}</p>
      <p><strong>Fees:</strong> ${fees}</p>
      <p>${description}</p>
    </div>
  `;
}

// ✅ Find the best-matching course
function findBestMatch(question) {
  if (!courses.length) return "COURSE_NOT_FOUND";

  const q = question.toLowerCase();
  const courseNames = courses.map((c) => (c.course_name || "").toLowerCase());

  // 1️⃣ Try string-similarity first
  const bestMatch = stringSimilarity.findBestMatch(q, courseNames);
  let course = null;

  if (bestMatch.bestMatch.rating >= 0.25) {
    course = courses[bestMatch.bestMatchIndex];
  }

  // 2️⃣ If no strong match, try keyword includes
  if (!course) {
    const keywords = q.split(/\s+/).filter((w) => w.length > 2);
    course = courses.find((c) =>
      keywords.every((kw) => (c.course_name || "").toLowerCase().includes(kw))
    );
    if (!course) {
      course = courses.find((c) =>
        keywords.some((kw) => (c.course_name || "").toLowerCase().includes(kw))
      );
    }
  }

  if (!course) return "COURSE_NOT_FOUND";

  // ✅ Special cases (duration/fees only)
  if (q.includes("duration")) {
    return `<p><strong>${course.course_name}</strong> has a duration of <strong>${
      course.duration || "Not specified"
    }</strong>.</p>`;
  }

  if (q.includes("fee") || q.includes("cost") || q.includes("price")) {
    const fees =
      course.formatted_price ||
      (course.prices && course.prices[0]?.formatted_price) ||
      "Not specified";
    return `<p><strong>${course.course_name}</strong> costs <strong>${fees}</strong>.</p>`;
  }

  // ✅ Full course details
  return formatCourseDetails(course);
}

module.exports = {
  findBestMatch,
  COURSE_NOT_FOUND: "COURSE_NOT_FOUND",
};
