const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  getAllUsers,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
// This is the new line we added:
router.get("/users", protect, getAllUsers);

module.exports = router;
