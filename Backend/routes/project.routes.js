const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const Project = require("../models/Project");
const multer = require("multer");

// ------------------- Multer for 3D file uploads -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.obj', '.stl', '.glb', '.gltf', '.fbx'];
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only 3D model formats (.obj, .stl, .glb, .gltf, .fbx) are allowed.'), false);
    }
  }
});

// ------------------- Client: Submit Project -------------------
router.post(
  "/submit-project",
  protect,
  authorize("client"),
  upload.single("model3D"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const model3D = req.file ? req.file.path : "";

      const project = await Project.create({
        name,
        client: req.user._id,
        description,
        model3D,
        status: "pending",
        materials: [],
        progressReports: [],
        attendance: [],
        hiddenFromAdmin: false,
        hiddenFromEngineer: false,
        hiddenFromClient: false
      });

      // Notify Admin
      const User = require("../models/User");
      const { createNotification } = require("../controllers/notification.controller");
      const admins = await User.find({ role: "admin" });
      admins.forEach((admin) => {
        createNotification(
          admin._id,
          "general",
          "New Project Submitted",
          `Client ${req.user.name} submitted a new project: ${name}`,
          null,
          project._id
        );
      });

      res.status(201).json({ message: "Project submitted", project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ------------------- Admin: Assign Engineer -------------------
router.post(
  "/assign-engineer",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { projectId, engineerId } = req.body;
      const { createNotification } = require("../controllers/notification.controller");

      const project = await Project.findById(projectId).populate("client", "name");
      if (!project) return res.status(404).json({ message: "Project not found" });

      // Requirement 5: Exclusive project assignment (only one engineer)
      if (project.assignedEngineers && project.assignedEngineers.length > 0) {
        if (!project.assignedEngineers.includes(engineerId)) {
          return res.status(400).json({ message: "This project is already assigned to another engineer." });
        }
      }

      if (!project.assignedEngineers.includes(engineerId)) {
        project.assignedEngineers.push(engineerId);

        // Auto-set status to in-progress
        if (project.status === "pending") {
          project.status = "in-progress";
        }

        await project.save();

        // Create notification for engineer
        await createNotification(
          engineerId,
          "engineer_assigned",
          "New Project Assigned",
          `You have been assigned to project: ${project.name}`,
          null,
          projectId
        );

        // Create notification for client
        await createNotification(
          project.client._id,
          "engineer_assigned",
          "Engineer Assigned",
          `An engineer has been assigned to your project: ${project.name}`,
          null,
          projectId
        );
      }

      res.json({ message: "Engineer assigned", project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ------------------- Engineer: Update Task Progress -------------------
router.put(
  "/update-task/:id",
  protect,
  authorize("engineer"),
  async (req, res) => {
    try {
      const { progress } = req.body;
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      project.progressReports.push({ engineer: req.user._id, progress });
      await project.save();

      res.json({ message: "Task progress updated", project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Note: Material and Attendance routes have been moved to their respective 
// specialized routes (/api/materials and /api/attendance) to maintain 
// data consistency with separate collections used by Analytics.

// ------------------- Get Projects -------------------
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    const userRole = (req.user.role || "").toString().trim().toLowerCase();

    if (userRole === "client") {
      query = { client: req.user._id, hiddenFromClient: { $ne: true } };
    } else if (userRole === "engineer") {
      query = {
        assignedEngineers: req.user._id,
        hiddenFromEngineer: { $ne: true },
        hiddenFromEngineerIds: { $ne: req.user._id }
      };
    } else if (userRole === "admin") {
      query = { hiddenFromAdmin: { $ne: true } };
    } else if (userRole === "worker") {
      // Workers should only see projects that are active/not hidden from engineers
      query = { hiddenFromEngineer: { $ne: true } };
    } else {
      query = { _id: null };
    }

    const projects = await Project.find(query)
      .populate("assignedEngineers", "name email")
      .populate("client", "name")
      .populate("progressReports.engineer", "name");

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// ------------------- Delete Project (Role-specific) -------------------
router.delete("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userRole = req.user.role ? req.user.role.toLowerCase() : "";

    if (userRole === "admin") {
      // Admin delete: hide from admin and ALL engineers (Client still sees it)
      project.hiddenFromAdmin = true;
      project.hiddenFromEngineer = true;
      await project.save();
      return res.json({ message: "Project removed from admin and engineer view" });
    } else if (userRole === "client") {
      // Client delete: hide from EVERYONE (Sync to Admin per original requirement)
      if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }
      project.hiddenFromClient = true;
      project.hiddenFromAdmin = true;
      project.hiddenFromEngineer = true;
      await project.save();
      return res.json({ message: "Project deleted successfully" });
    } else if (userRole === "engineer") {
      // Engineer delete: hide ONLY from the specific Engineer
      // Use .some() and toString() for robust ObjectId matching in arrays
      const isAssigned = project.assignedEngineers.some(id => id.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }

      const isAlreadyHidden = project.hiddenFromEngineerIds.some(id => id.toString() === req.user._id.toString());
      if (!isAlreadyHidden) {
        project.hiddenFromEngineerIds.push(req.user._id);
        await project.save();
      }
      return res.json({ message: "Project removed from your view" });
    } else {
      return res.status(403).json({ message: "Authorized role required for deletion" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
