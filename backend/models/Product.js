const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'Please provide selling price'],
    min: 0
  },
  costPrice: {
    type: Number,
    required: [true, 'Please provide cost price'],
    min: 0
  },
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'litre', 'box', 'packet', 'meter', 'dozen'],
    default: 'pcs'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.price && this.costPrice) {
    return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
