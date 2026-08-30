const Notification = require("../Model/notificationModel");

// Get Notifications
const getNotifications = async (req, res) => {
    try {

        const notifications = await Notification.find({
            user: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json(notifications);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Create Notification (Admin/System)
const createNotification = async (req, res) => {

    try {

        const { user, title, message } = req.body;

        const notification = await Notification.create({
            user,
            title,
            message
        });

        res.status(201).json({
            message: "Notification Created",
            notification
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Mark Single Notification Read
const markAsRead = async (req, res) => {

    try {

        const notification = await Notification.findById(req.params.id);

        if (!notification) {

            return res.status(404).json({
                message: "Notification Not Found"
            });

        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            message: "Notification Marked Read"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Mark All Read
const markAllRead = async (req, res) => {

    try {

        await Notification.updateMany(
            { user: req.user.userId },
            { isRead: true }
        );

        res.status(200).json({
            message: "All Notifications Marked Read"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Delete Notification
const deleteNotification = async (req, res) => {

    try {

        await Notification.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Notification Deleted"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllRead,
    deleteNotification
};