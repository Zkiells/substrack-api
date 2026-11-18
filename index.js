'use strict';

require('dotenv').config();

const express = require('express');
const { connectDB } = require('./config/database');

const subscriptionRoutes = require('./routes/subscriptionRoutes');
const usageReviewRoutes = require('./routes/usageReviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/usage-reviews', usageReviewRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler (unknown routes) ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`SubTrack API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
