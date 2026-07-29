const multer = require('multer');
const path = require('path');
const config = require('../config/default');
const { ensureDirectories, getUploadDir } = require('../utils/fileHelpers');

ensureDirectories();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.doc', '.docx', '.html', '.csv', '.xlsx', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/pdf')) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = upload;
