const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Dealer = require('../models/Dealer');
const FinanceTransaction = require('../models/FinanceTransaction');
const Employee = require('../models/Employee');
const Expense = require('../models/Expense');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/best-selling-products/:shopId
// @desc    Get best selling products analysis
// @access  Private
router.get('/best-selling-products/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '30days', limit = 10 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this shop' });
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

    const bestSellingProducts = await Sale.aggregate([
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
            sku: '$items.sku',
            category: '$items.category'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          salesCount: { $sum: 1 },
          averagePrice: { $avg: '$items.unitPrice' },
          profit: { $sum: '$items.profit' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const totalRevenue = bestSellingProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalQuantity = bestSellingProducts.reduce((sum, p) => sum + p.totalQuantity, 0);

    res.json({
      shopId,
      period,
      dateRange: { startDate, endDate },
      summary: {
        totalProducts: bestSellingProducts.length,
        totalRevenue,
        totalQuantity,
        averagePrice: totalRevenue > 0 ? (totalRevenue / totalQuantity).toFixed(0) : 0
      },
      products: bestSellingProducts.map(p => ({
        productId: p._id.productId,
        productName: p._id.productName,
        sku: p._id.sku,
        category: p._id.category,
        totalQuantity: p.totalQuantity,
        totalRevenue: p.totalRevenue,
        salesCount: p.salesCount,
        averagePrice: p.averagePrice.toFixed(0),
        profit: p.profit,
        profitMargin: p.totalRevenue > 0 ? ((p.profit / p.totalRevenue) * 100).toFixed(1) : 0,
        revenueShare: totalRevenue > 0 ? ((p.totalRevenue / totalRevenue) * 100).toFixed(1) : 0
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/slow-moving-products/:shopId
// @desc    Get slow moving/underperforming products
// @access  Private
router.get('/slow-moving-products/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '30days', threshold = 5 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this shop' });
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

    // Get products with sales data
    const productSales = await Sale.aggregate([
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
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          category: { $first: '$items.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      }
    ]);

    // Get current stock levels
    const stockData = await Stock.find({ shopId })
      .populate('productId', 'name sku category price costPrice minStockLevel');

    // Combine data and identify slow moving products
    const slowMovingProducts = stockData
      .filter(stock => {
        const salesData = productSales.find(p => p._id.toString() === stock.productId._id.toString());
        const salesQty = salesData ? salesData.totalQuantity : 0;
        return salesQty <= parseInt(threshold);
      })
      .map(stock => {
        const salesData = productSales.find(p => p._id.toString() === stock.productId._id.toString());
        const salesQty = salesData ? salesData.totalQuantity : 0;
        const stockValue = stock.quantity * (stock.productId.costPrice || 0);
        const daysInStock = Math.floor((new Date() - new Date(stock.lastUpdated)) / (1000 * 60 * 60 * 24));

        return {
          productId: stock.productId._id,
          productName: stock.productId.name,
          sku: stock.productId.sku,
          category: stock.productId.category,
          currentStock: stock.quantity,
          salesInPeriod: salesQty,
          salesRate: salesQty > 0 ? (stock.quantity / salesQty).toFixed(1) : 'N/A',
          stockValue: stockValue,
          estimatedDaysUntilStockout: salesQty > 0 ? Math.floor(stock.quantity / (salesQty / 30)) : null,
          daysInStock: daysInStock,
          lastUpdated: stock.lastUpdated,
          minStockLevel: stock.productId.minStockLevel || 10,
          isBelowMinLevel: stock.quantity < (stock.productId.minStockLevel || 10)
        };
      })
      .sort((a, b) => a.salesInPeriod - b.salesInPeriod);

    // Calculate summary
    const totalSlowMovingValue = slowMovingProducts.reduce((sum, p) => sum + p.stockValue, 0);
    const totalStockValue = stockData.reduce((sum, s) => {
      return sum + (s.quantity * (s.productId.costPrice || 0));
    }, 0);

    res.json({
      shopId,
      period,
      threshold: parseInt(threshold),
      dateRange: { startDate, endDate },
      summary: {
        totalProducts: stockData.length,
        slowMovingCount: slowMovingProducts.length,
        slowMovingPercentage: stockData.length > 0
          ? ((slowMovingProducts.length / stockData.length) * 100).toFixed(1)
          : 0,
        totalSlowMovingValue,
        totalStockValue,
        valueTiedUp: totalSlowMovingValue
      },
      products: slowMovingProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/dealer-payment-history/:shopId
// @desc    Get dealer payment history and analytics
// @access  Private
router.get('/dealer-payment-history/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '90days', limit = 20 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === '180days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 180);
    } else if (period === '1year') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    }

    const endDate = new Date();

    const dealers = await Dealer.find({ shopId, status: 'active' });

    const dealerAnalytics = await Promise.all(dealers.map(async (dealer) => {
      // Get all transactions for this dealer
      const allTransactions = await FinanceTransaction.find({
        dealerId: dealer._id,
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: 1 });

      // Get current pending/overdue
      const pendingTransactions = await FinanceTransaction.find({
        dealerId: dealer._id,
        type: 'credit',
        status: { $in: ['pending', 'overdue'] }
      });

      const totalCredit = allTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalPayments = allTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
      const overdueAmount = pendingTransactions
        .filter(t => t.status === 'overdue')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate payment behavior
      const creditTransactions = allTransactions.filter(t => t.type === 'credit');
      const paymentTransactions = allTransactions.filter(t => t.type === 'debit');

      // Average payment delay (in days)
      let averagePaymentDelay = 0;
      if (paymentTransactions.length > 0) {
        const totalDelay = paymentTransactions.reduce((sum, t) => {
          if (t.dueDate) {
            const delayInDays = Math.floor((new Date(t.createdAt) - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, delayInDays);
          }
          return sum;
        }, 0);
        averagePaymentDelay = totalDelay / paymentTransactions.length;
      }

      // Payment reliability (on-time payments / total payments)
      const onTimePayments = paymentTransactions.filter(t => {
        if (t.dueDate) {
          return new Date(t.createdAt) <= new Date(t.dueDate);
        }
        return true;
      }).length;

      const paymentReliability = paymentTransactions.length > 0
        ? (onTimePayments / paymentTransactions.length) * 100
        : 100;

      return {
        dealerId: dealer._id,
        name: dealer.name,
        phone: dealer.phone,
        email: dealer.email,
        currentBalance: dealer.currentBalance,
        creditLimit: dealer.creditLimit,
        availableCredit: dealer.availableCredit,
        paymentBehavior: {
          totalCreditPeriod: totalCredit,
          totalPaymentsPeriod: totalPayments,
          pendingAmount,
          overdueAmount,
          paymentReliability: paymentReliability.toFixed(1),
          averagePaymentDelay: averagePaymentDelay.toFixed(0),
          creditUtilization: dealer.creditLimit > 0
            ? ((dealer.currentBalance / dealer.creditLimit) * 100).toFixed(1)
            : 0
        },
        riskLevel: overdueAmount > 0 ? 'high'
          : pendingAmount > (dealer.creditLimit * 0.7) ? 'medium'
          : 'low',
        transactionCount: {
          credits: creditTransactions.length,
          payments: paymentTransactions.length
        },
        lastTransaction: allTransactions.length > 0 ? allTransactions[allTransactions.length - 1].createdAt : null
      };
    }));

    // Sort by payment reliability and balance
    const sortedDealers = dealerAnalytics.sort((a, b) => {
      if (a.paymentBehavior.paymentReliability !== b.paymentBehavior.paymentReliability) {
        return b.paymentBehavior.paymentReliability - a.paymentBehavior.paymentReliability;
      }
      return a.currentBalance - b.currentBalance;
    });

    // Calculate summary
    const summary = {
      totalDealers: dealerAnalytics.length,
      highRiskDealers: dealerAnalytics.filter(d => d.riskLevel === 'high').length,
      mediumRiskDealers: dealerAnalytics.filter(d => d.riskLevel === 'medium').length,
      lowRiskDealers: dealerAnalytics.filter(d => d.riskLevel === 'low').length,
      totalOutstandingBalance: dealerAnalytics.reduce((sum, d) => sum + d.currentBalance, 0),
      totalPendingPayments: dealerAnalytics.reduce((sum, d) => sum + d.paymentBehavior.pendingAmount, 0),
      totalOverduePayments: dealerAnalytics.reduce((sum, d) => sum + d.paymentBehavior.overdueAmount, 0),
      averagePaymentReliability: dealerAnalytics.length > 0
        ? (dealerAnalytics.reduce((sum, d) => sum + parseFloat(d.paymentBehavior.paymentReliability), 0) / dealerAnalytics.length).toFixed(1)
        : 0
    };

    res.json({
      shopId,
      period,
      dateRange: { startDate, endDate },
      summary,
      dealers: sortedDealers.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/shop-profitability/:shopId
// @desc    Get detailed shop profitability analysis
// @access  Private (Owner only)
router.get('/shop-profitability/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this shop' });
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
    } else if (period === 'year') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Get shop details
    const shop = await Shop.findById(shopId);

    // Get financial data
    const [salesData, expenseData, employeeData] = await Promise.all([
      // Sales data
      Sale.aggregate([
        { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$profit' },
            totalSales: { $sum: 1 },
            averageOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]),
      // Expense data
      Expense.aggregate([
        { $match: { shopId, expenseDate: { $gte: startDate, $lte: endDate }, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' }
          }
        }
      ]),
      // Employee cost data
      Employee.find({ shopId, status: 'active' })
    ]);

    const sales = salesData[0] || { totalRevenue: 0, totalProfit: 0, totalSales: 0, averageOrderValue: 0 };
    const expenses = expenseData[0] || { totalExpenses: 0 };

    // Calculate employee costs
    const employeeCosts = employeeData.reduce((sum, emp) => {
      return sum + (emp.salary || 0);
    }, 0);

    const commissionCosts = await Sale.aggregate([
      { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      { $group: { _id: null, totalCommission: { $sum: '$commissionEarned' } } }
    ]);
    const totalCommission = commissionCosts[0]?.totalCommission || 0;

    // Calculate profitability
    const grossProfit = sales.totalProfit;
    const operatingExpenses = expenses.totalExpenses + employeeCosts + totalCommission;
    const netProfit = grossProfit - operatingExpenses;

    const profitMargin = sales.totalRevenue > 0
      ? ((netProfit / sales.totalRevenue) * 100).toFixed(1)
      : 0;

    const expenseRatio = sales.totalRevenue > 0
      ? ((operatingExpenses / sales.totalRevenue) * 100).toFixed(1)
      : 0;

    // Get previous period data for comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const previousData = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: previousStartDate, $lte: previousEndDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          netProfit: { $sum: '$profit' }
        }
      }
    ]);

    const previousPeriod = previousData[0] || { totalRevenue: 0, netProfit: 0 };

    const revenueGrowth = previousPeriod.totalRevenue > 0
      ? ((sales.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue * 100).toFixed(1)
      : 0;

    const profitGrowth = previousPeriod.netProfit > 0
      ? ((netProfit - previousPeriod.netProfit) / previousPeriod.netProfit * 100).toFixed(1)
      : 0;

    res.json({
      shopId,
      shop: {
        name: shop.name,
        location: shop.location
      },
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      profitability: {
        revenue: {
          totalRevenue: sales.totalRevenue,
          previousPeriodRevenue: previousPeriod.totalRevenue,
          growth: parseFloat(revenueGrowth)
        },
        costs: {
          employeeCosts: employeeCosts,
          commissionCosts: totalCommission,
          operatingExpenses: expenses.totalExpenses,
          totalCosts: operatingExpenses,
          costRatio: parseFloat(expenseRatio)
        },
        profit: {
          grossProfit,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          previousPeriodProfit: previousPeriod.netProfit,
          growth: parseFloat(profitGrowth)
        },
        sales: {
          totalSales: sales.totalSales,
          averageOrderValue: sales.averageOrderValue
        }
      },
      health: {
        status: netProfit > 0 ? 'profitable' : 'loss',
        efficiency: sales.totalRevenue > 0 ? ((netProfit / sales.totalRevenue) * 100).toFixed(1) : 0,
        recommendation: netProfit > 0
          ? 'Shop is performing well. Consider expanding inventory or marketing.'
          : 'Shop is operating at loss. Review expenses and pricing strategy.'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/trend-analysis/:shopId
// @desc    Get comprehensive trend analysis
// @access  Private
router.get('/trend-analysis/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '90days', metrics = 'all' } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === '180days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 180);
    } else if (period === '1year') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    }

    const endDate = new Date();

    // Get trend data by day
    const dailyTrends = await Sale.aggregate([
      {
        $match: {
          shopId,
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          date: { $first: '$saleDate' },
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate trends and growth
    const trendsWithGrowth = dailyTrends.map((trend, index) => {
      let revenueGrowth = 0;
      let profitGrowth = 0;

      if (index > 0) {
        const prevTrend = dailyTrends[index - 1];
        revenueGrowth = prevTrend.totalRevenue > 0
          ? ((trend.totalRevenue - prevTrend.totalRevenue) / prevTrend.totalRevenue * 100).toFixed(1)
          : 0;
        profitGrowth = prevTrend.totalProfit > 0
          ? ((trend.totalProfit - prevTrend.totalProfit) / prevTrend.totalProfit * 100).toFixed(1)
          : 0;
      }

      return {
        date: trend._id,
        totalRevenue: trend.totalRevenue,
        totalProfit: trend.totalProfit,
        totalSales: trend.totalSales,
        averageOrderValue: trend.averageOrderValue,
        revenueGrowth: parseFloat(revenueGrowth),
        profitGrowth: parseFloat(profitGrowth)
      };
    });

    // Calculate summary statistics
    const totalRevenue = trendsWithGrowth.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalProfit = trendsWithGrowth.reduce((sum, t) => sum + t.totalProfit, 0);
    const totalSales = trendsWithGrowth.reduce((sum, t) => sum + t.totalSales, 0);

    const averageDailyRevenue = trendsWithGrowth.length > 0
      ? totalRevenue / trendsWithGrowth.length
      : 0;

    const averageDailyProfit = trendsWithGrowth.length > 0
      ? totalProfit / trendsWithGrowth.length
      : 0;

    // Find best and worst days
    const bestDay = trendsWithGrowth.length > 0
      ? trendsWithGrowth.reduce((best, current) =>
          current.totalRevenue > best.totalRevenue ? current : best)
      : null;

    const worstDay = trendsWithGrowth.length > 0
      ? trendsWithGrowth.reduce((worst, current) =>
          current.totalRevenue < worst.totalRevenue ? current : worst)
      : null;

    // Calculate overall growth rate
    const overallGrowthRate = trendsWithGrowth.length > 1
      ? ((trendsWithGrowth[trendsWithGrowth.length - 1].totalRevenue - trendsWithGrowth[0].totalRevenue) /
         trendsWithGrowth[0].totalRevenue * 100).toFixed(1)
      : 0;

    // Calculate trend direction
    let trendDirection = 'stable';
    let averageGrowth = 0;

    if (trendsWithGrowth.length > 1) {
      const growthRates = trendsWithGrowth.slice(1).map(t => t.revenueGrowth);
      averageGrowth = growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length;

      if (averageGrowth > 2) {
        trendDirection = 'upward';
      } else if (averageGrowth < -2) {
        trendDirection = 'downward';
      }
    }

    res.json({
      shopId,
      period,
      dateRange: { startDate, endDate },
      summary: {
        totalRevenue,
        totalProfit,
        totalSales,
        averageDailyRevenue: averageDailyRevenue.toFixed(0),
        averageDailyProfit: averageDailyProfit.toFixed(0),
        overallGrowthRate: parseFloat(overallGrowthRate),
        averageGrowthRate: averageGrowth.toFixed(1)
      },
      trend: {
        direction: trendDirection,
        averageGrowth: averageGrowth.toFixed(1),
        bestDay: bestDay ? {
          date: bestDay.date,
          revenue: bestDay.totalRevenue,
          profit: bestDay.totalProfit
        } : null,
        worstDay: worstDay ? {
          date: worstDay.date,
          revenue: worstDay.totalRevenue,
          profit: worstDay.totalProfit
        } : null
      },
      dailyTrends: trendsWithGrowth
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;