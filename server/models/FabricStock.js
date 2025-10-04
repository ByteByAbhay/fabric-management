const mongoose = require('mongoose');

const fabricStockSchema = new mongoose.Schema({
  fabric_name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  color_hex: {
    type: String,
    default: '#3498db' // Default blue color
  },
  current_quantity: {
    type: Number,
    required: true,
    default: 0
  },
  standard_weight: {
    type: Number,
    default: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for fabric name and color to ensure uniqueness
fabricStockSchema.index({ fabric_name: 1, color: 1 }, { unique: true });

module.exports = mongoose.model('FabricStock', fabricStockSchema); 