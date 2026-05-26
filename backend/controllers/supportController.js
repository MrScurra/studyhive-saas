const firestoreService = require('../services/firestoreService')

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

exports.createSupportMessage = async (req, res) => {
  try {
    const supportMessage = await firestoreService.createSupportMessage(getCurrentUserSummary(req), {
      subject: req.body.subject,
      message: req.body.message
    })

    return res.status(201).json({ success: true, supportMessage })
  } catch (error) {
    if (error.message === 'Subject and message are required') {
      return res.status(400).json({ error: error.message })
    }

    console.error('Failed to submit support message:', error)
    return res.status(500).json({ error: 'Failed to submit support message' })
  }
}
