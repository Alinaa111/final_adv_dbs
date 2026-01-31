const mongoose = require('mongoose');

// ===============================================
// EMBEDDED SCHEMA: Order Item
// Demonstrates: Embedded Documents with Product References
// Denormalization: Store product details at order time
// ===============================================
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Denormalized fields (snapshot of product at time of order)
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// ===============================================
// EMBEDDED SCHEMA: Shipping Address
// ===============================================
const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'USA' },
  phoneNumber: { type: String, required: true, trim: true }
}, { _id: false });

// ===============================================
// MAIN SCHEMA: Order
// Advanced Features Demonstrated:
// 1. References to User collection
// 2. Array of embedded order items
// 3. Embedded shipping address
// 4. Enum for order status
// 5. Denormalization for historical data
// 6. Pre-save calculations
// 7. Status tracking with timestamps
// ===============================================
const orderSchema = new mongoose.Schema({
  // REFERENCE: Link to User who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Denormalized user info (snapshot at order time)
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  // EMBEDDED DOCUMENTS: Order items
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function(arr) {
        return arr && arr.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  // EMBEDDED DOCUMENT: Shipping address
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  // Payment and pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Payment details
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery']
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  // Order status tracking
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  // Status timestamps
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  // Tracking information
  trackingNumber: {
    type: String,
    trim: true
  },
  // Delivery dates
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  // Order notes
  customerNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===============================================
// INDEXES (Advanced Feature)
// ===============================================

// Compound index on user and createdAt for user order history
orderSchema.index({ user: 1, createdAt: -1 });

// Index on order status for admin dashboard
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// Index on payment status
orderSchema.index({ paymentStatus: 1 });

// Compound index for analytics
orderSchema.index({ createdAt: -1, orderStatus: 1 });

// ===============================================
// VIRTUAL PROPERTIES
// ===============================================

// Calculate total items in order
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['Pending', 'Processing'].includes(this.orderStatus);
});

// Calculate days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ===============================================
// PRE-SAVE HOOKS
// ===============================================

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  // Calculate subtotal from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }
  
  // Calculate tax (8% for example)
  if (!this.tax) {
    this.tax = Math.round(this.subtotal * 0.08 * 100) / 100;
  }
  
  // Calculate total
  this.totalAmount = this.subtotal + this.tax + this.shippingCost;
  
  // Add to status history if status changed
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date()
    });
  }
  
  next();
});

// ===============================================
// STATIC METHODS
// Advanced queries
// ===============================================

// Find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ orderStatus: status })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
};

// Find recent orders
orderSchema.statics.findRecent = function(days = 7, limit = 50) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({ createdAt: { $gte: dateThreshold } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Find orders for a specific user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name brand');
};

// ===============================================
// INSTANCE METHODS
// ===============================================

// Update order status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.orderStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note
  });
  return this.save();
};

// Mark as delivered
orderSchema.methods.markAsDelivered = function() {
  this.orderStatus = 'Delivered';
  this.actualDeliveryDate = new Date();
  this.paymentStatus = 'Completed';
  return this.save();
};

// Cancel order
orderSchema.methods.cancelOrder = function(reason = '') {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  this.orderStatus = 'Cancelled';
  this.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: reason
  });
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
