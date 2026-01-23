const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const subscriptionsRoutes = require('./routes/subscriptions');
const paymentLogsRoutes = require('./routes/payment-logs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payment-logs', paymentLogsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
