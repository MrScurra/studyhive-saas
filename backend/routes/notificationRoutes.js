const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Get all notifications for a user
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark single notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Clear all notifications for the current user
router.delete('/', notificationController.clearNotifications);

module.exports = router;
