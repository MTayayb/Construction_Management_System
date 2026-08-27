const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const materialController = require("../controllers/material.controller");

// ------------------- Engineer Routes -------------------

// Add material IN/OUT for a project
router.post("/:projectId", protect, authorize("engineer"), materialController.addMaterial);

// Get all materials for a project
router.get("/:projectId", protect, authorize("engineer", "admin"), materialController.getProjectMaterials);

module.exports = router;
