const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['in', 'out', 'transfer'],
    required: [true, 'Please provide transaction type']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 1
  },
  referenceType: {
    type: String,
    enum: ['purchase', 'sale', 'damage', 'transfer', 'adjustment', 'return'],
    required: [true, 'Please provide reference type']
  },
  referenceId: {
    type: String,
    trim: true
  },
  fromShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  toShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user who created this transaction']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
stockTransactionSchema.index({ shop: 1, createdAt: -1 });
stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
