const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { protect, owner, ownerOrManager } = require('../middleware/auth');

// @route   GET /api/shops
// @desc    Get all shops (filtered by user role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let shops;

    // Owner can see all shops
    if (req.user.role === 'owner') {
      shops = await Shop.find().populate('owner', 'name email').populate('managers', 'name email');
    }
    // Manager/Worker can only see their assigned shops
    else {
      shops = await Shop.find({
        _id: { $in: req.user.shops }
      }).populate('owner', 'name email').populate('managers', 'name email');
    }

    res.json(shops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/shops/:id
// @desc    Get single shop
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('managers', 'name email phone');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user has access to this shop
    if (req.user.role !== 'owner' && !req.user.shops.includes(shop._id)) {
      return res.status(403).json({ message: 'Not authorized to access this shop' });
    }

    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/shops
// @desc    Create new shop
// @access  Private (Owner only)
router.post('/', protect, owner, async (req, res) => {
  try {
    const { name, location, address, phone, businessType } = req.body;

    const shop = await Shop.create({
      name,
      location,
      address,
      phone,
      businessType,
      owner: req.user._id
    });

    // Add shop to owner's shops array
    await require('../models/User').findByIdAndUpdate(
      req.user._id,
      { $push: { shops: shop._id } }
    );

    res.status(201).json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update shop
// @access  Private (Owner or Manager)
router.put('/:id', protect, ownerOrManager, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user has access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shop._id)) {
      return res.status(403).json({ message: 'Not authorized to update this shop' });
    }

    const { name, location, address, phone, businessType, status } = req.body;

    shop.name = name || shop.name;
    shop.location = location || shop.location;
    shop.address = address || shop.address;
    shop.phone = phone || shop.phone;
    shop.businessType = businessType || shop.businessType;
    shop.status = status || shop.status;

    await shop.save();

    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/shops/:id
// @desc    Delete shop
// @access  Private (Owner only)
router.delete('/:id', protect, owner, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await shop.deleteOne();

    // Remove shop from all users' shops arrays
    await require('../models/User').updateMany(
      { shops: shop._id },
      { $pull: { shops: shop._id } }
    );

    res.json({ message: 'Shop removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
