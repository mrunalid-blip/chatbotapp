
// backend/scripts/json_to_csv.js
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

const inputPath = path.join(__dirname, "../src/data/courses/futurecources.json");
const outputPath = path.join(__dirname, "../src/data/courses/course_names.csv");

try {
  const rawData = fs.readFileSync(inputPath, "utf-8");
  const json = JSON.parse(rawData);

  // Collect all courses from different sections
  let allCourses = [
    ...(json.featured_course || []),
    ...(json.trending_courses || []),
    ...(json.all_courses || []),
    ...(json.courses || []),
    ...(json.categories || []).flatMap((cat) => cat.courses || []),
  ];

  // Deduplicate by course_name
  const seen = new Set();
  allCourses = allCourses.filter((c) => {
    if (!c.course_name) return false;
    if (seen.has(c.course_name)) return false;
    seen.add(c.course_name);
    return true;
  });

  // Only keep course_name field
  const courseNames = allCourses.map((c) => ({ course_name: c.course_name }));

  // Convert JSON → CSV
  const parser = new Parser({ fields: ["course_name"] });
  const csv = parser.parse(courseNames);

  fs.writeFileSync(outputPath, csv, "utf-8");
  console.log(`✅ Wrote ${courseNames.length} course names to ${outputPath}`);
} catch (err) {
  console.error("❌ Error:", err.message);
}
