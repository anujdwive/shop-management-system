const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, ownerOrManager } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Owner or Manager)
router.post('/', protect, ownerOrManager, async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      sku,
      description,
      minStockLevel,
      price,
      costPrice,
      unit,
      status
    } = req.body;

    // Check if SKU already exists
    if (sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    const product = await Product.create({
      name,
      category,
      brand,
      sku,
      description,
      minStockLevel,
      price,
      costPrice,
      unit,
      status
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Owner or Manager)
router.put('/:id', protect, ownerOrManager, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      category,
      brand,
      sku,
      description,
      minStockLevel,
      price,
      costPrice,
      unit,
      status
    } = req.body;

    // Check if SKU already exists (and it's not this product)
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.sku = sku || product.sku;
    product.description = description || product.description;
    product.minStockLevel = minStockLevel !== undefined ? minStockLevel : product.minStockLevel;
    product.price = price !== undefined ? price : product.price;
    product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
    product.unit = unit || product.unit;
    product.status = status || product.status;

    await product.save();

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Owner or Manager)
router.delete('/:id', protect, ownerOrManager, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product has stock in any shop
    const Stock = require('../models/Stock');
    const stockEntries = await Stock.find({ product: req.params.id });

    if (stockEntries.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete product. It has stock entries in shops. Please set status to inactive instead.'
      });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
