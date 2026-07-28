const db = require('../config/db');

class FavoriteModel {
  static async toggle(userId = 'guest', toolId) {
    const store = db.getStore();
    const index = store.favorites.findIndex(f => f.userId === userId && f.toolId === toolId);
    if (index > -1) {
      store.favorites.splice(index, 1);
      return { toolId, isFavorite: false };
    } else {
      store.favorites.push({ userId, toolId, createdAt: new Date() });
      return { toolId, isFavorite: true };
    }
  }

  static async getFavorites(userId = 'guest') {
    const store = db.getStore();
    return store.favorites.filter(f => f.userId === userId).map(f => f.toolId);
  }
}

class AILogModel {
  static async log({ userId = 'guest', action, inputLength, durationMs, model = 'Built-in Document AI' }) {
    const store = db.getStore();
    const entry = {
      id: 'ailog_' + Date.now(),
      userId,
      action,
      inputLength,
      durationMs,
      model,
      timestamp: new Date()
    };
    store.aiLogs.unshift(entry);
    return entry;
  }

  static async getAll() {
    const store = db.getStore();
    return store.aiLogs;
  }
}

module.exports = {
  FavoriteModel,
  AILogModel
};
