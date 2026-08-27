const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    status: { type: String, enum: ["in", "out"], required: true },
    time: { type: Date, default: Date.now },
    hiddenFromAdmin: { type: Boolean, default: false },
    hiddenFromWorker: { type: Boolean, default: false },
    historyHiddenFromAdmin: { type: Boolean, default: false },
    historyHiddenFromWorker: { type: Boolean, default: false },
    historyHiddenFromEngineer: { type: Boolean, default: false },
    hiddenFromEngineerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    historyHiddenFromEngineerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
