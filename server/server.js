require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// MIDDLEWARE=

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow frontend to access backend
app.use(cors({
  origin: (origin, cb) => {
    const allowList = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    // allow REST tools / same-origin (no origin header)
    if (!origin) return cb(null, true);

    if (allowList.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ROUTES

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Shoe Store API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      analytics: '/api/stats'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// START SERVER

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
   🚀 Shoe Store API Server                   
            
   📍 Running on: http://localhost:${PORT}              
   🌍 Environment: ${process.env.NODE_ENV || 'development'}             
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
