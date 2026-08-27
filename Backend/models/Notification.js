const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["engineer_assigned", "change_request_response", "report_submitted", "salary_generated", "project_status", "general"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        link: { type: String }, // Optional link to relevant page/section
        read: { type: Boolean, default: false },
        project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, // Optional project reference
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
