const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Employee = require('../models/Employee');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockTransaction = require('../models/StockTransaction');
const { protect } = require('../middleware/auth');

// Helper function to generate invoice number
const generateInvoiceNumber = async (shopId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Count sales for this shop today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const count = await Sale.countDocuments({
    shopId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `INV${year}${month}${day}${sequence}`;
};

// @route   POST /api/sales
// @desc    Create a new sale
// @access  Private (Owner/Manager/Worker)
router.post('/', protect, async (req, res) => {
  try {
    const {
      shopId,
      employeeId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      paymentMethod,
      paymentDetails,
      discount,
      taxAmount,
      deliveryType,
      deliveryAddress,
      notes
    } = req.body;

    // Validate shop access
    let shop;
    if (req.user.role === 'manager') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to create sale in this shop' });
      }
      shop = await Shop.findById(shopId);
    } else if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create sale in this shop' });
      }
    } else if (req.user.role === 'worker') {
      if (!req.user.shops.includes(shopId)) {
        return res.status(403).json({ message: 'Not authorized to create sale in this shop' });
      }
    }

    // Validate employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(shopId);

    // Validate items and check stock
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      // Check stock availability
      const stock = await Stock.findOne({ shopId, productId: item.productId });
      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
          available: stock ? stock.quantity : 0,
          requested: item.quantity
        });
      }

      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
      const finalItemSubtotal = itemSubtotal - itemDiscount;

      processedItems.push({
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        subtotal: finalItemSubtotal
      });

      subtotal += finalItemSubtotal;
    }

    // Calculate totals
    const totalAmount = subtotal + (taxAmount || 0) - (discount || 0);

    // Create sale
    const sale = await Sale.create({
      shopId,
      employeeId,
      userId: req.user._id,
      invoiceNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items: processedItems,
      subtotal,
      discount: discount || 0,
      taxAmount: taxAmount || 0,
      totalAmount,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      deliveryType: deliveryType || 'store_pickup',
      deliveryAddress,
      notes,
      createdBy: req.user._id
    });

    // Update stock for each item
    const stockTransactionIds = [];
    for (const item of items) {
      // Update stock quantity
      await Stock.findOneAndUpdate(
        { shopId, productId: item.productId },
        { $inc: { quantity: -item.quantity } }
      );

      // Create stock transaction
      const stockTransaction = await StockTransaction.create({
        shopId,
        productId: item.productId,
        type: 'out',
        quantity: item.quantity,
        referenceType: 'sale',
        referenceId: sale._id,
        createdBy: req.user._id
      });

      stockTransactionIds.push(stockTransaction._id);
    }

    // Update employee performance and calculate commission
    await sale.updateEmployeePerformance();
    await sale.calculateCommission(employee);

    await sale.populate('employeeId', 'employeeId designation');
    await sale.populate('userId', 'name email');
    await sale.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { shopId, employeeId, startDate, endDate, paymentMethod, paymentStatus, status, page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shop specified, get sales for user's accessible shops
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
      query.saleDate = {};
      if (startDate) {
        query.saleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.saleDate.$lte = new Date(endDate);
      }
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('employeeId', 'employeeId designation')
        .populate('userId', 'name email')
        .populate('shopId', 'name location')
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query)
    ]);

    res.json({
      count: sales.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales/:id
// @desc    Get single sale
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('employeeId', 'employeeId designation userId')
      .populate('userId', 'name email phone')
      .populate('shopId', 'name location')
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name sku');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(sale.shopId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this sale' });
    }

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/sales/:id
// @desc    Update sale
// @access  Private (Owner/Manager)
router.put('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check permissions
    if (req.user.role === 'worker') {
      return res.status(403).json({ message: 'Workers cannot update sales' });
    }

    if (req.user.role === 'manager' && !req.user.shops.includes(sale.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this sale' });
    }

    if (req.user.role === 'owner') {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({ _id: sale.shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to update this sale' });
      }
    }

    // Update allowed fields (limited to prevent stock inconsistencies)
    const {
      paymentStatus,
      paymentDetails,
      deliveryStatus,
      notes,
      status,
      cancellationReason,
      returnReason
    } = req.body;

    if (paymentStatus) sale.paymentStatus = paymentStatus;
    if (paymentDetails) sale.paymentDetails = { ...sale.paymentDetails, ...paymentDetails };
    if (deliveryStatus) sale.deliveryStatus = deliveryStatus;
    if (notes !== undefined) sale.notes = notes;
    if (status) {
      sale.status = status;
      if (status === 'cancelled') sale.cancellationReason = cancellationReason;
      if (status === 'returned') sale.returnReason = returnReason;
    }

    await sale.save();
    await sale.populate('employeeId', 'employeeId designation');
    await sale.populate('userId', 'name email');

    res.json({
      message: 'Sale updated successfully',
      sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales/shop/:shopId/daily/:date
// @desc    Get daily sales report
// @access  Private
router.get('/shop/:shopId/daily/:date', protect, async (req, res) => {
  try {
    const { shopId, date } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales for this shop' });
    }

    const { sales, summary } = await Sale.getDailySalesReport(shopId, date);

    res.json({
      date,
      shopId,
      summary,
      sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales/shop/:shopId/monthly/:year/:month
// @desc    Get monthly sales report
// @access  Private
router.get('/shop/:shopId/monthly/:year/:month', protect, async (req, res) => {
  try {
    const { shopId, year, month } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales for this shop' });
    }

    const { sales, summary } = await Sale.getMonthlySalesReport(shopId, parseInt(year), parseInt(month));

    res.json({
      shopId,
      year: parseInt(year),
      month: parseInt(month),
      summary,
      sales: sales.slice(0, 100) // Limit to 100 sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales/shop/:shopId/top-products
// @desc    Get top selling products
// @access  Private
router.get('/shop/:shopId/top-products', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { limit = 10 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view sales for this shop' });
    }

    const topProducts = await Sale.getTopSellingProducts(shopId, parseInt(limit));

    res.json({
      count: topProducts.length,
      topProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales/employee/:employeeId
// @desc    Get sales by employee
// @access  Private
router.get('/employee/:employeeId', protect, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(employee.shopId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view sales for this employee' });
    }

    const sales = await Sale.getSalesByEmployee(employeeId, startDate, endDate);

    // Calculate employee sales summary
    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      totalCommission: sales.reduce((sum, s) => sum + (s.commissionEarned || 0), 0),
      averageSaleValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0
    };

    res.json({
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.userId?.name || 'N/A',
        designation: employee.designation
      },
      summary,
      sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;