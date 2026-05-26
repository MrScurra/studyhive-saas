const fs = require('fs')
const path = require('path')

const profilesFile = path.join(__dirname, 'profiles.json')

const defaultProfile = {
  displayName: 'StudyHive User',
  fullName: 'StudyHive User',
  bio: 'Hey there! I am using StudyHive to collaborate.',
  avatarUrl: './frontend/assets/profile-picture/default-profile-picture.webp',
  username: 'studyhiveuser',
  school: '',
  course: '',
  yearLevel: '1st Year',
  skills: [],
  email: 'user@studyhive.local'
}

function loadProfiles() {
  if (!fs.existsSync(profilesFile)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(profilesFile, 'utf8'))
  } catch (error) {
    console.error('Could not read profiles.json:', error)
    return {}
  }
}

let profiles = loadProfiles()

function saveProfiles() {
  fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2))
}

function normalizeEmail(email) {
  return String(email || defaultProfile.email).trim().toLowerCase()
}

function createDefaultProfile(email, fallback = {}) {
  const now = new Date().toISOString()

  return {
    ...defaultProfile,
    displayName: fallback.displayName || fallback.name || defaultProfile.displayName,
    fullName: fallback.fullName || fallback.realName || fallback.name || fallback.displayName || defaultProfile.fullName,
    avatarUrl: fallback.avatarUrl || fallback.avatar || defaultProfile.avatarUrl,
    email,
    createdAt: now,
    updatedAt: now
  }
}

function getProfile(email, fallback = {}) {
  const profileEmail = normalizeEmail(email || fallback.email)
  return profiles[profileEmail] || createDefaultProfile(profileEmail, fallback)
}

function saveProfile(email, profileData = {}) {
  const profileEmail = normalizeEmail(email)
  const now = new Date().toISOString()
  const existingProfile = profiles[profileEmail] || createDefaultProfile(profileEmail)

  profiles[profileEmail] = {
    ...existingProfile,
    ...profileData,
    email: profileEmail,
    createdAt: existingProfile.createdAt || now,
    updatedAt: now
  }

  saveProfiles()
  return profiles[profileEmail]
}

module.exports = {
  getProfile,
  saveProfile
}
