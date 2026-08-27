const Project = require("../models/Project");
const Attendance = require("../models/Attendance");
const Salary = require("../models/Salary");
const Material = require("../models/Material");
const Report = require("../models/Report");

// Helper to extract numbers from progress strings (e.g., "50%", "half way")
const extractProgress = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d+)/);
    return parseInt(match ? match[1] : 0);
};

// -------------------
// Get Analytics Overview (Admin)
// -------------------
const getAnalyticsOverview = async (req, res) => {
    try {
        const allProjects = await Project.find({ hiddenFromAdmin: { $ne: true } });
        const totalProjects = allProjects.length;

        const pendingProjects = allProjects.filter(p => p.status === "pending").length;

        // Technical Completion: status is completed OR latest report is 100%
        const completedProjects = allProjects.filter((p) => {
            if (p.status === "completed") return true;
            if (!p.progressReports || p.progressReports.length === 0) return false;
            const latest = p.progressReports[p.progressReports.length - 1];
            return extractProgress(latest.progress) === 100;
        }).length;

        const inProgressProjects = totalProjects - completedProjects - pendingProjects;

        // Project completion percentage (weighted average)
        let totalAvgProgress = 0;
        if (totalProjects > 0) {
            const sumProgress = allProjects.reduce((acc, p) => {
                if (p.status === "completed") return acc + 100;
                if (!p.progressReports || p.progressReports.length === 0) return acc;
                const latest = p.progressReports[p.progressReports.length - 1];
                return acc + extractProgress(latest.progress);
            }, 0);
            totalAvgProgress = (sumProgress / totalProjects).toFixed(1);
        }
        const completionRate = parseFloat(totalAvgProgress);

        // Material usage summary (only for projects not hidden from admin)
        const activeProjectIds = allProjects.map(p => p._id);
        const materials = await Material.aggregate([
            { $match: { project: { $in: activeProjectIds } } },
            {
                $group: {
                    _id: "$inOut",
                    total: { $sum: "$quantity" },
                },
            },
        ]);

        const materialIn = materials.find((m) => m._id?.toUpperCase() === "IN")?.total || 0;
        const materialOut = materials.find((m) => m._id?.toUpperCase() === "OUT")?.total || 0;

        // Material breakdown (Grouped by name, only for visible projects)
        const materialBreakdown = await Material.aggregate([
            { $match: { project: { $in: activeProjectIds } } },
            {
                $group: {
                    _id: { name: "$name", inOut: "$inOut", unit: "$unit" },
                    total: { $sum: "$quantity" },
                },
            },
            {
                $project: {
                    name: "$_id.name",
                    inOut: "$_id.inOut",
                    unit: "$_id.unit",
                    total: 1,
                    _id: 0
                }
            }
        ]);

        const { calculateAllSalaries } = require("../utils/salaryCalculator");
        const User = require("../models/User");

        // Calculate current total salaries across all workers (LIVE)
        const workers = await User.find({ role: "worker" });
        const workerIds = workers.map(w => w._id);
        const liveSalaries = await calculateAllSalaries(workerIds);

        const salaryStats = liveSalaries.reduce((acc, curr) => ({
            totalSalary: acc.totalSalary + (curr.totalSalary || 0),
            totalHours: acc.totalHours + (curr.totalHours || 0)
        }), { totalSalary: 0, totalHours: 0 });

        // Attendance summary (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceCount = await Attendance.countDocuments({
            time: { $gte: thirtyDaysAgo },
            hiddenFromAdmin: { $ne: true }
        });

        const totalReportsCount = await Report.countDocuments({ hiddenFromAdmin: { $ne: true } });

        // Get 5 most recent progress reports (Admin)
        const recentReports = await Report.find({ hiddenFromAdmin: { $ne: true } })
            .populate("project", "name")
            .populate("engineer", "name")
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            projects: {
                total: totalProjects,
                pending: pendingProjects,
                inProgress: inProgressProjects,
                completed: completedProjects,
                completionRate: parseFloat(totalAvgProgress), // Now technical average
            },
            materials: {
                in: materialIn,
                out: materialOut,
                balance: materialIn - materialOut,
                breakdown: materialBreakdown
            },
            salaries: {
                totalPaid: salaryStats.totalSalary || 0,
                totalHours: Math.round((salaryStats.totalHours || 0) * 10) / 10,
            },
            attendance: {
                last30Days: attendanceCount,
            },
            reports: {
                total: totalReportsCount
            },
            recentReports
        });
    } catch (error) {
        console.error("GET ANALYTICS OVERVIEW ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get Client Analytics
// -------------------
const getClientAnalytics = async (req, res) => {
    try {
        // Find client's projects (excluding hidden ones)
        const projects = await Project.find({ client: req.user._id, hiddenFromClient: { $ne: true } });

        const projectIds = projects.map((p) => p._id);

        const totalProjects = projects.length;

        // Technical Completion: status is completed OR latest report is 100%
        const completedProjects = projects.filter((p) => {
            if (p.status === "completed") return true;
            if (!p.progressReports || p.progressReports.length === 0) return false;
            const latest = p.progressReports[p.progressReports.length - 1];
            return extractProgress(latest.progress) === 100;
        }).length;

        const pendingProjects = projects.filter((p) => p.status === "pending").length;
        const inProgressProjects = totalProjects - completedProjects - pendingProjects;

        // Calculate Average Technical Progress for Client
        let clientAvgProgress = 0;
        if (totalProjects > 0) {
            const sumProgress = projects.reduce((acc, p) => {
                if (p.status === "completed") return acc + 100;
                if (!p.progressReports || p.progressReports.length === 0) return acc;
                const latest = p.progressReports[p.progressReports.length - 1];
                return acc + extractProgress(latest.progress);
            }, 0);
            clientAvgProgress = (sumProgress / totalProjects).toFixed(1);
        }

        // Material usage for client's projects
        const materials = await Material.aggregate([
            { $match: { project: { $in: projectIds } } },
            {
                $group: {
                    _id: "$inOut",
                    total: { $sum: "$quantity" },
                },
            },
        ]);

        const materialIn = materials.find((m) => m._id?.toUpperCase() === "IN")?.total || 0;
        const materialOut = materials.find((m) => m._id?.toUpperCase() === "OUT")?.total || 0;

        // Material breakdown for client's projects (FIXED: Added this missing block)
        const materialBreakdown = await Material.aggregate([
            { $match: { project: { $in: projectIds } } },
            {
                $group: {
                    _id: { name: "$name", inOut: "$inOut", unit: "$unit" },
                    total: { $sum: "$quantity" },
                },
            },
            {
                $project: {
                    name: "$_id.name",
                    inOut: "$_id.inOut",
                    unit: "$_id.unit",
                    total: 1,
                    _id: 0
                }
            }
        ]);

        // Reports for client's projects (excluding hidden records)
        const reportsCount = await Report.countDocuments({
            project: { $in: projectIds },
            hiddenFromClient: { $ne: true }
        });

        // Get 3 most recent progress reports for this client (excluding hidden ones)
        const recentReports = await Report.find({
            project: { $in: projectIds },
            hiddenFromClient: { $ne: true }
        })
            .populate("project", "name")
            .populate("engineer", "name")
            .sort({ createdAt: -1 })
            .limit(3);

        res.json({
            projects: {
                total: totalProjects,
                pending: pendingProjects,
                inProgress: inProgressProjects,
                completed: completedProjects,
                completionRate: parseFloat(clientAvgProgress),
            },
            materials: {
                in: materialIn,
                out: materialOut,
                breakdown: materialBreakdown
            },
            reports: {
                total: reportsCount,
            },
            recentReports
        });
    } catch (error) {
        console.error("GET CLIENT ANALYTICS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get Project Progress Details
// -------------------
const getProjectProgress = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId)
            .populate("assignedEngineers", "name")
            .populate("client", "name");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Calculate progress metrics
        const materialsCount = await Material.countDocuments({ project: projectId });
        const reportsCount = await Report.countDocuments({ project: projectId });
        const attendanceCount = await Attendance.countDocuments({ project: projectId });

        res.json({
            project: {
                name: project.name,
                status: project.status,
                client: project.client?.name || "N/A",
                engineers: project.assignedEngineers.map((e) => e.name),
            },
            metrics: {
                materials: materialsCount,
                reports: reportsCount,
                attendance: attendanceCount,
            },
        });
    } catch (error) {
        console.error("GET PROJECT PROGRESS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalyticsOverview,
    getClientAnalytics,
    getProjectProgress,
};
