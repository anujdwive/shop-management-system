const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private (Owner/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const {
      shopId,
      title,
      description,
      type,
      category,
      priority,
      dueDate,
      dueTime,
      reminderDaysBefore,
      reminderFrequency,
      assignedTo,
      referenceType,
      referenceId,
      referenceDetails,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
      tags,
      notes,
      attachments
    } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create reminders' });
    }

    // Validate shop access
    let shop;
    if (req.user.role === 'manager') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to create reminder in this shop' });
      }
      const Shop = require('../models/Shop');
      shop = await Shop.findById(shopId);
    } else if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create reminder in this shop' });
      }
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Create reminder
    const reminder = await Reminder.create({
      shopId,
      title,
      description,
      type,
      category,
      priority: priority || 'medium',
      dueDate,
      dueTime,
      reminderDaysBefore: reminderDaysBefore || 1,
      reminderFrequency: reminderFrequency || 'once',
      assignedTo,
      referenceType,
      referenceId,
      referenceDetails: referenceDetails || {},
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      recurrenceEndDate,
      tags: tags || [],
      notes,
      attachments: attachments || [],
      createdBy: req.user._id
    });

    await reminder.populate('assignedTo', 'name email');
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders
// @desc    Get all reminders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, type, status, priority, assignedTo, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get reminders for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by due date range
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reminders, total] = await Promise.all([
      Reminder.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('shopId', 'name location')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Reminder.countDocuments(query)
    ]);

    res.json({
      count: reminders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/:id
// @desc    Get single reminder
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('shopId', 'name location');

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(reminder.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this reminder' });
    }

    res.json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update reminders' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(reminder.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this reminder' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: reminder.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this reminder' });
      }
    }

    // Update allowed fields
    const {
      title,
      description,
      type,
      category,
      priority,
      dueDate,
      dueTime,
      reminderDaysBefore,
      reminderFrequency,
      assignedTo,
      referenceDetails,
      status,
      tags,
      notes
    } = req.body;

    if (title) reminder.title = title;
    if (description) reminder.description = description;
    if (type) reminder.type = type;
    if (category) reminder.category = category;
    if (priority) reminder.priority = priority;
    if (dueDate) reminder.dueDate = dueDate;
    if (dueTime) reminder.dueTime = dueTime;
    if (reminderDaysBefore !== undefined) reminder.reminderDaysBefore = reminderDaysBefore;
    if (reminderFrequency) reminder.reminderFrequency = reminderFrequency;
    if (assignedTo) reminder.assignedTo = assignedTo;
    if (referenceDetails) reminder.referenceDetails = { ...reminder.referenceDetails, ...referenceDetails };
    if (status) reminder.status = status;
    if (tags) reminder.tags = tags;
    if (notes !== undefined) reminder.notes = notes;

    await reminder.save();
    await reminder.populate('assignedTo', 'name email');
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.json({
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete reminders' });
    }

    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if reminder belongs to owner's shop
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ _id: reminder.shopId, owner: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this reminder' });
    }

    await reminder.deleteOne();

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/pending/:shopId
// @desc    Get pending reminders for a shop
// @access  Private
router.get('/pending/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this shop' });
    }

    const reminders = await Reminder.getPendingReminders(shopId);

    res.json({
      shopId,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/overdue/:shopId
// @desc    Get overdue reminders for a shop
// @access  Private
router.get('/overdue/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this shop' });
    }

    const reminders = await Reminder.getOverdueReminders(shopId);

    res.json({
      shopId,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/due/:shopId
// @desc    Get due reminders (within next N days)
// @access  Private
router.get('/due/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { days = 7 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this shop' });
    }

    const reminders = await Reminder.getDueReminders(shopId, parseInt(days));

    res.json({
      shopId,
      days: parseInt(days),
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reminders/:id/complete
// @desc    Mark reminder as complete
// @access  Private (Owner/Manager/Worker)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check permissions (anyone can complete if they have access)
    if (req.user.role !== 'owner' && !req.user.shops.includes(reminder.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to complete this reminder' });
    }

    const { completionNotes } = req.body;

    await reminder.markAsComplete(req.user._id, completionNotes);
    await reminder.populate('assignedTo', 'name email');
    await reminder.populate('completedBy', 'name email');
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.json({
      message: 'Reminder marked as complete successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reminders/:id/in-progress
// @desc    Mark reminder as in progress
// @access  Private (Owner/Manager/Worker)
router.post('/:id/in-progress', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check permissions
    if (req.user.role !== 'owner' && !req.user.shops.includes(reminder.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this reminder' });
    }

    await reminder.markAsInProgress();
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.json({
      message: 'Reminder marked as in progress successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reminders/:id/cancel
// @desc    Cancel reminder
// @access  Private (Owner/Manager)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot cancel reminders' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(reminder.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to cancel reminder for this shop' });
    }

    const { reason } = req.body;

    await reminder.cancel(reason);
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.json({
      message: 'Reminder cancelled successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reminders/:id/snooze
// @desc    Snooze reminder to new date
// @access  Private (Owner/Manager)
router.post('/:id/snooze', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot snooze reminders' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(reminder.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to snooze reminder for this shop' });
    }

    const { newDueDate, reason } = req.body;

    if (!newDueDate) {
      return res.status(400).json({ message: 'Please provide new due date' });
    }

    await reminder.snooze(newDueDate, reason);
    await reminder.populate('assignedTo', 'name email');
    await reminder.populate('createdBy', 'name email');
    await reminder.populate('shopId', 'name location');

    res.json({
      message: 'Reminder snoozed successfully',
      reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/type/:shopId/:type
// @desc    Get reminders by type
// @access  Private
router.get('/type/:shopId/:type', protect, async (req, res) => {
  try {
    const { shopId, type } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this shop' });
    }

    const reminders = await Reminder.getRemindersByType(shopId, type);

    res.json({
      shopId,
      type,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/priority/:shopId/:priority
// @desc    Get reminders by priority
// @access  Private
router.get('/priority/:shopId/:priority', protect, async (req, res) => {
  try {
    const { shopId, priority } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this shop' });
    }

    const reminders = await Reminder.getRemindersByPriority(shopId, priority);

    res.json({
      shopId,
      priority,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reminders/assigned/:userId
// @desc    Get reminders assigned to user
// @access  Private
router.get('/assigned/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'pending' } = req.query;

    // Check if user is requesting their own reminders or if they're an owner
    if (req.user.role !== 'owner' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view reminders for this user' });
    }

    const reminders = await Reminder.getAssignedReminders(userId, status);

    res.json({
      userId,
      status,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
