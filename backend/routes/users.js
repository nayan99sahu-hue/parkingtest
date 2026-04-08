const express = require("express");
const router = express.Router();
const { getUsers, createUser, deleteUser } = require("../controllers/userController");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/", authenticate, requireAdmin, getUsers);
router.post("/", authenticate, requireAdmin, createUser);
router.delete("/:id", authenticate, requireAdmin, deleteUser);

module.exports = router;
