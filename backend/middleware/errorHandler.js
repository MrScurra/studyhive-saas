function errorHandler(error, req, res, next) {
  console.error(error)

  const isUploadError = error.name === 'MulterError' || error.message === 'Invalid file type'
  const message = String(error.message || error.details || '').toLowerCase()
  const code = String(error.code || error.status || '').toLowerCase()
  const isQuotaError = code === '8'
    || code === 'resource-exhausted'
    || message.includes('resource_exhausted')
    || message.includes('resource exhausted')
    || message.includes('quota exceeded')
  const statusCode = isUploadError ? 400 : isQuotaError ? 503 : 500

  res.status(statusCode).json({
    error: isQuotaError
      ? 'Firestore quota exceeded. Please try again after the quota resets.'
      : error.message || 'Something went wrong',
    code: isQuotaError ? 'firestore_quota_exceeded' : undefined
  })
}

module.exports = errorHandler
