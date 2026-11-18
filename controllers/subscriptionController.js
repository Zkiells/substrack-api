'use strict';

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const {
  validateCreateSubscription,
  validateUpdateSubscription,
  isValidObjectId,
} = require('../utils/validators');

// ─── Helper ───────────────────────────────────────────────────────────────────

function subscriptionsCollection() {
  return getDB().collection('subscriptions');
}

// ─── POST /api/subscriptions ──────────────────────────────────────────────────

async function createSubscription(req, res) {
  try {
    const errors = validateCreateSubscription(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const {
      name,
      category,
      price,
      currency,
      billingCycle,
      customIntervalDays,
      startDate,
      nextBillingDate,
      status,
      notes,
    } = req.body;

    const now = new Date();

    const doc = {
      name: name.trim(),
      category,
      price,
      currency: currency || 'IDR',
      billingCycle,
      customIntervalDays: billingCycle === 'custom' ? customIntervalDays : null,
      startDate: new Date(startDate),
      nextBillingDate: new Date(nextBillingDate),
      status: status || 'active',
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await subscriptionsCollection().insertOne(doc);

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully.',
      data: { _id: result.insertedId, ...doc },
    });
  } catch (error) {
    console.error('createSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

async function getAllSubscriptions(req, res) {
  try {
    const subscriptions = await subscriptionsCollection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error('getAllSubscriptions error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/subscriptions/:id ──────────────────────────────────────────────

async function getSubscriptionById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription ID.' });
    }

    const subscription = await subscriptionsCollection().findOne({ _id: new ObjectId(id) });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error('getSubscriptionById error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/subscriptions/:id ──────────────────────────────────────────────

async function updateSubscription(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription ID.' });
    }

    const errors = validateUpdateSubscription(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const {
      name,
      category,
      price,
      currency,
      billingCycle,
      customIntervalDays,
      startDate,
      nextBillingDate,
      status,
      notes,
    } = req.body;

    // Build update fields — only include what was provided
    const updateFields = { updatedAt: new Date() };

    if (name !== undefined) updateFields.name = name.trim();
    if (category !== undefined) updateFields.category = category;
    if (price !== undefined) updateFields.price = price;
    if (currency !== undefined) updateFields.currency = currency;
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    if (startDate !== undefined) updateFields.startDate = new Date(startDate);
    if (nextBillingDate !== undefined) updateFields.nextBillingDate = new Date(nextBillingDate);

    if (billingCycle !== undefined) {
      updateFields.billingCycle = billingCycle;
      // When switching cycle, resolve customIntervalDays accordingly
      if (billingCycle === 'custom') {
        updateFields.customIntervalDays = customIntervalDays;
      } else {
        updateFields.customIntervalDays = null;
      }
    } else if (customIntervalDays !== undefined) {
      // billingCycle not changing, but customIntervalDays explicitly updated
      updateFields.customIntervalDays = customIntervalDays;
    }

    const result = await subscriptionsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Return the updated document
    const updated = await subscriptionsCollection().findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/subscriptions/:id ───────────────────────────────────────────

async function deleteSubscription(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription ID.' });
    }

    const result = await subscriptionsCollection().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully.',
    });
  } catch (error) {
    console.error('deleteSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
};
