'use strict';

const express = require('express');
const router = express.Router();
const { getSpendingSummary } = require('../controllers/analyticsController');

// GET /api/analytics/summary — Spending summary analytics
router.get('/summary', getSpendingSummary);

module.exports = router;
