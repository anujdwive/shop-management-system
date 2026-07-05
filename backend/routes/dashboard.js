const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Dealer = require('../models/Dealer');
const FinanceTransaction = require('../models/FinanceTransaction');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/shop/:shopId
// @desc    Get shop overview and quick stats
// @access  Private
router.get('/shop/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'today' } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view dashboard for this shop' });
    }

    // Calculate date range based on period
    let startDate, endDate;
    const now = new Date();

    if (period === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    // Fetch all data in parallel
    const [
      shop,
      totalProducts,
      lowStockCount,
      todaySales,
      totalRevenue,
      pendingPaymentsCount,
      overduePaymentsCount,
      upcomingMeetingsCount,
      pendingRemindersCount,
      totalEmployees,
      presentTodayCount,
      totalExpenses,
      totalProfit
    ] = await Promise.all([
      // Shop details
      Shop.findById(shopId),

      // Product stats
      Product.countDocuments({ status: 'active' }),
      Stock.countDocuments({ shopId, quantity: { $lt: 10 } }),

      // Sales stats
      Sale.countDocuments({
        shopId,
        saleDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }),
      Sale.aggregate([
        { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),

      // Payment stats
      FinanceTransaction.countDocuments({
        shopId,
        type: 'credit',
        status: 'pending'
      }),
      FinanceTransaction.countDocuments({
        shopId,
        type: 'credit',
        status: 'overdue'
      }),

      // Meeting stats
      Meeting.countDocuments({
        shopId,
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['scheduled', 'confirmed'] }
      }),

      // Reminder stats
      Reminder.countDocuments({
        shopId,
        status: 'pending'
      }),

      // Employee stats
      Employee.countDocuments({ shopId, status: 'active' }),

      // Attendance stats
      Attendance.countDocuments({
        shopId,
        date: { $gte: startDate, $lte: endDate },
        status: 'present'
      }),

      // Expense stats
      Expense.aggregate([
        { $match: { shopId, expenseDate: { $gte: startDate, $lte: endDate }, status: 'approved' } },
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
      ]),

      // Profit calculation
      Sale.aggregate([
        { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        { $group: { _id: null, totalProfit: { $sum: '$profit' } } }
      ])
    ]);

    // Get top products
    const topProducts = await Sale.aggregate([
      { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Get recent activities (last 10)
    const recentSales = await Sale.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employeeId', 'name')
      .select('invoiceNumber totalAmount saleDate status');

    const recentExpenses = await Expense.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title amount expenseDate status');

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
        location: shop.location,
        businessType: shop.businessType,
        status: shop.status
      },
      period,
      dateRange: { startDate, endDate },
      overview: {
        totalProducts,
        lowStockAlerts: lowStockCount,
        todaySales: todaySales,
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        pendingPayments: pendingPaymentsCount,
        overduePayments: overduePaymentsCount,
        upcomingMeetings: upcomingMeetingsCount,
        pendingReminders: pendingRemindersCount,
        totalEmployees,
        presentToday: presentTodayCount,
        totalExpenses: totalExpenses[0]?.totalExpenses || 0,
        totalProfit: totalProfit[0]?.totalProfit || 0,
        profitMargin: totalRevenue[0]?.totalRevenue > 0
          ? ((totalProfit[0]?.totalProfit / totalRevenue[0]?.totalRevenue) * 100).toFixed(1)
          : 0
      },
      topProducts: topProducts.map(p => ({
        productId: p._id,
        name: p.name,
        totalQuantity: p.totalQuantity,
        totalRevenue: p.totalRevenue
      })),
      recentActivities: {
        sales: recentSales.map(s => ({
          type: 'sale',
          invoiceNumber: s.invoiceNumber,
          amount: s.totalAmount,
          date: s.saleDate,
          status: s.status,
          employee: s.employeeId?.name || 'N/A'
        })),
        expenses: recentExpenses.map(e => ({
          type: 'expense',
          title: e.title,
          amount: e.amount,
          date: e.expenseDate,
          status: e.status
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dashboard/shops-comparison
// @desc    Get comparison data for all shops
// @access  Private (Owner only)
router.get('/shops-comparison', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can view shops comparison' });
    }

    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, endDate;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const shops = await Shop.find({ owner: req.user._id });
    const shopIds = shops.map(s => s._id);

    const comparisons = await Promise.all(shops.map(async (shop) => {
      const [
        salesData,
        expensesData,
        profitData,
        employeeCount
      ] = await Promise.all([
        Sale.aggregate([
          { $match: { shopId: shop._id, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
          { $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount' },
              totalProfit: { $sum: '$profit' }
            }
          }
        ]),
        Expense.aggregate([
          { $match: { shopId: shop._id, expenseDate: { $gte: startDate, $lte: endDate }, status: 'approved' } },
          { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ]),
        Sale.aggregate([
          { $match: { shopId: shop._id, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
          { $group: { _id: null, totalProfit: { $sum: '$profit' } } }
        ]),
        Employee.countDocuments({ shopId: shop._id, status: 'active' })
      ]);

      return {
        shop: {
          id: shop._id,
          name: shop.name,
          location: shop.location
        },
        performance: {
          totalSales: salesData[0]?.totalSales || 0,
          totalRevenue: salesData[0]?.totalRevenue || 0,
          totalExpenses: expensesData[0]?.totalExpenses || 0,
          totalProfit: profitData[0]?.totalProfit || 0,
          profitMargin: salesData[0]?.totalRevenue > 0
            ? ((profitData[0]?.totalProfit / salesData[0]?.totalRevenue) * 100).toFixed(1)
            : 0
        },
        employees: employeeCount
      };
    }));

    // Calculate totals
    const totals = comparisons.reduce((acc, comp) => ({
      totalRevenue: acc.totalRevenue + comp.performance.totalRevenue,
      totalProfit: acc.totalProfit + comp.performance.totalProfit,
      totalExpenses: acc.totalExpenses + comp.performance.totalExpenses,
      totalSales: acc.totalSales + comp.performance.totalSales,
      totalEmployees: acc.totalEmployees + comp.employees
    }), { totalRevenue: 0, totalProfit: 0, totalExpenses: 0, totalSales: 0, totalEmployees: 0 });

    res.json({
      period,
      dateRange: { startDate, endDate },
      shops: comparisons.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue),
      totals: {
        ...totals,
        averageProfitMargin: totals.totalRevenue > 0
          ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)
          : 0,
        shopsCount: comparisons.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dashboard/quick-stats/:shopId
// @desc    Get quick stats for dashboard widgets
// @access  Private
router.get('/quick-stats/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view stats for this shop' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayStats, monthStats] = await Promise.all([
      Promise.all([
        Sale.countDocuments({ shopId, saleDate: { $gte: startOfDay, $lte: endOfDay }, status: 'completed' }),
        Sale.aggregate([
          { $match: { shopId, saleDate: { $gte: startOfDay, $lte: endOfDay }, status: 'completed' } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalProfit: { $sum: '$profit' } } }
        ]),
        Stock.countDocuments({ shopId, quantity: { $lt: 10 } }),
        FinanceTransaction.countDocuments({ shopId, type: 'credit', status: { $in: ['pending', 'overdue'] } })
      ]),
      Promise.all([
        Sale.aggregate([
          { $match: { shopId, saleDate: { $gte: startOfMonth, $lte: endOfMonth }, status: 'completed' } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalProfit: { $sum: '$profit' } } }
        ]),
        Expense.aggregate([
          { $match: { shopId, expenseDate: { $gte: startOfMonth, $lte: endOfMonth }, status: 'approved' } },
          { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ])
      ])
    ]);

    res.json({
      today: {
        sales: todayStats[0],
        revenue: todayStats[1]?.[0]?.totalRevenue || 0,
        profit: todayStats[1]?.[0]?.totalProfit || 0,
        lowStockAlerts: todayStats[2],
        pendingPayments: todayStats[3]
      },
      month: {
        revenue: monthStats[0]?.[0]?.totalRevenue || 0,
        profit: monthStats[0]?.[0]?.totalProfit || 0,
        expenses: monthStats[1]?.[0]?.totalExpenses || 0,
        netProfit: (monthStats[0]?.[0]?.totalProfit || 0) - (monthStats[1]?.[0]?.totalExpenses || 0)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
