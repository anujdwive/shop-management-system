const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please associate reminder with a shop']
  },
  // Reminder Details
  title: {
    type: String,
    required: [true, 'Please provide reminder title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide reminder description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  // Categorization
  type: {
    type: String,
    enum: ['payment', 'meeting', 'order', 'delivery', 'license', 'appointment', 'task', 'other'],
    required: [true, 'Please specify reminder type']
  },
  category: {
    type: String,
    trim: String
  },
  // Priority & Status
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'],
    default: 'pending'
  },
  // Due Date & Time
  dueDate: {
    type: Date,
    required: [true, 'Please provide due date']
  },
  dueTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
  },
  // Reminder Settings
  reminderDate: {
    type: Date
  },
  reminderDaysBefore: {
    type: Number,
    default: 1,
    min: [0, 'Reminder days cannot be negative'],
    max: [30, 'Reminder cannot be more than 30 days before']
  },
  reminderFrequency: {
    type: String,
    enum: ['once', 'daily', 'weekly'],
    default: 'once'
  },
  // Assigned To
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Reference to other entities
  referenceType: {
    type: String,
    enum: ['dealer', 'customer', 'employee', 'vendor', 'expense', 'sale', 'other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceDetails: {
    name: String,
    identifier: String,
    amount: Number,
    notes: String
  },
  // Completion Tracking
  completedDate: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: {
    type: String,
    trim: true
  },
  // Recurring Reminders
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
  nextReminderDate: {
    type: Date
  },
  // Additional Info
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Notifications
  notificationsSent: {
    type: Boolean,
    default: false
  },
  lastNotificationDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reminderSchema.index({ shopId: 1, dueDate: 1, status: 1 });
reminderSchema.index({ shopId: 1, type: 1, status: 1 });
reminderSchema.index({ assignedTo: 1, dueDate: 1, status: 1 });
reminderSchema.index({ dueDate: 1, status: 1 });
reminderSchema.index({ priority: 1, dueDate: 1 });
reminderSchema.index({ createdBy: 1, dueDate: -1 });
reminderSchema.index({ nextReminderDate: 1, isRecurring: 1 });

// Virtual to check if reminder is overdue
reminderSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate < new Date();
});

// Virtual to check if reminder is high priority
reminderSchema.virtual('isHighPriority').get(function() {
  return ['urgent', 'high'].includes(this.priority);
});

// Virtual to get days until due
reminderSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(this.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to calculate reminder date and check status
reminderSchema.pre('save', function(next) {
  // Calculate reminder date
  if (this.dueDate && !this.reminderDate) {
    this.reminderDate = new Date(this.dueDate);
    if (this.reminderDaysBefore > 0) {
      this.reminderDate.setDate(this.reminderDate.getDate() - this.reminderDaysBefore);
    }
  }

  // Update status to overdue if past due date
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }

  // Set next reminder date for recurring reminders
  if (this.isRecurring && (!this.nextReminderDate || this.nextReminderDate < new Date())) {
    this.nextReminderDate = this.calculateNextReminderDate();
  }

  next();
});

// Instance method to calculate next reminder date for recurring reminders
reminderSchema.methods.calculateNextReminderDate = function() {
  if (!this.isRecurring) return null;

  const baseDate = this.dueDate || new Date();
  let nextDate = new Date(baseDate);

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

// Static method to get pending reminders
reminderSchema.statics.getPendingReminders = async function(shopId) {
  return await this.find({
    shopId,
    status: 'pending'
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get overdue reminders
reminderSchema.statics.getOverdueReminders = async function(shopId) {
  return await this.find({
    shopId,
    status: 'overdue'
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get due reminders (within next N days)
reminderSchema.statics.getDueReminders = async function(shopId, days = 7) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  return await this.find({
    shopId,
    dueDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['pending', 'overdue'] }
  })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get reminders by type
reminderSchema.statics.getRemindersByType = async function(shopId, type) {
  return await this.find({
    shopId,
    type,
    status: { $ne: 'cancelled' }
  })
    .populate('assignedTo', 'name email')
    .sort({ dueDate: -1 });
};

// Static method to get reminders by priority
reminderSchema.statics.getRemindersByPriority = async function(shopId, priority) {
  return await this.find({
    shopId,
    priority,
    status: { $in: ['pending', 'overdue'] }
  })
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get recurring reminders due
reminderSchema.statics.getRecurringRemindersDue = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await this.find({
    isRecurring: true,
    nextReminderDate: {
      $lte: today
    },
    status: { $ne: 'cancelled' }
  });
};

// Static method to get assigned reminders for user
reminderSchema.statics.getAssignedReminders = async function(userId, status = 'pending') {
  return await this.find({
    assignedTo: userId,
    status: status === 'all' ? { $ne: 'completed' } : status
  })
    .populate('shopId', 'name location')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
};

// Instance method to mark as complete
reminderSchema.methods.markAsComplete = async function(completedBy, completionNotes) {
  this.status = 'completed';
  this.completedDate = new Date();
  this.completedBy = completedBy;
  if (completionNotes) this.completionNotes = completionNotes;
  await this.save();
};

// Instance method to mark as in progress
reminderSchema.methods.markAsInProgress = async function() {
  this.status = 'in_progress';
  await this.save();
};

// Instance method to cancel
reminderSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  if (reason) this.completionNotes = reason;
  await this.save();
};

// Instance method to snooze
reminderSchema.methods.snooze = async function(newDueDate, reason) {
  this.dueDate = newDueDate;
  this.status = 'pending';
  if (reason) this.notes = reason;
  await this.save();
};

// Instance method to update priority
reminderSchema.methods.updatePriority = async function(newPriority) {
  this.priority = newPriority;
  await this.save();
};

module.exports = mongoose.model('Reminder', reminderSchema);