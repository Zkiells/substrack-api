'use strict';

const { getDB } = require('../config/database');

// ─── Helper ───────────────────────────────────────────────────────────────────

function subscriptionsCollection() {
  return getDB().collection('subscriptions');
}

/**
 * Normalize a subscription's price to its monthly equivalent.
 *
 * Rules:
 *   monthly : price
 *   yearly  : price / 12
 *   custom  : (price * 30) / customIntervalDays
 */
function toMonthlyEquivalent(subscription) {
  const { price, billingCycle, customIntervalDays } = subscription;

  if (billingCycle === 'monthly') {
    return price;
  }

  if (billingCycle === 'yearly') {
    return price / 12;
  }

  if (billingCycle === 'custom' && customIntervalDays > 0) {
    return (price * 30) / customIntervalDays;
  }

  // Fallback — should not happen with valid data
  return 0;
}

// ─── GET /api/analytics/summary ──────────────────────────────────────────────

async function getSpendingSummary(req, res) {
  try {
    // Fetch all active subscriptions only
    const activeSubscriptions = await subscriptionsCollection()
      .find({ status: 'active' })
      .toArray();

    // Calculate monthly equivalent for each active subscription
    const subscriptionsWithMonthly = activeSubscriptions.map((sub) => {
      const monthlyEquivalent = toMonthlyEquivalent(sub);
      return {
        _id: sub._id,
        name: sub.name,
        category: sub.category,
        price: sub.price,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        customIntervalDays: sub.customIntervalDays,
        status: sub.status,
        nextBillingDate: sub.nextBillingDate,
        monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
      };
    });

    // Sum all monthly equivalents
    const totalMonthlyExpense = subscriptionsWithMonthly.reduce(
      (sum, sub) => sum + sub.monthlyEquivalent,
      0
    );

    // Yearly = monthly * 12
    const totalYearlyExpense = totalMonthlyExpense * 12;

    return res.status(200).json({
      success: true,
      data: {
        totalActiveSubscriptions: activeSubscriptions.length,
        estimatedMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
        estimatedYearlyExpense: Math.round(totalYearlyExpense * 100) / 100,
        activeSubscriptions: subscriptionsWithMonthly,
      },
    });
  } catch (error) {
    console.error('getSpendingSummary error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { getSpendingSummary };
