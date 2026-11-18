'use strict';

const { MongoClient } = require('mongodb');

let db = null;

/**
 * Connect to MongoDB using MongoClient.
 * Creates required indexes after a successful connection.
 * Returns the database instance.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    throw new Error('MONGODB_URI and DB_NAME must be defined in environment variables.');
  }

  const client = new MongoClient(uri);

  await client.connect();

  db = client.db(dbName);

  await createIndexes();

  console.log(`Connected to MongoDB — database: "${dbName}"`);

  return db;
}

/**
 * Create all required indexes for the application.
 * This runs once at startup, so it is safe to call repeatedly
 * (MongoDB will skip creation if the index already exists).
 */
async function createIndexes() {
  // Unique compound index on monthlyUsageReviews to prevent
  // duplicate evaluations for the same subscription + month + year.
  await db.collection('monthlyUsageReviews').createIndex(
    { subscriptionId: 1, month: 1, year: 1 },
    { unique: true, name: 'unique_subscription_month_year' }
  );
}

/**
 * Returns the connected database instance.
 * Controllers call this function to access MongoDB collections.
 * Throws if the database has not been connected yet.
 */
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

module.exports = { connectDB, getDB };
