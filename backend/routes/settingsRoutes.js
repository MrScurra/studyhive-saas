const express = require('express')
const settingsController = require('../controllers/settingsController')

const router = express.Router()

router.get('/', settingsController.getUserSettings)
router.put('/', settingsController.updateUserSettings)

module.exports = router
