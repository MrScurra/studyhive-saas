# StudyHive Notification System Implementation Guide

## Overview

A clean, lightweight notification system has been added to the StudyHive dashboard header. Notifications persist in Firebase Firestore and appear in a dropdown panel with unread badge.

## Features

✅ **Notification Bell Icon** - Left of user profile in header
✅ **Unread Badge** - Shows count of unread notifications
✅ **Dropdown Panel** - Scrollable list of notifications
✅ **Real-time Updates** - Polls for new notifications every 30 seconds when dropdown open
✅ **Mark as Read** - Click notification to mark read
✅ **Mark All Read** - Button to mark all notifications as read
✅ **Persistent** - All notifications stored in Firestore
✅ **Dark Mode Support** - Fully themed for light and dark modes
✅ **Empty State** - Shows "No notifications yet" when empty
✅ **Responsive** - Works on mobile and desktop

## UI Placement

**Header Layout (left to right):**
```
[Logo] [Search Bar] [🔔 Notifications] [👤 User Profile]
```

The bell icon appears on the LEFT side of the user profile menu, as requested.

## Notification Types

Notifications can be created for:
- **comments** - When someone replies to your post
- **upvotes** - When someone upvotes your post
- **bookmarks** - When someone bookmarks content
- **messages** - New messages from users
- **circle** - Study circle activity

## Firestore Collection Structure

```
notifications/
├── {notificationId}
│   ├── userId: string (recipient)
│   ├── fromUser: string (sender name)
│   ├── avatar: string (sender avatar URL)
│   ├── message: string (notification text)
│   ├── type: string (comment, upvote, bookmark, message, circle)
│   ├── postId: string (optional, for post-related notifications)
│   ├── link: string (optional, link to notification target)
│   ├── read: boolean (false when new)
│   └── createdAt: timestamp (server timestamp)
```

## Backend API Endpoints

### Get Notifications
```
GET /api/notifications?userId={userId}
Response: { notifications: [...] }
```

### Get Unread Count
```
GET /api/notifications/unread-count?userId={userId}
Response: { unreadCount: 5 }
```

### Mark as Read
```
PUT /api/notifications/{notificationId}/read
Response: { success: true }
```

### Mark All as Read
```
PUT /api/notifications/mark-all-read?userId={userId}
Response: { success: true }
```

## Frontend Functions

All notification functions in `dashboard.js`:

### `initNotificationPanel()`
Initializes the notification system:
- Sets up bell icon click handler
- Opens/closes dropdown
- Polls for new notifications
- Closes on outside click

### `loadNotifications()`
Fetches notifications from backend and displays them.

### `updateNotificationBadge()`
Updates the unread count badge.

### `markNotificationAsRead(notificationId)`
Marks a single notification as read.

### `markAllNotificationsAsRead()`
Marks all notifications as read.

### `formatRelativeTime(timestamp)`
Converts timestamps to relative format (e.g., "2m ago", "1h ago").

### `renderNotificationItem(notification)`
Creates HTML element for a notification.

### `displayNotifications(notifications)`
Renders all notifications in the dropdown.

## Creating Notifications Programmatically

From backend code, create notifications like this:

```javascript
const firestoreService = require('./services/firestoreService');

await firestoreService.createNotification(userId, {
  fromUser: 'John Doe',
  avatar: 'avatar-url.jpg',
  message: 'John upvoted your post',
  type: 'upvote',
  postId: 'post-123',
  link: '/posts/post-123'
});
```

Example in `postController.js` when someone upvotes:

```javascript
// After adding upvote to Firestore
const postAuthor = post.userId; // Get post author ID
await firestoreService.createNotification(postAuthor, {
  fromUser: req.user.name,
  avatar: req.user.avatar,
  message: `${req.user.name} upvoted your post`,
  type: 'upvote',
  postId: postId,
  link: `/posts/${postId}`
});
```

## Notification UI Behavior

### Bell Icon
- Shows bell emoji (🔔)
- Displays unread count badge (red, top-right)
- Clickable to toggle dropdown
- Hover effect (slight scale-up)

### Dropdown Panel
- Opens below bell icon
- Width: 380px (desktop), 320px (tablet), 280px (mobile)
- Max height: 500px (desktop), 400px (tablet)
- Vertically scrollable
- Shadow and border styling

### Notification Items
- Shows avatar, message, timestamp, and type badge
- Unread items: yellow-tinted background
- Hover: cream background (#faf6ed)
- Click: marks as read
- Type badges: different colors per type
  - Comments: Blue (#1565c0)
  - Upvotes: Orange (#e65100)
  - Bookmarks: Purple (#6a1b9a)
  - Messages: Green (#2e7d32)
  - Circle: Pink (#c2185b)

### Empty State
- Shows "No notifications yet" message
- Centered, light gray text
- Appears when no notifications exist

### Relative Timestamps
- Just now (< 1 min)
- 2m ago, 5m ago (minutes)
- 1h ago, 3h ago (hours)
- 1d ago, 3d ago (days)
- Date format for > 7 days ago

## Polling Behavior

Notifications are polled when the dropdown is open:
- Polls every 30 seconds
- Updates the notification list
- Updates the badge count
- Stops polling when dropdown closes
- Restarts when dropdown opens again

## Dark Mode Support

All notification colors automatically adjust in dark mode:
- Background: #242424
- Text: #e8e8e8
- Hover: #2e2e2e
- Badge: #3a3a3a
- Type badges: Darkened with opacity

## Responsive Design

| Screen Size | Dropdown Width | Max Height |
|-------------|----------------|-----------|
| Desktop    | 380px         | 500px    |
| Tablet     | 320px         | 400px    |
| Mobile     | 280px         | 400px    |

Mobile also adjusts:
- Dropdown positioned right: -20px
- Smaller fonts for header
- Tighter padding

## Files Modified

✅ `dashboard.html` - Added notification bell HTML
✅ `notifications.css` - New file with all notification styling
✅ `dashboard.js` - Added notification functions
✅ `firebase-config.js` - Already has Firestore (no changes needed)
✅ `backend/services/firestoreService.js` - Added notification functions
✅ `backend/controllers/notificationController.js` - New file
✅ `backend/routes/notificationRoutes.js` - New file
✅ `backend/server.js` - Added notification routes

## Testing the Notification System

### Test 1: View Notifications
1. Open dashboard
2. Click bell icon in header
3. Dropdown should open with notification list or "No notifications yet"

### Test 2: Badge Count
1. Create a notification in Firestore (see section above)
2. Refresh page
3. Badge should show "1"
4. Badge should have red background and white text

### Test 3: Mark as Read
1. Click notification in dropdown
2. Notification background should lose yellow tint
3. Badge count should update (if last unread)
4. Notification stays in list but marked as read

### Test 4: Mark All as Read
1. Have multiple unread notifications
2. Click "Mark all as read" button
3. All notifications should lose yellow tint
4. Badge should disappear

### Test 5: Close Dropdown
1. Open dropdown
2. Click outside (anywhere on page)
3. Dropdown should close
4. Polling should stop

### Test 6: Persistence
1. Create notification in Firestore
2. Refresh page
3. Notification should still appear
4. Badge count should be correct

### Test 7: Dark Mode
1. Enable dark mode in settings
2. Click bell icon
3. Dropdown should have dark background
4. Text should be light
5. Hover should show dark gray background

## Integration with Post Events

To automatically create notifications when posts get interactions, update `postController.js`:

```javascript
// After upvote is added
if (post.userId !== userId) { // Don't notify self
  const postAuthor = await firestoreService.getPost(postId);
  await firestoreService.createNotification(post.userId, {
    fromUser: req.user.name,
    avatar: req.user.avatar,
    message: `${req.user.name} upvoted your post`,
    type: 'upvote',
    postId: postId
  });
}

// After comment is added
if (post.userId !== userId) {
  await firestoreService.createNotification(post.userId, {
    fromUser: req.user.name,
    avatar: req.user.avatar,
    message: `${req.user.name} commented on your post`,
    type: 'comment',
    postId: postId
  });
}

// After bookmark
if (post.userId !== userId) {
  await firestoreService.createNotification(post.userId, {
    fromUser: req.user.name,
    avatar: req.user.avatar,
    message: `${req.user.name} bookmarked your post`,
    type: 'bookmark',
    postId: postId
  });
}
```

## Future Enhancements

Possible additions (not in this version):
- Real-time notifications using Firebase listeners
- Notification preferences (disable certain types)
- Delete individual notifications
- Archive notifications
- Notification filtering by type
- Sound/browser notifications
- Click notification to navigate to target
- Notification actions (reply, accept, decline)

## Troubleshooting

### Badge doesn't show count
- Check browser console for errors
- Verify userId is set in localStorage
- Check Firestore notifications collection for data

### Dropdown doesn't open
- Check browser console for JavaScript errors
- Verify notificationBell element exists in HTML
- Check that CSS is loaded (notifications.css)

### Notifications don't persist
- Check Firestore is initialized in backend
- Verify serviceAccountKey.json exists
- Check that notifications are being created (test in Firestore console)

### Polling doesn't work
- Verify backend is running
- Check that API endpoints are registered
- Monitor Network tab in Dev Tools

## API Response Examples

### Get Notifications Response
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "userId": "user-456",
      "fromUser": "John Doe",
      "avatar": "https://...",
      "message": "John upvoted your post",
      "type": "upvote",
      "postId": "post-789",
      "read": false,
      "createdAt": "2026-05-24T15:30:45.123Z"
    }
  ]
}
```

### Unread Count Response
```json
{
  "unreadCount": 3
}
```

## Summary

The notification system is:
- ✅ Lightweight and performant
- ✅ Persistent (Firestore-backed)
- ✅ Responsive across all devices
- ✅ Integrated into existing header
- ✅ Clean and modern UI
- ✅ Dark mode compatible
- ✅ Ready to expand with more event types
