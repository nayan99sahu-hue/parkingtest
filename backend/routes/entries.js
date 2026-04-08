const express = require("express");
const router = express.Router();
const { submitEntries, getEntries } = require("../controllers/entryController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, submitEntries);
router.get("/", authenticate, getEntries);

module.exports = router;
