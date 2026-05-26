const firestoreService = require('../services/firestoreService');

function getNotificationUserId(req) {
  return String(req.headers['x-user-id'] || req.query.userId || '').trim();
}

async function getNotifications(req, res, next) {
  try {
    const userId = getNotificationUserId(req);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notifications = await firestoreService.getNotifications(userId, 50);
    res.json({ notifications });
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        notifications: [],
        degraded: true,
        warning: 'Firestore quota exceeded; notifications are temporarily unavailable.'
      });
    }

    return next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const userId = getNotificationUserId(req);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const unreadCount = await firestoreService.getUnreadNotificationCount(userId);
    res.json({ unreadCount });
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        unreadCount: 0,
        degraded: true,
        warning: 'Firestore quota exceeded; unread notification count is temporarily unavailable.'
      });
    }

    return next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    await firestoreService.markNotificationAsRead(notificationId);
    res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = getNotificationUserId(req);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await firestoreService.markAllNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

async function clearNotifications(req, res, next) {
  try {
    const userId = getNotificationUserId(req);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await firestoreService.clearNotificationsForUser(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotifications
};
