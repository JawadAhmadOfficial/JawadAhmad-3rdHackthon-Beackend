const express = require("express");
const router = express.Router();
const {
  getAllDiagnosis,
  createDiagnosis,
} = require("../controllers/diagnosisController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.get("/", authorize("doctor", "admin"), getAllDiagnosis);
router.post("/", authorize("doctor"), createDiagnosis);

module.exports = router;
