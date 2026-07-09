const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// API health-check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount modular API routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Fallback route for unmatched requests (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error Handler] Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

module.exports = app;
