module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-pdf-toolkit-jwt-key-2026',
  jwtExpire: '30d',
  mongoURI: process.env.MONGODB_URI || '',
  uploadDir: 'uploads',
  tempDir: 'temp',
  maxFileSizeMB: 50,
  maxFilesPerUpload: 20
};
