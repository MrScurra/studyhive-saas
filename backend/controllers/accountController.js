const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')
const firestoreService = require('../services/firestoreService')
const { uploadsDir } = require('../config/paths')

function getCurrentUserId(req) {
  return String(req.user?.id || req.userId || '').trim()
}

async function getVerifiedCurrentUserId(req) {
  const authHeader = String(req.headers.authorization || '')
  const match = authHeader.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    const error = new Error('Firebase authentication is required')
    error.status = 401
    throw error
  }

  const decodedToken = await admin.auth().verifyIdToken(match[1])
  const headerUserId = getCurrentUserId(req)

  if (headerUserId && decodedToken.uid !== headerUserId) {
    const error = new Error('Authenticated user does not match the requested account')
    error.status = 403
    throw error
  }

  return decodedToken.uid
}

function getLocalProfileAvatarFilename(avatarUrl = '') {
  const value = String(avatarUrl || '').trim()
  const marker = '/api/profile/avatar/'
  const markerIndex = value.indexOf(marker)

  if (markerIndex === -1) {
    return ''
  }

  const filename = decodeURIComponent(value.slice(markerIndex + marker.length).split(/[?#]/)[0])

  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return ''
  }

  return filename
}

function removeLocalProfileAvatar(avatarUrl = '') {
  const filename = getLocalProfileAvatarFilename(avatarUrl)

  if (!filename) {
    return false
  }

  const filepath = path.join(uploadsDir, filename)

  if (!fs.existsSync(filepath)) {
    return false
  }

  fs.unlinkSync(filepath)
  return true
}

function sendAccountActionError(error, res, next) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message })
  }

  if (String(error.code || '').startsWith('auth/')) {
    return res.status(401).json({ error: 'Firebase authentication is required' })
  }

  return next(error)
}

exports.signOutEverywhere = async (req, res, next) => {
  try {
    const userId = await getVerifiedCurrentUserId(req)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const result = await firestoreService.revokeUserSessions(userId, {
      reason: 'sign_out_everywhere'
    })

    return res.json({
      success: true,
      ...result
    })
  } catch (error) {
    return sendAccountActionError(error, res, next)
  }
}

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = await getVerifiedCurrentUserId(req)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (String(req.body.confirmation || '').trim() !== 'DELETE') {
      return res.status(400).json({ error: 'Type DELETE to confirm account deletion' })
    }

    await firestoreService.revokeUserSessions(userId, {
      reason: 'account_deletion'
    })

    const cleanup = await firestoreService.deleteAccountData(userId, req.user)
    const avatarRemoved = removeLocalProfileAvatar(cleanup.avatarUrl)
    const authDeletion = await firestoreService.deleteFirebaseAuthUser(userId)

    return res.json({
      success: true,
      cleanup,
      avatarRemoved,
      authDeletion
    })
  } catch (error) {
    return sendAccountActionError(error, res, next)
  }
}
