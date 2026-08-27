const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
    {
        engineer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        fileUrl: { type: String, default: "" }, // Path to uploaded file (PDF/Image)
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

module.exports = mongoose.model("Report", ReportSchema);
