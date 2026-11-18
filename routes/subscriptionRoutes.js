'use strict';

const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} = require('../controllers/subscriptionController');

// POST   /api/subscriptions        — Create a new subscription
// GET    /api/subscriptions        — Get all subscriptions
// GET    /api/subscriptions/:id    — Get a subscription by ID
// PUT    /api/subscriptions/:id    — Update a subscription
// DELETE /api/subscriptions/:id    — Delete a subscription

router.post('/', createSubscription);
router.get('/', getAllSubscriptions);
router.get('/:id', getSubscriptionById);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

module.exports = router;
