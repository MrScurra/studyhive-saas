# Firestore Data Verification Guide

## Quick Start: Testing Firestore Integration

### Prerequisites
- ✅ Service account key saved as `backend/serviceAccountKey.json`
- ✅ Backend running: `npm start`
- ✅ Frontend accessible
- ✅ Logged in to Firebase

---

## Option 1: Verify in Firebase Console

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **study-collab-saas-js**
3. Click **Firestore Database** in left sidebar

### Step 2: Check Collections
You should see 4 collections:
- **posts** - All published posts
- **upvotes** - All user upvotes
- **comments** - All comments/insights
- **bookmarks** - All bookmarked posts

### Step 3: View Posts Collection
```
Click: posts collection
See documents like:
  - post-1234567890-abc123
  - post-1234567890-def456
  
Click a document to see:
  - content: "Post text here"
  - userId: "firebase-user-id"
  - userName: "User Name"
  - category: "Biology 101"
  - createdAt: "2026-05-24T15:30:45.123Z"
  - fileUrl: "http://..." (if attachment)
```

### Step 4: View Upvotes Collection
```
Click: upvotes collection
See documents like:
  - post-123_user-456  (format: {postId}_{userId})
  
Click a document to see:
  - postId: "post-123"
  - userId: "user-456"
  - createdAt: Timestamp
```

### Step 5: View Comments Collection
```
Click: comments collection
See documents with:
  - postId: "post-123"
  - userId: "user-456"
  - author: "User Name"
  - text: "Comment text"
  - timestamp: "ISO-date-string"
```

---

## Option 2: Verify with Backend Logs

### Check Server Logs
When backend starts, you should see:
```
✓ Firestore initialized
Server running on port 5000
```

### Check API Responses
Test the API endpoint:
```bash
curl -H "x-user-id: user-123" http://localhost:5000/api/posts
```

Expected response:
```json
{
  "posts": [
    {
      "id": "post-1234567890-abc123",
      "userId": "user-123",
      "userName": "Your Name",
      "content": "Your post content",
      "category": "General",
      "upvotes": 0,
      "comments": 0,
      "bookmarks": 0,
      "createdAt": "2026-05-24T15:30:45.123Z"
    }
  ]
}
```

---

## Step-by-Step Testing Workflow

### Test 1: Create Post (Write to Firestore)

**In Dashboard:**
1. Type post: "Testing Firestore"
2. Click **Publish**
3. See post appear in feed

**In Firebase Console:**
1. Go to `posts` collection
2. Should see new document with your content
3. Check `createdAt` timestamp

✅ **Verification**: Post exists in Firestore

---

### Test 2: Upvote Post (Write to Firestore)

**In Dashboard:**
1. Click upvote on the post
2. Button should highlight
3. Count increases by 1

**In Firebase Console:**
1. Go to `upvotes` collection
2. Look for document: `post-123_your-user-id`
3. Should show `postId` and `userId`

✅ **Verification**: Upvote stored in Firestore

---

### Test 3: Add Comment (Write to Firestore)

**In Dashboard:**
1. Click **Insights** on a post
2. Type comment in input field
3. Press send (or click comment button)
4. Comment appears below post

**In Firebase Console:**
1. Go to `comments` collection
2. Should see new comment document
3. Check: `postId`, `author`, `text`, `timestamp`

✅ **Verification**: Comment stored in Firestore

---

### Test 4: Bookmark Post (Write to Firestore)

**In Dashboard:**
1. Click bookmark icon on a post
2. Icon should highlight/fill

**In Firebase Console:**
1. Go to `bookmarks` collection
2. Look for document: `post-123_your-user-id`
3. Should show `postId` and `userId`

✅ **Verification**: Bookmark stored in Firestore

---

### Test 5: Persistence (Refresh = Data Remains)

**In Dashboard:**
1. Publish a post
2. Press **F5** to refresh page
3. Wait for page to load
4. Your post should still be there! ✅

**Why this works:**
- Old system: Posts lost on refresh (in-memory)
- New system: Posts loaded from Firestore (cloud database)

---

### Test 6: Edit Post (Update in Firestore)

**In Dashboard:**
1. Click the **three dots** on your post
2. Click **Edit**
3. Change the content
4. Click **Save**
5. Post content updates

**In Firebase Console:**
1. Go to `posts` collection
2. Click your post document
3. Check the `content` field
4. Should show your new text
5. Check `updatedAt` timestamp - should be recent

✅ **Verification**: Post updated in Firestore

---

### Test 7: Delete Post (Delete from Firestore)

**In Dashboard:**
1. Click **three dots** on your post
2. Click **Delete**
3. Confirm deletion
4. Post disappears from feed

**In Firebase Console:**
1. Go to `posts` collection
2. The document should be gone! ✓
3. If you see related upvotes/comments, those are orphaned (safe to ignore)

✅ **Verification**: Post deleted from Firestore

---

## Data Verification Checklist

Use this to verify everything is working:

- [ ] **Collections exist**: posts, upvotes, comments, bookmarks
- [ ] **Posts persisted**: Create post, refresh page, post remains
- [ ] **Upvotes recorded**: Upvote recorded in `upvotes` collection
- [ ] **Comments saved**: Comments visible in `comments` collection
- [ ] **Bookmarks tracked**: Bookmarks recorded in `bookmarks` collection
- [ ] **Edits applied**: Edited post updates in Firestore
- [ ] **Deletes work**: Deleted post removed from Firestore
- [ ] **Timestamps correct**: `createdAt`, `updatedAt`, `timestamp` fields exist
- [ ] **User data present**: `userId`, `userName`, `userEmail` fields populated
- [ ] **Attachments linked**: Posts with files show `fileUrl` field

---

## Common Issues & Solutions

### Issue: Collections don't appear
**Cause**: Firestore not initialized or service account invalid
**Solution**: 
1. Check backend logs for errors
2. Verify `serviceAccountKey.json` exists
3. Restart backend: `npm start`

### Issue: Posts created but don't appear in Firestore
**Cause**: Backend not writing to correct project
**Solution**:
1. Check `firestoreService.js` line 20: projectId should be `'study-collab-saas-js'`
2. Verify service account has Firestore permissions
3. Check backend console for errors

### Issue: Can create post, but can't load posts
**Cause**: `getPosts()` function issue
**Solution**:
1. Check postController.js `getPosts()` function
2. Try: `curl http://localhost:5000/api/posts` 
3. Look for JSON response with posts array

### Issue: Upvotes not showing in collection
**Cause**: POST request not reaching backend
**Solution**:
1. Open browser Dev Tools → Network tab
2. Click upvote
3. Check if POST request shows status 200
4. Look for response: `{"success": true, "upvoted": true, "count": 1}`

---

## Advanced Verification

### Query All Documents Count
In Firebase Console, you can see document counts:
1. Click each collection
2. See "Total documents: X" at top

### Filter Documents
1. Click collection
2. Click **Add Filter**
3. Filter by field: `userId`
4. See all your posts/upvotes

### Export Data
1. Click **⋮** (menu) next to collection
2. Click **Export documents**
3. Gets JSON backup of all data

---

## What You Should See

### After Creating 1 Post:
```
posts: 1 document
├── {postId}
    ├── content: "Post text"
    ├── userId: "user-id"
    ├── userName: "Your Name"
    └── createdAt: Timestamp
```

### After Upvoting 1 Post:
```
upvotes: 1 document
├── {postId}_{userId}
    ├── postId: "..."
    ├── userId: "..."
    └── createdAt: Timestamp
```

### After Adding 1 Comment:
```
comments: 1 document
├── {commentId}
    ├── postId: "..."
    ├── author: "Your Name"
    ├── text: "Comment text"
    └── timestamp: "..."
```

### After Bookmarking 1 Post:
```
bookmarks: 1 document
├── {postId}_{userId}
    ├── postId: "..."
    ├── userId: "..."
    └── createdAt: Timestamp
```

---

## Success Indicators ✅

You'll know Firestore is working when:

1. ✅ Posts appear in Firestore after publishing
2. ✅ Posts persist after page refresh
3. ✅ Upvotes recorded in upvotes collection
4. ✅ Comments stored in comments collection
5. ✅ Bookmarks tracked in bookmarks collection
6. ✅ Edited posts update timestamps
7. ✅ Deleted posts removed from collection
8. ✅ All post metadata (author, timestamp) preserved

---

## Database Schema Verification

Each collection should have this structure:

### ✅ Posts Collection
```
Document: post-1234567890-abc123
  - id: string
  - userId: string
  - userName: string
  - userEmail: string
  - avatar: string
  - content: string
  - category: string
  - fileUrl: string (or empty)
  - fileStoredName: string (or empty)
  - fileName: string (or empty)
  - fileSize: string (or empty)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### ✅ Upvotes Collection
```
Document: post-123_user-456
  - postId: string
  - userId: string
  - createdAt: timestamp
```

### ✅ Comments Collection
```
Document: [auto-generated-id]
  - id: string (same as doc ID)
  - postId: string
  - userId: string
  - userEmail: string
  - author: string
  - avatar: string
  - text: string
  - createdAt: timestamp
```

### ✅ Bookmarks Collection
```
Document: post-123_user-456
  - postId: string
  - userId: string
  - createdAt: timestamp
```

---

## Ready to Deploy?

Before deploying, make sure:
- ✅ Service account key is in `.gitignore` (never commit!)
- ✅ All CRUD operations work locally
- ✅ Firestore collections created
- ✅ Data persists across page refreshes
- ✅ All 4 collections have documents

You're ready! 🚀
