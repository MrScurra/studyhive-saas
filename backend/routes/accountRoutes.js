const express = require('express')
const accountController = require('../controllers/accountController')

const router = express.Router()

router.post('/sign-out-everywhere', accountController.signOutEverywhere)
router.delete('/', accountController.deleteAccount)

module.exports = router
