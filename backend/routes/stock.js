const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const { protect, ownerOrManager } = require('../middleware/auth');

// @route   GET /api/stock
// @desc    Get stock for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, lowStock } = req.query;

    let query = {};

    if (shopId) {
      query.shop = shopId;
    } else {
      // If no shop specified, return stock for user's shops
      if (req.user.role === 'owner') {
        // Owner can see all shops
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shop = { $in: shops.map(s => s._id) };
      } else {
        // Manager/Worker can only see their assigned shops
        query.shop = { $in: req.user.shops };
      }
    }

    // Populate product details
    let stocks = await Stock.find(query)
      .populate('product')
      .populate('shop');

    // Filter by low stock if requested
    if (lowStock === 'true') {
      stocks = stocks.filter(stock =>
        stock.quantity <= stock.product.minStockLevel
      );
    }

    res.json({
      count: stocks.length,
      stocks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/stock/alerts/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const { shopId } = req.query;

    let query = {};

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

    // Get all stocks and filter low stock
    const stocks = await Stock.find(query)
      .populate('product')
      .populate('shop');

    const lowStockItems = stocks.filter(stock =>
      stock.quantity <= stock.product.minStockLevel
    );

    res.json({
      count: lowStockItems.length,
      lowStockItems: lowStockItems.map(stock => ({
        shop: stock.shop,
        product: stock.product,
        currentStock: stock.quantity,
        minStockLevel: stock.product.minStockLevel,
        deficit: stock.product.minStockLevel - stock.quantity
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/stock/:shopId/:productId
// @desc    Get stock for specific shop and product
// @access  Private
router.get('/:shopId/:productId', protect, async (req, res) => {
  try {
    const stock = await Stock.findOne({
      shop: req.params.shopId,
      product: req.params.productId
    }).populate('product').populate('shop');

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/stock/adjust
// @desc    Adjust stock quantity
// @access  Private (Owner or Manager)
router.post('/adjust', protect, ownerOrManager, async (req, res) => {
  try {
    const { shopId, productId, quantity, type, notes } = req.body;

    // Validate
    if (!shopId || !productId || !quantity || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({ message: 'Type must be in or out' });
    }

    // Find or create stock entry
    let stock = await Stock.findOne({ shop: shopId, product: productId });
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!stock) {
      stock = await Stock.create({
        shop: shopId,
        product: productId,
        quantity: 0
      });
    }

    // Calculate new quantity
    let newQuantity;
    if (type === 'in') {
      newQuantity = stock.quantity + parseInt(quantity);
    } else {
      newQuantity = stock.quantity - parseInt(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({
          message: 'Insufficient stock',
          currentStock: stock.quantity,
          requested: quantity
        });
      }
    }

    // Update stock
    stock.quantity = newQuantity;
    stock.lastUpdated = Date.now();
    await stock.save();

    // Create transaction record
    const transaction = await StockTransaction.create({
      shop: shopId,
      product: productId,
      type,
      quantity: parseInt(quantity),
      referenceType: 'adjustment',
      notes: notes || `${type === 'in' ? 'Stock added' : 'Stock removed'}`,
      createdBy: req.user._id
    });

    // Return updated stock with product details
    const updatedStock = await Stock.findById(stock._id)
      .populate('product')
      .populate('shop');

    res.status(200).json({
      stock: updatedStock,
      transaction,
      message: `Stock ${type === 'in' ? 'added' : 'removed'} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/stock/transfer
// @desc    Transfer stock between shops
// @access  Private (Owner or Manager)
router.post('/transfer', protect, ownerOrManager, async (req, res) => {
  try {
    const { fromShopId, toShopId, productId, quantity, notes } = req.body;

    // Validate
    if (!fromShopId || !toShopId || !productId || !quantity) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (fromShopId === toShopId) {
      return res.status(400).json({ message: 'Cannot transfer to same shop' });
    }

    const transferQty = parseInt(quantity);
    if (transferQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check source shop stock
    let fromStock = await Stock.findOne({
      shop: fromShopId,
      product: productId
    });

    if (!fromStock || fromStock.quantity < transferQty) {
      return res.status(400).json({
        message: 'Insufficient stock in source shop',
        available: fromStock ? fromStock.quantity : 0,
        requested: transferQty
      });
    }

    // Get or create destination stock
    let toStock = await Stock.findOne({
      shop: toShopId,
      product: productId
    });

    if (!toStock) {
      toStock = await Stock.create({
        shop: toShopId,
        product: productId,
        quantity: 0
      });
    }

    // Perform transfer
    fromStock.quantity -= transferQty;
    fromStock.lastUpdated = Date.now();
    await fromStock.save();

    toStock.quantity += transferQty;
    toStock.lastUpdated = Date.now();
    await toStock.save();

    // Create transaction records
    const fromTransaction = await StockTransaction.create({
      shop: fromShopId,
      product: productId,
      type: 'out',
      quantity: transferQty,
      referenceType: 'transfer',
      referenceId: `${fromShopId}-to-${toShopId}`,
      toShop: toShopId,
      notes: notes || `Transferred to shop ${toShopId}`,
      createdBy: req.user._id
    });

    const toTransaction = await StockTransaction.create({
      shop: toShopId,
      product: productId,
      type: 'in',
      quantity: transferQty,
      referenceType: 'transfer',
      referenceId: `${fromShopId}-to-${toShopId}`,
      fromShop: fromShopId,
      notes: notes || `Transferred from shop ${fromShopId}`,
      createdBy: req.user._id
    });

    // Return updated stocks
    const updatedFromStock = await Stock.findById(fromStock._id)
      .populate('product')
      .populate('shop');

    const updatedToStock = await Stock.findById(toStock._id)
      .populate('product')
      .populate('shop');

    res.status(200).json({
      fromStock: updatedFromStock,
      toStock: updatedToStock,
      transactions: [fromTransaction, toTransaction],
      message: 'Stock transferred successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
