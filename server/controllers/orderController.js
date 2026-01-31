const Order = require('../models/Order');
const Product = require('../models/Product');

// ===============================================
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// DEMONSTRATES: References, Embedded Documents, Transactions
// ===============================================
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, customerNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Calculate order totals and validate stock
    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      // Find the specific color and size
      const color = product.colors.find(c => c.name === item.color);
      if (!color) {
        return res.status(400).json({
          success: false,
          message: `Color ${item.color} not available for ${product.name}`
        });
      }

      const sizeVariant = color.sizes.find(s => s.size === item.size);
      if (!sizeVariant) {
        return res.status(400).json({
          success: false,
          message: `Size ${item.size} not available for ${product.name} in ${item.color}`
        });
      }

      // Check stock availability
      if (sizeVariant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.color}, size ${item.size}). Only ${sizeVariant.stock} available.`
        });
      }

      // Calculate item subtotal
      const itemSubtotal = product.finalPrice * item.quantity;
      subtotal += itemSubtotal;

      // Create order item with denormalized data
      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.mainImage,
        brand: product.brand,
        color: item.color,
        size: item.size,
        priceAtPurchase: product.finalPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Decrease stock using the product method
      await product.decreaseStock(item.color, item.size, item.quantity);
    }

    // Calculate shipping (free over $100, otherwise $10)
    const shippingCost = subtotal >= 100 ? 0 : 10;

    // Calculate tax (8%)
    const tax = Math.round(subtotal * 0.08 * 100) / 100;

    // Calculate total
    const totalAmount = subtotal + tax + shippingCost;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      items: orderItems,
      shippingAddress,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      paymentMethod,
      customerNotes,
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get user's orders
// @route   GET /api/orders/me
// @access  Private
// DEMONSTRATES: References with populate
// ===============================================
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name brand mainImage');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
// ===============================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name brand mainImage');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
// ===============================================
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
// ===============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, note);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
// ===============================================
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const colorIndex = product.colors.findIndex(c => c.name === item.color);
        if (colorIndex !== -1) {
          const sizeIndex = product.colors[colorIndex].sizes.findIndex(s => s.size === item.size);
          if (sizeIndex !== -1) {
            product.colors[colorIndex].sizes[sizeIndex].stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    await order.cancelOrder('Cancelled by user');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
};
