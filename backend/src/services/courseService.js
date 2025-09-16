// backend/src/services/courseService.js
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../data/courses/futurecources.json");
const csvPath = path.join(__dirname, "../data/courses/course_names.csv");

let courses = [];
let courseNames = [];

function safeLoadJson() {
  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(raw);
    courses = [
      ...(parsed.featured_course || []),
      ...(parsed.trending_courses || []),
      ...(parsed.all_courses || []),
      ...(parsed.courses || []),
      ...(parsed.categories || []).flatMap((cat) => cat.courses || []),
    ].filter(Boolean);
    console.log("✅ Loaded", courses.length, "courses (JSON)");
  } catch (err) {
    console.error("❌ Failed to load courses JSON:", err.message);
    courses = [];
  }
}

function safeLoadCsv() {
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn("⚠️ CSV not found:", csvPath);
      courseNames = courses
        .map((c) => (c.course_name || c.name || "").trim())
        .filter(Boolean);
      return;
    }
    const raw = fs.readFileSync(csvPath, "utf-8");
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines[0]?.toLowerCase().startsWith("course_name")) lines.shift();
    courseNames = lines
      .map((l) => {
        let v = l;
        if (v.startsWith('"') && v.endsWith('"'))
          v = v.slice(1, -1).replace(/""/g, '"');
        return v.trim();
      })
      .filter(Boolean);
    console.log("✅ Loaded", courseNames.length, "course names (CSV)");
  } catch (err) {
    console.error("❌ Failed to load course_names CSV:", err.message);
    courseNames = courses
      .map((c) => (c.course_name || c.name || "").trim())
      .filter(Boolean);
  }
}

safeLoadJson();
safeLoadCsv();

// 🔎 Get course by exact name
function getCourseByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return (
    courses.find(
      (c) => (c.course_name || c.name || "").trim().toLowerCase() === n
    ) || null
  );
}

// 🔎 Search multiple courses by keywords (supports partial matches)
function searchCoursesByKeywords(query) {
  if (!query) return [];
  const q = query.toLowerCase();

  // Split query into words (tokens)
  const tokens = q.split(/\s+/).filter(Boolean);

  return courses.filter((c) => {
    const name = (c.course_name || c.name || "").toLowerCase();
    return tokens.some((t) => name.includes(t));
  });
}

// 📝 Full details formatter (short description)
function formatCourseDetails(course) {
  if (!course) return "<p>Course details not found.</p>";

  const title = course.course_name || course.name || "Unknown Course";
  const duration =
    course.duration ||
    course.duration_in_months ||
    course.duration_text ||
    "Not specified";

  let fees = "Not specified";
  if (course.formatted_price) fees = course.formatted_price;
  else if (course.prices?.length > 0) {
    fees =
      course.prices[0].formatted_price ||
      `${course.prices[0].currency} ${course.prices[0].price}`;
  } else if (course.price) {
    fees = course.price;
  }

  let desc =
    (course.one_line_description ||
      course.description ||
      course.details ||
      "")
      .toString()
      .replace(/<[^>]+>/g, "")
      .trim();

  // shorten description to ~3-4 lines
  if (desc.length > 350) {
    desc = desc.substring(0, 350).trim() + "...";
  }

  return `
    <div>
      <h3><strong>${title}</strong></h3>
      <p><strong>Duration:</strong> ${duration}</p>
      <p><strong>Fees:</strong> ${fees}</p>
      <p>${desc}</p>
    </div>
  `;
}

// 📝 Summary formatter (fees + duration only)
function formatCourseSummaries(courseList) {
  if (!courseList.length) return "<p>No matching courses found.</p>";

  let html = "<div><h3><strong>Matching Courses</strong></h3><ul>";
  for (const c of courseList) {
    const title = c.course_name || c.name || "Unknown Course";
    const duration =
      c.duration || c.duration_in_months || c.duration_text || "Not specified";

    let fees = "Not specified";
    if (c.formatted_price) fees = c.formatted_price;
    else if (c.prices?.length > 0) {
      fees =
        c.prices[0].formatted_price ||
        `${c.prices[0].currency} ${c.prices[0].price}`;
    } else if (c.price) {
      fees = c.price;
    }

    html += `<li><strong>${title}</strong> — Duration: ${duration}, Fees: ${fees}</li>`;
  }
  html += "</ul></div>";

  return html;
}

module.exports = {
  courses,
  courseNames,
  getCourseByName,
  searchCoursesByKeywords,
  formatCourseDetails,
  formatCourseSummaries,
  reload: () => {
    safeLoadJson();
    safeLoadCsv();
  },
};
