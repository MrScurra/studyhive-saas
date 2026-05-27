const firestoreService = require('../services/firestoreService')
const fallbackPosts = require('../data/postsStore')
const fs = require('fs')
const path = require('path')
const { uploadsDir } = require('../config/paths')

function formatFileSize(bytes) {
  if (!bytes) return '0 KB'

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${Math.max(kilobytes, 0.1).toFixed(1)} KB`
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`
}

function createPostId() {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getUploadUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/api/posts/files/${encodeURIComponent(filename)}`
}

function getAttachmentFromBody(body) {
  const attachment = body.attachment || {}
  const originalName = body.fileOriginalName || body.fileName || attachment.originalName || ''
  const storedName = body.fileStoredName || attachment.filename || ''
  const url = body.fileUrl || attachment.url || ''

  if (!originalName && !storedName && !url) {
    return null
  }

  return {
    originalName,
    filename: storedName,
    size: Number(body.fileSizeBytes || attachment.size || 0),
    sizeFormatted: body.fileSize || attachment.sizeFormatted || '',
    url,
    mimeType: body.fileMimeType || attachment.mimeType || ''
  }
}

function getInteractionMessage(type, actorName) {
  const name = actorName || 'Someone'

  if (type === 'comment') {
    return `${name} commented on your post`
  }

  return `${name} interacted with your post`
}

async function createPostInteractionNotification(post, actor, type) {
  if (type !== 'comment') {
    return null
  }

  if (!post?.userId || post.userId === actor.id) {
    return null
  }

  return firestoreService.createNotification(post.userId, {
    fromUser: actor.name,
    avatar: actor.avatar,
    message: getInteractionMessage(type, actor.name),
    type,
    postId: post.id,
    link: `/posts/${post.id}`
  })
}

function getPostOwnerId(post = {}) {
  return String(post.userId || post.ownerId || post.createdById || '')
}

function getUniqueUserIds(userIds = []) {
  return [...new Set(userIds.map((userId) => String(userId || '')).filter(Boolean))]
}

async function getCountableUpvoteUsers(post) {
  const postId = post?.id

  if (!postId) {
    return []
  }

  return getUniqueUserIds(await firestoreService.getUpvotes(postId))
}

async function getPostWithStats(post, userId) {
  try {
    const countedUpvotes = await getCountableUpvoteUsers(post)
    const commentList = await firestoreService.getComments(post.id)
    const bookmarkList = await firestoreService.getBookmarks(post.id)
    const ownerId = getPostOwnerId(post)

    return {
      ...post,
      baseUpvotes: countedUpvotes.length,
      upvotes: countedUpvotes.length,
      comments: commentList.length,
      bookmarks: (post.bookmarks || 0) + bookmarkList.length,
      isOwner: ownerId === userId,
      upvoted: countedUpvotes.includes(userId),
      bookmarked: bookmarkList.includes(userId)
    }
  } catch (error) {
    if (!firestoreService.isQuotaError(error)) {
      throw error
    }

    return getFallbackPostWithStats(post, userId)
  }
}

function getFallbackPostWithStats(post, userId) {
  const ownerId = getPostOwnerId(post)
  const upvotes = Number(post.upvotes || post.baseUpvotes || 0)

  return {
    ...post,
    baseUpvotes: upvotes,
    upvotes,
    comments: Number(post.comments || 0),
    bookmarks: Number(post.bookmarks || 0),
    isOwner: ownerId === userId,
    upvoted: false,
    bookmarked: false,
    degraded: true
  }
}

async function getPosts(req, res, next) {
  try {
    const posts = await firestoreService.getPosts()
    const postsWithStats = await Promise.all(
      posts.map(post => getPostWithStats(post, req.userId))
    )
    res.json({ posts: postsWithStats })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        posts: fallbackPosts.map(post => getFallbackPostWithStats(post, req.userId)),
        degraded: true,
        warning: 'Firestore quota exceeded; showing cached starter posts.'
      })
    }

    return next(error)
  }
}

async function createPost(req, res, next) {
  try {
    const { content, category } = req.body
    const attachment = getAttachmentFromBody(req.body)
    const keywords = Array.isArray(req.body.keywords)
      ? req.body.keywords
      : String(req.body.keywords || '').split(',').map((keyword) => keyword.trim()).filter(Boolean)

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post text is required' })
    }

    const post = {
      id: createPostId(),
      userId: req.user.id,
      userEmail: req.user.email,
      title: String(req.body.title || '').trim(),
      content: content.trim(),
      text: content.trim(),
      keywords,
      category: category || 'General',
      fileName: attachment?.originalName || '',
      fileSize: attachment?.sizeFormatted || '',
      fileUrl: attachment?.url || '',
      fileStoredName: attachment?.filename || '',
      fileOriginalName: attachment?.originalName || '',
      fileMimeType: attachment?.mimeType || '',
      attachment,
      userName: req.user.name,
      avatar: req.user.avatar,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      upvotes: 0,
      comments: 0,
      bookmarks: 0
    }

    await firestoreService.savePost(post)

    res.status(201).json({
      success: true,
      post: await getPostWithStats(post, req.userId)
    })
  } catch (error) {
    return next(error)
  }
}

async function toggleUpvote(req, res, next) {
  try {
    const { postId } = req.params
    const userId = req.userId
    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const hasUpvoted = await firestoreService.hasUserUpvoted(postId, userId)

    if (hasUpvoted) {
      await firestoreService.removeUpvote(postId, userId)
      const countedUpvotes = await getCountableUpvoteUsers(post)
      return res.json({
        success: true,
        upvoted: false,
        count: countedUpvotes.length
      })
    }

    await firestoreService.addUpvote(postId, userId)
    const countedUpvotes = await getCountableUpvoteUsers(post)
    return res.json({
      success: true,
      upvoted: true,
      count: countedUpvotes.length
    })
  } catch (error) {
    return next(error)
  }
}

async function getUpvotes(req, res, next) {
  try {
    const { postId } = req.params
    const userId = req.userId
    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const countedUpvotes = await getCountableUpvoteUsers(post)
    const hasUpvoted = countedUpvotes.includes(userId)

    return res.json({
      count: countedUpvotes.length,
      upvoted: hasUpvoted
    })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        count: Number(req.query.baseCount || req.body?.baseCount || 0),
        upvoted: false,
        degraded: true,
        warning: 'Firestore quota exceeded; upvote status is temporarily unavailable.'
      })
    }

    return next(error)
  }
}

async function toggleBookmark(req, res, next) {
  try {
    const { postId } = req.params
    const userId = req.userId
    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const hasBookmarked = await firestoreService.hasUserBookmarked(postId, userId)

    if (hasBookmarked) {
      await firestoreService.removeBookmark(postId, userId)
      const bookmarks = await firestoreService.getBookmarks(postId)
      return res.json({
        success: true,
        bookmarked: false,
        count: bookmarks.length
      })
    }

    await firestoreService.addBookmark(postId, userId)
    const bookmarks = await firestoreService.getBookmarks(postId)
    return res.json({
      success: true,
      bookmarked: true,
      count: bookmarks.length
    })
  } catch (error) {
    return next(error)
  }
}

async function getBookmark(req, res, next) {
  try {
    const { postId } = req.params
    const userId = req.userId
    const bookmarks = await firestoreService.getBookmarks(postId)
    const hasBookmarked = bookmarks.includes(userId)

    return res.json({
      bookmarked: hasBookmarked,
      count: bookmarks.length
    })
  } catch (error) {
    return next(error)
  }
}

async function createComment(req, res, next) {
  try {
    const { postId } = req.params
    const { text } = req.body
    const userId = req.userId
    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' })
    }

    const comment = {
      userId,
      userEmail: req.user.email,
      author: req.user.name,
      avatar: req.user.avatar,
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    const savedComment = await firestoreService.addComment(postId, comment)
    await createPostInteractionNotification(post, req.user, 'comment')
    const comments = await firestoreService.getComments(postId)

    return res.json({
      success: true,
      comment: savedComment,
      totalComments: comments.length
    })
  } catch (error) {
    return next(error)
  }
}

async function getComments(req, res, next) {
  try {
    const { postId } = req.params
    const comments = await firestoreService.getComments(postId)

    return res.json({
      count: comments.length,
      comments: comments.map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        author: comment.author,
        avatar: comment.avatar,
        text: comment.text,
        timestamp: comment.timestamp
      }))
    })
  } catch (error) {
    return next(error)
  }
}

async function updatePost(req, res, next) {
  try {
    const { postId } = req.params
    const { content, category } = req.body
    const userId = req.userId

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post text is required' })
    }

    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own posts' })
    }

    const updates = {
      content: content.trim(),
      text: content.trim()
    }

    if (category) {
      updates.category = category
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      updates.title = String(req.body.title || '').trim()
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'keywords')) {
      updates.keywords = Array.isArray(req.body.keywords)
        ? req.body.keywords
        : String(req.body.keywords || '').split(',').map((keyword) => keyword.trim()).filter(Boolean)
    }

    const updatedPost = await firestoreService.updatePost(postId, updates)

    return res.json({
      success: true,
      post: await getPostWithStats(updatedPost, userId)
    })
  } catch (error) {
    return next(error)
  }
}

async function deletePost(req, res, next) {
  try {
    const { postId } = req.params
    const userId = req.userId

    const post = await firestoreService.getPost(postId)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' })
    }

    await firestoreService.deletePost(postId)

    return res.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    return next(error)
  }
}

function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = getUploadUrl(req, req.file.filename)
    const fileSizeStr = formatFileSize(req.file.size)

    return res.status(201).json({
      success: true,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        sizeFormatted: fileSizeStr,
        url: fileUrl,
        mimeType: req.file.mimetype
      }
    })
  } catch (error) {
    return next(error)
  }
}

function downloadFile(req, res, next) {
  try {
    const { filename } = req.params

    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filepath = path.join(uploadsDir, filename)

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    res.download(filepath, filename)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  toggleUpvote,
  getUpvotes,
  toggleBookmark,
  getBookmark,
  createComment,
  getComments,
  uploadFile,
  downloadFile
}
