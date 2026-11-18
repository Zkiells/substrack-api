'use strict';

const express = require('express');
const router = express.Router();
const {
  createUsageReview,
  getAllUsageReviews,
  getUsageReviewById,
  updateUsageReview,
} = require('../controllers/usageReviewController');

// POST   /api/usage-reviews        — Create a new usage review
// GET    /api/usage-reviews        — Get all usage reviews
// GET    /api/usage-reviews/:id    — Get a usage review by ID
// PUT    /api/usage-reviews/:id    — Update a usage review

router.post('/', createUsageReview);
router.get('/', getAllUsageReviews);
router.get('/:id', getUsageReviewById);
router.put('/:id', updateUsageReview);

module.exports = router;
