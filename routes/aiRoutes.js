const express = require("express");
const router = express.Router();
const {
  checkSymptoms,
  explainPrescription,
  flagRisks,
  getPredictiveAnalytics,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.post("/symptom-check", authorize("doctor"), checkSymptoms);
router.post("/explain-prescription", explainPrescription);
router.get("/risk-flags/:patientId", authorize("doctor", "admin"), flagRisks);
router.get("/predictive-analytics", authorize("admin"), getPredictiveAnalytics);

module.exports = router;
