const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');
const FinanceTransaction = require('../models/FinanceTransaction');
const { protect } = require('../middleware/auth');

// @route   POST /api/finance/transactions
// @desc    Create a new finance transaction (credit/debit)
// @access  Private (Owner/Manager)
router.post('/transactions', protect, async (req, res) => {
  try {
    const {
      dealerId,
      shopId,
      type,
      amount,
      description,
      referenceType,
      referenceNumber,
      dueDate,
      paymentMethod,
      paymentDetails,
      notes
    } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create transactions' });
    }

    // Validate shop access
    if (req.user.role === 'manager' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to create transaction for this shop' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create transaction for this shop' });
      }
    }

    // Validate dealer exists
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check if dealer belongs to the specified shop
    if (dealer.shopId.toString() !== shopId) {
      return res.status(400).json({ message: 'Dealer does not belong to this shop' });
    }

    // Validate credit limit for credit transactions
    if (type === 'credit') {
      const newBalance = dealer.currentBalance + amount;
      if (newBalance > dealer.creditLimit && dealer.creditLimit > 0) {
        return res.status(400).json({
          message: 'Transaction exceeds credit limit',
          currentBalance: dealer.currentBalance,
          creditLimit: dealer.creditLimit,
          requestedAmount: amount,
          excessAmount: newBalance - dealer.creditLimit
        });
      }
    }

    // Calculate balance after transaction
    let balanceAfter;
    if (type === 'credit') {
      balanceAfter = dealer.currentBalance + amount;
    } else {
      balanceAfter = Math.max(0, dealer.currentBalance - amount);
    }

    // Create transaction
    const transaction = await FinanceTransaction.create({
      dealerId,
      shopId,
      type,
      amount,
      balanceAfter,
      description,
      referenceType: referenceType || 'other',
      referenceNumber,
      dueDate: type === 'credit' ? dueDate : undefined,
      paymentMethod: type === 'debit' ? paymentMethod : undefined,
      paymentDetails: type === 'debit' ? paymentDetails : undefined,
      createdBy: req.user._id,
      status: type === 'debit' ? 'paid' : 'pending',
      notes
    });

    // Update dealer balance
    await dealer.updateBalance(amount, type);

    // Populate and return
    await transaction.populate([
      { path: 'dealerId', select: 'name phone email' },
      { path: 'shopId', select: 'name location' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: `${type === 'credit' ? 'Credit' : 'Payment'} recorded successfully`,
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/transactions
// @desc    Get all finance transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const { dealerId, shopId, type, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get transactions for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by dealer
    if (dealerId) {
      query.dealerId = dealerId;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      FinanceTransaction.find(query)
        .populate('dealerId', 'name phone email')
        .populate('shopId', 'name location')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FinanceTransaction.countDocuments(query)
    ]);

    res.json({
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/transactions/:id
// @desc    Get single finance transaction
// @access  Private
router.get('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await FinanceTransaction.findById(req.params.id)
      .populate('dealerId', 'name phone email address')
      .populate('shopId', 'name location')
      .populate('createdBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(transaction.shopId._id)) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/transactions/dealer/:dealerId
// @desc    Get transaction history for a specific dealer
// @access  Private
router.get('/transactions/dealer/:dealerId', protect, async (req, res) => {
  try {
    const { type, status, limit = 50 } = req.query;

    const dealer = await Dealer.findById(req.params.dealerId);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(dealer.shopId)) {
      return res.status(403).json({ message: 'Not authorized to view transactions for this dealer' });
    }

    let query = { dealerId: req.params.dealerId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const transactions = await FinanceTransaction.find(query)
      .populate('shopId', 'name location')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      dealer: {
        id: dealer._id,
        name: dealer.name,
        phone: dealer.phone,
        currentBalance: dealer.currentBalance,
        creditLimit: dealer.creditLimit
      },
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/finance/transactions/:id
// @desc    Update finance transaction
// @access  Private (Owner/Manager)
router.put('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await FinanceTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update transactions' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(transaction.shopId)) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: transaction.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this transaction' });
      }
    }

    // Update allowed fields (limited updates to maintain data integrity)
    const { description, dueDate, paymentMethod, paymentDetails, notes, status } = req.body;

    if (description) transaction.description = description;
    if (dueDate && transaction.type === 'credit') {
      transaction.dueDate = dueDate;
      // Update status if overdue
      if (new Date(dueDate) < new Date() && transaction.status === 'pending') {
        transaction.status = 'overdue';
      }
    }
    if (paymentMethod && transaction.type === 'debit') {
      transaction.paymentMethod = paymentMethod;
    }
    if (paymentDetails && transaction.type === 'debit') {
      transaction.paymentDetails = { ...transaction.paymentDetails, ...paymentDetails };
    }
    if (notes !== undefined) transaction.notes = notes;
    if (status) transaction.status = status;

    await transaction.save();
    await transaction.populate([
      { path: 'dealerId', select: 'name phone email' },
      { path: 'shopId', select: 'name location' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/payments/pending
// @desc    Get all pending payments
// @access  Private
router.get('/payments/pending', protect, async (req, res) => {
  try {
    const { shopId, days } = req.query;

    let query = {
      type: 'credit',
      status: { $in: ['pending', 'overdue'] }
    };

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by due date (next N days)
    if (days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days));
      query.dueDate = { $lte: futureDate };
    }

    const pendingPayments = await FinanceTransaction.find(query)
      .populate('dealerId', 'name phone email')
      .populate('shopId', 'name location')
      .sort({ dueDate: 1 });

    res.json({
      count: pendingPayments.length,
      pendingPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/payments/overdue
// @desc    Get all overdue payments
// @access  Private
router.get('/payments/overdue', protect, async (req, res) => {
  try {
    const { shopId } = req.query;

    let query = {
      type: 'credit',
      status: 'overdue',
      dueDate: { $lt: new Date() }
    };

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    const overduePayments = await FinanceTransaction.find(query)
      .populate('dealerId', 'name phone email')
      .populate('shopId', 'name location')
      .sort({ dueDate: 1 });

    // Calculate total overdue amount
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      count: overduePayments.length,
      totalOverdue,
      overduePayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/finance/payments/:id/mark-paid
// @desc    Mark a credit transaction as paid
// @access  Private (Owner/Manager)
router.post('/payments/:id/mark-paid', protect, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails } = req.body;

    const transaction = await FinanceTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.type !== 'credit') {
      return res.status(400).json({ message: 'Only credit transactions can be marked as paid' });
    }

    if (transaction.status === 'paid') {
      return res.status(400).json({ message: 'Transaction is already marked as paid' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot mark payments as paid' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(transaction.shopId)) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    // Mark transaction as paid
    await transaction.markAsPaid({ paymentMethod, paymentDetails });

    // Update dealer balance
    const dealer = await Dealer.findById(transaction.dealerId);
    await dealer.updateBalance(transaction.amount, 'debit');

    await transaction.populate([
      { path: 'dealerId', select: 'name phone email' },
      { path: 'shopId', select: 'name location' }
    ]);

    res.json({
      message: 'Payment marked as paid successfully',
      transaction,
      dealer: {
        id: dealer._id,
        name: dealer.name,
        currentBalance: dealer.currentBalance,
        availableCredit: dealer.availableCredit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/finance/summary
// @desc    Get finance summary for shops
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.query;

    let shopQuery = {};
    if (shopId) {
      shopQuery._id = shopId;
    } else if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shops = await Shop.find({ owner: req.user._id });
      shopQuery._id = { $in: shops.map(s => s._id) };
    } else {
      shopQuery._id = { $in: req.user.shops };
    }

    const Shop = require('../models/Shop');
    const shops = await Shop.find(shopQuery);

    const summaries = await Promise.all(shops.map(async (shop) => {
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const [creditTransactions, debitTransactions, pendingPayments, overduePayments] = await Promise.all([
        FinanceTransaction.find({ shopId: shop._id, type: 'credit', ...dateFilter }),
        FinanceTransaction.find({ shopId: shop._id, type: 'debit', ...dateFilter }),
        FinanceTransaction.find({
          shopId: shop._id,
          type: 'credit',
          status: { $in: ['pending', 'overdue'] }
        }),
        FinanceTransaction.find({
          shopId: shop._id,
          type: 'credit',
          status: 'overdue',
          dueDate: { $lt: new Date() }
        })
      ]);

      const totalCredit = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCollected = debitTransactions.reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        shop: {
          id: shop._id,
          name: shop.name,
          location: shop.location
        },
        totalCredit,
        totalCollected,
        pendingAmount,
        overdueAmount,
        netCollection: totalCollected - totalCredit,
        pendingCount: pendingPayments.length,
        overdueCount: overduePayments.length
      };
    }));

    const totalSummary = summaries.reduce((acc, summary) => ({
      totalCredit: acc.totalCredit + summary.totalCredit,
      totalCollected: acc.totalCollected + summary.totalCollected,
      pendingAmount: acc.pendingAmount + summary.pendingAmount,
      overdueAmount: acc.overdueAmount + summary.overdueAmount
    }), { totalCredit: 0, totalCollected: 0, pendingAmount: 0, overdueAmount: 0 });

    res.json({
      shops: summaries,
      total: {
        ...totalSummary,
        netCollection: totalSummary.totalCollected - totalSummary.totalCredit,
        pendingCount: summaries.reduce((sum, s) => sum + s.pendingCount, 0),
        overdueCount: summaries.reduce((sum, s) => sum + s.overdueCount, 0)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;