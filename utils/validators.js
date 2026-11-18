'use strict';

const { ObjectId } = require('mongodb');

// ─── Allowed Values ───────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = [
  'Entertainment',
  'Productivity',
  'Cloud Storage',
  'Education',
  'Communication',
  'Other',
];

const ALLOWED_BILLING_CYCLES = ['monthly', 'yearly', 'custom'];

const ALLOWED_STATUSES = ['active', 'cancelled', 'expired'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the value is a non-empty string.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns true if the value is a finite number greater than zero.
 */
function isPositiveNumber(value) {
  return typeof value === 'number' && isFinite(value) && value > 0;
}

/**
 * Returns true if the value is a valid MongoDB ObjectId string.
 */
function isValidObjectId(value) {
  return ObjectId.isValid(value) && String(new ObjectId(value)) === String(value);
}

/**
 * Returns true if the value is a valid date string or Date object.
 */
function isValidDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Returns true if value is an integer >= 0.
 */
function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Returns true if value is a positive integer.
 */
function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

// ─── Subscription Validators ──────────────────────────────────────────────────

/**
 * Validates the request body for creating a subscription.
 * Returns an array of error messages (empty array = valid).
 */
function validateCreateSubscription(body) {
  const errors = [];

  // name — required, non-empty string
  if (!isNonEmptyString(body.name)) {
    errors.push('name is required and must be a non-empty string.');
  }

  // category — required, must be one of the allowed values
  if (!body.category) {
    errors.push('category is required.');
  } else if (!ALLOWED_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
  }

  // price — required, must be greater than zero
  if (body.price === undefined || body.price === null) {
    errors.push('price is required.');
  } else if (!isPositiveNumber(body.price)) {
    errors.push('price must be a number greater than zero.');
  }

  // billingCycle — required, must be one of the allowed values
  if (!body.billingCycle) {
    errors.push('billingCycle is required.');
  } else if (!ALLOWED_BILLING_CYCLES.includes(body.billingCycle)) {
    errors.push(`billingCycle must be one of: ${ALLOWED_BILLING_CYCLES.join(', ')}.`);
  }

  // customIntervalDays — required only when billingCycle is 'custom'
  if (body.billingCycle === 'custom') {
    if (body.customIntervalDays === undefined || body.customIntervalDays === null) {
      errors.push('customIntervalDays is required when billingCycle is custom.');
    } else if (!isPositiveInteger(body.customIntervalDays)) {
      errors.push('customIntervalDays must be a positive integer.');
    }
  } else if (body.billingCycle === 'monthly' || body.billingCycle === 'yearly') {
    // customIntervalDays must NOT be provided for monthly/yearly
    if (body.customIntervalDays !== undefined && body.customIntervalDays !== null) {
      errors.push('customIntervalDays must be omitted or null for monthly and yearly billing cycles.');
    }
  }

  // startDate — required, must be a valid date
  if (!body.startDate) {
    errors.push('startDate is required.');
  } else if (!isValidDate(body.startDate)) {
    errors.push('startDate must be a valid date.');
  }

  // nextBillingDate — required, must be a valid date
  if (!body.nextBillingDate) {
    errors.push('nextBillingDate is required.');
  } else if (!isValidDate(body.nextBillingDate)) {
    errors.push('nextBillingDate must be a valid date.');
  }

  // status — optional, defaults to 'active', but if provided must be valid
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
  }

  // notes — optional, but if provided must be a string
  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== 'string') {
      errors.push('notes must be a string.');
    }
  }

  return errors;
}

/**
 * Validates the request body for updating a subscription.
 * All fields are optional — only validate what is provided.
 * Returns an array of error messages (empty array = valid).
 */
function validateUpdateSubscription(body) {
  const errors = [];

  if (Object.keys(body).length === 0) {
    errors.push('Request body must not be empty.');
    return errors;
  }

  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    errors.push('name must be a non-empty string.');
  }

  if (body.category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(body.category)) {
      errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
    }
  }

  if (body.price !== undefined) {
    if (!isPositiveNumber(body.price)) {
      errors.push('price must be a number greater than zero.');
    }
  }

  if (body.billingCycle !== undefined) {
    if (!ALLOWED_BILLING_CYCLES.includes(body.billingCycle)) {
      errors.push(`billingCycle must be one of: ${ALLOWED_BILLING_CYCLES.join(', ')}.`);
    }
  }

  // Determine the effective billingCycle for customIntervalDays validation.
  // We check the value being updated, if provided.
  const effectiveCycle = body.billingCycle;

  if (effectiveCycle === 'custom') {
    if (body.customIntervalDays === undefined || body.customIntervalDays === null) {
      errors.push('customIntervalDays is required when billingCycle is custom.');
    } else if (!isPositiveInteger(body.customIntervalDays)) {
      errors.push('customIntervalDays must be a positive integer.');
    }
  } else if (effectiveCycle === 'monthly' || effectiveCycle === 'yearly') {
    if (body.customIntervalDays !== undefined && body.customIntervalDays !== null) {
      errors.push('customIntervalDays must be omitted or null for monthly and yearly billing cycles.');
    }
  } else if (effectiveCycle === undefined && body.customIntervalDays !== undefined) {
    // billingCycle is not being updated but customIntervalDays is provided
    if (body.customIntervalDays !== null && !isPositiveInteger(body.customIntervalDays)) {
      errors.push('customIntervalDays must be a positive integer or null.');
    }
  }

  if (body.startDate !== undefined && !isValidDate(body.startDate)) {
    errors.push('startDate must be a valid date.');
  }

  if (body.nextBillingDate !== undefined && !isValidDate(body.nextBillingDate)) {
    errors.push('nextBillingDate must be a valid date.');
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
  }

  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== 'string') {
      errors.push('notes must be a string.');
    }
  }

  return errors;
}

// ─── Usage Review Validators ──────────────────────────────────────────────────

/**
 * Validates the request body for creating a usage review.
 * Returns an array of error messages (empty array = valid).
 */
function validateCreateUsageReview(body) {
  const errors = [];

  // subscriptionId — required, must be a valid ObjectId string
  if (!body.subscriptionId) {
    errors.push('subscriptionId is required.');
  } else if (!isValidObjectId(body.subscriptionId)) {
    errors.push('subscriptionId must be a valid MongoDB ObjectId.');
  }

  // month — required, integer between 1 and 12
  if (body.month === undefined || body.month === null) {
    errors.push('month is required.');
  } else if (!Number.isInteger(body.month) || body.month < 1 || body.month > 12) {
    errors.push('month must be an integer between 1 and 12.');
  }

  // year — required, must be a reasonable year
  if (body.year === undefined || body.year === null) {
    errors.push('year is required.');
  } else if (!Number.isInteger(body.year) || body.year < 2000 || body.year > 2100) {
    errors.push('year must be a valid year (2000–2100).');
  }

  // usageCount — required, non-negative integer
  if (body.usageCount === undefined || body.usageCount === null) {
    errors.push('usageCount is required.');
  } else if (!isNonNegativeInteger(body.usageCount)) {
    errors.push('usageCount must be a non-negative integer.');
  }

  // note — optional, but if provided must be a string
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== 'string') {
      errors.push('note must be a string.');
    }
  }

  return errors;
}

/**
 * Validates the request body for updating a usage review.
 * All fields are optional — only validate what is provided.
 * Returns an array of error messages (empty array = valid).
 */
function validateUpdateUsageReview(body) {
  const errors = [];

  if (Object.keys(body).length === 0) {
    errors.push('Request body must not be empty.');
    return errors;
  }

  if (body.month !== undefined) {
    if (!Number.isInteger(body.month) || body.month < 1 || body.month > 12) {
      errors.push('month must be an integer between 1 and 12.');
    }
  }

  if (body.year !== undefined) {
    if (!Number.isInteger(body.year) || body.year < 2000 || body.year > 2100) {
      errors.push('year must be a valid year (2000–2100).');
    }
  }

  if (body.usageCount !== undefined) {
    if (!isNonNegativeInteger(body.usageCount)) {
      errors.push('usageCount must be a non-negative integer.');
    }
  }

  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== 'string') {
      errors.push('note must be a string.');
    }
  }

  return errors;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  isValidObjectId,
  validateCreateSubscription,
  validateUpdateSubscription,
  validateCreateUsageReview,
  validateUpdateUsageReview,
  ALLOWED_CATEGORIES,
  ALLOWED_BILLING_CYCLES,
  ALLOWED_STATUSES,
};
