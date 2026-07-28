const db = require('../config/db');

class HistoryModel {
  static async add({ userId = 'guest', toolName, fileName, fileSize, status = 'success', downloadUrl = '#' }) {
    const store = db.getStore();
    const entry = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userId,
      toolName,
      fileName,
      fileSize,
      status,
      downloadUrl,
      timestamp: new Date()
    };
    store.history.unshift(entry); // latest first
    return entry;
  }

  static async getRecent(userId = 'guest', limit = 20) {
    const store = db.getStore();
    return store.history
      .filter(h => h.userId === userId || userId === 'admin')
      .slice(0, limit);
  }

  static async getAll() {
    const store = db.getStore();
    return store.history;
  }
}

module.exports = HistoryModel;
