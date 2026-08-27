const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
    getAllAttendance,
    exportAttendanceCSV,
    recordAttendance,
    getWorkerAttendance,
    getProjectAttendance,
    deleteAttendance,
    deleteAttendanceWorker,
    deleteAttendanceEngineer
} = require("../controllers/attendance.controller");

// Get all attendance records (Admin)
router.get("/all", protect, authorize("admin"), getAllAttendance);

// Delete attendance record (Admin)
router.delete("/:id", protect, authorize("admin"), deleteAttendance);

// Export attendance as CSV (Admin)
router.get("/export-csv", protect, authorize("admin"), exportAttendanceCSV);

// Record attendance (Worker)
router.post("/:projectId", protect, authorize("worker"), recordAttendance);

// Get worker attendance
router.get("/", protect, authorize("worker", "admin", "engineer"), getWorkerAttendance);

// Worker delete attendance
router.delete("/worker/:id", protect, authorize("worker"), deleteAttendanceWorker);

// Engineer: Get attendance for specific project
router.get("/project/:projectId", protect, authorize("engineer", "admin"), getProjectAttendance);

// Engineer: Delete attendance (individual)
router.delete("/engineer/:id", protect, authorize("engineer"), deleteAttendanceEngineer);

module.exports = router;
