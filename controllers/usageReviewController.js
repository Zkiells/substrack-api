'use strict';

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const {
  validateCreateUsageReview,
  validateUpdateUsageReview,
  isValidObjectId,
} = require('../utils/validators');

// ─── Helper ───────────────────────────────────────────────────────────────────

function usageReviewsCollection() {
  return getDB().collection('monthlyUsageReviews');
}

function subscriptionsCollection() {
  return getDB().collection('subscriptions');
}

// ─── POST /api/usage-reviews ──────────────────────────────────────────────────

async function createUsageReview(req, res) {
  try {
    const errors = validateCreateUsageReview(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const { subscriptionId, month, year, usageCount, note } = req.body;

    // Verify that the referenced subscription actually exists
    const subscription = await subscriptionsCollection().findOne({
      _id: new ObjectId(subscriptionId),
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Referenced subscription not found.',
      });
    }

    const now = new Date();

    const doc = {
      subscriptionId: new ObjectId(subscriptionId),
      month,
      year,
      usageCount,
      note: note || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await usageReviewsCollection().insertOne(doc);

    return res.status(201).json({
      success: true,
      message: 'Usage review created successfully.',
      data: { _id: result.insertedId, ...doc },
    });
  } catch (error) {
    // Handle duplicate key error from the unique compound index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A usage review for this subscription, month, and year already exists.',
      });
    }

    console.error('createUsageReview error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/usage-reviews ───────────────────────────────────────────────────

async function getAllUsageReviews(req, res) {
  try {
    const reviews = await usageReviewsCollection()
      .find({})
      .sort({ year: -1, month: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('getAllUsageReviews error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/usage-reviews/:id ──────────────────────────────────────────────

async function getUsageReviewById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid usage review ID.' });
    }

    const review = await usageReviewsCollection().findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Usage review not found.' });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('getUsageReviewById error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/usage-reviews/:id ──────────────────────────────────────────────

async function updateUsageReview(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid usage review ID.' });
    }

    const errors = validateUpdateUsageReview(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const { month, year, usageCount, note } = req.body;

    // Build update fields — only include what was provided
    const updateFields = { updatedAt: new Date() };

    if (month !== undefined) updateFields.month = month;
    if (year !== undefined) updateFields.year = year;
    if (usageCount !== undefined) updateFields.usageCount = usageCount;
    if (note !== undefined) updateFields.note = note;

    const result = await usageReviewsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Usage review not found.' });
    }

    // Return the updated document
    const updated = await usageReviewsCollection().findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Usage review updated successfully.',
      data: updated,
    });
  } catch (error) {
    // Handle duplicate key error when updating month/year causes a conflict
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A usage review for this subscription, month, and year already exists.',
      });
    }

    console.error('updateUsageReview error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createUsageReview,
  getAllUsageReviews,
  getUsageReviewById,
  updateUsageReview,
};
