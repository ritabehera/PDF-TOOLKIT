const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config/default');

const getUploadDir = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const dir = path.join(os.tmpdir(), config.uploadDir || 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.join(__dirname, '..', config.uploadDir || 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const getTempDir = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const dir = path.join(os.tmpdir(), config.tempDir || 'temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.join(__dirname, '..', config.tempDir || 'temp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const getDownloadsDir = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const dir = path.join(os.tmpdir(), 'downloads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.join(__dirname, '..', 'public', 'downloads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const ensureDirectories = () => {
  const dirs = [getUploadDir(), getTempDir(), getDownloadsDir()];
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[FileHelpers] Could not create directory ${dir}:`, err.message);
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
  getUploadDir,
  getTempDir,
  getDownloadsDir,
  ensureDirectories,
  cleanupFile,
  generateFilename,
  formatBytes
};

