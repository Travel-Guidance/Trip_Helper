'use strict';

const { Router } = require('express');
const { sendMessage } = require('../controllers/chatbotController');

const router = Router();

router.post('/chatbot', sendMessage);

module.exports = router;
