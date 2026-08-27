const Material = require("../models/Material");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require("./notification.controller");

// Engineer: Add material IN/OUT
exports.addMaterial = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, quantity, unit, inOut } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const material = await Material.create({
      project: projectId,
      name,
      quantity,
      unit,
      inOut: inOut.toUpperCase(),
      recordedBy: req.user._id,
    });

    project.materials.push(material._id);
    await project.save();

    // Notify Admin
    const admins = await User.find({ role: "admin" });
    admins.forEach(admin => {
      createNotification(
        admin._id,
        "general",
        `Material Update: ${project.name}`,
        `Engineer ${req.user.name} recorded ${quantity} ${unit} of ${name} (${inOut.toUpperCase()}) for project ${project.name}`,
        null,
        projectId
      );
    });

    res.status(201).json({ message: "Material recorded successfully", material });
  } catch (error) {
    console.error("ADD MATERIAL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all materials for a project
exports.getProjectMaterials = async (req, res) => {
  try {
    const { projectId } = req.params;
    const materials = await Material.find({ project: projectId });
    res.json(materials);
  } catch (error) {
    console.error("GET MATERIALS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
