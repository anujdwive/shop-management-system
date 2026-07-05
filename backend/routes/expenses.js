const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// Helper function to generate expense number
const generateExpenseNumber = async (shopId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Count expenses for this shop this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const count = await Expense.countDocuments({
    shopId,
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `EXP${year}${month}${sequence}`;
};

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private (Owner/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const {
      shopId,
      title,
      description,
      category,
      subCategory,
      amount,
      currency,
      expenseDate,
      period,
      paymentMethod,
      paymentDetails,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
      budgetCategory,
      budgetAmount,
      taxAmount,
      taxType,
      taxIncluded,
      vendorName,
      vendorDetails,
      receiptNumber,
      invoiceNumber,
      attachments,
      tags,
      notes
    } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create expenses' });
    }

    // Validate shop access
    let shop;
    if (req.user.role === 'manager') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to create expense in this shop' });
      }
      const Shop = require('../models/Shop');
      shop = await Shop.findById(shopId);
    } else if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create expense in this shop' });
      }
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Generate expense number
    const expenseNumber = await generateExpenseNumber(shopId);

    // Create expense
    const expense = await Expense.create({
      shopId,
      expenseNumber,
      title,
      description,
      category,
      subCategory,
      amount,
      currency: currency || 'INR',
      expenseDate: expenseDate || new Date(),
      period,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      recurrenceEndDate,
      budgetCategory,
      budgetAmount,
      taxAmount: taxAmount || 0,
      taxType,
      taxIncluded: taxIncluded || false,
      vendorName,
      vendorDetails: vendorDetails || {},
      receiptNumber,
      invoiceNumber,
      attachments: attachments || [],
      tags: tags || [],
      notes,
      createdBy: req.user._id
    });

    await expense.populate('createdBy', 'name email');
    await expense.populate('shopId', 'name location');

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, category, paymentStatus, status, isRecurring, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get expenses for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by recurring
    if (isRecurring !== undefined) {
      query.isRecurring = isRecurring === 'true';
    }

    // Filter by date range
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) {
        query.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.expenseDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('shopId', 'name location')
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);

    res.json({
      count: expenses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      expenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('shopId', 'name location');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(expense.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update expenses' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(expense.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: expense.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this expense' });
      }
    }

    // Update allowed fields
    const {
      title,
      description,
      category,
      subCategory,
      amount,
      paymentMethod,
      paymentDetails,
      paymentStatus,
      status,
      budgetAmount,
      notes,
      tags
    } = req.body;

    if (title) expense.title = title;
    if (description) expense.description = description;
    if (category) expense.category = category;
    if (subCategory) expense.subCategory = subCategory;
    if (amount !== undefined) expense.amount = amount;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (paymentDetails) expense.paymentDetails = { ...expense.paymentDetails, ...paymentDetails };
    if (paymentStatus) expense.paymentStatus = paymentStatus;
    if (status) expense.status = status;
    if (budgetAmount !== undefined) expense.budgetAmount = budgetAmount;
    if (notes !== undefined) expense.notes = notes;
    if (tags) expense.tags = tags;

    await expense.save();
    await expense.populate('createdBy', 'name email');
    await expense.populate('shopId', 'name location');

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete expenses' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if expense belongs to owner's shop
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ _id: expense.shopId, owner: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private (Owner/Manager)
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot approve expenses' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(expense.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to approve expense for this shop' });
    }

    const { notes } = req.body;
    await expense.approve(req.user._id, notes);

    await expense.populate('approvedBy', 'name email');
    await expense.populate('createdBy', 'name email');
    await expense.populate('shopId', 'name location');

    res.json({
      message: 'Expense approved successfully',
      expense
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/expenses/:id/reject
// @desc    Reject expense
// @access  Private (Owner/Manager)
router.post('/:id/reject', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot reject expenses' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(expense.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to reject expense for this shop' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Please provide rejection reason' });
    }

    await expense.reject(req.user._id, reason);

    await expense.populate('approvedBy', 'name email');
    await expense.populate('createdBy', 'name email');
    await expense.populate('shopId', 'name location');

    res.json({
      message: 'Expense rejected successfully',
      expense
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/expenses/:id/mark-paid
// @desc    Mark expense as paid
// @access  Private (Owner/Manager)
router.post('/:id/mark-paid', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot mark expenses as paid' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(expense.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update expense for this shop' });
    }

    const { paymentDetails } = req.body;
    await expense.markAsPaid(paymentDetails);

    await expense.populate('createdBy', 'name email');
    await expense.populate('shopId', 'name location');

    res.json({
      message: 'Expense marked as paid successfully',
      expense
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/shop/:shopId/category-summary
// @desc    Get expense summary by category
// @access  Private
router.get('/shop/:shopId/category-summary', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view expenses for this shop' });
    }

    // Default to current month if no dates provided
    const date = new Date();
    const defaultStartDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const defaultEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const summary = await Expense.getExpenseSummaryByCategory(
      shopId,
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    res.json({
      shopId,
      startDate: startDate || defaultStartDate,
      endDate: endDate || defaultEndDate,
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/shop/:shopId/monthly/:year/:month
// @desc    Get monthly expense report
// @access  Private
router.get('/shop/:shopId/monthly/:year/:month', protect, async (req, res) => {
  try {
    const { shopId, year, month } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view expenses for this shop' });
    }

    const { expenses, summary } = await Expense.getMonthlyExpenseReport(shopId, parseInt(year), parseInt(month));

    res.json({
      shopId,
      year: parseInt(year),
      month: parseInt(month),
      summary,
      expenses: expenses.slice(0, 100) // Limit to 100 expenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/pending
// @desc    Get all pending expenses
// @access  Private
router.get('/pending/pending', protect, async (req, res) => {
  try {
    const { shopId } = req.query;

    let query = { paymentStatus: { $in: ['pending', 'overdue'] } };

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

    const pendingExpenses = await Expense.find(query)
      .populate('shopId', 'name location')
      .populate('createdBy', 'name email')
      .sort({ expenseDate: 1 });

    // Calculate total pending amount
    const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      count: pendingExpenses.length,
      totalPending,
      pendingExpenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/recurring/due
// @desc    Get recurring expenses due
// @access  Private (Owner only)
router.get('/recurring/due', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can view recurring expenses' });
    }

    const dueExpenses = await Expense.getRecurringExpensesDue();

    res.json({
      count: dueExpenses.length,
      dueExpenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;