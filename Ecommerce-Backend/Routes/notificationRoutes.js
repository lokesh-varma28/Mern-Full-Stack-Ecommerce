const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");
const adminMiddleware = require("../MiddleWare/adminMiddleware");

const {
    getNotifications,
    createNotification,
    markAsRead,
    markAllRead,
    deleteNotification
} = require("../Controller/notificationController");

// User Notifications
router.get(
    "/notifications",
    authMiddleware,
    getNotifications
);

// Admin Create Notification
router.post(
    "/notifications",
    authMiddleware,
    adminMiddleware,
    createNotification
);

// Mark Single Notification Read
router.patch(
    "/notifications/:id/read",
    authMiddleware,
    markAsRead
);

// Mark All Notifications Read
router.patch(
    "/notifications/read-all",
    authMiddleware,
    markAllRead
);

// Delete Notification
router.delete(
    "/notifications/:id",
    authMiddleware,
    deleteNotification
);

module.exports = router;