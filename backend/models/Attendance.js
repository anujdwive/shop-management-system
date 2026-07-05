const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please associate attendance with an employee']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate attendance with a shop']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate attendance with a user']
  },
  // Date and Time
  date: {
    type: Date,
    required: [true, 'Please provide date'],
    set: function(val) {
      // Set to midnight of the provided date
      return new Date(new Date(val).setHours(0, 0, 0, 0));
    }
  },
  checkIn: {
    type: Date,
    required: [true, 'Please provide check-in time']
  },
  checkOut: {
    type: Date
  },
  // Attendance Status
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'early_exit'],
    default: 'present'
  },
  leaveType: {
    type: String,
    enum: ['sick_leave', 'casual_leave', 'earned_leave', 'compensatory_leave'],
    required: function() {
      return this.status === 'on_leave';
    }
  },
  // Work Hours Calculation
  workHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  // Location/Device Info
  checkInLocation: {
    type: String,
    trim: true
  },
  checkOutLocation: {
    type: String,
    trim: true
  },
  deviceInfo: {
    type: String,
    trim: true
  },
  // Notes & Approval
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reason cannot be more than 200 characters']
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ shopId: 1, date: -1 });
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ shopId: 1, date: 1, status: 1 });

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Virtual to check if attendance is complete
attendanceSchema.virtual('isComplete').get(function() {
  return this.checkOut !== null && this.checkOut !== undefined;
});

// Virtual to calculate duration
attendanceSchema.virtual('duration').get(function() {
  if (this.checkOut && this.checkIn) {
    const duration = this.checkOut - this.checkIn;
    return Math.floor(duration / (1000 * 60 * 60)); // Return in hours
  }
  return 0;
});

// Pre-save middleware to calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkOut && this.checkIn) {
    const duration = this.checkOut - this.checkIn;
    this.workHours = Math.floor((duration / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimals

    // Calculate overtime (assuming 8 hours is standard work day)
    if (this.workHours > 8) {
      this.overtimeHours = this.workHours - 8;
    }
  }

  // Determine if late (assuming 9:00 AM is standard start time)
  if (this.checkIn) {
    const checkInHour = this.checkIn.getHours();
    const checkInMinute = this.checkIn.getMinutes();
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
      this.isLate = true;
      this.lateMinutes = (checkInHour - 9) * 60 + checkInMinute;
      if (this.status !== 'on_leave' && this.status !== 'absent') {
        this.status = 'late';
      }
    }
  }

  next();
});

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = async function(shopId, startDate, endDate) {
  const query = {
    shopId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  return await this.find(query)
    .populate('employeeId', 'employeeId designation')
    .populate('userId', 'name email')
    .sort({ date: -1, checkIn: -1 });
};

// Static method to get daily attendance report
attendanceSchema.statics.getDailyAttendanceReport = async function(shopId, date) {
  const attendance = await this.find({
    shopId,
    date: new Date(date)
  })
    .populate('employeeId', 'employeeId designation')
    .populate('userId', 'name email')
    .sort({ checkIn: 1 });

  const summary = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    halfDay: attendance.filter(a => a.status === 'half_day').length,
    onLeave: attendance.filter(a => a.status === 'on_leave').length
  };

  return { attendance, summary };
};

// Static method to get employee attendance history
attendanceSchema.statics.getEmployeeAttendanceHistory = async function(employeeId, limit = 30) {
  return await this.find({ employeeId })
    .populate('shopId', 'name location')
    .sort({ date: -1 })
    .limit(limit);
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlyAttendanceSummary = async function(shopId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendance = await this.find({
    shopId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });

  const summary = {
    totalDays: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    halfDay: attendance.filter(a => a.status === 'half_day').length,
    onLeave: attendance.filter(a => a.status === 'on_leave').length,
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
    totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
  };

  return summary;
};

// Instance method to mark check-out
attendanceSchema.methods.markCheckOut = async function(checkOutData = {}) {
  this.checkOut = checkOutData.time || new Date();
  this.checkOutLocation = checkOutData.location;
  this.notes = checkOutData.notes || this.notes;
  await this.save();
};

module.exports = mongoose.model('Attendance', attendanceSchema);