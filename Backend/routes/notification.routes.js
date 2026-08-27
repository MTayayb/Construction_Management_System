const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notification.controller");

// All routes require authentication
router.get("/", protect, getUserNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read/:id", protect, markAsRead);
router.put("/read-all", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
