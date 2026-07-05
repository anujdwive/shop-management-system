const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate expense with a shop']
  },
  // Expense Details
  expenseNumber: {
    type: String,
    required: [true, 'Please provide expense number'],
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    required: [true, 'Please provide expense title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide expense description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  // Categorization
  category: {
    type: String,
    required: [true, 'Please provide expense category'],
    enum: [
      'rent',
      'utilities',
      'salary',
      'inventory',
      'marketing',
      'maintenance',
      'transportation',
      'office_supplies',
      'insurance',
      'taxes',
      'loan_payment',
      'miscellaneous'
    ]
  },
  subCategory: {
    type: String,
    trim: true
  },
  // Financial Details
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Date & Period
  expenseDate: {
    type: Date,
    required: [true, 'Please provide expense date'],
    default: Date.now
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'auto_debit'],
    required: [true, 'Please provide payment method']
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'overdue'],
    default: 'paid'
  },
  paymentDetails: {
    transactionId: String,
    cardNumber: String,
    bankName: String,
    chequeNumber: String,
    upiId: String,
    accountNumber: String,
    ifscCode: String,
    paidTo: String,
    recipientName: String,
    recipientAccount: String
  },
  // Recurring Expenses
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'],
    required: function() {
      return this.isRecurring;
    }
  },
  recurrenceEndDate: {
    type: Date
  },
  nextDueDate: {
    type: Date
  },
  // Approval & Status
  status: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Supporting Documents
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  receiptNumber: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  vendorName: {
    type: String,
    trim: true
  },
  vendorDetails: {
    name: String,
    phone: String,
    email: String,
    address: String,
    gstin: String
  },
  // Budget Tracking
  budgetCategory: {
    type: String,
    trim: true
  },
  budgetAmount: {
    type: Number,
    min: [0, 'Budget amount cannot be negative']
  },
  isBudgetExceeded: {
    type: Boolean,
    default: false
  },
  // Tax Information
  taxAmount: {
    type: Number,
    default: 0
  },
  taxType: {
    type: String,
    enum: ['gst', 'vat', 'service_tax', 'income_tax', 'other'],
    required: function() {
      return this.taxAmount > 0;
    }
  },
  taxIncluded: {
    type: Boolean,
    default: false
  },
  // Additional Info
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference to other records
  referenceType: {
    type: String,
    enum: ['sale', 'purchase', 'maintenance', 'other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
expenseSchema.index({ shopId: 1, expenseDate: -1 });
expenseSchema.index({ category: 1, expenseDate: -1 });
expenseSchema.index({ status: 1, expenseDate: -1 });
expenseSchema.index({ paymentStatus: 1, dueDate: 1 });
expenseSchema.index({ isRecurring: 1, nextDueDate: 1 });
expenseSchema.index({ createdBy: 1, expenseDate: -1 });

// Compound index for unique expense numbers per shop
expenseSchema.index({ shopId: 1, expenseNumber: 1 }, { unique: true });

// Virtual to check if expense is overdue
expenseSchema.virtual('isOverdue').get(function() {
  return this.paymentStatus === 'pending' && this.expenseDate < new Date();
});

// Virtual to get total amount including tax
expenseSchema.virtual('totalAmount').get(function() {
  if (this.taxIncluded) {
    return this.amount;
  }
  return this.amount + this.taxAmount;
});

// Pre-save middleware to handle recurring expenses
expenseSchema.pre('save', function(next) {
  // Check if budget is exceeded
  if (this.budgetAmount && this.amount > this.budgetAmount) {
    this.isBudgetExceeded = true;
  }

  // Set next due date for recurring expenses
  if (this.isRecurring && !this.nextDueDate) {
    this.nextDueDate = this.calculateNextDueDate();
  }

  // Check if payment is overdue
  if (this.paymentStatus === 'pending' && this.expenseDate < new Date()) {
    this.paymentStatus = 'overdue';
  }

  next();
});

// Instance method to calculate next due date for recurring expenses
expenseSchema.methods.calculateNextDueDate = function() {
  if (!this.isRecurring) return null;

  const currentDate = this.expenseDate || new Date();
  let nextDate = new Date(currentDate);

  switch (this.recurrencePattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  // Check if recurrence end date is reached
  if (this.recurrenceEndDate && nextDate > this.recurrenceEndDate) {
    return null;
  }

  return nextDate;
};

// Static method to get expenses by date range
expenseSchema.statics.getExpensesByDateRange = async function(shopId, startDate, endDate) {
  const query = {
    shopId,
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  return await this.find(query)
    .populate('approvedBy', 'name email')
    .populate('createdBy', 'name email')
    .sort({ expenseDate: -1 });
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(shopId, category, startDate, endDate) {
  const query = {
    shopId,
    category
  };

  if (startDate && endDate) {
    query.expenseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return await this.find(query)
    .sort({ expenseDate: -1 });
};

// Static method to get pending expenses
expenseSchema.statics.getPendingExpenses = async function(shopId) {
  return await this.find({
    shopId,
    paymentStatus: { $in: ['pending', 'overdue'] }
  })
    .sort({ expenseDate: 1 });
};

// Static method to get recurring expenses due
expenseSchema.statics.getRecurringExpensesDue = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await this.find({
    isRecurring: true,
    nextDueDate: {
      $lte: today
    },
    status: { $ne: 'cancelled' }
  });
};

// Static method to get expense summary by category
expenseSchema.statics.getExpenseSummaryByCategory = async function(shopId, startDate, endDate) {
  const expenses = await this.find({
    shopId,
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'approved'
  });

  const summary = {};
  expenses.forEach(expense => {
    if (!summary[expense.category]) {
      summary[expense.category] = {
        category: expense.category,
        count: 0,
        totalAmount: 0,
        totalTax: 0
      };
    }
    summary[expense.category].count += 1;
    summary[expense.category].totalAmount += expense.amount;
    summary[expense.category].totalTax += expense.taxAmount || 0;
  });

  return Object.values(summary).sort((a, b) => b.totalAmount - a.totalAmount);
};

// Static method to get monthly expense report
expenseSchema.statics.getMonthlyExpenseReport = async function(shopId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const expenses = await this.find({
    shopId,
    expenseDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'approved'
  });

  const summary = {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    totalTax: expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0),
    paidExpenses: expenses.filter(e => e.paymentStatus === 'paid').length,
    pendingExpenses: expenses.filter(e => e.paymentStatus === 'pending').length,
    overdueExpenses: expenses.filter(e => e.paymentStatus === 'overdue').length,
    recurringExpenses: expenses.filter(e => e.isRecurring).length,
    budgetExceeded: expenses.filter(e => e.isBudgetExceeded).length
  };

  return { expenses, summary };
};

// Instance method to approve expense
expenseSchema.methods.approve = async function(approvedBy, notes) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  await this.save();
};

// Instance method to reject expense
expenseSchema.methods.reject = async function(approvedBy, reason) {
  this.status = 'rejected';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
};

// Instance method to mark as paid
expenseSchema.methods.markAsPaid = async function(paymentDetails) {
  this.paymentStatus = 'paid';
  this.status = 'paid';
  if (paymentDetails) {
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
  }
  await this.save();
};

module.exports = mongoose.model('Expense', expenseSchema);