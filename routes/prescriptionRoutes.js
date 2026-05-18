const express = require("express");
const router = express.Router();
const {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
} = require("../controllers/prescriptionController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.get("/", getAllPrescriptions);
router.get("/:id", getPrescriptionById);
router.post("/", authorize("doctor"), createPrescription);
router.put("/:id", authorize("doctor"), updatePrescription);

module.exports = router;
