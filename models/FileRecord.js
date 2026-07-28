const db = require('../config/db');

class FileRecordModel {
  static async create(fileData) {
    const store = db.getStore();
    const record = {
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      filename: fileData.filename,
      originalName: fileData.originalname || fileData.originalName,
      size: fileData.size,
      mimetype: fileData.mimetype,
      path: fileData.path,
      userId: fileData.userId || 'guest',
      createdAt: new Date()
    };
    store.files.push(record);
    return record;
  }

  static async findByUserId(userId) {
    const store = db.getStore();
    return store.files.filter(f => f.userId === userId);
  }

  static async getAll() {
    const store = db.getStore();
    return store.files;
  }
}

module.exports = FileRecordModel;
