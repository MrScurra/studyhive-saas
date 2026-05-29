const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'
const EMAIL_TIMEOUT_MS = 10000

function getBrevoConfig() {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim()
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL || '').trim()
  const senderName = String(process.env.BREVO_SENDER_NAME || '').trim()

  if (!apiKey || !senderEmail || !senderName) {
    const error = new Error('Brevo email settings are not configured')
    error.status = 503
    throw error
  }

  return {
    apiKey,
    senderEmail,
    senderName
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendOtpEmail({ toEmail, toName = '', otpCode }) {
  const { apiKey, senderEmail, senderName } = getBrevoConfig()
  const recipientEmail = String(toEmail || '').trim()

  if (!recipientEmail) {
    const error = new Error('Recipient email is required')
    error.status = 400
    throw error
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS)
  const escapedCode = escapeHtml(otpCode)
  const escapedName = escapeHtml(toName || recipientEmail)

  try {
    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName
        },
        to: [
          {
            email: recipientEmail,
            name: toName || recipientEmail
          }
        ],
        subject: 'Your StudyHive verification code',
        htmlContent: `
          <p>Hi ${escapedName},</p>
          <p>Your StudyHive verification code is:</p>
          <p style="font-size:24px;font-weight:700;margin:20px 0;">${escapedCode}</p>
          <p>This code expires in 5 minutes. If you did not try to sign in, you can ignore this email.</p>
        `,
        textContent: `Your StudyHive verification code is ${otpCode}. This code expires in 5 minutes.`
      })
    })

    if (!response.ok) {
      const error = new Error('Brevo email delivery failed')
      error.status = 502
      throw error
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Brevo email delivery timed out')
      timeoutError.status = 504
      throw timeoutError
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

module.exports = {
  sendOtpEmail
}
