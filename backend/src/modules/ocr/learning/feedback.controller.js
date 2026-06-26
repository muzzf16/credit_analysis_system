const EventStore = require('./events/event.store');
const ReviewQueue = require('./review/review.queue');
const crypto = require('crypto');

class FeedbackController {
  /**
   * POST /api/ocr/feedback
   * Endpoint to record feedback from AO (corrections or confirmations)
   */
  static async submitFeedback(req, res) {
    try {
      const {
        sessionId,
        documentId,
        feedbackType, // 'USER_CORRECTED', 'USER_CONFIRMED', 'REJECTED'
        field,
        ocrValue,
        correctValue,
        evidenceScore,
        metadata
      } = req.body;

      if (!sessionId || !documentId || !feedbackType) {
        return res.status(400).json({ success: false, message: 'Missing required fields: sessionId, documentId, feedbackType' });
      }

      const eventPayload = {
        eventType: feedbackType,
        eventId: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
        sessionId,
        document: {
          documentId
        },
        feedback: {
          field,
          ocrValue,
          correctValue,
          evidenceScore
        },
        metadata
      };

      // 1. Log to Full Event Store
      await EventStore.append(eventPayload);

      // 2. If it's a correction, send to Review Queue for Dataset Builder
      if (feedbackType === 'USER_CORRECTED') {
        await ReviewQueue.addPending(eventPayload);
      }

      return res.status(200).json({ success: true, message: 'Feedback recorded successfully' });
    } catch (error) {
      console.error('Feedback submission error:', error);
      return res.status(500).json({ success: false, message: 'Failed to record feedback' });
    }
  }
}

module.exports = FeedbackController;
