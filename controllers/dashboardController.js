const HistoryModel = require('../models/History');
const { AILogModel } = require('../models/Favorite');
const FileRecordModel = require('../models/FileRecord');
const db = require('../config/db');

class DashboardController {
  static async getMetrics(req, res, next) {
    try {
      const history = await HistoryModel.getAll();
      const aiLogs = await AILogModel.getAll();
      const files = await FileRecordModel.getAll();
      const store = db.getStore();

      const totalFilesProcessed = history.length;
      const totalAiOps = aiLogs.length;
      const totalUsers = store.users.length || 1;

      // Group tool breakdown
      const toolStats = {};
      history.forEach(h => {
        toolStats[h.toolName] = (toolStats[h.toolName] || 0) + 1;
      });

      res.json({
        metrics: {
          totalFilesProcessed,
          totalAiOps,
          totalUsers,
          activeStorageMB: (files.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(2)
        },
        toolStats,
        recentHistory: history.slice(0, 15),
        recentAiLogs: aiLogs.slice(0, 10)
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
