const express = require('express')
const postController = require('../controllers/postController')
const upload = require('../middleware/uploadMiddleware')

const router = express.Router()

router.get('/', postController.getPosts)
router.post('/', postController.createPost)
router.post('/upload', upload.single('file'), postController.uploadFile)
router.get('/files/:filename', postController.downloadFile)

router.put('/:postId', postController.updatePost)
router.delete('/:postId', postController.deletePost)

router.post('/:postId/upvote', postController.toggleUpvote)
router.get('/:postId/upvotes', postController.getUpvotes)

router.post('/:postId/bookmark', postController.toggleBookmark)
router.get('/:postId/bookmarks', postController.getBookmark)

router.post('/:postId/comments', postController.createComment)
router.get('/:postId/comments', postController.getComments)

module.exports = router
