const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const DiagnosisLog = require("../models/DiagnosisLog");

const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalAppointments,
      totalPrescriptions,
      monthlyAppointments,
      appointmentStatus,
      proUsers,
      recentPatients,
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "receptionist" }),
      Appointment.countDocuments(),
      Prescription.countDocuments(),
      Appointment.aggregate([
        {
          $group: {
            _id: { month: { $month: "$date" }, year: { $year: "$date" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 },
      ]),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ subscriptionPlan: "pro" }),
      Patient.find()
        .sort("-createdAt")
        .limit(5)
        .select("name age gender createdAt"),
    ]);

    // Simulated revenue: pro users * 2999 PKR/month
    const simulatedRevenue = proUsers * 2999;

    res.json({
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalAppointments,
      totalPrescriptions,
      monthlyAppointments,
      appointmentStatus,
      proUsers,
      simulatedRevenue,
      recentPatients,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      myAppointments,
      myPrescriptions,
      myDiagnosis,
      todayAppointments,
      monthlyAppointments,
      statusBreakdown,
    ] = await Promise.all([
      Appointment.countDocuments({ doctorId }),
      Prescription.countDocuments({ doctorId }),
      DiagnosisLog.countDocuments({ doctorId }),
      Appointment.countDocuments({ doctorId, date: { $gte: startOfDay } }),
      Appointment.countDocuments({ doctorId, date: { $gte: startOfMonth } }),
      Appointment.aggregate([
        { $match: { doctorId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      myAppointments,
      myPrescriptions,
      myDiagnosis,
      todayAppointments,
      monthlyAppointments,
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminAnalytics, getDoctorAnalytics };
