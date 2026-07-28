const fs = require('fs');
const path = require('path');
const config = require('../config/default');

const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, '..', config.uploadDir),
    path.join(__dirname, '..', config.tempDir),
    path.join(__dirname, '..', 'public', 'downloads')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete temporary file ${filePath}:`, err.message);
    }
  }
};

const generateFilename = (originalName, prefix = 'processed', ext = '.pdf') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const baseName = path.parse(originalName || 'file').name.replace(/[^a-zA-Z0-9]/g, '_');
  return `${prefix}_${baseName}_${timestamp}_${random}${ext}`;
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  ensureDirectories,
  cleanupFile,
  generateFilename,
  formatBytes
};
