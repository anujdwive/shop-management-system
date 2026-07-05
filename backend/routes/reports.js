const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports/sales/trend/:shopId
// @desc    Get sales trend analysis
// @access  Private
router.get('/sales/trend/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '30days', groupBy = 'day' } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales reports for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    let dateFormat;

    if (period === '7days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = '%Y-%m-%d';
    } else if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = '%Y-%m-%d';
    } else if (period === '90days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      dateFormat = '%Y-%m-%d';
    } else if (period === '6months') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      dateFormat = '%Y-%m';
    } else if (period === '1year') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = '%Y-%m';
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = '%Y-%m-%d';
    }

    endDate = new Date();

    // Build aggregation pipeline based on groupBy
    let groupByFormat;
    if (groupBy === 'day') {
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
    } else if (groupBy === 'week') {
      groupByFormat = { $dateToString: { format: '%Y-W%V', date: '$saleDate' } };
    } else if (groupBy === 'month') {
      groupByFormat = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
    } else {
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
    }

    const trendData = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupByFormat,
          date: { $first: '$saleDate' },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          totalItems: { $sum: { $size: '$items' } },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate growth rate
    const growthRate = [];
    if (trendData.length > 1) {
      for (let i = 1; i < trendData.length; i++) {
        const currentRevenue = trendData[i].totalRevenue;
        const previousRevenue = trendData[i - 1].totalRevenue;
        const rate = previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
          : 0;
        growthRate.push(parseFloat(rate));
      }
      growthRate.unshift(0); // No growth for first period
    }

    // Find best and worst performing periods
    let bestPeriod = trendData.length > 0 ? trendData[0] : null;
    let worstPeriod = trendData.length > 0 ? trendData[0] : null;

    if (trendData.length > 0) {
      bestPeriod = trendData.reduce((best, current) =>
        current.totalRevenue > best.totalRevenue ? current : best
      );
      worstPeriod = trendData.reduce((worst, current) =>
        current.totalRevenue < worst.totalRevenue ? current : worst
      );
    }

    res.json({
      shopId,
      period,
      groupBy,
      dateRange: { startDate, endDate },
      summary: {
        totalSales: trendData.reduce((sum, t) => sum + t.totalSales, 0),
        totalRevenue: trendData.reduce((sum, t) => sum + t.totalRevenue, 0),
        totalProfit: trendData.reduce((sum, t) => sum + t.totalProfit, 0),
        averageDailySales: trendData.length > 0
          ? (trendData.reduce((sum, t) => sum + t.totalSales, 0) / trendData.length).toFixed(0)
          : 0,
        averageDailyRevenue: trendData.length > 0
          ? (trendData.reduce((sum, t) => sum + t.totalRevenue, 0) / trendData.length).toFixed(0)
          : 0
      },
      trend: trendData.map((t, index) => ({
        ...t,
        growthRate: growthRate[index] || 0
      })),
      bestPeriod,
      worstPeriod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/sales/product-performance/:shopId
// @desc    Get product performance report
// @access  Private
router.get('/sales/product-performance/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '30days', limit = 20 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales reports for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    if (period === '7days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = new Date();

    const productPerformance = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            productName: '$items.productName',
            sku: '$items.sku'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          salesCount: { $sum: 1 },
          averagePrice: { $avg: '$items.unitPrice' },
          profit: { $sum: { $multiply: ['$items.quantity', { $subtract: ['$items.unitPrice', { $ifNull: ['$items.costPrice', 0] }] } ] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate overall stats
    const totalProducts = productPerformance.length;
    const totalRevenue = productPerformance.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalQuantity = productPerformance.reduce((sum, p) => sum + p.totalQuantity, 0);
    const totalProfit = productPerformance.reduce((sum, p) => sum + p.profit, 0);

    // Categorize products
    const topPerformers = productPerformance.slice(0, 5);
    const slowMoving = productPerformance
      .filter(p => p.totalQuantity <= 5)
      .slice(0, 5);

    res.json({
      shopId,
      period,
      dateRange: { startDate, endDate },
      summary: {
        totalProducts,
        totalRevenue,
        totalQuantity,
        totalProfit,
        averageOrderValue: totalRevenue > 0 ? (totalRevenue / productPerformance.reduce((sum, p) => sum + p.salesCount, 0)).toFixed(0) : 0
      },
      topPerformers,
      slowMoving: slowMoving.length > 0 ? slowMoving : null,
      allProducts: productPerformance.map(p => ({
        ...p,
        profitMargin: p.totalRevenue > 0 ? ((p.profit / p.totalRevenue) * 100).toFixed(1) : 0,
        revenueShare: totalRevenue > 0 ? ((p.totalRevenue / totalRevenue) * 100).toFixed(1) : 0
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/sales/employee-performance/:shopId
// @desc    Get employee sales performance report
// @access  Private
router.get('/sales/employee-performance/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales reports for this shop' });
    }

    // Calculate date range
    let startDate, endDate;

    if (period === 'month') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = new Date().getMonth();
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
    } else {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const employeePerformance = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$employeeId',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          totalCommission: { $sum: '$commissionEarned' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: 'userId',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          _id: 1,
          employeeId: '$_id',
          employeeName: '$employee.userId.name',
          employeeId: '$employee.employeeId',
          designation: '$employee.designation',
          totalSales: 1,
          totalRevenue: 1,
          totalProfit: 1,
          totalCommission: 1,
          averageOrderValue: 1,
          salesTarget: '$employee.salesTarget',
          commissionRate: '$employee.commissionRate'
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate target achievement
    const performanceWithTargets = employeePerformance.map(emp => ({
      ...emp,
      targetAchievement: emp.salesTarget > 0
        ? ((emp.totalRevenue / emp.salesTarget) * 100).toFixed(1)
        : null,
      isTopPerformer: emp.totalRevenue > 0
    }));

    // Find top performer
    const topPerformer = performanceWithTargets.length > 0
      ? performanceWithTargets[0]
      : null;

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : null,
      dateRange: { startDate, endDate },
      summary: {
        totalEmployees: performanceWithTargets.length,
        totalRevenue: performanceWithTargets.reduce((sum, e) => sum + e.totalRevenue, 0),
        totalProfit: performanceWithTargets.reduce((sum, e) => sum + e.totalProfit, 0),
        totalCommission: performanceWithTargets.reduce((sum, e) => sum + e.totalCommission, 0),
        averageRevenuePerEmployee: performanceWithTargets.length > 0
          ? (performanceWithTargets.reduce((sum, e) => sum + e.totalRevenue, 0) / performanceWithTargets.length).toFixed(0)
          : 0
      },
      employees: performanceWithTargets,
      topPerformer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/sales/payment-methods/:shopId
// @desc    Get sales by payment methods
// @access  Private
router.get('/sales/payment-methods/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month' } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales reports for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalAmount = paymentMethods.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({
      shopId,
      period,
      dateRange: { startDate, endDate },
      paymentMethods: paymentMethods.map(p => ({
        method: p._id,
        count: p.count,
        amount: p.totalAmount,
        percentage: totalAmount > 0 ? ((p.totalAmount / totalAmount) * 100).toFixed(1) : 0
      })),
      totalAmount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
