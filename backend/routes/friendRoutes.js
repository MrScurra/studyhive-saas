const express = require('express')
const friendController = require('../controllers/friendController')

const router = express.Router()

router.get('/', friendController.getFriends)
router.get('/search', friendController.searchUsers)
router.post('/requests', friendController.sendFriendRequest)
router.put('/requests/:requestId/accept', friendController.acceptFriendRequest)
router.put('/requests/:requestId/decline', friendController.declineFriendRequest)
router.delete('/:friendUserId', friendController.unfriend)

module.exports = router
