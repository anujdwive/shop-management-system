const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/attendance/check-in
// @desc    Mark employee check-in
// @access  Private (All employees)
router.post('/check-in', protect, async (req, res) => {
  try {
    const { employeeId, shopId, location, deviceInfo } = req.body;

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify the employee belongs to the user
    if (employee.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this employee' });
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId,
      shopId,
      userId: req.user._id,
      date: today,
      checkIn: new Date(),
      checkInLocation: location,
      deviceInfo
    });

    await attendance.populate('employeeId', 'employeeId designation');
    await attendance.populate('userId', 'name email');

    res.status(201).json({
      message: 'Check-in marked successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/check-out
// @desc    Mark employee check-out
// @access  Private (All employees)
router.post('/check-out', protect, async (req, res) => {
  try {
    const { employeeId, location, notes } = req.body;

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }

    // Verify the attendance belongs to the user
    if (attendance.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this attendance' });
    }

    // Mark check-out
    await attendance.markCheckOut({
      time: new Date(),
      location,
      notes
    });

    await attendance.populate('employeeId', 'employeeId designation');
    await attendance.populate('userId', 'name email');

    res.json({
      message: 'Check-out marked successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, employeeId, startDate, endDate, status, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get attendance for user's accessible shops
      if (req.user.role === 'owner') {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by employee
    if (employeeId) {
      query.employeeId = employeeId;
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

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('employeeId', 'employeeId designation')
        .populate('userId', 'name email')
        .populate('shopId', 'name location')
        .sort({ date: -1, checkIn: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    res.json({
      count: attendance.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get single attendance record
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employeeId', 'employeeId designation userId')
      .populate('userId', 'name email phone')
      .populate('shopId', 'name location')
      .populate('approvedBy', 'name email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(attendance.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this attendance record' });
    }

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/employee/:employeeId
// @desc    Get attendance history for an employee
// @access  Private
router.get('/employee/:employeeId', protect, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 30 } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(employee.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view attendance for this employee' });
    }

    const attendance = await Attendance.getEmployeeAttendanceHistory(employeeId, parseInt(limit));

    res.json({
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.userId?.name || 'N/A',
        designation: employee.designation
      },
      count: attendance.length,
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/shop/:shopId/:date
// @desc    Get daily attendance report for a shop
// @access  Private
router.get('/shop/:shopId/:date', protect, async (req, res) => {
  try {
    const { shopId, date } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view attendance for this shop' });
    }

    const { attendance, summary } = await Attendance.getDailyAttendanceReport(shopId, date);

    res.json({
      date,
      shopId,
      summary,
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/shop/:shopId/monthly/:year/:month
// @desc    Get monthly attendance summary for a shop
// @access  Private
router.get('/shop/:shopId/monthly/:year/:month', protect, async (req, res) => {
  try {
    const { shopId, year, month } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view attendance for this shop' });
    }

    const summary = await Attendance.getMonthlyAttendanceSummary(shopId, parseInt(year), parseInt(month));

    res.json({
      shopId,
      year: parseInt(year),
      month: parseInt(month),
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update attendance records' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(attendance.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this attendance record' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: attendance.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this attendance record' });
      }
    }

    // Update allowed fields
    const { status, notes, reason } = req.body;

    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    if (reason) attendance.reason = reason;

    await attendance.save();
    await attendance.populate('employeeId', 'employeeId designation');
    await attendance.populate('userId', 'name email');

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/:id/approve
// @desc    Approve attendance record
// @access  Private (Owner/Manager)
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot approve attendance' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(attendance.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to approve attendance for this shop' });
    }

    attendance.approvedBy = req.user._id;
    attendance.approvedAt = new Date();
    await attendance.save();

    await attendance.populate('approvedBy', 'name email');
    await attendance.populate('employeeId', 'employeeId designation');
    await attendance.populate('userId', 'name email');

    res.json({
      message: 'Attendance approved successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;