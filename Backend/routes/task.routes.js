const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const taskController = require("../controllers/task.controller");

// ------------------- Engineer Routes -------------------

// Create a new task (Admin can also assign, you can protect accordingly)
router.post("/", protect, authorize("engineer"), taskController.createTask);

// Update task status/progress
router.put("/:id", protect, authorize("engineer"), taskController.updateTask);

// Get all tasks assigned to the logged-in engineer
router.get("/", protect, authorize("engineer"), taskController.getTasksForEngineer);

module.exports = router;
