const express = require('express')
const searchController = require('../controllers/searchController')

const router = express.Router()

router.get('/posts', searchController.searchPosts)
router.get('/users', searchController.searchUsers)
router.get('/circles', searchController.searchCircles)
router.get('/all', searchController.searchAll)

module.exports = router
