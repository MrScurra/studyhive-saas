const profileStore = require('../data/profileStore')
const firestoreService = require('../services/firestoreService')
const fs = require('fs')
const path = require('path')
const { uploadsDir } = require('../config/paths')

const defaultAvatar = './frontend/assets/profile-picture/default-profile-picture.webp'

function getAvatarUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/api/profile/avatar/${encodeURIComponent(filename)}`
}

function isSafeUploadFilename(filename) {
  return Boolean(filename)
    && !filename.includes('..')
    && !filename.includes('/')
    && !filename.includes('\\')
}

function getPersistableAvatarUrl(value, fallback = defaultAvatar) {
  const avatarUrl = String(value || fallback || defaultAvatar).trim()
  return /^(data|blob):/i.test(avatarUrl) ? defaultAvatar : avatarUrl
}

function getPublicProfileSummary(profile = {}, userId = '') {
  const fullName = profile.fullName || profile.realName || profile.name || profile.displayName || 'StudyHive User'
  const displayName = profile.displayName || profile.nickname || fullName

  return {
    id: profile.id || userId,
    uid: profile.uid || profile.id || userId,
    displayName,
    fullName,
    avatarUrl: getPersistableAvatarUrl(profile.avatarUrl || profile.avatar)
  }
}

exports.getUserProfile = async (req, res) => {
  try {
    let profile = await firestoreService.getUserProfile(req.user.id)

    if (!profile) {
      profile = profileStore.getProfile(req.user.email, {
        displayName: req.user.name,
        avatarUrl: req.user.avatar,
        email: req.user.email
      })

      profile = await firestoreService.saveUserProfile(req.user.id, {
        ...profile,
        email: req.user.email,
        avatar: getPersistableAvatarUrl(profile.avatarUrl || req.user.avatar)
      })
    }

    return res.status(200).json({ success: true, profile })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.status(200).json({
        success: true,
        profile: {
          id: req.user.id,
          uid: req.user.id,
          displayName: req.user.name,
          fullName: req.user.name,
          email: req.user.email,
          avatarUrl: getPersistableAvatarUrl(req.user.avatar)
        },
        degraded: true,
        warning: 'Firestore quota exceeded; showing session profile only.'
      })
    }

    console.error('Failed to fetch profile info:', error)
    return res.status(500).json({ error: 'Failed to fetch profile info' })
  }
}

exports.getPublicUserProfile = async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const profile = await firestoreService.getUserProfile(userId)

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.status(200).json({
      success: true,
      profile: getPublicProfileSummary(profile, userId)
    })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.status(503).json({
        error: 'Firestore quota exceeded. Profile lookup is unavailable right now.',
        code: 'firestore_quota_exceeded'
      })
    }

    console.error('Failed to fetch public profile info:', error)
    return res.status(500).json({ error: 'Failed to fetch profile info' })
  }
}

exports.updateUserProfile = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || req.body.realName || req.user.name || '').trim()
    const displayName = String(req.body.displayName || req.body.nickname || fullName || req.user.name || '').trim()

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' })
    }

    const skills = Array.isArray(req.body.skills) ? req.body.skills : []
    const updatedProfile = profileStore.saveProfile(req.user.email, {
      displayName,
      fullName: fullName || displayName,
      bio: String(req.body.bio || req.body.about || '').trim(),
      avatarUrl: getPersistableAvatarUrl(req.body.avatarUrl || req.body.avatar, req.user.avatar),
      username: String(req.body.username || '').trim().replace(/^@+/, ''),
      school: String(req.body.school || '').trim(),
      course: String(req.body.course || '').trim(),
      yearLevel: String(req.body.yearLevel || '').trim(),
      skills
    })

    const firestoreProfile = await firestoreService.saveUserProfile(req.user.id, {
      ...updatedProfile,
      email: req.user.email,
      avatar: updatedProfile.avatarUrl || req.user.avatar
    })

    return res.status(200).json({ success: true, profile: firestoreProfile })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.status(503).json({
        error: 'Firestore quota exceeded. Profile changes could not be saved right now.',
        code: 'firestore_quota_exceeded'
      })
    }

    console.error('Failed to save profile changes:', error)
    return res.status(500).json({ error: 'Failed to save profile changes' })
  }
}

exports.uploadProfileAvatar = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile photo uploaded' })
    }

    if (!String(req.file.mimetype || '').startsWith('image/')) {
      fs.unlink(req.file.path, () => {})
      return res.status(400).json({ error: 'Profile photo must be an image' })
    }

    return res.status(201).json({
      success: true,
      avatar: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: getAvatarUrl(req, req.file.filename)
      }
    })
  } catch (error) {
    return next(error)
  }
}

exports.getProfileAvatar = (req, res, next) => {
  try {
    const { filename } = req.params

    if (!isSafeUploadFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filepath = path.join(uploadsDir, filename)

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    return res.sendFile(filepath)
  } catch (error) {
    return next(error)
  }
}
