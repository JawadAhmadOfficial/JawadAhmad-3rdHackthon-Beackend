const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  getPatientHistory,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.get("/:id/history", getPatientHistory);
router.post("/", authorize("admin", "receptionist"), createPatient);
router.put("/:id", authorize("admin", "receptionist", "doctor"), updatePatient);
router.delete("/:id", authorize("admin"), deletePatient);

module.exports = router;
