const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g., kg, m3
    inOut: { type: String, enum: ["IN", "OUT", "in", "out"], required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // engineer
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", MaterialSchema);
