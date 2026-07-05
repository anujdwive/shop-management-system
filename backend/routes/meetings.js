const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { protect } = require('../middleware/auth');

// @route   POST /api/meetings
// @desc    Create a new meeting
// @access  Private (Owner/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const {
      shopId,
      title,
      description,
      meetingType,
      withName,
      contact,
      date,
      time,
      duration,
      location,
      locationDetails,
      meetingLink,
      agenda,
      notes,
      priority,
      reminder,
      reminderMinutes,
      participants,
      attachments
    } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create meetings' });
    }

    // Validate shop access
    let shop;
    if (req.user.role === 'manager') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to create meeting in this shop' });
      }
      const Shop = require('../models/Shop');
      shop = await Shop.findById(shopId);
    } else if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create meeting in this shop' });
      }
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Create meeting
    const meeting = await Meeting.create({
      shopId,
      title,
      description,
      meetingType,
      withName,
      contact: contact || {},
      date,
      time,
      duration: duration || 60,
      location: location || 'shop',
      locationDetails,
      meetingLink,
      agenda: agenda || [],
      notes,
      priority: priority || 'medium',
      reminder: reminder !== undefined ? reminder : true,
      reminderMinutes: reminderMinutes || 30,
      participants: participants || [],
      attachments: attachments || [],
      createdBy: req.user._id
    });

    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings
// @desc    Get all meetings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, meetingType, status, priority, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get meetings for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by meeting type
    if (meetingType) {
      query.meetingType = meetingType;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('createdBy', 'name email')
        .populate('shopId', 'name location')
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(query)
    ]);

    res.json({
      count: meetings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      meetings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/:id
// @desc    Get single meeting
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('createdBy', 'name email phone')
      .populate('shopId', 'name location')
      .populate('participants.userId', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(meeting.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this meeting' });
    }

    res.json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/meetings/:id
// @desc    Update meeting
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update meetings' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(meeting.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: meeting.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this meeting' });
      }
    }

    // Update allowed fields
    const {
      title,
      description,
      meetingType,
      withName,
      contact,
      date,
      time,
      duration,
      location,
      locationDetails,
      meetingLink,
      agenda,
      notes,
      priority,
      status,
      reminder,
      reminderMinutes,
      participants
    } = req.body;

    if (title) meeting.title = title;
    if (description) meeting.description = description;
    if (meetingType) meeting.meetingType = meetingType;
    if (withName) meeting.withName = withName;
    if (contact) meeting.contact = { ...meeting.contact, ...contact };
    if (date) meeting.date = date;
    if (time) meeting.time = time;
    if (duration !== undefined) meeting.duration = duration;
    if (location) meeting.location = location;
    if (locationDetails) meeting.locationDetails = locationDetails;
    if (meetingLink) meeting.meetingLink = meetingLink;
    if (agenda) meeting.agenda = agenda;
    if (notes !== undefined) meeting.notes = notes;
    if (priority) meeting.priority = priority;
    if (status) meeting.status = status;
    if (reminder !== undefined) meeting.reminder = reminder;
    if (reminderMinutes !== undefined) meeting.reminderMinutes = reminderMinutes;
    if (participants) meeting.participants = participants;

    await meeting.save();
    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.json({
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/meetings/:id
// @desc    Delete meeting
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete meetings' });
    }

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if meeting belongs to owner's shop
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ _id: meeting.shopId, owner: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this meeting' });
    }

    await meeting.deleteOne();

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/upcoming/:shopId
// @desc    Get upcoming meetings for a shop
// @access  Private
router.get('/upcoming/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { days = 7 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view meetings for this shop' });
    }

    const meetings = await Meeting.getUpcomingMeetings(shopId, parseInt(days));

    res.json({
      shopId,
      days: parseInt(days),
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/today/:shopId
// @desc    Get today's meetings for a shop
// @access  Private
router.get('/today/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view meetings for this shop' });
    }

    const meetings = await Meeting.getTodaysMeetings(shopId);

    res.json({
      shopId,
      date: new Date(),
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/:id/confirm
// @desc    Confirm a meeting
// @access  Private (Owner/Manager)
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot confirm meetings' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(meeting.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to confirm meeting for this shop' });
    }

    await meeting.confirm();
    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.json({
      message: 'Meeting confirmed successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/:id/start
// @desc    Start a meeting
// @access  Private (Owner/Manager)
router.post('/:id/start', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check permissions (anyone in the shop can start)
    if (req.user.role !== 'owner' && !req.user.shops.includes(meeting.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to start this meeting' });
    }

    await meeting.start();
    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.json({
      message: 'Meeting started successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/:id/complete
// @desc    Complete a meeting
// @access  Private (Owner/Manager)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot complete meetings' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(meeting.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to complete meeting for this shop' });
    }

    const { outcome, outcomeNotes } = req.body;

    await meeting.complete(outcome, outcomeNotes);
    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.json({
      message: 'Meeting completed successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/:id/cancel
// @desc    Cancel a meeting
// @access  Private (Owner/Manager)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot cancel meetings' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(meeting.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to cancel meeting for this shop' });
    }

    const { reason } = req.body;

    await meeting.cancel(reason);
    await meeting.populate('createdBy', 'name email');
    await meeting.populate('shopId', 'name location');

    res.json({
      message: 'Meeting cancelled successfully',
      meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/type/:shopId/:meetingType
// @desc    Get meetings by type
// @access  Private
router.get('/type/:shopId/:meetingType', protect, async (req, res) => {
  try {
    const { shopId, meetingType } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view meetings for this shop' });
    }

    const meetings = await Meeting.getMeetingsByType(shopId, meetingType);

    res.json({
      shopId,
      meetingType,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/overdue/:shopId
// @desc    Get overdue meetings for a shop
// @access  Private
router.get('/overdue/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view meetings for this shop' });
    }

    const meetings = await Meeting.getOverdueMeetings(shopId);

    res.json({
      shopId,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
