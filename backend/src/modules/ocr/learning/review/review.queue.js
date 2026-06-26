const fs = require('fs');
const path = require('path');
const EventStore = require('../events/event.store');

class ReviewQueue {
  static getPendingDir() {
    const dir = path.join(__dirname, 'pending');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  
  static getApprovedDir() {
    const dir = path.join(__dirname, 'approved');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  
  static getRejectedDir() {
    const dir = path.join(__dirname, 'rejected');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static async addPending(eventPayload) {
    const filePath = path.join(this.getPendingDir(), `${eventPayload.eventId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(eventPayload, null, 2));
  }

  /**
   * Approves a pending correction.
   * Internal/Admin function.
   */
  static async approve(eventId) {
    const pendingFile = path.join(this.getPendingDir(), `${eventId}.json`);
    if (!fs.existsSync(pendingFile)) return false;

    const approvedFile = path.join(this.getApprovedDir(), `${eventId}.json`);
    fs.renameSync(pendingFile, approvedFile);
    
    // Log the approval event
    const eventData = JSON.parse(fs.readFileSync(approvedFile, 'utf8'));
    await EventStore.append({
      eventType: 'REVIEW_APPROVED',
      originalEventId: eventId,
      documentId: eventData.document?.documentId
    });
    
    return true;
  }
  
  static async reject(eventId) {
    const pendingFile = path.join(this.getPendingDir(), `${eventId}.json`);
    if (!fs.existsSync(pendingFile)) return false;

    const rejectedFile = path.join(this.getRejectedDir(), `${eventId}.json`);
    fs.renameSync(pendingFile, rejectedFile);
    
    return true;
  }
}

module.exports = ReviewQueue;
