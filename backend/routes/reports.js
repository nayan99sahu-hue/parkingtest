const express = require("express");
const router = express.Router();
const { getReports, exportReport, getDashboard } = require("../controllers/reportController");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/dashboard", authenticate, requireAdmin, getDashboard);
router.get("/", authenticate, requireAdmin, getReports);
router.get("/export", authenticate, requireAdmin, exportReport);

module.exports = router;
