const express = require("express");
const router = express.Router();

// Example Zoho data fetch
router.get("/", (req, res) => {
  res.json({ data: "📊 Example Zoho data" });
});

module.exports = router;