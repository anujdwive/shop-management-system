const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate meeting with a shop']
  },
  // Meeting Details
  title: {
    type: String,
    required: [true, 'Please provide meeting title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  // Meeting Type & Participant
  meetingType: {
    type: String,
    enum: ['dealer', 'customer', 'employee', 'vendor', 'government', 'other'],
    required: [true, 'Please specify meeting type']
  },
  withName: {
    type: String,
    required: [true, 'Please provide participant name'],
    trim: true
  },
  contact: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  // Schedule
  date: {
    type: Date,
    required: [true, 'Please provide meeting date']
  },
  time: {
    type: String,
    required: [true, 'Please provide meeting time'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 60,
    min: [5, 'Duration must be at least 5 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  endTime: {
    type: Date
  },
  // Location
  location: {
    type: String,
    enum: ['shop', 'office', 'client_location', 'phone_call', 'video_call', 'other'],
    default: 'shop'
  },
  locationDetails: {
    type: String,
    trim: String
  },
  meetingLink: {
    type: String,
    trim: true
  },
  // Agenda & Notes
  agenda: [{
    topic: String,
    description: String,
    duration: Number,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  // Status Tracking
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  reminder: {
    type: Boolean,
    default: true
  },
  reminderMinutes: {
    type: Number,
    default: 30,
    min: [5, 'Reminder must be at least 5 minutes before'],
    max: [1440, 'Reminder cannot be more than 24 hours before']
  },
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpNotes: {
    type: String,
    trim: true
  },
  // Outcome
  outcome: {
    type: String,
    enum: ['successful', 'partially_successful', 'unsuccessful', 'cancelled', 'postponed'],
    required: function() {
      return ['completed', 'cancelled', 'no_show'].includes(this.status);
    }
  },
  outcomeNotes: {
    type: String,
    trim: true
  },
  // Next Meeting
  nextMeetingDate: {
    type: Date
  },
  nextMeetingNotes: {
    type: String,
    trim: true
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Participants
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['organizer', 'attendee', 'note_taker', 'observer']
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'tentative'],
      default: 'invited'
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
meetingSchema.index({ shopId: 1, date: 1, time: 1 });
meetingSchema.index({ shopId: 1, status: 1, date: 1 });
meetingSchema.index({ createdBy: 1, date: -1 });
meetingSchema.index({ date: 1, status: 1 });
meetingSchema.index({ meetingType: 1, date: -1 });

// Virtual to check if meeting is upcoming
meetingSchema.virtual('isUpcoming').get(function() {
  return this.status === 'scheduled' || this.status === 'confirmed';
});

// Virtual to check if meeting is overdue
meetingSchema.virtual('isOverdue').get(function() {
  const meetingDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return meetingDateTime < new Date() && this.status === 'scheduled';
});

// Virtual to get meeting duration in hours
meetingSchema.virtual('durationInHours').get(function() {
  return (this.duration / 60).toFixed(1);
});

// Pre-save middleware to calculate end time
meetingSchema.pre('save', function(next) {
  if (this.date && this.time) {
    const meetingDateTime = new Date(this.date);
    const [hours, minutes] = this.time.split(':');
    meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (this.duration) {
      this.endTime = new Date(meetingDateTime.getTime() + this.duration * 60000);
    }
  }

  // Auto-update status if meeting time has passed
  if (this.isOverdue && this.status === 'scheduled') {
    this.status = 'no_show';
  }

  next();
});

// Static method to get upcoming meetings
meetingSchema.statics.getUpcomingMeetings = async function(shopId, days = 7) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  return await this.find({
    shopId,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });
};

// Static method to get meetings by date range
meetingSchema.statics.getMeetingsByDateRange = async function(shopId, startDate, endDate) {
  return await this.find({
    shopId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });
};

// Static method to get meetings by type
meetingSchema.statics.getMeetingsByType = async function(shopId, meetingType) {
  return await this.find({
    shopId,
    meetingType,
    status: { $ne: 'cancelled' }
  })
    .populate('createdBy', 'name email')
    .sort({ date: -1 });
};

// Static method to get today's meetings
meetingSchema.statics.getTodaysMeetings = async function(shopId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await this.find({
    shopId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
  })
    .populate('createdBy', 'name email')
    .sort({ time: 1 });
};

// Static method to get overdue meetings
meetingSchema.statics.getOverdueMeetings = async function(shopId) {
  const now = new Date();

  const meetings = await this.find({
    shopId,
    status: 'scheduled',
    date: { $lt: now }
  })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });

  return meetings;
};

// Instance method to confirm meeting
meetingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  await this.save();
};

// Instance method to start meeting
meetingSchema.methods.start = async function() {
  this.status = 'in_progress';
  await this.save();
};

// Instance method to complete meeting
meetingSchema.methods.complete = async function(outcome, outcomeNotes) {
  this.status = 'completed';
  if (outcome) this.outcome = outcome;
  if (outcomeNotes) this.outcomeNotes = outcomeNotes;
  await this.save();
};

// Instance method to cancel meeting
meetingSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  if (reason) this.outcomeNotes = reason;
  await this.save();
};

module.exports = mongoose.model('Meeting', meetingSchema);