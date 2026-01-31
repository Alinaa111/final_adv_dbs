const Order = require('../models/Order');
const Product = require('../models/Product');

// ===============================================
// @desc    Get revenue statistics
// @route   GET /api/stats/revenue
// @access  Private/Admin
// DEMONSTRATES: Aggregation Pipeline - $group, $match, $sort
// ===============================================
const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build match stage
    let matchStage = { orderStatus: { $ne: 'Cancelled' } };
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // ADVANCED AGGREGATION PIPELINE
    const revenueByCategory = await Order.aggregate([
      // Stage 1: Match orders that aren't cancelled
      { $match: matchStage },
      
      // Stage 2: Unwind the items array to process each item
      { $unwind: '$items' },
      
      // Stage 3: Lookup product details to get category
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      
      // Stage 4: Unwind product details
      { $unwind: '$productDetails' },
      
      // Stage 5: Group by category and calculate totals
      {
        $group: {
          _id: '$productDetails.category',
          totalRevenue: { $sum: '$items.subtotal' },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          averageOrderValue: { $avg: '$items.subtotal' }
        }
      },
      
      // Stage 6: Sort by revenue descending
      { $sort: { totalRevenue: -1 } },
      
      // Stage 7: Project to format output
      {
        $project: {
          category: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalOrders: 1,
          totalQuantity: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          _id: 0
        }
      }
    ]);

    // Get overall totals
    const overallStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
        byCategory: revenueByCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue statistics',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get top-rated products
// @route   GET /api/stats/top-rated
// @access  Public
// DEMONSTRATES: Aggregation Pipeline - $match, $sort, $limit
// ===============================================
const getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // ADVANCED AGGREGATION PIPELINE
    const topRated = await Product.aggregate([
      // Stage 1: Match only active products with reviews
      {
        $match: {
          isActive: true,
          totalReviews: { $gte: 5 }  // At least 5 reviews for reliability
        }
      },
      
      // Stage 2: Sort by average rating and review count
      {
        $sort: {
          averageRating: -1,
          totalReviews: -1
        }
      },
      
      // Stage 3: Limit results
      { $limit: limit },
      
      // Stage 4: Project only needed fields
      {
        $project: {
          name: 1,
          brand: 1,
          category: 1,
          price: 1,
          averageRating: 1,
          totalReviews: 1,
          mainImage: 1,
          soldCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: topRated.length,
      data: topRated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top-rated products',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get best-selling products
// @route   GET /api/stats/best-sellers
// @access  Public
// DEMONSTRATES: Aggregation Pipeline - complex sorting
// ===============================================
const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    // Build match stage
    let matchStage = { isActive: true };
    if (category) {
      matchStage.category = category;
    }

    // ADVANCED AGGREGATION PIPELINE
    const bestSellers = await Product.aggregate([
      // Stage 1: Match criteria
      { $match: matchStage },
      
      // Stage 2: Sort by sold count
      { $sort: { soldCount: -1, averageRating: -1 } },
      
      // Stage 3: Limit results
      { $limit: limit },
      
      // Stage 4: Add computed fields
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: ['$soldCount', 0.7] },
              { $multiply: ['$averageRating', '$totalReviews', 0.3] }
            ]
          }
        }
      },
      
      // Stage 5: Project fields
      {
        $project: {
          name: 1,
          brand: 1,
          category: 1,
          price: 1,
          soldCount: 1,
          averageRating: 1,
          totalReviews: 1,
          mainImage: 1,
          popularityScore: { $round: ['$popularityScore', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: bestSellers.length,
      data: bestSellers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get sales trends over time
// @route   GET /api/stats/sales-trends
// @access  Private/Admin
// DEMONSTRATES: Aggregation Pipeline - $dateToString, time-based grouping
// ===============================================
const getSalesTrends = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Determine grouping format based on period
    let dateFormat;
    switch (period) {
      case 'hourly':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // ADVANCED AGGREGATION PIPELINE
    const trends = await Order.aggregate([
      // Stage 1: Match orders in date range
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      
      // Stage 2: Group by time period
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItems: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      },
      
      // Stage 3: Sort by date
      { $sort: { _id: 1 } },
      
      // Stage 4: Project formatted results
      {
        $project: {
          date: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          totalItems: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      period: period,
      days: parseInt(days),
      dataPoints: trends.length,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales trends',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get inventory report
// @route   GET /api/stats/inventory
// @access  Private/Admin
// DEMONSTRATES: Aggregation Pipeline - complex calculations
// ===============================================
const getInventoryReport = async (req, res) => {
  try {
    // Get low stock products
    const lowStock = await Product.find({
      isActive: true,
      totalStock: { $lte: 10, $gt: 0 }
    })
      .select('name brand category totalStock')
      .sort({ totalStock: 1 })
      .limit(20);

    // Get out of stock products
    const outOfStock = await Product.countDocuments({
      isActive: true,
      totalStock: 0
    });

    // ADVANCED AGGREGATION: Stock value by category
    const stockValueByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$totalStock' },
          totalValue: {
            $sum: { $multiply: ['$price', '$totalStock'] }
          },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { totalValue: -1 } },
      {
        $project: {
          category: '$_id',
          totalProducts: 1,
          totalStock: 1,
          totalValue: { $round: ['$totalValue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] },
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        lowStockProducts: lowStock,
        outOfStockCount: outOfStock,
        stockValueByCategory: stockValueByCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory report',
      error: error.message
    });
  }
};

// ===============================================
// @desc    Get customer insights
// @route   GET /api/stats/customers
// @access  Private/Admin
// DEMONSTRATES: Aggregation Pipeline - $lookup, complex joins
// ===============================================
const getCustomerInsights = async (req, res) => {
  try {
    // ADVANCED AGGREGATION: Top customers by revenue
    const topCustomers = await Order.aggregate([
      // Stage 1: Match completed orders
      {
        $match: {
          orderStatus: { $in: ['Delivered', 'Shipped'] }
        }
      },
      
      // Stage 2: Group by user
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
          userEmail: { $first: '$userEmail' },
          userName: { $first: '$userName' }
        }
      },
      
      // Stage 3: Sort by total spent
      { $sort: { totalSpent: -1 } },
      
      // Stage 4: Limit to top 10
      { $limit: 10 },
      
      // Stage 5: Project formatted results
      {
        $project: {
          userId: '$_id',
          userName: 1,
          userEmail: 1,
          totalSpent: { $round: ['$totalSpent', 2] },
          orderCount: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          lastOrderDate: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        topCustomers: topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer insights',
      error: error.message
    });
  }
};

module.exports = {
  getRevenueStats,
  getTopRatedProducts,
  getBestSellers,
  getSalesTrends,
  getInventoryReport,
  getCustomerInsights
};
