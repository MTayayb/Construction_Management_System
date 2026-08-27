const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require("./notification.controller");

// Engineer: Create a new task for a project
exports.createTask = async (req, res) => {
  try {
    const { projectId, title, description, assignedTo } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const task = await Task.create({
      project: projectId,
      title,
      description,
      assignedTo, // Engineer assigned
      status: "pending",
    });

    project.tasks.push(task._id);
    await project.save();

    // Notify Admin
    const admins = await User.find({ role: "admin" });
    admins.forEach(admin => {
      createNotification(
        admin._id,
        "general",
        `New Task Created: ${title}`,
        `Engineer ${req.user.name} created a task for project ${project.name}`,
        null,
        projectId
      );
    });

    // Notify Assigned Engineer (if different)
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      createNotification(
        assignedTo,
        "general",
        `New Task Assigned: ${title}`,
        `You have been assigned a new task for project ${project.name}`,
        null,
        projectId
      );
    }

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Engineer: Update task status/progress
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const task = await Task.findById(id).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = status || task.status;
    task.progress = progress || task.progress;

    await task.save();

    // Notify Admin
    const admins = await User.find({ role: "admin" });
    admins.forEach(admin => {
      createNotification(
        admin._id,
        "general",
        `Task Updated: ${task.title}`,
        `Task "${task.title}" in project ${task.project?.name || 'Unknown'} was updated to ${status || task.status}`,
        null,
        task.project?._id
      );
    });

    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks for engineer
exports.getTasksForEngineer = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id }).populate("project");
    res.json(tasks);
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
