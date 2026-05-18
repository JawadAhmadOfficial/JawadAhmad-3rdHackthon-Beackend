const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const DiagnosisLog = require("../models/DiagnosisLog");

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("createdBy", "name role")
      .sort("-createdAt");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "name",
    );
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
      Appointment.find({ patientId: id })
        .populate("doctorId", "name specialization")
        .sort("-createdAt")
        .limit(20),
      Prescription.find({ patientId: id })
        .populate("doctorId", "name specialization")
        .sort("-createdAt")
        .limit(20),
      DiagnosisLog.find({ patientId: id })
        .populate("doctorId", "name")
        .sort("-createdAt")
        .limit(20),
    ]);
    res.json({ appointments, prescriptions, diagnosisLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPatient = async (req, res) => {
  try {
    // Free plan limit: max 10 patients
    if (req.user.subscriptionPlan === "free") {
      const count = await Patient.countDocuments({ createdBy: req.user._id });
      if (count >= 10) {
        return res.status(403).json({
          message: "Free plan limit reached (10 patients). Upgrade to Pro.",
          limitReached: true,
        });
      }
    }
    const patient = await Patient.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getPatientHistory,
  createPatient,
  updatePatient,
  deletePatient,
};
