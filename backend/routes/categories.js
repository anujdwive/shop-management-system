const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, ownerOrManager } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name')
      .sort({ name: 1 });

    res.json({
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name description');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Owner or Manager)
router.post('/', protect, ownerOrManager, async (req, res) => {
  try {
    const { name, description, parent, status } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Validate parent category if provided
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
    }

    const category = await Category.create({
      name,
      description,
      parent,
      status
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name');

    res.status(201).json(populatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Owner or Manager)
router.put('/:id', protect, ownerOrManager, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, parent, status } = req.body;

    // Check if name is being changed and if new name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    // Validate parent category if provided
    if (parent && parent !== category.parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
      // Prevent circular reference
      if (parent === category._id) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parent = parent !== undefined ? parent : category.parent;
    category.status = status || category.status;

    await category.save();

    const updatedCategory = await Category.findById(category._id)
      .populate('parent', 'name');

    res.json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Owner or Manager)
router.delete('/:id', protect, ownerOrManager, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has child categories
    const childCategories = await Category.find({ parent: req.params.id });
    if (childCategories.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete category. It has child categories. Please delete or reassign child categories first.'
      });
    }

    // Check if category is being used by products
    const Product = require('../models/Product');
    const productsUsingCategory = await Product.countDocuments({ category: category.name });
    if (productsUsingCategory > 0) {
      return res.status(400).json({
        message: 'Cannot delete category. It is being used by products. Please set category status to inactive instead.'
      });
    }

    await category.deleteOne();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
