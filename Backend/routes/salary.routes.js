const express = require("express");
const router = express.Router();

// Correct imports
const { protect } = require("../middleware/auth.middleware"); // JWT auth
const { authorize } = require("../middleware/role.middleware"); // role-based access
const { getWorkerSalary, getAllSalaries, deleteWorkerSalary } = require("../controllers/salary.controller");

// -------------------
// Worker: Get own salary (optional, can be seen by worker, engineer, admin)
router.get(
  "/worker/:id",
  protect,
  authorize("worker", "engineer", "admin"),
  getWorkerSalary
);

// -------------------
// Admin: Get all workers' salaries
router.get(
  "/all",
  protect,
  authorize("admin"),
  getAllSalaries
);

// Admin: Hide worker salary
router.delete(
  "/:workerId",
  protect,
  authorize("admin"),
  deleteWorkerSalary
);

module.exports = router;
