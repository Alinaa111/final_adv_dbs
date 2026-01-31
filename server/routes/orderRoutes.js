const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorizeAdmin } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// User routes
router.post('/', createOrder);
router.get('/me', getMyOrders);
router.get('/:id', getOrderById);
router.delete('/:id', cancelOrder);

// Admin routes
router.get('/', authorizeAdmin, getAllOrders);
router.patch('/:id/status', authorizeAdmin, updateOrderStatus);

module.exports = router;
