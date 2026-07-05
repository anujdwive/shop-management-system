const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');
const FinanceTransaction = require('../models/FinanceTransaction');
const { protect } = require('../middleware/auth');

// @route   POST /api/dealers
// @desc    Create a new dealer
// @access  Private (Owner/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, address, shopId, creditLimit, gstin, panNumber, notes } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create dealers' });
    }

    // Validate shop access
    if (req.user.role === 'manager' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to add dealer to this shop' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to add dealer to this shop' });
      }
    }

    // Check if dealer with same phone already exists in this shop
    const existingDealer = await Dealer.findOne({ phone, shopId });
    if (existingDealer) {
      return res.status(400).json({ message: 'Dealer with this phone number already exists in this shop' });
    }

    const dealer = await Dealer.create({
      name,
      phone,
      email,
      address,
      shopId,
      creditLimit: creditLimit || 0,
      gstin,
      panNumber,
      notes
    });

    await dealer.populate('shopId', 'name location');

    res.status(201).json({
      message: 'Dealer created successfully',
      dealer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dealers
// @desc    Get all dealers for a shop or user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, status, search, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get dealers for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [dealers, total] = await Promise.all([
      Dealer.find(query)
        .populate('shopId', 'name location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Dealer.countDocuments(query)
    ]);

    res.json({
      count: dealers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      dealers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dealers/:id
// @desc    Get single dealer
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id)
      .populate('shopId', 'name location');

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(dealer.shopId._id)) {
      return res.status(403).json({ message: 'Not authorized to view this dealer' });
    }

    // Get recent transactions for this dealer
    const recentTransactions = await FinanceTransaction.find({ dealerId: dealer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name');

    res.json({
      dealer,
      recentTransactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/dealers/:id
// @desc    Update dealer
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update dealers' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(dealer.shopId)) {
      return res.status(403).json({ message: 'Not authorized to update this dealer' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: dealer.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this dealer' });
      }
    }

    // Update allowed fields
    const { name, phone, email, address, creditLimit, gstin, panNumber, status, notes } = req.body;

    dealer.name = name || dealer.name;
    dealer.phone = phone || dealer.phone;
    dealer.email = email !== undefined ? email : dealer.email;
    dealer.address = address || dealer.address;
    dealer.creditLimit = creditLimit !== undefined ? creditLimit : dealer.creditLimit;
    dealer.gstin = gstin !== undefined ? gstin : dealer.gstin;
    dealer.panNumber = panNumber !== undefined ? panNumber : dealer.panNumber;
    dealer.status = status || dealer.status;
    dealer.notes = notes !== undefined ? notes : dealer.notes;

    await dealer.save();
    await dealer.populate('shopId', 'name location');

    res.json({
      message: 'Dealer updated successfully',
      dealer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/dealers/:id
// @desc    Delete dealer
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete dealers' });
    }

    const dealer = await Dealer.findById(req.params.id);

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check if dealer belongs to owner's shop
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ _id: dealer.shopId, owner: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this dealer' });
    }

    // Check if dealer has outstanding balance
    if (dealer.currentBalance > 0) {
      return res.status(400).json({
        message: 'Cannot delete dealer with outstanding balance',
        outstandingAmount: dealer.currentBalance
      });
    }

    // Check if dealer has any transactions
    const transactionCount = await FinanceTransaction.countDocuments({ dealerId: dealer._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete dealer with transaction history',
        transactionCount
      });
    }

    await dealer.deleteOne();

    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dealers/:id/balance
// @desc    Get dealer balance and summary
// @access  Private
router.get('/:id/balance', protect, async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(dealer.shopId)) {
      return res.status(403).json({ message: 'Not authorized to view this dealer' });
    }

    // Get transaction summary
    const transactions = await FinanceTransaction.find({ dealerId: dealer._id });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = await FinanceTransaction.find({
      dealerId: dealer._id,
      type: 'credit',
      status: { $in: ['pending', 'overdue'] }
    });

    res.json({
      dealer: {
        id: dealer._id,
        name: dealer.name,
        phone: dealer.phone,
        email: dealer.email
      },
      balance: {
        current: dealer.currentBalance,
        creditLimit: dealer.creditLimit,
        available: dealer.availableCredit,
        creditUsed: dealer.currentBalance
      },
      summary: {
        totalCredit,
        totalDebit,
        pendingPayments: pendingPayments.length,
        overduePayments: pendingPayments.filter(p => p.status === 'overdue').length
      },
      pendingPayments: pendingPayments.map(p => ({
        id: p._id,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status,
        description: p.description
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;