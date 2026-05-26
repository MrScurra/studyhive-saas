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

exports.updatePresence = async (req, res, next) => {
  try {
    const presence = await firestoreService.updateUserPresence(getCurrentUserSummary(req), {
      active: req.body.active !== false,
      onlineVisible: req.body.onlineVisible !== false
    })

    return res.json({
      success: true,
      presence
    })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        success: true,
        presence: {
          userId: req.user.id,
          active: req.body?.active !== false,
          onlineVisible: req.body?.onlineVisible !== false,
          degraded: true
        },
        degraded: true,
        warning: 'Firestore quota exceeded; presence update was not persisted.'
      })
    }

    return next(error)
  }
}

exports.getActiveFriends = async (req, res, next) => {
  try {
    const activeFriends = await firestoreService.getActiveFriendPresence(req.user.id)

    return res.json({
      success: true,
      activeFriends
    })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        success: true,
        activeFriends: [],
        degraded: true,
        warning: 'Firestore quota exceeded; active friends are temporarily unavailable.'
      })
    }

    return next(error)
  }
}
