const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Dealer = require('../models/Dealer');
const FinanceTransaction = require('../models/FinanceTransaction');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   GET /api/financial-reports/profit-loss/:shopId
// @desc    Get profit/loss statement
// @access  Private
router.get('/profit-loss/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view financial reports for this shop' });
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

    // Get all data needed for P&L
    const [salesData, expensesData, previousData] = await Promise.all([
      // Current period sales
      Sale.aggregate([
        { $match: { shopId, saleDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$profit' },
            salesCount: { $sum: 1 },
            totalItemsSold: { $sum: { $size: '$items' } }
          }
        }
      ]),
      // Current period expenses
      Expense.aggregate([
        { $match: { shopId, expenseDate: { $gte: startDate, $lte: endDate }, status: 'approved' } },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      // Previous period for comparison
      Sale.aggregate([
        {
          $match: {
            shopId,
            saleDate: {
              $gte: new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1),
              $lte: new Date(startDate.getFullYear(), startDate.getMonth(), 0, 23, 59, 59, 999)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$profit' }
          }
        }
      ])
    ]);

    const currentSales = salesData[0] || { totalRevenue: 0, totalProfit: 0, salesCount: 0, totalItemsSold: 0 };
    const previousSales = previousData[0] || { totalRevenue: 0, totalProfit: 0 };
    const totalExpenses = expensesData.reduce((sum, e) => sum + e.totalAmount, 0);

    // Calculate P&L
    const grossProfit = currentSales.totalProfit;
    const operatingExpenses = totalExpenses;
    const netProfit = grossProfit - operatingExpenses;

    // Calculate growth
    const revenueGrowth = previousSales.totalRevenue > 0
      ? ((currentSales.totalRevenue - previousSales.totalRevenue) / previousSales.totalRevenue * 100).toFixed(1)
      : 0;
    const profitGrowth = previousSales.totalProfit > 0
      ? ((currentSales.totalProfit - previousSales.totalProfit) / previousSales.totalProfit * 100).toFixed(1)
      : 0;

    // Build P&L statement
    const profitLossStatement = {
      revenue: {
        totalRevenue: currentSales.totalRevenue,
        grossProfit,
        grossMargin: currentSales.totalRevenue > 0 ? ((grossProfit / currentSales.totalRevenue) * 100).toFixed(1) : 0
      },
      expenses: {
        totalExpenses,
        expenseBreakdown: expensesData.map(e => ({
          category: e._id,
          amount: e.totalAmount,
          percentage: totalExpenses > 0 ? ((e.totalAmount / totalExpenses) * 100).toFixed(1) : 0
        }))
      },
      profit: {
        operatingProfit: grossProfit - totalExpenses,
        netProfit,
        profitMargin: currentSales.totalRevenue > 0 ? ((netProfit / currentSales.totalRevenue) * 100).toFixed(1) : 0
      },
      sales: {
        totalSales: currentSales.salesCount,
        averageOrderValue: currentSales.salesCount > 0
          ? (currentSales.totalRevenue / currentSales.salesCount).toFixed(0)
          : 0,
        totalItemsSold: currentSales.totalItemsSold
      },
      growth: {
        revenueGrowth: parseFloat(revenueGrowth),
        profitGrowth: parseFloat(profitGrowth)
      }
    };

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      profitLossStatement,
      comparison: {
        previousPeriodRevenue: previousSales.totalRevenue,
        previousPeriodProfit: previousSales.totalProfit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/financial/expense-breakdown/:shopId
// @desc    Get detailed expense breakdown
// @access  Private
router.get('/expense-breakdown/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view financial reports for this shop' });
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

    const expenses = await Expense.find({
      shopId,
      expenseDate: { $gte: startDate, $lte: endDate },
      status: 'approved'
    })
      .sort({ expenseDate: -1 });

    // Group by category
    const expenseByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          totalAmount: 0,
          count: 0,
          expenses: []
        };
      }
      acc[category].totalAmount += expense.amount;
      acc[category].count += 1;
      acc[category].expenses.push({
        title: expense.title,
        amount: expense.amount,
        date: expense.expenseDate,
        vendor: expense.vendorName
      });
      return acc;
    }, {});

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Find top expense categories
    const topCategories = Object.values(expenseByCategory)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      summary: {
        totalExpenses: expenses.length,
        totalAmount,
        averageExpense: expenses.length > 0 ? (totalAmount / expenses.length).toFixed(0) : 0
      },
      expenseByCategory: Object.values(expenseByCategory).map(cat => ({
        ...cat,
        percentage: totalAmount > 0 ? ((cat.totalAmount / totalAmount) * 100).toFixed(1) : 0
      })),
      topCategories,
      recentExpenses: expenses.slice(0, 10).map(e => ({
        id: e._id,
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.expenseDate,
        vendor: e.vendorName
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/financial/dealer-summary/:shopId
// @desc    Get dealer payment summary
// @access  Private
router.get('/dealer-summary/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view financial reports for this shop' });
    }

    const dealers = await Dealer.find({ shopId, status: 'active' })
      .sort({ currentBalance: -1 });

    const dealerSummaries = await Promise.all(dealers.map(async (dealer) => {
      const transactions = await FinanceTransaction.find({
        dealerId: dealer._id,
        type: 'credit',
        status: { $in: ['pending', 'overdue'] }
      })
        .sort({ dueDate: 1 });

      const totalPending = transactions.reduce((sum, t) => sum + t.amount, 0);
      const overdueTransactions = transactions.filter(t => t.status === 'overdue');
      const totalOverdue = overdueTransactions.reduce((sum, t) => sum + t.amount, 0);

      const lastTransaction = await FinanceTransaction.findOne({
        dealerId: dealer._id
      }).sort({ createdAt: -1 });

      return {
        dealerId: dealer._id,
        name: dealer.name,
        phone: dealer.phone,
        currentBalance: dealer.currentBalance,
        creditLimit: dealer.creditLimit,
        availableCredit: dealer.availableCredit,
        creditUtilization: dealer.creditLimit > 0
          ? ((dealer.currentBalance / dealer.creditLimit) * 100).toFixed(1)
          : 0,
        pendingPayments: transactions.length,
        pendingAmount: totalPending,
        overduePayments: overdueTransactions.length,
        overdueAmount: totalOverdue,
        lastTransactionDate: lastTransaction ? lastTransaction.createdAt : null,
        status: dealer.currentBalance > 0 ? 'has_balance' : 'clear',
        riskLevel: dealer.currentBalance > 0
          ? (dealer.currentBalance >= dealer.creditLimit ? 'high' : 'medium')
          : 'low'
      };
    }));

    // Calculate totals
    const totals = dealerSummaries.reduce((acc, dealer) => ({
      totalBalance: acc.totalBalance + dealer.currentBalance,
      totalCreditLimit: acc.totalCreditLimit + dealer.creditLimit,
      totalPending: acc.totalPending + dealer.pendingAmount,
      totalOverdue: acc.totalOverdue + dealer.overdueAmount
    }), { totalBalance: 0, totalCreditLimit: 0, totalPending: 0, totalOverdue: 0 });

    // Risk categorization
    const highRiskDealers = dealerSummaries.filter(d => d.riskLevel === 'high');
    const mediumRiskDealers = dealerSummaries.filter(d => d.riskLevel === 'medium');
    const lowRiskDealers = dealerSummaries.filter(d => d.riskLevel === 'low');

    res.json({
      shopId,
      summary: {
        totalDealers: dealerSummaries.length,
        totalBalance: totals.totalBalance,
        totalCreditLimit: totals.totalCreditLimit,
        totalPending: totals.totalPending,
        totalOverdue: totals.totalOverdue,
        creditUtilization: totals.totalCreditLimit > 0
          ? ((totals.totalBalance / totals.totalCreditLimit) * 100).toFixed(1)
          : 0
      },
      riskAnalysis: {
        high: highRiskDealers.length,
        medium: mediumRiskDealers.length,
        low: lowRiskDealers.length,
        highRiskDealers: highRiskDealers.map(d => ({
          dealerId: d.dealerId,
          name: d.name,
          overdueAmount: d.overdueAmount,
          pendingPayments: d.overduePayments
        }))
      },
      dealers: dealerSummaries.sort((a, b) => b.currentBalance - a.currentBalance)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
