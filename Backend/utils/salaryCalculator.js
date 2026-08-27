const Attendance = require("../models/Attendance");

// ---------------- CONFIG ----------------
const DAILY_RATE = 720;          // salary per full day (8 hrs) @ 90 Rs/hr
const HOURS_PER_DAY = 8;
const OVERTIME_RATE = 110;       // per extra hour (slightly boosted)
// ----------------------------------------

/**
 * Calculate salary for ONE worker
 */
const calculateWorkerSalary = async (workerId) => {
  try {
    // Get all attendance for this worker, sorted by time
    const records = await Attendance.find({ worker: workerId }).sort({ time: 1 });

    let totalHours = 0;

    // Pair IN → OUT sequentially
    for (let i = 0; i < records.length - 1; i++) {
      if (records[i].status === "in" && records[i + 1].status === "out") {
        const inTime = new Date(records[i].time);
        const outTime = new Date(records[i + 1].time);

        const diffMs = outTime - inTime;
        const hoursWorked = diffMs / (1000 * 60 * 60);

        if (hoursWorked > 0 && hoursWorked < 24) { // Sanity check
          totalHours += hoursWorked;
        }

        // Skip the 'out' record so we don't try to pair it with the next 'in'
        i++;
      }
    }

    // Convert hours to salary
    const fullDays = Math.floor(totalHours / HOURS_PER_DAY);
    const remainingHours = totalHours % HOURS_PER_DAY;

    const baseSalary = fullDays * DAILY_RATE;
    const overtimeSalary = remainingHours * OVERTIME_RATE;

    return {
      totalHours: Number(totalHours.toFixed(2)),
      fullDays,
      overtimeHours: Number(remainingHours.toFixed(2)),
      totalSalary: Math.round(baseSalary + overtimeSalary), // Using 'totalSalary' for consistency
    };
  } catch (error) {
    console.error("Salary calculation failed:", error);
    throw new Error("Failed to calculate salary");
  }
};

/**
 * Calculate salary for ALL workers
 */
const calculateAllSalaries = async (workerIds) => {
  const salaries = [];

  for (const workerId of workerIds) {
    const salaryData = await calculateWorkerSalary(workerId);
    salaries.push({
      worker: workerId,
      ...salaryData,
    });
  }

  return salaries;
};

module.exports = {
  calculateWorkerSalary,
  calculateAllSalaries,
};
