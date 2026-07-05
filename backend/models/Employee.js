const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate employee with a user']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate employee with a shop']
  },
  employeeId: {
    type: String,
    required: [true, 'Please provide an employee ID'],
    unique: true,
    trim: true,
    uppercase: true
  },
  // Employment Details
  designation: {
    type: String,
    required: [true, 'Please provide designation'],
    trim: true,
    enum: ['Manager', 'Sales Executive', 'Worker', 'Accountant', 'Store Keeper', 'Other']
  },
  department: {
    type: String,
    trim: true
  },
  // Salary Details
  salary: {
    type: Number,
    required: [true, 'Please provide salary amount'],
    min: [0, 'Salary cannot be negative']
  },
  salaryType: {
    type: String,
    enum: ['monthly', 'daily', 'hourly', 'commission_based'],
    default: 'monthly'
  },
  // Sales & Commission
  salesTarget: {
    type: Number,
    default: 0,
    min: [0, 'Sales target cannot be negative']
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  // Work Schedule
  workSchedule: {
    workDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    shiftStart: {
      type: String,
      default: '09:00'
    },
    shiftEnd: {
      type: String,
      default: '18:00'
    }
  },
  // Bank Details for salary payment
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  // Documents
  documents: {
    aadharNumber: String,
    panNumber: String,
    aadharCardUrl: String,
    panCardUrl: String,
    otherDocuments: [{
      name: String,
      url: String
    }]
  },
  // Status & Tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  leaveDate: {
    type: Date
  },
  // Performance Tracking
  performance: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
employeeSchema.index({ shopId: 1, status: 1 });
employeeSchema.index({ userId: 1 });
// employeeId index is automatically created by unique: true
employeeSchema.index({ designation: 1 });
employeeSchema.index({ shopId: 1, status: 1, joinDate: -1 });

// Virtual to check if employee is active
employeeSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual to calculate total earnings (salary + commission)
employeeSchema.virtual('totalEarnings').get(function() {
  return this.salary + this.totalCommission;
});

// Virtual to check if sales target is met
employeeSchema.virtual('salesTargetMet').get(function() {
  return this.performance.totalSales >= this.salesTarget;
});

// Pre-save middleware to update status based on dates
employeeSchema.pre('save', function(next) {
  if (this.leaveDate && this.status === 'active') {
    this.status = 'terminated';
  }
  next();
});

// Static method to get employees by shop
employeeSchema.statics.getEmployeesByShop = async function(shopId, status = 'active') {
  const query = { shopId };
  if (status) {
    query.status = status;
  }
  return await this.find(query)
    .populate('userId', 'name email phone')
    .populate('shopId', 'name location')
    .sort({ joinDate: -1 });
};

// Static method to get top performers
employeeSchema.statics.getTopPerformers = async function(shopId, limit = 5) {
  return await this.find({ shopId, status: 'active' })
    .sort({ 'performance.totalSales': -1 })
    .limit(limit)
    .populate('userId', 'name email phone')
    .populate('shopId', 'name location');
};

// Instance method to update performance
employeeSchema.methods.updatePerformance = async function(salesAmount) {
  this.performance.totalSales += salesAmount;
  this.performance.totalTransactions += 1;
  await this.save();
};

// Instance method to calculate commission
employeeSchema.methods.calculateCommission = function(salesAmount) {
  if (this.commissionRate > 0) {
    const commission = (salesAmount * this.commissionRate) / 100;
    this.totalCommission += commission;
    return commission;
  }
  return 0;
};

module.exports = mongoose.model('Employee', employeeSchema);