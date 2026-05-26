const firestoreService = require('../services/firestoreService')

function getDefaultSettings(email = '') {
  return {
    account: { email },
    toggles: {
      '2fa': false,
      'public-profile': true,
      'online-status': true,
      'direct-messages': true,
      'dark-mode': false
    },
    appearance: {
      themeColor: '#f4b400',
      fontSize: 'normal'
    }
  }
}

exports.getUserSettings = async (req, res) => {
  try {
    const settings = await firestoreService.getUserSettings(req.user.id, {
      email: req.user.email
    })

    return res.json({ success: true, settings })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        success: true,
        settings: getDefaultSettings(req.user.email),
        degraded: true,
        warning: 'Firestore quota exceeded; showing default settings.'
      })
    }

    console.error('Failed to fetch settings:', error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
}

exports.updateUserSettings = async (req, res) => {
  try {
    const settings = await firestoreService.saveUserSettings(req.user.id, req.body.settings || req.body, {
      email: req.user.email
    })

    return res.json({ success: true, settings })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.status(503).json({
        error: 'Firestore quota exceeded. Settings could not be saved right now.',
        code: 'firestore_quota_exceeded'
      })
    }

    console.error('Failed to save settings:', error)
    return res.status(500).json({ error: 'Failed to save settings' })
  }
}
