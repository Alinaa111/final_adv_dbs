const express = require('express');
const router = express.Router();
const {
  getRevenueStats,
  getTopRatedProducts,
  getBestSellers,
  getSalesTrends,
  getInventoryReport,
  getCustomerInsights
} = require('../controllers/analyticsController');
const { protect, authorizeAdmin } = require('../middleware/auth');

// Public analytics
router.get('/top-rated', getTopRatedProducts);
router.get('/best-sellers', getBestSellers);

// Admin-only analytics
router.get('/revenue', protect, authorizeAdmin, getRevenueStats);
router.get('/sales-trends', protect, authorizeAdmin, getSalesTrends);
router.get('/inventory', protect, authorizeAdmin, getInventoryReport);
router.get('/customers', protect, authorizeAdmin, getCustomerInsights);

module.exports = router;
