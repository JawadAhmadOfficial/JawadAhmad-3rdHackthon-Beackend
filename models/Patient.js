const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    contact: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    allergies: [String],
    chronicConditions: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    riskFlags: [
      {
        flag: String,
        detectedAt: { type: Date, default: Date.now },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "low",
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
