const express = require('express')
const profileController = require('../controllers/profileController')
const upload = require('../middleware/uploadMiddleware')

const router = express.Router()

router.post('/avatar', upload.single('avatar'), profileController.uploadProfileAvatar)
router.get('/avatar/:filename', profileController.getProfileAvatar)
router.get('/', profileController.getUserProfile)
router.put('/', profileController.updateUserProfile)

module.exports = router
