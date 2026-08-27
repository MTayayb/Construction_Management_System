const Report = require("../models/Report");
const Project = require("../models/Project");
const User = require("../models/User");
const ChangeRequest = require("../models/ChangeRequest");
const Attendance = require("../models/Attendance");
const Salary = require("../models/Salary");
const { createNotification } = require("./notification.controller");

// -------------------
// Engineer: Submit Report
// -------------------
const submitReport = async (req, res) => {
    try {
        const { projectId, title, description } = req.body;
        const fileUrl = req.file ? req.file.path : "";

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const report = await Report.create({
            engineer: req.user._id,
            project: projectId,
            title,
            description,
            fileUrl,
        });

        // Notify Admin and Client
        const admins = await User.find({ role: "admin" });
        admins.forEach(admin => {
            createNotification(
                admin._id,
                "report_submitted",
                `New Report: ${title}`,
                `Engineer ${req.user.name} submitted a report for project ${project.name}`,
                null,
                projectId
            );
        });

        createNotification(
            project.client,
            "report_submitted",
            `New Report: ${title}`,
            `A new progress report has been submitted for your project ${project.name}`,
            null,
            projectId
        );

        res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
        console.error("SUBMIT REPORT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get All Reports (Admin/Engineer)
// -------------------
const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({ hiddenFromAdmin: { $ne: true } })
            .populate("engineer", "name email")
            .populate("project", "name");
        res.json(reports);
    } catch (error) {
        console.error("GET ALL REPORTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get History (Admin/Engineer/Client)
// -------------------
const getHistory = async (req, res) => {
    try {
        let projects = [];
        let reports = [];
        let changeRequests = [];
        let attendance = [];
        let salaries = [];

        const userRole = req.user.role.toLowerCase();

        if (userRole === "admin") {
            projects = await Project.find({ historyHiddenFromAdmin: { $ne: true }, hiddenFromAdmin: true })
                .populate("client", "name")
                .populate("assignedEngineers", "name");
            reports = await Report.find({ historyHiddenFromAdmin: { $ne: true }, hiddenFromAdmin: true })
                .populate("engineer", "name email")
                .populate("project", "name");
            changeRequests = await ChangeRequest.find({ historyHiddenFromAdmin: { $ne: true }, hiddenFromAdmin: true })
                .populate("client", "name")
                .populate("project", "name");
            attendance = await Attendance.find({ historyHiddenFromAdmin: { $ne: true }, hiddenFromAdmin: true })
                .populate("worker", "name")
                .populate("project", "name");
            salaries = await Salary.find({ historyHiddenFromAdmin: { $ne: true }, hiddenFromAdmin: true })
                .populate("worker", "name");

        } else if (userRole === "engineer") {
            projects = await Project.find({
                assignedEngineers: req.user._id,
                historyHiddenFromEngineerIds: { $ne: req.user._id },
                $or: [
                    { hiddenFromEngineer: true },
                    { hiddenFromEngineerIds: req.user._id }
                ]
            }).populate("client", "name");

            reports = await Report.find({
                engineer: req.user._id,
                historyHiddenFromEngineerIds: { $ne: req.user._id },
                $or: [
                    { hiddenFromEngineer: true },
                    { hiddenFromEngineerIds: req.user._id }
                ]
            }).populate("project", "name");
        } else if (userRole === "client") {
            projects = await Project.find({
                client: req.user._id,
                historyHiddenFromClient: { $ne: true },
                hiddenFromClient: true
            }).populate("assignedEngineers", "name");

            // First get client projects to filter reports securely
            const allClientProjects = await Project.find({ client: req.user._id }).select("_id");
            const clientProjectIds = allClientProjects.map(p => p._id);

            reports = await Report.find({
                project: { $in: clientProjectIds },
                historyHiddenFromClient: { $ne: true },
                hiddenFromClient: true
            }).populate("engineer", "name email")
                .populate("project", "name");

            changeRequests = await ChangeRequest.find({
                client: req.user._id,
                historyHiddenFromClient: { $ne: true },
                hiddenFromClient: true
            }).populate("project", "name");
        } else if (userRole === "worker") {
            attendance = await Attendance.find({
                worker: req.user._id,
                historyHiddenFromWorker: { $ne: true },
                hiddenFromWorker: true
            }).populate("project", "name");
        }

        res.json({ projects, reports, changeRequests, attendance, salaries });
    } catch (error) {
        console.error("GET HISTORY ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Clear History
// -------------------
const clearHistory = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            await Project.updateMany({ hiddenFromAdmin: true }, { historyHiddenFromAdmin: true });
            await Report.updateMany({ hiddenFromAdmin: true }, { historyHiddenFromAdmin: true });
            await ChangeRequest.updateMany({ hiddenFromAdmin: true }, { historyHiddenFromAdmin: true });
            await Attendance.updateMany({ hiddenFromAdmin: true }, { historyHiddenFromAdmin: true });
            await Salary.updateMany({ hiddenFromAdmin: true }, { historyHiddenFromAdmin: true });
        } else if (req.user.role === "engineer") {
            // Update individual history hidden state for projects and reports
            await Project.updateMany(
                { assignedEngineers: req.user._id, hiddenFromEngineerIds: req.user._id },
                { $push: { historyHiddenFromEngineerIds: req.user._id } }
            );
            await Report.updateMany(
                { engineer: req.user._id, hiddenFromEngineerIds: req.user._id },
                { $push: { historyHiddenFromEngineerIds: req.user._id } }
            );
            // Also handle global hiddenFromEngineer for backward compatibility
            await Project.updateMany(
                { assignedEngineers: req.user._id, hiddenFromEngineer: true },
                { historyHiddenFromEngineer: true }
            );
            await Report.updateMany(
                { engineer: req.user._id, hiddenFromEngineer: true },
                { historyHiddenFromEngineer: true }
            );
        } else if (req.user.role === "client") {
            await Project.updateMany(
                { client: req.user._id, hiddenFromClient: true },
                { historyHiddenFromClient: true }
            );

            const clientProjects = await Project.find({ client: req.user._id });
            const clientProjectIds = clientProjects.map(p => p._id);

            await Report.updateMany(
                { project: { $in: clientProjectIds }, hiddenFromClient: true },
                { historyHiddenFromClient: true }
            );

            await ChangeRequest.updateMany(
                { client: req.user._id, hiddenFromClient: true },
                { historyHiddenFromClient: true }
            );
        } else if (req.user.role === "worker") {
            await Attendance.updateMany(
                { worker: req.user._id, hiddenFromWorker: true },
                { historyHiddenFromWorker: true }
            );
        }

        // Mutual Delete: Remove ONLY IF hidden from ALL relevant histories
        await Project.deleteMany({
            historyHiddenFromAdmin: true,
            historyHiddenFromEngineer: true,
            historyHiddenFromClient: true
        });
        await Report.deleteMany({
            historyHiddenFromAdmin: true,
            historyHiddenFromEngineer: true,
            historyHiddenFromClient: true
        });
        await ChangeRequest.deleteMany({
            historyHiddenFromAdmin: true,
            historyHiddenFromClient: true
        });
        await Attendance.deleteMany({
            historyHiddenFromAdmin: true,
            historyHiddenFromWorker: true
        });
        await Salary.deleteMany({
            historyHiddenFromAdmin: true
        });

        res.json({ message: "History cleared successfully (Permanent deletion happened if mutually cleared)" });
    } catch (error) {
        console.error("CLEAR HISTORY ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Delete Report (Role-specific soft-delete)
// -------------------
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        if (req.user.role === "admin") {
            report.hiddenFromAdmin = true;
        } else if (req.user.role === "engineer") {
            // Check if it's their own report
            if (report.engineer.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to delete this report" });
            }
            report.hiddenFromEngineer = true;
        } else if (req.user.role === "client") {
            // Check if it belongs to their project (though reports are usually viewed by project)
            const project = await Project.findById(report.project);
            if (project.client.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to delete this report" });
            }
            report.hiddenFromClient = true;
        } else {
            return res.status(403).json({ message: "Role not authorized to delete reports" });
        }

        await report.save();
        res.json({ message: "Report deleted for your view" });
    } catch (error) {
        console.error("DELETE REPORT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get Reports for a Project
// -------------------
const getProjectReports = async (req, res) => {
    try {
        const { projectId } = req.params;
        let query = { project: projectId };

        if (req.user.role === "admin") query.hiddenFromAdmin = { $ne: true };
        else if (req.user.role === "engineer") query.hiddenFromEngineer = { $ne: true };

        const reports = await Report.find(query)
            .populate("engineer", "name")
            .populate("project", "name");
        res.json(reports);
    } catch (error) {
        console.error("GET PROJECT REPORTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get Reports for Client's Projects
// -------------------
const getClientReports = async (req, res) => {
    try {
        // Find all projects where the client is the logged-in user
        const clientProjects = await Project.find({ client: req.user._id }).select("_id");
        const projectIds = clientProjects.map(p => p._id);

        // Find all reports for those projects, filtering by hiddenFromClient
        const reports = await Report.find({
            project: { $in: projectIds },
            hiddenFromClient: { $ne: true }
        })
            .populate("engineer", "name email")
            .populate("project", "name")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error("GET CLIENT REPORTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

const getEngineerReports = async (req, res) => {
    try {
        const reports = await Report.find({
            engineer: req.user._id,
            hiddenFromEngineer: { $ne: true }
        })
            .populate("project", "name")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error("GET ENGINEER REPORTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitReport,
    getAllReports,
    getProjectReports,
    getClientReports,
    getEngineerReports,
    deleteReport,
    getHistory,
    clearHistory
};
