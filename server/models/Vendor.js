const mongoose = require('mongoose');

const fabricColorSchema = new mongoose.Schema({
  color_name: {
    type: String,
    required: true
  },
  color_hex: {
    type: String,
    default: '#000000'
  },
  color_weight: {
    type: Number,
    required: true
  }
});

const fabricDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  weight_type: {
    type: String,
    required: true,
    enum: ['kg', 'meter'],
    default: 'kg'
  },
  total_weight: {
    type: Number,
    required: true
  },
  remarks: {
    type: String
  },
  fabricColors: [fabricColorSchema]
});

// Add a virtual for calculating total color weight
fabricDetailSchema.virtual('totalColorWeight').get(function() {
  if (!this.fabricColors || !Array.isArray(this.fabricColors)) {
    return 0;
  }
  return this.fabricColors.reduce((sum, color) => sum + (color.color_weight || 0), 0);
});

// Enable virtuals for fabricDetailSchema
fabricDetailSchema.set('toJSON', { virtuals: true });
fabricDetailSchema.set('toObject', { virtuals: true });

const vendorSchema = new mongoose.Schema({
  shop_name: {
    type: String,
    required: true
  },
  party_name: {
    type: String,
    required: true
  },
  contact_number: {
    type: String
  },
  address: {
    type: String
  },
  gstin: {
    type: String
  },
  date_time: {
    type: Date,
    default: Date.now
  },
  bill_no: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Pending'
  },
  payment_amount: {
    type: Number,
    default: 0
  },
  fabricDetails: [fabricDetailSchema]
}, {
  timestamps: true
});

// Add a virtual field for total fabric weight
vendorSchema.virtual('totalWeight').get(function() {
  // Add safety check for undefined fabricDetails
  if (!this.fabricDetails || !Array.isArray(this.fabricDetails)) {
    return 0;
  }
  return this.fabricDetails.reduce((total, fabric) => total + (fabric.total_weight || 0), 0);
});

// Ensure virtuals are included in JSON output
vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vendor', vendorSchema); 