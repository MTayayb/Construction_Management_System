const ChangeRequest = require("../models/ChangeRequest");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require("./notification.controller");

// -------------------
// Client: Submit a change request
// -------------------
const submitChangeRequest = async (req, res) => {
  try {
    const { projectId, description } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const changeRequest = await ChangeRequest.create({
      project: projectId,
      client: req.user._id,
      description,
      status: "pending",
    });

    // Notify Admin
    const admins = await User.find({ role: "admin" });
    admins.forEach(admin => {
      createNotification(
        admin._id,
        "general", // Or add "change_request" to enum if needed, using general for now
        `New Change Request: ${project.name}`,
        `Client ${req.user.name} requested a change for project ${project.name}`,
        null,
        projectId
      );
    });

    res.status(201).json({ message: "Change request submitted", changeRequest });
  } catch (error) {
    console.error("SUBMIT CHANGE REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Admin: Approve or reject a change request
// -------------------
const respondToChangeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await ChangeRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Change request not found" });

    request.status = status;
    request.responseMessage = responseMessage || "";
    await request.save();

    // Notify Client
    const project = await Project.findById(request.project);
    createNotification(
      request.client,
      "change_request_response",
      `Change Request ${status.toUpperCase()}`,
      `Admin has ${status} your change request for project ${project ? project.name : 'Unknown'}. ${responseMessage ? 'Message: ' + responseMessage : ''}`,
      null,
      request.project
    );

    res.json({ message: "Change request updated", request });
  } catch (error) {
    console.error("RESPOND CHANGE REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Get all change requests (Admin only)
// -------------------
const getAllChangeRequests = async (req, res) => {
  try {
    const requests = await ChangeRequest.find({ hiddenFromAdmin: { $ne: true } })
      .populate("client", "name email")
      .populate("project", "name description");
    res.json(requests);
  } catch (error) {
    console.error("GET ALL CHANGE REQUESTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Client: Get own change requests
// -------------------
const getClientChangeRequests = async (req, res) => {
  try {
    const requests = await ChangeRequest.find({ client: req.user._id, hiddenFromClient: { $ne: true } })
      .populate("project", "name description");
    res.json(requests);
  } catch (error) {
    console.error("GET CLIENT CHANGE REQUESTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------
// Delete Change Request (Soft-delete)
// -------------------
const deleteChangeRequest = async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Change request not found" });

    if (req.user.role === "admin") {
      request.hiddenFromAdmin = true;
    } else if (req.user.role === "client") {
      if (request.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      request.hiddenFromClient = true;
    } else {
      return res.status(403).json({ message: "Role not authorized to delete" });
    }

    await request.save();
    res.json({ message: "Change request deleted for your view" });
  } catch (error) {
    console.error("DELETE CHANGE REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitChangeRequest,
  respondToChangeRequest,
  getAllChangeRequests,
  getClientChangeRequests,
  deleteChangeRequest,
};
