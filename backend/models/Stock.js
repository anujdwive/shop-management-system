const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Please provide shop']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please provide product']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lowStockAlert: {
    type: Boolean,
    default: false
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

// Compound index for shop + product (unique combination)
stockSchema.index({ shop: 1, product: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
stockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastUpdated = Date.now();

  // Check if stock is below minimum level
  this.populate('product').then(() => {
    if (this.product && this.quantity <= this.product.minStockLevel) {
      this.lowStockAlert = true;
    } else {
      this.lowStockAlert = false;
    }
    next();
  }).catch(() => next());
});

module.exports = mongoose.model('Stock', stockSchema);
