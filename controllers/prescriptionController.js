const Prescription = require("../models/Prescription");

const getAllPrescriptions = async (req, res) => {
  let query = {};
  if (req.user.role === "doctor") query.doctorId = req.user._id;
  if (req.user.role === "patient") {
    const Patient = require("../models/Patient");
    const patient = await Patient.findOne({ email: req.user.email });
    if (patient) query.patientId = patient._id;
  }
  const prescriptions = await Prescription.find(query)
    .populate("patientId", "name age gender")
    .populate("doctorId", "name specialization")
    .sort("-createdAt");
  res.json(prescriptions);
};

const getPrescriptionById = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("patientId", "name age gender contact bloodGroup")
    .populate("doctorId", "name specialization phone");
  if (!prescription)
    return res.status(404).json({ message: "Prescription not found" });
  res.json(prescription);
};

const createPrescription = async (req, res) => {
  const prescription = await Prescription.create({
    ...req.body,
    doctorId: req.user._id,
  });
  res.status(201).json(prescription);
};

const updatePrescription = async (req, res) => {
  const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );
  if (!prescription)
    return res.status(404).json({ message: "Prescription not found" });
  res.json(prescription);
};

module.exports = {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
};
