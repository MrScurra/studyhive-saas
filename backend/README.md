# StudyHive Backend

Beginner-friendly Express API for StudyHive.

## How to Run

```bash
cd backend
npm start
```

For auto-restart while editing:

```bash
cd backend
npm run dev
```

## Folder Structure

```text
backend/
  server.js                 # Starts Express and connects middleware/routes
  routes/                   # URL definitions
    postRoutes.js
    debugRoutes.js
  controllers/              # Request/response logic
    postController.js
    debugController.js
  middleware/               # Shared request helpers
    currentUser.js
    errorHandler.js
    notFound.js
  data/
    postsStore.js           # Temporary in-memory posts
    interactionsStore.js    # Temporary in-memory data
```

## Current Endpoints

```text
GET  /api/health

GET  /api/posts
POST /api/posts

POST /api/posts/:postId/upvote
GET  /api/posts/:postId/upvotes

POST /api/posts/:postId/bookmark
GET  /api/posts/:postId/bookmarks

POST /api/posts/:postId/comments
GET  /api/posts/:postId/comments

GET  /api/debug/interactions
```

## Notes

- Data is stored in memory for now, so it resets when the server restarts.
- Firebase Authentication runs in the frontend, then sends the signed-in user's `uid`, name, and avatar to the API using simple request headers.
- Later, you can replace `data/interactionsStore.js` with Firebase, MongoDB, PostgreSQL, or another database.
