const express = require("express");
const router = express.Router();
const {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.get("/", getAllAppointments);
router.post(
  "/",
  authorize("admin", "receptionist", "patient"),
  createAppointment,
);
router.put(
  "/:id",
  authorize("admin", "receptionist", "doctor"),
  updateAppointment,
);
router.delete("/:id", authorize("admin", "receptionist"), deleteAppointment);

module.exports = router;
