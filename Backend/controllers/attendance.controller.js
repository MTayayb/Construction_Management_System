const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Project = require("../models/Project");
const { createNotification } = require("./notification.controller");

// -------------------
// Get All Attendance Records (Admin)
// -------------------
const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ hiddenFromAdmin: { $ne: true } })
      .populate("worker", "name email")
      .populate("project", "name")
      .sort({ time: -1 });
    res.json(attendance);
  } catch (error) {
    console.error("GET ALL ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Delete Attendance Record (Soft-delete for Admin)
// -------------------
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    if (req.user.role === "admin") {
      record.hiddenFromAdmin = true;
      await record.save();
      res.json({ message: "Attendance record removed from view" });
    } else {
      res.status(403).json({ message: "Only admin can delete attendance records" });
    }
  } catch (error) {
    console.error("DELETE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Export Attendance as CSV
// -------------------
const exportAttendanceCSV = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("worker", "name email")
      .populate("project", "name")
      .sort({ time: -1 });

    // Create CSV content
    let csv = "Worker Name,Worker Email,Project,Status,Date,Time\n";

    attendance.forEach(record => {
      const workerName = record.worker?.name || "N/A";
      const workerEmail = record.worker?.email || "N/A";
      const projectName = record.project?.name || "N/A";
      const status = record.status || "N/A";
      const date = new Date(record.time).toLocaleDateString();
      const time = new Date(record.time).toLocaleTimeString();

      csv += `"${workerName}","${workerEmail}","${projectName}","${status}","${date}","${time}"\n`;
    });

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance-records.csv");
    res.send(csv);
  } catch (error) {
    console.error("EXPORT ATTENDANCE CSV ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Worker: Clock-in / Clock-out
async function recordAttendance(req, res) {
  try {
    const { projectId } = req.params;
    const { status } = req.body; // "in" or "out"

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const attendance = await Attendance.create({
      project: projectId,
      worker: req.user._id,
      status,
    });

    project.attendance.push(attendance._id);
    await project.save();

    // Notify Admin and Engineers
    const admins = await User.find({ role: "admin" });
    admins.forEach(admin => {
      createNotification(
        admin._id,
        "general",
        `Worker ${status === 'in' ? 'Clock In' : 'Clock Out'}`,
        `Worker ${req.user.name} clocked ${status} for project ${project.name}`,
        null,
        projectId
      );
    });

    project.assignedEngineers.forEach(engId => {
      createNotification(
        engId,
        "general",
        `Worker ${status === 'in' ? 'Clock In' : 'Clock Out'}`,
        `Worker ${req.user.name} clocked ${status} for project ${project.name}`,
        null,
        projectId
      );
    });

    res.status(201).json({ message: "Attendance recorded", attendance });
  } catch (error) {
    console.error("ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
}

// Get attendance for a worker
async function getWorkerAttendance(req, res) {
  try {
    let query = {};
    if (req.user.role === "worker") {
      query = { worker: req.user._id, hiddenFromWorker: { $ne: true } };
    } else if (req.user.role === "engineer") {
      const projects = await Project.find({ assignedEngineers: req.user._id }).select("_id");
      const projectIds = projects.map(p => p._id);
      query = {
        project: { $in: projectIds },
        hiddenFromEngineerIds: { $ne: req.user._id }
      };
    } else if (req.user.role === "admin") {
      query = { hiddenFromAdmin: { $ne: true } };
    }

    const attendances = await Attendance.find(query)
      .populate("worker", "name email")
      .populate("project", "name")
      .sort({ time: -1 });
    res.json(attendances);
  } catch (error) {
    console.error("GET ATTENDANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
}

// Worker: Delete attendance (Soft delete)
async function deleteAttendanceWorker(req, res) {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (record.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    record.hiddenFromWorker = true;
    await record.save();
    res.json({ message: "Record deleted from your view" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getProjectAttendance = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (req.user.role === "engineer" && !project.assignedEngineers.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const attendance = await Attendance.find({
      project: projectId,
      hiddenFromEngineerIds: { $ne: req.user._id }
    })
      .populate("worker", "name email")
      .populate("project", "name")
      .sort({ time: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAttendanceEngineer = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });

    if (req.user.role === "engineer") {
      if (!record.hiddenFromEngineerIds.includes(req.user._id)) {
        record.hiddenFromEngineerIds.push(req.user._id);
        await record.save();
      }
      res.json({ message: "Attendance record removed" });
    } else {
      res.status(403).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllAttendance,
  exportAttendanceCSV,
  recordAttendance,
  getWorkerAttendance,
  getProjectAttendance,
  deleteAttendance,
  deleteAttendanceWorker,
  deleteAttendanceEngineer
};
