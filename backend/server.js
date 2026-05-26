const express = require('express')
const cors = require('cors')
const firestoreService = require('./services/firestoreService')

const profileRoutes = require('./routes/profileRoutes')
const circleRoutes = require('./routes/circleRoutes')
const postRoutes = require('./routes/postRoutes')
const debugRoutes = require('./routes/debugRoutes')
const messageRoutes = require('./routes/messageRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const searchRoutes = require('./routes/searchRoutes')
const friendRoutes = require('./routes/friendRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const supportRoutes = require('./routes/supportRoutes')
const reportRoutes = require('./routes/reportRoutes')
const accountRoutes = require('./routes/accountRoutes')
const presenceRoutes = require('./routes/presenceRoutes')
const addCurrentUser = require('./middleware/currentUser')
const notFound = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000

// Initialize Firestore on server startup
try {
  firestoreService.initializeFirestore()
  console.log('✓ Firestore initialized')
} catch (error) {
  console.warn('⚠ Firestore initialization attempted:', error.message)
  console.warn('  If this fails, make sure serviceAccountKey.json exists or set FIREBASE_SERVICE_ACCOUNT env var')
}

// Basic app middleware
app.use(cors())
app.use(express.json())
app.use(addCurrentUser)

// Simple starter route
app.get('/', (req, res) => {
  res.send('StudyHive API Running')
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyHive API'
  })
})

// API routes
app.use('/api/posts', postRoutes)
app.use('/api/debug', debugRoutes)
app.use('/api/circles', circleRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/account', accountRoutes)
app.use('/api/presence', presenceRoutes)

// Error middleware should stay after the routes
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${PORT}`)
    console.error(error.message)
    process.exit(1)
  }

  console.log(`Server running on port ${PORT}`)
  console.log('API endpoints ready:')
  console.log('  GET  /api/health')
  console.log('  GET  /api/posts')
  console.log('  POST /api/posts')
  console.log('  POST /api/posts/upload')
  console.log('  GET  /api/posts/files/:filename')
  console.log('  POST /api/posts/:postId/upvote')
  console.log('  GET  /api/posts/:postId/upvotes')
  console.log('  POST /api/posts/:postId/bookmark')
  console.log('  GET  /api/posts/:postId/bookmarks')
  console.log('  POST /api/posts/:postId/comments')
  console.log('  GET  /api/posts/:postId/comments')
  console.log('  GET  /api/notifications')
  console.log('  GET  /api/notifications/unread-count')
  console.log('  PUT  /api/notifications/:notificationId/read')
  console.log('  PUT  /api/notifications/mark-all-read')
  console.log('  GET  /api/search/posts?q=')
  console.log('  GET  /api/search/users?q=')
  console.log('  GET  /api/search/circles?q=')
  console.log('  GET  /api/search/all?q=')
  console.log('  GET  /api/friends')
  console.log('  GET  /api/friends/search?q=')
  console.log('  POST /api/friends/requests')
  console.log('  PUT  /api/friends/requests/:requestId/accept')
  console.log('  PUT  /api/friends/requests/:requestId/decline')
  console.log('  DELETE /api/friends/:friendUserId')
  console.log('  GET  /api/circles')
  console.log('  POST /api/circles')
  console.log('  GET  /api/debug/interactions')
  console.log('  GET  /api/messages')
  console.log('  POST /api/messages')
  console.log('  GET  /api/profile')
  console.log('  PUT  /api/profile')
  console.log('  GET  /api/settings')
  console.log('  PUT  /api/settings')
  console.log('  POST /api/support')
  console.log('  GET  /api/reports')
  console.log('  POST /api/reports')
  console.log('  POST /api/account/sign-out-everywhere')
  console.log('  DELETE /api/account')
  console.log('  POST /api/presence')
  console.log('  GET  /api/presence/active-friends')
})
