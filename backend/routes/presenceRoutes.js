const express = require('express')
const presenceController = require('../controllers/presenceController')

const router = express.Router()

router.post('/', presenceController.updatePresence)
router.get('/active-friends', presenceController.getActiveFriends)

module.exports = router
