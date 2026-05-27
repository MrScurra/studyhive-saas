const firestoreService = require('../services/firestoreService')

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function normalizeConversationId(conversationId) {
  return String(conversationId || '').trim()
}

function normalizeUserId(userId) {
  return String(userId || '').trim()
}

function uniqueUserIds(userIds = []) {
  const values = Array.isArray(userIds) ? userIds : [userIds]
  return [...new Set(values.map(normalizeUserId).filter(Boolean))]
}

function isStudyCircleConversation(body = {}, conversationId = '') {
  const conversationType = String(body.conversationType || body.type || '').trim().toLowerCase()

  return conversationType === 'study_circle'
    || conversationType === 'study-circle'
    || Boolean(body.circleId || body.studyCircleId)
    || String(conversationId || '').startsWith('study-circle-')
}

function getStudyCircleId(body = {}, conversationId = '') {
  const explicitCircleId = normalizeConversationId(body.circleId || body.studyCircleId)

  if (explicitCircleId) return explicitCircleId

  const prefix = 'study-circle-'
  if (String(conversationId || '').startsWith(prefix)) {
    return String(conversationId).slice(prefix.length)
  }

  return ''
}

function getStudyCircleMemberIds(circle = {}) {
  return uniqueUserIds(Array.isArray(circle.memberIds) ? circle.memberIds : [])
}

function addRecipientId(value, recipientIds) {
  if (!value) return

  if (Array.isArray(value)) {
    value.forEach((item) => addRecipientId(item, recipientIds))
    return
  }

  if (typeof value === 'object') {
    addRecipientId(value.userId || value.id || value.uid, recipientIds)
    return
  }

  const recipientId = String(value).trim()

  if (recipientId) {
    recipientIds.add(recipientId)
  }
}

function getMessageRecipientIds(body, senderId) {
  const recipientIds = new Set()

  addRecipientId(body.recipientId, recipientIds)
  addRecipientId(body.receiverId, recipientIds)
  addRecipientId(body.toUserId, recipientIds)
  addRecipientId(body.recipientIds, recipientIds)
  addRecipientId(body.receiverIds, recipientIds)
  addRecipientId(body.toUserIds, recipientIds)
  addRecipientId(body.participantUserIds, recipientIds)
  addRecipientId(body.participants, recipientIds)

  recipientIds.delete(senderId)

  return [...recipientIds]
}

async function getMessages(req, res, next) {
  try {
    const conversationId = normalizeConversationId(req.query.conversationId)
    const firestoreMessages = await firestoreService.getMessagesForUser(req.user.id, conversationId)

    return res.json({ messages: firestoreMessages })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        messages: [],
        degraded: true,
        warning: 'Firestore quota exceeded; messages are temporarily unavailable.'
      })
    }

    return next(error)
  }
}

async function createMessage(req, res, next) {
  try {
    const conversationId = normalizeConversationId(req.body.conversationId)
    const text = String(req.body.text || '').trim()
    const conversationName = String(req.body.conversationName || 'a conversation').trim()

    if (!conversationId || !text) {
      return res.status(400).json({
        error: 'Conversation ID and message text are required'
      })
    }

    let recipientIds = getMessageRecipientIds(req.body, req.user.id)
    let participantIds = uniqueUserIds([req.user.id, ...recipientIds])
    let conversationType = 'friend'
    let circleId = ''
    let circleName = ''

    if (isStudyCircleConversation(req.body, conversationId)) {
      conversationType = 'study_circle'
      circleId = getStudyCircleId(req.body, conversationId)

      if (!circleId) {
        return res.status(400).json({ error: 'Study circle ID is required' })
      }

      const circle = await firestoreService.getStudyCircle(circleId)
      if (!circle) {
        return res.status(404).json({ error: 'Study circle was not found' })
      }

      const memberIds = getStudyCircleMemberIds(circle)
      if (!memberIds.includes(normalizeUserId(req.user.id))) {
        return res.status(403).json({
          error: 'Only accepted study circle members can send group messages'
        })
      }

      participantIds = uniqueUserIds(memberIds)
      recipientIds = participantIds.filter((participantId) => participantId !== normalizeUserId(req.user.id))
      circleName = String(circle.name || conversationName || 'Study Circle').trim()
    } else {
      if (recipientIds.length === 0) {
        return res.status(400).json({
          error: 'Choose a friend before sending a message'
        })
      }

      const friendChecks = await Promise.all(
        recipientIds.map((recipientId) => firestoreService.areFriends(req.user.id, recipientId))
      )

      if (friendChecks.some((isFriend) => !isFriend)) {
        return res.status(403).json({
          error: 'You can only message accepted friends'
        })
      }
    }

    const now = new Date()
    const message = {
      id: createMessageId(),
      conversationId,
      conversationType,
      senderId: req.user.id,
      author: req.user.name,
      avatar: req.user.avatar,
      text,
      time: formatMessageTime(now),
      timestamp: now.toISOString(),
      participantIds
    }

    if (circleId) {
      message.circleId = circleId
      message.circleName = circleName
    }

    await firestoreService.saveMessage(message)

    await Promise.all(recipientIds.map((recipientId) => firestoreService.createNotification(recipientId, {
      fromUser: req.user.name,
      avatar: req.user.avatar,
      message: `${req.user.name} sent a message in ${circleName || conversationName || 'a conversation'}`,
      type: 'message',
      conversationId,
      messageId: message.id,
      link: `/messages/${conversationId}`
    })))

    return res.status(201).json({ message })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getMessages,
  createMessage
}
