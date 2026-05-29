const crypto = require('crypto')
const studyCircles = require('../data/studyCirclesStore')
const firestoreService = require('../services/firestoreService')

const DEFAULT_CIRCLE_AVATAR = '👥'
const FRONTEND_INVITE_BASE_URL = 'https://study-collab-saas-js.web.app'

function createCircleId() {
  return `circle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createInviteCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase()
}

async function createUniqueInviteCode() {
  for (let attempts = 0; attempts < 8; attempts += 1) {
    const inviteCode = createInviteCode()
    const existingCircle = await firestoreService.getStudyCircleByInviteCode(inviteCode)

    if (!existingCircle) {
      return inviteCode
    }
  }

  throw new Error('Could not create a unique invite code')
}

function createInviteLink(inviteCode) {
  return `${FRONTEND_INVITE_BASE_URL}/dashboard.html?circleInvite=${encodeURIComponent(inviteCode)}`
}

function normalizeInviteCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

function requireSignedInUser(req) {
  const userId = String(req.user?.id || '').trim()

  if (!userId || userId === 'default-user') {
    const error = new Error('Please sign in before joining this study circle')
    error.status = 401
    throw error
  }

  return userId
}

function getCurrentUserSummary(req) {
  return {
    id: req.user.id,
    uid: req.user.id,
    displayName: req.user.name,
    name: req.user.name,
    avatarUrl: req.user.avatar,
    avatar: req.user.avatar,
    email: req.user.email
  }
}

function normalizeCreatorMembers(creatorName) {
  return [...new Set([String(creatorName || 'StudyHive User').trim()].filter(Boolean))]
}

function normalizeCreatorMemberIds(creatorId) {
  return [...new Set([String(creatorId || 'default-user').trim()].filter(Boolean))]
}

function normalizeInviteeIds(value, creatorId) {
  const inviteeIds = Array.isArray(value) ? value : []
  const cleanedInviteeIds = inviteeIds
    .map((memberId) => String(memberId).trim())
    .filter(Boolean)

  return [...new Set(cleanedInviteeIds)].filter((memberId) => memberId !== creatorId)
}

async function validateInviteeFriendships(creatorId, inviteeIds) {
  if (inviteeIds.length === 0) return

  const friendChecks = await Promise.all(
    inviteeIds.map((memberId) => firestoreService.areFriends(creatorId, memberId))
  )

  if (friendChecks.some((isFriend) => !isFriend)) {
    const error = new Error('Only accepted friends can be invited to a study circle')
    error.status = 403
    throw error
  }
}

async function seedDefaultCircles() {
  await Promise.all(studyCircles.map((circle) => firestoreService.saveStudyCircle(circle)))
}

const getCircles = async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user'
    let circles = await firestoreService.getStudyCirclesForUser(userId)

    if (userId === 'default-user' && circles.length === 0) {
      await seedDefaultCircles()
      circles = await firestoreService.getStudyCirclesForUser(userId)
    }

    return res.json(circles)
  } catch (error) {
    console.warn('Could not load study circles from Firestore:', error.message)
    return res.json(studyCircles)
  }
}

const createCircle = async (req, res) => {
  try {
    const { name, description } = req.body
    const circleName = String(name || '').trim()

    if (!circleName) {
      return res.status(400).json({ error: 'Circle name is required' })
    }

    const circleId = createCircleId()
    const creatorName = req.user?.name || 'StudyHive User'
    const creatorId = req.user?.id || 'default-user'
    const inviteeIds = normalizeInviteeIds(req.body.inviteeIds || req.body.memberIds, creatorId)
    const inviteCode = await createUniqueInviteCode()

    await validateInviteeFriendships(creatorId, inviteeIds)

    const newCircle = {
      id: circleId,
      name: circleName,
      description: String(description || '').trim(),
      topic: String(req.body.topic || req.body.category || '').trim(),
      category: String(req.body.category || req.body.topic || '').trim(),
      createdBy: creatorName,
      createdById: creatorId,
      members: normalizeCreatorMembers(creatorName),
      memberIds: normalizeCreatorMemberIds(creatorId),
      createdAt: new Date().toISOString(),
      inviteCode,
      inviteLink: createInviteLink(inviteCode),
      avatar: DEFAULT_CIRCLE_AVATAR
    }

    studyCircles.push(newCircle)
    await firestoreService.saveStudyCircle(newCircle)
    const invitations = await firestoreService.createStudyCircleInvites(newCircle, getCurrentUserSummary(req), inviteeIds)
    return res.status(201).json({
      ...newCircle,
      invitations,
      invitedCount: invitations.filter((invitation) => invitation.status === 'pending').length
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    console.error('Could not create study circle:', error)
    return res.status(500).json({ error: 'Failed to create study circle' })
  }
}

const getCircleByInviteCode = async (req, res) => {
  try {
    const userId = requireSignedInUser(req)
    const inviteCode = normalizeInviteCode(req.params.inviteCode)

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' })
    }

    const circle = await firestoreService.getStudyCircleByInviteCode(inviteCode)

    if (!circle) {
      return res.status(404).json({ error: 'Study circle invite was not found' })
    }

    const memberIds = (circle.memberIds || []).map((memberId) => String(memberId).trim())
    return res.json({
      circle,
      alreadyMember: memberIds.includes(userId)
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to load study circle invite' })
  }
}

const joinCircleByInviteCode = async (req, res) => {
  try {
    requireSignedInUser(req)
    const inviteCode = normalizeInviteCode(req.params.inviteCode)

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' })
    }

    const result = await firestoreService.joinStudyCircleByInviteCode(inviteCode, getCurrentUserSummary(req))

    if (!result) {
      return res.status(404).json({ error: 'Study circle invite was not found' })
    }

    return res.json(result)
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to join study circle' })
  }
}

const inviteCircleMembers = async (req, res) => {
  try {
    const circleId = String(req.params.circleId || '').trim()
    const inviteeIds = normalizeInviteeIds(req.body.inviteeIds || req.body.memberIds, req.user.id)

    if (!circleId) {
      return res.status(400).json({ error: 'Study circle ID is required' })
    }

    const circle = await firestoreService.getStudyCircle(circleId)

    if (!circle) {
      return res.status(404).json({ error: 'Study circle was not found' })
    }

    const acceptedMemberIds = (circle.memberIds || []).map((memberId) => String(memberId).trim())
    if (!acceptedMemberIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only accepted study circle members can invite friends' })
    }

    await validateInviteeFriendships(req.user.id, inviteeIds)

    const invitations = await firestoreService.createStudyCircleInvites(circle, getCurrentUserSummary(req), inviteeIds)
    return res.status(201).json({ invitations })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to invite study circle members' })
  }
}

const acceptCircleInvite = async (req, res) => {
  try {
    const invite = await firestoreService.acceptStudyCircleInvite(req.params.inviteId, getCurrentUserSummary(req))

    if (!invite) {
      return res.status(404).json({ error: 'Study circle invitation was not found' })
    }

    return res.json({ invite })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to accept study circle invitation' })
  }
}

const leaveCircle = async (req, res) => {
  try {
    const circle = await firestoreService.leaveStudyCircle(req.params.circleId, getCurrentUserSummary(req))

    if (!circle) {
      return res.status(404).json({ error: 'Study circle was not found' })
    }

    return res.json({ circle })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to leave study circle' })
  }
}

const deleteCircle = async (req, res) => {
  try {
    const result = await firestoreService.deleteStudyCircle(req.params.circleId, getCurrentUserSummary(req))

    if (!result) {
      return res.status(404).json({ error: 'Study circle was not found' })
    }

    const localCircleIndex = studyCircles.findIndex((circle) => String(circle.id) === String(req.params.circleId))
    if (localCircleIndex !== -1) {
      studyCircles.splice(localCircleIndex, 1)
    }

    return res.json({ success: true, ...result })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to delete study circle' })
  }
}

const declineCircleInvite = async (req, res) => {
  try {
    const invite = await firestoreService.declineStudyCircleInvite(req.params.inviteId, req.user.id)

    if (!invite) {
      return res.status(404).json({ error: 'Study circle invitation was not found' })
    }

    return res.json({ invite })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to decline study circle invitation' })
  }
}

module.exports = {
  getCircles,
  createCircle,
  getCircleByInviteCode,
  joinCircleByInviteCode,
  inviteCircleMembers,
  acceptCircleInvite,
  leaveCircle,
  deleteCircle,
  declineCircleInvite
}
