const Product = require('../models/Product');

// ===============================================
// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
// DEMONSTRATES: Text Search, Regex Search, Filtering, Sorting
// ===============================================
const getProducts = async (req, res) => {
  try {
    const {
      search,        // Text search
      brand,         // Filter by brand
      category,      // Filter by category
      minPrice,      // Price range filter
      maxPrice,      // Price range filter
      gender,        // Filter by gender
      sortBy,        // Sort field
      order,         // Sort order (asc/desc)
      page,          // Pagination
      limit,         // Items per page
      featured       // Show only featured products
    } = req.query;

    // Build query object
    let query = { isActive: true };

    // TEXT SEARCH (Advanced Feature - uses text index)
    if (search) {
      query.$text = { $search: search };
    }

    // FILTERS
    if (brand) {
      query.brand = brand;
    }

    if (category) {
      query.category = category;
    }

    if (gender) {
      query.gender = gender;
    }

    // PRICE RANGE (Advanced Feature - compound query)
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Build sort object
    let sortOptions = {};
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sortOptions[sortBy] = sortOrder;
      
      // If text search, add text score sorting
      if (search) {
        sortOptions.score = { $meta: 'textScore' };
      }
    } else {
      sortOptions = { createdAt: -1 }; // Default: newest first
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total: total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
// ===============================================
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (could add this field to schema)
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
// DEMONSTRATES: CRUD - Create
// ===============================================
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private/Admin
// DEMONSTRATES: CRUD - Update with $set and $inc
// ===============================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ADVANCED UPDATE: Use $set for normal updates
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { 
        new: true,           // Return updated document
        runValidators: true  // Run schema validators
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
// DEMONSTRATES: Advanced Update with $inc operator
// ===============================================
const updateStock = async (req, res) => {
  try {
    const { colorName, size, quantity } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the color and size
    const colorIndex = product.colors.findIndex(c => c.name === colorName);
    if (colorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Color not found'
      });
    }

    const sizeIndex = product.colors[colorIndex].sizes.findIndex(s => s.size === size);
    if (sizeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Size not found'
      });
    }

    // ADVANCED UPDATE: Use $inc to increment/decrement stock
    const updatePath = `colors.${colorIndex}.sizes.${sizeIndex}.stock`;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { [updatePath]: quantity } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
// DEMONSTRATES: CRUD - Delete
// ===============================================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Add review to product
// @route   POST /api/products/:id/reviews
// @access  Private
// DEMONSTRATES: Advanced Update with $push operator
// ===============================================
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rating and comment'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // ADVANCED UPDATE: Use $push to add review to array
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $push: {
          reviews: {
            user: req.user._id,
            userName: req.user.name,
            rating: Number(rating),
            comment: comment,
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
// ===============================================
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .sort({ averageRating: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  addReview,
  getFeaturedProducts
};
