const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, owner } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (owner only)
// @access  Private (Owner only)
router.get('/', protect, owner, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('shops', 'name location');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Owner only)
router.get('/:id', protect, owner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('shops', 'name location');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Owner only)
router.put('/:id', protect, owner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phone, role, shops, status } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.shops = shops || user.shops;
    user.status = status || user.status;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Owner only)
router.delete('/:id', protect, owner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'User removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
