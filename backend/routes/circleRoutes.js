const express = require('express')
const studyCircleController = require('../controllers/studyCircleController')

const router = express.Router()

router.put('/invites/:inviteId/accept', studyCircleController.acceptCircleInvite)
router.put('/invites/:inviteId/decline', studyCircleController.declineCircleInvite)
router.get('/invite/:inviteCode', studyCircleController.getCircleByInviteCode)
router.post('/invite/:inviteCode/join', studyCircleController.joinCircleByInviteCode)
router.get('/', studyCircleController.getCircles)
router.post('/', studyCircleController.createCircle)
router.delete('/:circleId/members/me', studyCircleController.leaveCircle)
router.post('/:circleId/invites', studyCircleController.inviteCircleMembers)
router.delete('/:circleId', studyCircleController.deleteCircle)

module.exports = router
