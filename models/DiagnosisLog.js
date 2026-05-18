const mongoose = require("mongoose");

const diagnosisLogSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    symptoms: [String],
    age: { type: Number },
    gender: { type: String },
    history: { type: String },
    aiResponse: { type: String },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    possibleConditions: [String],
    suggestedTests: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.model("DiagnosisLog", diagnosisLogSchema);
