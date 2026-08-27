const Notification = require("../models/Notification");

// -------------------
// Get User Notifications
// -------------------
const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate("project", "name")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Get Unread Count
// -------------------
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });
        res.json({ count });
    } catch (error) {
        console.error("GET UNREAD COUNT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Mark as Read
// -------------------
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { read: true });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("MARK AS READ ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Mark All as Read
// -------------------
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("MARK ALL AS READ ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// -------------------
// Helper: Create Notification
// -------------------
const createNotification = async (userId, type, title, message, link = null, projectId = null) => {
    try {
        await Notification.create({
            user: userId,
            type,
            title,
            message,
            link,
            project: projectId,
        });
    } catch (error) {
        console.error("CREATE NOTIFICATION ERROR:", error);
    }
};

// -------------------
// Delete Notification
// -------------------
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({ _id: id, user: req.user._id });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found or access denied" });
        }

        await Notification.findByIdAndDelete(id);
        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("DELETE NOTIFICATION ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
};
