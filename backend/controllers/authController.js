const admin = require('firebase-admin')
const otpService = require('../services/otpService')

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || '')
  const match = authHeader.match(/^Bearer\s+(.+)$/i)

  return match ? match[1] : ''
}

async function getPasswordAuthUser(req) {
  const idToken = getBearerToken(req)

  if (!idToken) {
    const error = new Error('Firebase authentication is required')
    error.status = 401
    throw error
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken)
  const signInProvider = decodedToken.firebase?.sign_in_provider || ''

  if (signInProvider !== 'password') {
    const error = new Error('Email OTP is only required for email/password sign-in')
    error.status = 403
    throw error
  }

  if (!decodedToken.email) {
    const error = new Error('Authenticated email is required')
    error.status = 400
    throw error
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name || decodedToken.email
  }
}

function sendAuthError(error, res, next) {
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
      retryAfterSeconds: error.retryAfterSeconds,
      attemptsRemaining: error.attemptsRemaining
    })
  }

  if (String(error.code || '').startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Firebase authentication is required'
    })
  }

  return next(error)
}

exports.sendOtp = async (req, res, next) => {
  try {
    const authUser = await getPasswordAuthUser(req)
    const result = await otpService.sendOtpChallenge(authUser)

    if (result.throttled) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another code.',
        retryAfterSeconds: result.retryAfterSeconds
      })
    }

    return res.json({
      success: true,
      expiresInSeconds: result.expiresInSeconds,
      resendAvailableInSeconds: result.resendAvailableInSeconds
    })
  } catch (error) {
    return sendAuthError(error, res, next)
  }
}

exports.verifyOtp = async (req, res, next) => {
  try {
    const authUser = await getPasswordAuthUser(req)
    const otpCode = req.body?.otp || req.body?.code
    await otpService.verifyOtpChallenge(authUser, otpCode)

    return res.json({
      success: true,
      verified: true
    })
  } catch (error) {
    return sendAuthError(error, res, next)
  }
}
