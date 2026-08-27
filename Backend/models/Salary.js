const mongoose = require("mongoose");

const SalarySchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    totalHours: { type: Number, default: 0 }, // Total working hours
    hourlyRate: { type: Number, default: 90 }, // 90 Rs per hour
    totalSalary: { type: Number, default: 0 }, // Calculated automatically
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
    hiddenFromAdmin: { type: Boolean, default: false },
    historyHiddenFromAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", SalarySchema);
