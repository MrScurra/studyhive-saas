const express = require('express')
const reportController = require('../controllers/reportController')

const router = express.Router()

router.get('/', reportController.getUserReports)
router.post('/', reportController.createProblemReport)

module.exports = router
