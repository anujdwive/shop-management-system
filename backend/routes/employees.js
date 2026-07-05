const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   POST /api/employees
// @desc    Create a new employee (creates user + employee record)
// @access  Private (Owner/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const {
      // User details
      name,
      email,
      phone,
      password,
      // Employee details
      employeeId,
      shopId,
      designation,
      department,
      salary,
      salaryType,
      salesTarget,
      commissionRate,
      workSchedule,
      bankDetails,
      documents,
      emergencyContact,
      notes
    } = req.body;

    // Validate permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot create employees' });
    }

    // Validate shop access
    let shop;
    if (req.user.role === 'manager') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to add employee to this shop' });
      }
      shop = await Shop.findById(shopId);
    } else if (req.user.role === 'owner') {
      shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to add employee to this shop' });
      }
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'worker',
      shops: [shopId]
    });

    // Create employee
    const employee = await Employee.create({
      userId: user._id,
      shopId,
      employeeId,
      designation,
      department,
      salary,
      salaryType: salaryType || 'monthly',
      salesTarget: salesTarget || 0,
      commissionRate: commissionRate || 0,
      workSchedule: workSchedule || {},
      bankDetails: bankDetails || {},
      documents: documents || {},
      emergencyContact: emergencyContact || {},
      notes
    });

    await employee.populate('userId', 'name email phone');
    await employee.populate('shopId', 'name location');

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/employees
// @desc    Get all employees for a shop or user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, designation, status, search, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get employees for user's accessible shops
      if (req.user.role === 'owner') {
        const shops = await Shop.find({ owner: req.user._id });
        query.shopId = { $in: shops.map(s => s._id) };
      } else {
        query.shopId = { $in: req.user.shops };
      }
    }

    // Filter by designation
    if (designation) {
      query.designation = designation;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { userId: { $in: users.map(u => u._id) } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('userId', 'name email phone')
        .populate('shopId', 'name location')
        .sort({ joinDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Employee.countDocuments(query)
    ]);

    res.json({
      count: employees.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      employees
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('shopId', 'name location');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(employee.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this employee' });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update employees' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(employee.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this employee' });
    }

    if (req.user.role === 'owner') {
      const shop = await Shop.findOne({ _id: employee.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this employee' });
      }
    }

    // Update allowed fields
    const {
      designation,
      department,
      salary,
      salaryType,
      salesTarget,
      commissionRate,
      workSchedule,
      bankDetails,
      documents,
      status,
      emergencyContact,
      notes
    } = req.body;

    if (designation) employee.designation = designation;
    if (department) employee.department = department;
    if (salary !== undefined) employee.salary = salary;
    if (salaryType) employee.salaryType = salaryType;
    if (salesTarget !== undefined) employee.salesTarget = salesTarget;
    if (commissionRate !== undefined) employee.commissionRate = commissionRate;
    if (workSchedule) employee.workSchedule = { ...employee.workSchedule, ...workSchedule };
    if (bankDetails) employee.bankDetails = { ...employee.bankDetails, ...bankDetails };
    if (documents) employee.documents = { ...employee.documents, ...documents };
    if (status) employee.status = status;
    if (emergencyContact) employee.emergencyContact = { ...employee.emergencyContact, ...emergencyContact };
    if (notes !== undefined) employee.notes = notes;

    await employee.save();
    await employee.populate('userId', 'name email phone');
    await employee.populate('shopId', 'name location');

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (deactivates)
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete employees' });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee belongs to owner's shop
    const shop = await Shop.findOne({ _id: employee.shopId, owner: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this employee' });
    }

    // Soft delete by setting status to inactive
    employee.status = 'inactive';
    employee.leaveDate = new Date();
    await employee.save();

    // Also deactivate the user
    await User.findByIdAndUpdate(employee.userId, { active: false });

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/employees/:id/performance
// @desc    Get employee performance details
// @access  Private
router.get('/:id/performance', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(employee.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this employee' });
    }

    const Sale = require('../models/Sale');
    const Attendance = require('../models/Attendance');

    // Get sales data
    const sales = await Sale.find({ employeeId: employee._id, status: 'completed' });
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCommission = sales.reduce((sum, s) => sum + (s.commissionEarned || 0), 0);

    // Get attendance data
    const attendance = await Attendance.find({ employeeId: employee._id });
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;

    res.json({
      employee: {
        id: employee._id,
        name: employee.userId?.name || 'N/A',
        employeeId: employee.employeeId,
        designation: employee.designation
      },
      performance: {
        totalSales,
        totalCommission,
        totalTransactions: sales.length,
        salesTarget: employee.salesTarget,
        salesTargetMet: totalSales >= employee.salesTarget,
        totalCommissionEarned: employee.totalCommission
      },
      attendance: {
        presentDays,
        absentDays,
        lateDays,
        totalDays: attendance.length,
        attendanceRate: attendance.length > 0 ? (presentDays / attendance.length) * 100 : 0
      },
      earnings: {
        salary: employee.salary,
        totalCommission: employee.totalCommission,
        totalEarnings: employee.salary + employee.totalCommission
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/employees/shop/:shopId/top-performers
// @desc    Get top performing employees
// @access  Private
router.get('/shop/:shopId/top-performers', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { limit = 5 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view employees of this shop' });
    }

    const topPerformers = await Employee.getTopPerformers(shopId, parseInt(limit));

    res.json({
      count: topPerformers.length,
      topPerformers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;