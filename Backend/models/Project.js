const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    assignedEngineers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    model3D: { type: String, default: "" },
    materials: [
      {
        name: String,
        quantity: Number,
        unit: String,
        inOut: { type: String, enum: ["in", "out"] },
        date: { type: Date, default: Date.now },
      },
    ],
    progressReports: [
      {
        engineer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        progress: String,
        date: { type: Date, default: Date.now },
      },
    ],
    attendance: [
      {
        worker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["in", "out"] },
        date: { type: Date, default: Date.now },
      },
    ],
    hiddenFromAdmin: { type: Boolean, default: false },
    hiddenFromEngineer: { type: Boolean, default: false },
    hiddenFromClient: { type: Boolean, default: false },
    historyHiddenFromAdmin: { type: Boolean, default: false },
    historyHiddenFromEngineer: { type: Boolean, default: false },
    historyHiddenFromClient: { type: Boolean, default: false },
    hiddenFromEngineerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    historyHiddenFromEngineerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
