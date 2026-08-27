const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
    getAnalyticsOverview,
    getClientAnalytics,
    getProjectProgress,
} = require("../controllers/analytics.controller");

// Admin analytics overview
router.get("/overview", protect, authorize("admin"), getAnalyticsOverview);

// Client analytics
router.get("/client", protect, authorize("client"), getClientAnalytics);

// Project progress details
router.get("/project/:projectId", protect, getProjectProgress);

module.exports = router;
