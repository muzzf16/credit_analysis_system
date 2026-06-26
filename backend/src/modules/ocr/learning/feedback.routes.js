const express = require('express');
const router = express.Router();
const FeedbackController = require('./feedback.controller');

router.post('/feedback', FeedbackController.submitFeedback);

module.exports = router;
