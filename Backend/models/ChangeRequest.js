const mongoose = require("mongoose");

const ChangeRequestSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    responseMessage: { type: String }, // Optional message from admin
    hiddenFromAdmin: { type: Boolean, default: false },
    hiddenFromClient: { type: Boolean, default: false },
    historyHiddenFromAdmin: { type: Boolean, default: false },
    historyHiddenFromClient: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChangeRequest", ChangeRequestSchema);
