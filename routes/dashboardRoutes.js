const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

router.get('/metrics', DashboardController.getMetrics);

module.exports = router;
