# Firebase Firestore Migration Guide

## Overview
The StudyHive post system has been migrated from temporary in-memory storage to **Firebase Firestore**. This means all posts, upvotes, comments, and bookmarks are now persistently stored in the cloud.

## What Changed

### Backend
- **Old**: Posts stored in-memory in `backend/data/postsStore.js` (lost on server restart)
- **New**: Posts stored in Firestore using `backend/services/firestoreService.js`

### Frontend
- **No changes!** The dashboard still calls the same `/api/posts` endpoints
- All interactions (upvote, comment, bookmark) work exactly the same

### Database Collections
The following Firestore collections are automatically created:

```
posts/
├── {postId}
│   ├── id
│   ├── userId
│   ├── userName
│   ├── userEmail
│   ├── avatar
│   ├── content
│   ├── category
│   ├── fileUrl
│   ├── fileStoredName
│   ├── fileName
│   ├── fileSize
│   ├── createdAt (timestamp)
│   └── updatedAt (timestamp)

upvotes/
├── {postId}_{userId}
│   ├── postId
│   ├── userId
│   └── createdAt (timestamp)

comments/
├── {commentId}
│   ├── id
│   ├── postId
│   ├── userId
│   ├── author
│   ├── avatar
│   ├── userEmail
│   ├── text
│   └── createdAt (timestamp)

bookmarks/
├── {postId}_{userId}
│   ├── postId
│   ├── userId
│   └── createdAt (timestamp)
```

## Setup Instructions

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **study-collab-saas-js**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download automatically

### Step 2: Add Service Account to Backend

Save the downloaded file as `serviceAccountKey.json` in the `backend/` directory:

```
study-collab-saas-js/
├── backend/
│   ├── serviceAccountKey.json  ← Add here
│   ├── server.js
│   ├── controllers/
│   ├── services/
│   └── ...
```

**⚠️ IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` to prevent leaking credentials:

```bash
echo "serviceAccountKey.json" >> backend/.gitignore
```

### Step 3: Start the Backend

```bash
cd backend
npm start
```

You should see:
```
✓ Firestore initialized
Server running on port 5000
```

### Step 4: Test in Dashboard

1. Open http://localhost:3000 (or your frontend)
2. Log in with your Firebase account
3. Create a new post
4. Refresh the page
5. **Your post persists!** ✓

## How It Works

### Publishing a Post
```
Frontend → POST /api/posts
  ↓
Backend receives request
  ↓
postController.createPost()
  ↓
firestoreService.savePost(post)
  ↓
Firestore: posts collection ✓
```

### Loading Posts
```
Frontend → GET /api/posts
  ↓
Backend receives request
  ↓
postController.getPosts()
  ↓
firestoreService.getPosts()
  ↓
Firestore: posts collection
  ↓
Backend enriches with upvotes/comments/bookmarks stats
  ↓
Frontend receives enriched posts ✓
```

### Upvote Flow
```
Frontend clicks upvote
  ↓
POST /api/posts/{postId}/upvote
  ↓
postController.toggleUpvote()
  ↓
firestoreService.addUpvote() OR removeUpvote()
  ↓
Firestore: upvotes collection ✓
```

## Verify Firestore Data

### In Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **study-collab-saas-js**
3. Go to **Firestore Database** → **Data**
4. You'll see:
   - `posts` collection with all published posts
   - `upvotes` collection with user upvotes
   - `comments` collection with post comments
   - `bookmarks` collection with bookmarked posts

### Example Firestore Document (Post):
```json
{
  "id": "post-1234567890-abc123",
  "userId": "user-id-from-firebase",
  "userName": "Matt Donovan",
  "userEmail": "matt@example.com",
  "avatar": "./frontend/assets/profile-picture/Matt.jpg",
  "content": "Here's my study guide for the exam tomorrow!",
  "category": "Biology 101",
  "fileUrl": "http://localhost:5000/api/posts/files/file-123.pdf",
  "fileStoredName": "file-123.pdf",
  "fileName": "study-guide.pdf",
  "fileSize": "2.4 MB",
  "createdAt": "2026-05-24T15:30:45.123Z",
  "updatedAt": "2026-05-24T15:30:45.123Z"
}
```

## Environment Variable Option

You can also use an environment variable instead of a file:

```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"study-collab-saas-js",...}'
npm start
```

This is useful for deployment platforms like Heroku, Railway, or Vercel.

## Troubleshooting

### Error: "Cannot find module '../serviceAccountKey.json'"
**Solution**: Download the service account key from Firebase Console (see Step 1-2 above)

### Error: "Firestore initialization attempted"
**Solution**: The backend will still run without Firestore. Check your service account key path or credentials.

### Posts not loading?
1. Check browser console for errors
2. Check backend console logs
3. Verify Firestore is initialized (look for "✓ Firestore initialized")
4. Check that your service account has Firestore permissions

### Cannot delete posts?
Make sure the `userId` in the post matches the logged-in user's ID. Only post authors can delete their own posts.

## Files Modified

✅ `firebase-config.js` - Added Firestore exports
✅ `backend/server.js` - Initialize Firestore on startup
✅ `backend/controllers/postController.js` - Uses Firestore instead of in-memory storage
✅ `backend/services/firestoreService.js` - New Firestore service module (created)

## Files NOT Modified (No Changes Needed)
- `dashboard.js` - Still calls same `/api/posts` endpoints
- `dashboard.html` - UI unchanged
- `post-interactions.js` - Interactions work the same way
- `Login.html` / `login.js` - Auth unchanged

## Key Features Preserved

✅ Publish posts with content and attachments
✅ Edit your own posts
✅ Delete your own posts
✅ Upvote posts (toggle on/off)
✅ Comment on posts (Insights)
✅ Bookmark posts
✅ Download attachments
✅ Category selection
✅ Study circle integration
✅ User profile display

## What's Persistent Now

| Feature | Before | After |
|---------|--------|-------|
| Posts | Lost on server restart ❌ | Saved in Firestore ✅ |
| Upvotes | Lost on server restart ❌ | Saved in Firestore ✅ |
| Comments | Lost on server restart ❌ | Saved in Firestore ✅ |
| Bookmarks | Lost on server restart ❌ | Saved in Firestore ✅ |
| Attachments | Stored on server ✅ | Still stored on server ✅ |

## Next Steps

1. ✅ Implement Firestore service
2. ✅ Update controllers
3. ✅ Test with your Firebase project
4. 📝 (Optional) Add Firestore security rules for production
5. 📝 (Optional) Add offline persistence (PWA)

## Questions?

- Check Firebase documentation: https://firebase.google.com/docs/firestore
- Check Admin SDK docs: https://firebase.google.com/docs/database/admin/start
- Review the service file: `backend/services/firestoreService.js`
