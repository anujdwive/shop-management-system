const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate sale with a shop']
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please associate sale with an employee']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate sale with a user']
  },
  // Sale Details
  invoiceNumber: {
    type: String,
    required: [true, 'Please provide invoice number'],
    unique: true,
    trim: true,
    uppercase: true
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  // Customer Information
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  // Items Sold
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    tax: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit', 'mixed'],
    required: [true, 'Please provide payment method']
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'refunded'],
    default: 'paid'
  },
  paymentDetails: {
    transactionId: String,
    cardNumber: String,
    bankName: String,
    chequeNumber: String,
    upiId: String,
    notes: String
  },
  // Commission & Performance
  commissionEarned: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  // Delivery & Status
  deliveryType: {
    type: String,
    enum: ['store_pickup', 'home_delivery', 'digital'],
    default: 'store_pickup'
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'delivered'
  },
  deliveryDate: {
    type: Date
  },
  // Status & Notes
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'returned'],
    default: 'completed'
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  returnReason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // References
  referencedStockTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockTransaction'
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
saleSchema.index({ shopId: 1, saleDate: -1 });
saleSchema.index({ employeeId: 1, saleDate: -1 });
// invoiceNumber index is automatically created by unique: true
saleSchema.index({ paymentStatus: 1, saleDate: -1 });
saleSchema.index({ status: 1, saleDate: -1 });
saleSchema.index({ customerPhone: 1 });

// Virtual to calculate total items
saleSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual to check if sale is profitable
saleSchema.virtual('isProfitable').get(function() {
  return this.profit > 0;
});

// Pre-save middleware to calculate totals
saleSchema.pre('save', function(next) {
  // Calculate subtotal from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      return sum + (itemSubtotal - itemDiscount);
    }, 0);
  }

  // Calculate total amount
  const totalBeforeDiscount = this.subtotal + this.taxAmount;
  this.totalAmount = totalBeforeDiscount - this.discount;

  // Calculate profit margin
  if (this.totalAmount > 0 && this.profit > 0) {
    this.profitMargin = (this.profit / this.totalAmount) * 100;
  }

  next();
});

// Static method to get sales by date range
saleSchema.statics.getSalesByDateRange = async function(shopId, startDate, endDate) {
  const query = {
    shopId,
    saleDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  return await this.find(query)
    .populate('employeeId', 'employeeId designation')
    .populate('userId', 'name email')
    .populate('createdBy', 'name email')
    .sort({ saleDate: -1 });
};

// Static method to get sales by employee
saleSchema.statics.getSalesByEmployee = async function(employeeId, startDate, endDate) {
  const query = { employeeId };
  if (startDate && endDate) {
    query.saleDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  return await this.find(query)
    .populate('shopId', 'name location')
    .sort({ saleDate: -1 });
};

// Static method to get daily sales report
saleSchema.statics.getDailySalesReport = async function(shopId, date) {
  const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

  const sales = await this.find({
    shopId,
    saleDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: 'completed'
  });

  const summary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalProfit: sales.reduce((sum, s) => sum + (s.profit || 0), 0),
    totalItemsSold: sales.reduce((sum, s) => sum + s.totalItems, 0),
    cashSales: sales.filter(s => s.paymentMethod === 'cash').length,
    cardSales: sales.filter(s => s.paymentMethod === 'card').length,
    upiSales: sales.filter(s => s.paymentMethod === 'upi').length,
    averageSaleValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0
  };

  return { sales, summary };
};

// Static method to get monthly sales report
saleSchema.statics.getMonthlySalesReport = async function(shopId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const sales = await this.find({
    shopId,
    saleDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'completed'
  });

  const summary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalProfit: sales.reduce((sum, s) => sum + (s.profit || 0), 0),
    averageProfitMargin: sales.length > 0 ? sales.reduce((sum, s) => sum + (s.profitMargin || 0), 0) / sales.length : 0,
    totalItemsSold: sales.reduce((sum, s) => sum + s.totalItems, 0),
    totalCommissionPaid: sales.reduce((sum, s) => sum + (s.commissionEarned || 0), 0)
  };

  return { sales, summary };
};

// Static method to get top selling products
saleSchema.statics.getTopSellingProducts = async function(shopId, limit = 10) {
  const sales = await this.find({ shopId, status: 'completed' });

  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      productSales[item.productId].totalQuantity += item.quantity;
      productSales[item.productId].totalRevenue += item.subtotal;
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
};

// Instance method to calculate commission
saleSchema.methods.calculateCommission = async function(employee) {
  if (employee && employee.commissionRate > 0) {
    const commission = (this.totalAmount * employee.commissionRate) / 100;
    this.commissionEarned = commission;

    // Update employee's total commission
    employee.totalCommission += commission;
    await employee.save();

    return commission;
  }
  return 0;
};

// Instance method to update employee performance
saleSchema.methods.updateEmployeePerformance = async function() {
  const Employee = require('./Employee');
  const employee = await Employee.findById(this.employeeId);
  if (employee) {
    await employee.updatePerformance(this.totalAmount);
    await employee.calculateCommission(this.totalAmount);
  }
};

module.exports = mongoose.model('Sale', saleSchema);