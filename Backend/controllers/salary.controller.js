const User = require("../models/User");
const { calculateWorkerSalary, calculateAllSalaries } = require("../utils/salaryCalculator");

// -------------------
// Get salary for a single worker
// -------------------
const getWorkerSalary = async (req, res) => {
  try {
    const workerId = req.params.id;

    // If worker is requesting, allow only own salary
    if (req.user.role === "worker" && req.user._id.toString() !== workerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    const salaryData = await calculateWorkerSalary(workerId);
    res.json({ worker: worker.name, baseRate: 90, ...salaryData });
  } catch (error) {
    console.error("GET WORKER SALARY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


const Salary = require("../models/Salary");

// -------------------
// Get salaries for all workers (Admin only)
// -------------------
const getAllSalaries = async (req, res) => {
  try {
    // Get all workers
    const workers = await User.find({ role: "worker" });

    const workerIds = workers.map((w) => w._id);
    const salaries = await calculateAllSalaries(workerIds);

    // Filter out salaries hidden by Admin
    const hiddenSalaries = await Salary.find({ hiddenFromAdmin: true }).select("worker");
    const hiddenWorkerIds = hiddenSalaries.map(s => s.worker.toString());

    // Attach worker names and filter
    const result = salaries
      .filter(s => !hiddenWorkerIds.includes(s.worker.toString()))
      .map((s) => {
        const worker = workers.find((w) => w._id.toString() === s.worker.toString());
        return { ...s, worker: worker ? worker.name : "Unknown", workerId: s.worker };
      });

    res.json(result);
  } catch (error) {
    console.error("GET ALL SALARIES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Delete Worker Salary (Soft-delete for Admin)
// -------------------
const deleteWorkerSalary = async (req, res) => {
  try {
    const { workerId } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete salaries" });
    }

    // Since salary is calculated, we mark the worker's salary as hidden in a Salary doc
    // We try to find a Salary doc for this worker, or create a placeholder
    let salaryDoc = await Salary.findOne({ worker: workerId });
    if (!salaryDoc) {
      // Find any project this worker is assigned to for the required field
      const Attendance = require("../models/Attendance");
      const lastAttendance = await Attendance.findOne({ worker: workerId });
      if (!lastAttendance) {
        // If no attendance, we can't easily create a Salary doc without a project
        // But we can just use a dummy project ID if needed or handle it
        return res.status(400).json({ message: "No attendance found for this worker to hide salary" });
      }

      salaryDoc = new Salary({
        worker: workerId,
        project: lastAttendance.project,
        periodStart: new Date(),
        periodEnd: new Date(),
      });
    }

    salaryDoc.hiddenFromAdmin = true;
    await salaryDoc.save();

    res.json({ message: "Worker salary removed from admin view" });
  } catch (error) {
    console.error("DELETE SALARY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWorkerSalary, getAllSalaries, deleteWorkerSalary };
