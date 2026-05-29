const crypto = require('crypto')
const admin = require('firebase-admin')
const firestoreService = require('./firestoreService')
const { sendOtpEmail } = require('./brevoEmailService')

const OTP_COLLECTION = 'emailOtpChallenges'
const OTP_EXPIRY_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5
const HASH_BYTE_LENGTH = 64

function createOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

function hashOtp(otpCode) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(otpCode, salt, HASH_BYTE_LENGTH).toString('hex')

  return {
    salt,
    hash
  }
}

function verifyOtpHash(otpCode, salt, expectedHash) {
  try {
    const expected = Buffer.from(String(expectedHash || ''), 'hex')
    const actual = crypto.scryptSync(otpCode, String(salt || ''), HASH_BYTE_LENGTH)

    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected)
  } catch (error) {
    return false
  }
}

function toMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  if (typeof value._seconds === 'number') return value._seconds * 1000
  if (typeof value === 'number') return value

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function getChallengeRef(userId) {
  return firestoreService.getFirestore()
    .collection(OTP_COLLECTION)
    .doc(String(userId || '').trim())
}

async function deleteChallengeIfHashMatches(userId, otpHash) {
  const db = firestoreService.getFirestore()
  const challengeRef = getChallengeRef(userId)

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef)
    const data = snapshot.exists ? snapshot.data() : null

    if (data?.otpHash === otpHash) {
      transaction.delete(challengeRef)
    }
  })
}

async function sendOtpChallenge(user) {
  const db = firestoreService.getFirestore()
  const challengeRef = getChallengeRef(user.uid)
  const otpCode = createOtpCode()
  const { salt, hash } = hashOtp(otpCode)
  const now = Date.now()
  const expiresAt = now + OTP_EXPIRY_MS
  let throttleResult = null

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef)
    const existing = snapshot.exists ? snapshot.data() : null
    const lastSentAt = toMillis(existing?.lastSentAt)
    const retryAfterMs = lastSentAt + RESEND_COOLDOWN_MS - now

    if (lastSentAt && retryAfterMs > 0) {
      throttleResult = {
        throttled: true,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
      }
      return
    }

    transaction.set(challengeRef, {
      otpHash: hash,
      salt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAt: admin.firestore.Timestamp.fromMillis(expiresAt),
      lastSentAt: admin.firestore.Timestamp.fromMillis(now),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })

  if (throttleResult) {
    return throttleResult
  }

  try {
    await sendOtpEmail({
      toEmail: user.email,
      toName: user.name || user.email,
      otpCode
    })
  } catch (error) {
    await deleteChallengeIfHashMatches(user.uid, hash)
    throw error
  }

  return {
    sent: true,
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    resendAvailableInSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000)
  }
}

async function verifyOtpChallenge(user, otpCode) {
  const normalizedCode = String(otpCode || '').trim()

  if (!/^\d{6}$/.test(normalizedCode)) {
    const error = new Error('Enter the 6-digit verification code')
    error.status = 400
    throw error
  }

  const db = firestoreService.getFirestore()
  const challengeRef = getChallengeRef(user.uid)
  let result = null

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef)

    if (!snapshot.exists) {
      result = {
        status: 404,
        error: 'No verification code found. Please request a new code.'
      }
      return
    }

    const data = snapshot.data()
    const expiresAt = toMillis(data.expiresAt)
    const attempts = Number(data.attempts || 0)

    if (expiresAt && expiresAt <= Date.now()) {
      transaction.delete(challengeRef)
      result = {
        status: 400,
        error: 'Verification code expired. Please request a new code.'
      }
      return
    }

    if (attempts >= MAX_ATTEMPTS) {
      result = {
        status: 429,
        error: 'Maximum attempts reached. Please request a new code.',
        attemptsRemaining: 0
      }
      return
    }

    const isValid = verifyOtpHash(normalizedCode, data.salt, data.otpHash)

    if (!isValid) {
      const nextAttempts = attempts + 1
      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - nextAttempts)

      transaction.update(challengeRef, {
        attempts: nextAttempts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      result = {
        status: attemptsRemaining === 0 ? 429 : 400,
        error: attemptsRemaining === 0
          ? 'Maximum attempts reached. Please request a new code.'
          : 'Invalid verification code.',
        attemptsRemaining
      }
      return
    }

    transaction.delete(challengeRef)
    result = {
      verified: true
    }
  })

  if (!result?.verified) {
    const error = new Error(result?.error || 'Verification failed')
    error.status = result?.status || 400
    error.attemptsRemaining = result?.attemptsRemaining
    throw error
  }

  return {
    verified: true
  }
}

module.exports = {
  MAX_ATTEMPTS,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  sendOtpChallenge,
  verifyOtpChallenge
}
