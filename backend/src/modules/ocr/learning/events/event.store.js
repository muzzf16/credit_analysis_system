const fs = require('fs');
const path = require('path');

class EventStore {
  /**
   * Logs an event to the daily JSONL file
   * @param {Object} eventPayload 
   */
  static async append(eventPayload) {
    try {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      
      const logDir = path.join(__dirname, year, month);
      fs.mkdirSync(logDir, { recursive: true });
      
      const logFile = path.join(logDir, `ocr-events-${year}-${month}-${day}.jsonl`);
      
      const payloadString = JSON.stringify({
        timestamp: now.toISOString(),
        ...eventPayload
      }) + '\n';
      
      // Fire and forget appending
      fs.appendFile(logFile, payloadString, (err) => {
        if (err) console.error('Failed to write to OCR Event Store:', err);
      });
    } catch (err) {
      console.error('OCR Event Store Error:', err);
    }
  }
}

module.exports = EventStore;
