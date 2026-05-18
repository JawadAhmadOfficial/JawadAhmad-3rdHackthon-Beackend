const Appointment = require("../models/Appointment");

const getAllAppointments = async (req, res) => {
  let query = {};
  if (req.user.role === "doctor") query.doctorId = req.user._id;
  const appointments = await Appointment.find(query)
    .populate("patientId", "name age gender contact")
    .populate("doctorId", "name specialization")
    .sort("-date");
  res.json(appointments);
};

const createAppointment = async (req, res) => {
  const appointment = await Appointment.create({
    ...req.body,
    bookedBy: req.user._id,
  });
  res.status(201).json(appointment);
};

const updateAppointment = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found" });
  res.json(appointment);
};

const deleteAppointment = async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ message: "Appointment deleted" });
};

module.exports = {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
