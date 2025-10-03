const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'food', 'books', 'home', 'other']
  },
  images: [{
    type: String // URLs to product images
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);