var express = require('express');
var router = express.Router();
var bot = require('../services/bot');

/* GET webhook to verify applicatoin */
router.get('/webhook/', bot.getWebHook);

/* POST webhook to process message */
router.post('/webhook', bot.postWebHook);

module.exports = router;
