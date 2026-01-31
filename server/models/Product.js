const mongoose = require('mongoose');

// ===============================================
// EMBEDDED SCHEMA: Size Variant
// Demonstrates: Array of Embedded Documents
// ===============================================
const sizeVariantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  }
}, { _id: false });

// ===============================================
// EMBEDDED SCHEMA: Color Option
// Demonstrates: Nested Embedded Documents
// ===============================================
const colorOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  hexCode: {
    type: String,
    required: true,
    match: [/^#([A-Fa-f0-9]{6})$/, 'Please provide valid hex color code']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  sizes: [sizeVariantSchema] // NESTED ARRAY of size variants
}, { _id: false });

// ===============================================
// EMBEDDED SCHEMA: Review
// Demonstrates: Array of Embedded Documents with Refs
// ===============================================
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { // Denormalized for performance
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// ===============================================
// MAIN SCHEMA: Product
// Advanced Features Demonstrated:
// 1. Multiple levels of embedded documents
// 2. Array of embedded objects (colors, sizes, reviews)
// 3. References to other collections
// 4. Complex validation rules
// 5. Text indexing for search
// 6. Compound indexes
// 7. Virtual properties
// 8. Pre/Post hooks
// ===============================================
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    enum: {
      values: ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Under Armour'],
      message: '{VALUE} is not a supported brand'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Running', 'Basketball', 'Casual', 'Training', 'Soccer', 'Tennis', 'Walking'],
      message: '{VALUE} is not a valid category'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price seems unreasonably high']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // EMBEDDED DOCUMENTS: Array of color options with nested sizes
  colors: {
    type: [colorOptionSchema],
    validate: {
      validator: function(arr) {
        return arr && arr.length > 0;
      },
      message: 'At least one color option is required'
    }
  },
  mainImage: {
    type: String,
    required: [true, 'Main image URL is required']
  },
  additionalImages: {
    type: [String],
    default: []
  },
  gender: {
    type: String,
    required: true,
    enum: ['Men', 'Women', 'Unisex', 'Kids']
  },
  // EMBEDDED DOCUMENTS: Array of reviews
  reviews: {
    type: [reviewSchema],
    default: []
  },
  // Calculated fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===============================================
// INDEXES (Advanced Feature)
// Multiple indexes for different query patterns
// ===============================================

// Text index for full-text search on name, description, and brand
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,      // Name is most important
    brand: 5,      // Brand is moderately important
    tags: 3,       // Tags are somewhat important
    description: 1 // Description is least important
  }
});

// Compound index on brand and price for filtering
productSchema.index({ brand: 1, price: 1 });

// Compound index on category and averageRating for sorted lists
productSchema.index({ category: 1, averageRating: -1 });

// Index for featured products
productSchema.index({ isFeatured: 1, averageRating: -1 });

// Index for active products sorted by creation date
productSchema.index({ isActive: 1, createdAt: -1 });

// ===============================================
// VIRTUAL PROPERTIES
// ===============================================

// Calculate discounted price
productSchema.virtual('finalPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

// Check if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.totalStock > 0;
});

// Calculate discount amount
productSchema.virtual('discountAmount').get(function() {
  return this.price - this.finalPrice;
});

// ===============================================
// PRE-SAVE HOOKS (Middleware)
// Auto-calculate totalStock when colors/sizes change
// ===============================================
productSchema.pre('save', function(next) {
  // Calculate total stock from all color variants
  if (this.colors && this.colors.length > 0) {
    this.totalStock = this.colors.reduce((total, color) => {
      const colorStock = color.sizes.reduce((sum, size) => sum + size.stock, 0);
      return total + colorStock;
    }, 0);
  }
  
  // Calculate average rating from reviews
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  
  next();
});

// ===============================================
// STATIC METHODS
// Advanced queries using aggregation
// ===============================================

// Find top-rated products
productSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ isActive: true, totalReviews: { $gte: 5 } })
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit);
};

// Find products by price range
productSchema.statics.findByPriceRange = function(min, max) {
  return this.find({
    isActive: true,
    price: { $gte: min, $lte: max }
  }).sort({ price: 1 });
};

// Find low stock products (for admin alerts)
productSchema.statics.findLowStock = function(threshold = 10) {
  return this.find({
    isActive: true,
    totalStock: { $lte: threshold, $gt: 0 }
  }).sort({ totalStock: 1 });
};

// ===============================================
// INSTANCE METHODS
// ===============================================

// Add a review (using $push - Advanced Update Operator)
productSchema.methods.addReview = function(userId, userName, rating, comment) {
  this.reviews.push({
    user: userId,
    userName: userName,
    rating: rating,
    comment: comment,
    createdAt: new Date()
  });
  return this.save();
};

// Decrease stock (using $inc - Advanced Update Operator)
productSchema.methods.decreaseStock = async function(colorName, size, quantity) {
  const color = this.colors.find(c => c.name === colorName);
  if (!color) throw new Error('Color not found');
  
  const sizeVariant = color.sizes.find(s => s.size === size);
  if (!sizeVariant) throw new Error('Size not found');
  
  if (sizeVariant.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  sizeVariant.stock -= quantity;
  this.soldCount += quantity;
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
