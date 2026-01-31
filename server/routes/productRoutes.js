const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  addReview,
  getFeaturedProducts
} = require('../controllers/productController');
const { protect, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Protected routes (require login)
router.post('/:id/reviews', protect, addReview);

// Admin routes
router.post('/', protect, authorizeAdmin, createProduct);
router.patch('/:id', protect, authorizeAdmin, updateProduct);
router.patch('/:id/stock', protect, authorizeAdmin, updateStock);
router.delete('/:id', protect, authorizeAdmin, deleteProduct);

module.exports = router;
