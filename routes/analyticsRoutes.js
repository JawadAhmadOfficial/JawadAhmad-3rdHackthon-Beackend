const express = require("express");
const router = express.Router();
const {
  getAdminAnalytics,
  getDoctorAnalytics,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.get("/admin", authorize("admin"), getAdminAnalytics);
router.get("/doctor", authorize("doctor"), getDoctorAnalytics);

module.exports = router;
