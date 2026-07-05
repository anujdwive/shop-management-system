const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: [true, 'Please associate transaction with a dealer']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate transaction with a shop']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Please specify transaction type']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide transaction amount'],
    min: [0, 'Amount cannot be negative']
  },
  // Balance after this transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  // Transaction reference
  referenceType: {
    type: String,
    enum: ['purchase', 'payment', 'adjustment', 'return', 'other'],
    default: 'other'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide transaction description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  // Payment tracking
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  // Payment details (for debit transactions)
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'online'],
    required: function() {
      return this.type === 'debit';
    }
  },
  paymentDetails: {
    transactionId: String,
    chequeNumber: String,
    bankName: String,
    accountNumber: String,
    notes: String
  },
  // User who created this transaction
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Additional attachments or references
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
financeTransactionSchema.index({ dealerId: 1, createdAt: -1 });
financeTransactionSchema.index({ shopId: 1, status: 1 });
financeTransactionSchema.index({ dueDate: 1, status: 1 });
financeTransactionSchema.index({ type: 1, createdAt: -1 });
financeTransactionSchema.index({ status: 1, dueDate: 1 });

// Virtual to check if payment is overdue
financeTransactionSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate && new Date(this.dueDate) < new Date();
});

// Pre-save middleware to update status based on dates
financeTransactionSchema.pre('save', function(next) {
  // Update status to overdue if past due date and still pending
  if (this.status === 'pending' && this.dueDate && new Date(this.dueDate) < new Date()) {
    this.status = 'overdue';
  }

  // If paid date is set, ensure status is paid
  if (this.paidDate && (this.status === 'pending' || this.status === 'partial' || this.status === 'overdue')) {
    this.status = 'paid';
  }

  next();
});

// Static method to get pending payments
financeTransactionSchema.statics.getPendingPayments = async function(shopId) {
  const query = {
    type: 'credit',
    status: { $in: ['pending', 'overdue'] }
  };

  if (shopId) {
    query.shopId = shopId;
  }

  return await this.find(query)
    .populate('dealerId', 'name phone email')
    .populate('shopId', 'name location')
    .sort({ dueDate: 1 });
};

// Static method to get overdue payments
financeTransactionSchema.statics.getOverduePayments = async function(shopId) {
  const query = {
    type: 'credit',
    status: 'overdue',
    dueDate: { $lt: new Date() }
  };

  if (shopId) {
    query.shopId = shopId;
  }

  return await this.find(query)
    .populate('dealerId', 'name phone email')
    .populate('shopId', 'name location')
    .sort({ dueDate: 1 });
};

// Instance method to mark as paid
financeTransactionSchema.methods.markAsPaid = async function(paymentDetails = {}) {
  this.status = 'paid';
  this.paidDate = new Date();

  if (paymentDetails.paymentMethod) {
    this.paymentMethod = paymentDetails.paymentMethod;
  }

  if (paymentDetails.paymentDetails) {
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails.paymentDetails };
  }

  await this.save();
};

module.exports = mongoose.model('FinanceTransaction', financeTransactionSchema);