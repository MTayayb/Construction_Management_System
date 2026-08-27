const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { submitReport, getAllReports, getProjectReports, getClientReports, getEngineerReports, deleteReport, getHistory, clearHistory } = require("../controllers/report.controller");
const multer = require("multer");

// Multer storage for reports (PDFs/Images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        cb(null, `report-${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const path = require('path');
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image formats (.jpg, .jpeg, .png) are allowed.'), false);
        }
    }
});

// -------------------
// Engineer Routes
// -------------------
router.post(
    "/submit",
    protect,
    authorize("engineer"),
    upload.single("file"),
    submitReport
);
router.get("/my-reports", protect, authorize("engineer"), getEngineerReports);

// -------------------
// Public/Shared Routes (Admin + Engineer)
// -------------------
router.get("/all", protect, authorize("admin"), getAllReports);
router.get("/project/:projectId", protect, authorize("engineer", "admin"), getProjectReports);

// -------------------
// Client Routes
// -------------------
router.get("/client", protect, authorize("client"), getClientReports);

// -------------------
// Shared History Routes
// -------------------
router.get("/history", protect, authorize("admin", "engineer", "client", "worker"), getHistory);
router.delete("/history/clear", protect, authorize("admin", "engineer", "client", "worker"), clearHistory);
router.delete("/:id", protect, deleteReport);

module.exports = router;
