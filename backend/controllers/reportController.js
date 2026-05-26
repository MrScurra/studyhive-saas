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

exports.getUserReports = async (req, res) => {
  try {
    const reports = await firestoreService.getProblemReportsForUser(req.user.id, 10)
    return res.json({ success: true, reports })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        success: true,
        reports: [],
        degraded: true,
        warning: 'Firestore quota exceeded; problem reports are temporarily unavailable.'
      })
    }

    console.error('Failed to fetch problem reports:', error)
    return res.status(500).json({ error: 'Failed to fetch problem reports' })
  }
}

exports.createProblemReport = async (req, res) => {
  try {
    const report = await firestoreService.createProblemReport(getCurrentUserSummary(req), {
      category: req.body.category,
      title: req.body.title,
      reportText: req.body.reportText || req.body.description,
      priority: req.body.priority,
      screenshotFileName: req.body.screenshotFileName
    })

    return res.status(201).json({ success: true, report })
  } catch (error) {
    if (error.message === 'Category, title, and report text are required') {
      return res.status(400).json({ error: error.message })
    }

    console.error('Failed to submit problem report:', error)
    return res.status(500).json({ error: 'Failed to submit problem report' })
  }
}
