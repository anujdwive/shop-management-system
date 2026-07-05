const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a dealer name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true,
    maxlength: [20, 'Phone cannot be more than 20 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate dealer with a shop']
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: [0, 'Current balance cannot be negative']
  },
  // Available credit = creditLimit - currentBalance
  availableCredit: {
    type: Number,
    default: 0
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  lastTransactionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
dealerSchema.index({ shopId: 1, status: 1 });
dealerSchema.index({ phone: 1 });
dealerSchema.index({ name: 1, shopId: 1 });

// Virtual to calculate available credit
dealerSchema.virtual('creditUsed').get(function() {
  return this.currentBalance;
});

// Virtual to check if dealer has exceeded credit limit
dealerSchema.virtual('hasExceededCredit').get(function() {
  return this.currentBalance >= this.creditLimit;
});

// Method to update balance
dealerSchema.methods.updateBalance = async function(amount, type) {
  if (type === 'credit') {
    // Increase balance (dealer owes more)
    this.currentBalance += amount;
  } else if (type === 'debit') {
    // Decrease balance (dealer pays)
    this.currentBalance -= amount;
    if (this.currentBalance < 0) this.currentBalance = 0;
  }

  this.lastTransactionDate = new Date();
  this.availableCredit = this.creditLimit - this.currentBalance;
  await this.save();
};

// Pre-save middleware to calculate available credit
dealerSchema.pre('save', function(next) {
  this.availableCredit = this.creditLimit - this.currentBalance;
  next();
});

module.exports = mongoose.model('Dealer', dealerSchema);