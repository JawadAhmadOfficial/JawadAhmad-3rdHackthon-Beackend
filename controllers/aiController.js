const DiagnosisLog = require("../models/DiagnosisLog");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

const callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
};

// AI Feature 1 — Smart Symptom Checker
const checkSymptoms = async (req, res) => {
  const { symptoms, age, gender, history, patientId } = req.body;

  // SaaS: AI only for pro plan
  if (req.user.subscriptionPlan === "free") {
    return res.status(403).json({
      message: "AI features require Pro plan. Please upgrade.",
      requiresUpgrade: true,
    });
  }

  try {
    const prompt = `You are a medical AI assistant. Analyze this patient:
Age: ${age}, Gender: ${gender}
Symptoms: ${symptoms.join(", ")}
Medical History: ${history || "None"}

Respond ONLY with valid JSON (no markdown):
{
  "conditions": ["condition1", "condition2", "condition3"],
  "riskLevel": "low|medium|high",
  "suggestedTests": ["test1", "test2"],
  "advice": "brief advice here"
}`;

    let parsedResponse = null;
    const aiText = await callGemini(prompt);

    if (aiText) {
      try {
        const match = aiText.match(/\{[\s\S]*\}/);
        if (match) parsedResponse = JSON.parse(match[0]);
      } catch {
        parsedResponse = null;
      }
    }

    if (!parsedResponse) {
      parsedResponse = {
        conditions: [
          "Requires clinical evaluation",
          "Possible viral infection",
          "Consult specialist",
        ],
        riskLevel: "medium",
        suggestedTests: [
          "Complete Blood Count (CBC)",
          "Blood Pressure Check",
          "Physical Examination",
        ],
        advice: "Please visit the clinic for thorough examination.",
      };
    }

    await DiagnosisLog.create({
      patientId: patientId || null,
      doctorId: req.user._id,
      symptoms,
      age,
      gender,
      history,
      aiResponse: JSON.stringify(parsedResponse),
      riskLevel: parsedResponse.riskLevel || "medium",
      possibleConditions: parsedResponse.conditions || [],
      suggestedTests: parsedResponse.suggestedTests || [],
    });

    res.json({ success: true, data: parsedResponse, fallback: !aiText });
  } catch (error) {
    res.json({
      success: true,
      data: {
        conditions: ["Please consult doctor for evaluation"],
        riskLevel: "medium",
        suggestedTests: ["General checkup"],
        advice: "AI service temporarily unavailable.",
      },
      fallback: true,
    });
  }
};

// AI Feature 2 — Prescription Explanation
const explainPrescription = async (req, res) => {
  const { medicines, diagnosis, instructions, language } = req.body;
  try {
    const isUrdu = language === "urdu";
    const prompt = isUrdu
      ? `آپ ایک طبی AI ہیں۔ اس نسخے کی سادہ اردو میں وضاحت کریں:
تشخیص: ${diagnosis}
دوائیں: ${medicines.map((m) => `${m.name} - ${m.dosage} - ${m.frequency}`).join(", ")}
ہدایات: ${instructions}
مختصر، دوستانہ انداز میں لکھیں۔`
      : `Explain this prescription in simple patient-friendly English:
Diagnosis: ${diagnosis}
Medicines: ${medicines.map((m) => `${m.name} - ${m.dosage} - ${m.frequency}`).join(", ")}
Instructions: ${instructions}
Include: what each medicine does, lifestyle advice, what to avoid. Keep it warm and simple.`;

    const fallback = isUrdu
      ? "اپنی دوائیں وقت پر لیں۔ آرام کریں اور پانی زیادہ پیئں۔ حالت خراب ہو تو ڈاکٹر سے ملیں۔"
      : "Take your medicines as prescribed. Stay hydrated, get rest, and contact your doctor if symptoms worsen.";

    const explanation = (await callGemini(prompt)) || fallback;
    res.json({
      success: true,
      explanation,
      language: isUrdu ? "urdu" : "english",
    });
  } catch {
    res.json({
      success: true,
      explanation: "Take medicines as directed by your doctor.",
      fallback: true,
    });
  }
};

// AI Feature 3 — Risk Flagging
const flagRisks = async (req, res) => {
  const { patientId } = req.params;
  try {
    const [diagnosisLogs, appointments] = await Promise.all([
      DiagnosisLog.find({ patientId }).sort("-createdAt").limit(10),
      Appointment.find({ patientId }).sort("-createdAt").limit(10),
    ]);

    const allSymptoms = diagnosisLogs.flatMap((d) => d.symptoms || []);
    const symCount = {};
    allSymptoms.forEach((s) => {
      symCount[s.toLowerCase()] = (symCount[s.toLowerCase()] || 0) + 1;
    });
    const repeated = Object.entries(symCount)
      .filter(([, count]) => count >= 2)
      .map(([sym]) => sym);

    const flags = [];
    if (repeated.length > 0) {
      flags.push({
        flag: `Recurring symptoms: ${repeated.join(", ")}`,
        severity: "medium",
      });
    }
    const highRisk = diagnosisLogs.filter((d) => d.riskLevel === "high");
    if (highRisk.length >= 2) {
      flags.push({
        flag: "Multiple high-risk diagnoses detected",
        severity: "high",
      });
    }
    if (appointments.length >= 5) {
      flags.push({
        flag: "Frequent clinic visits — possible chronic condition",
        severity: "medium",
      });
    }

    if (flags.length > 0) {
      await Patient.findByIdAndUpdate(patientId, { riskFlags: flags });
    }

    res.json({ success: true, flags, repeated });
  } catch (error) {
    res.json({ success: true, flags: [], repeated: [] });
  }
};

// AI Feature 4 — Predictive Analytics
const getPredictiveAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [diagnosisThisMonth, appointmentsByDay, doctorStats] =
      await Promise.all([
        DiagnosisLog.find({ createdAt: { $gte: startOfMonth } }),
        Appointment.aggregate([
          { $group: { _id: { $dayOfWeek: "$date" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Appointment.aggregate([
          {
            $group: {
              _id: "$doctorId",
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "doctor",
            },
          },
          { $unwind: "$doctor" },
          { $project: { name: "$doctor.name", total: 1, completed: 1 } },
          { $sort: { total: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const conditionCount = {};
    diagnosisThisMonth.forEach((d) => {
      (d.possibleConditions || []).forEach((c) => {
        conditionCount[c] = (conditionCount[c] || 0) + 1;
      });
    });
    const topConditions = Object.entries(conditionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const loadForecast = appointmentsByDay.map((d) => ({
      day: days[d._id - 1] || "Unknown",
      count: d.count,
    }));

    res.json({
      success: true,
      topConditions,
      loadForecast,
      doctorPerformance: doctorStats,
    });
  } catch (error) {
    res.json({
      success: true,
      topConditions: [],
      loadForecast: [],
      doctorPerformance: [],
    });
  }
};

module.exports = {
  checkSymptoms,
  explainPrescription,
  flagRisks,
  getPredictiveAnalytics,
};
