const express = require('express')
const debugController = require('../controllers/debugController')

const router = express.Router()

router.get('/interactions', debugController.getInteractions)

module.exports = router
