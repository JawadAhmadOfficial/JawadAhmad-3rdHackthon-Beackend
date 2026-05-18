const DiagnosisLog = require("../models/DiagnosisLog");

const getAllDiagnosis = async (req, res) => {
  const logs = await DiagnosisLog.find({ doctorId: req.user._id })
    .populate("patientId", "name age gender")
    .sort("-createdAt");
  res.json(logs);
};

const createDiagnosis = async (req, res) => {
  const log = await DiagnosisLog.create({
    ...req.body,
    doctorId: req.user._id,
  });
  res.status(201).json(log);
};

module.exports = { getAllDiagnosis, createDiagnosis };
