const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config/default');
const { connectDB } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { authenticateToken } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { ensureDirectories, getDownloadsDir } = require('./utils/fileHelpers');

// Process Safety Handlers for Unhandled Worker Rejections
process.on('uncaughtException', (err) => {
  console.error('[Process Safety] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Safety] Unhandled Rejection:', reason);
});

// Import Routers
const pdfRoutes = require('./routes/pdfRoutes');
const aiRoutes = require('./routes/aiRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const convertRoutes = require('./routes/convertRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Initialize Directories
ensureDirectories();

// Connect Database (or hybrid memory store)
connectDB();

// Core Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled CSP header restrictions for inline Web Worker blobs & PDF.js preview rendering
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Apply Rate Limiting
app.use('/api/', apiLimiter);

// Serve Static Web Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(getDownloadsDir()));
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'AI PDF Toolkit Engine Active'
  });
});

// API Routes
app.use('/api/pdf', authenticateToken, pdfRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/ocr', authenticateToken, ocrRoutes);
app.use('/api/convert', authenticateToken, convertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Modern AI-Powered PDF Toolkit Server is Running!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;

