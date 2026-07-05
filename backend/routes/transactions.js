const express = require('express');
const router = express.Router();
const StockTransaction = require('../models/StockTransaction');
const { protect } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get stock transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, productId, type, startDate, endDate, limit } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shop = shopId;
    } else {
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shop = { $in: shops.map(s => s._id) };
      } else {
        query.shop = { $in: req.user.shops };
      }
    }

    // Filter by product
    if (productId) {
      query.product = productId;
    }

    // Filter by type
    if (type) {
      query.type = type;
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

    let transactions = StockTransaction.find(query)
      .populate('shop', 'name location')
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    if (limit) {
      transactions = transactions.limit(parseInt(limit));
    }

    const results = await transactions;

    res.json({
      count: results.length,
      transactions: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await StockTransaction.findById(req.params.id)
      .populate('shop')
      .populate('product')
      .populate('fromShop')
      .populate('toShop')
      .populate('createdBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(transaction.shop._id)) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
