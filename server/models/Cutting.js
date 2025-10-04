const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_no: {
    type: String,
    required: true
  },
  role_weight: {
    type: Number,
    required: true
  },
  role_color: {
    type: String,
    required: true
  },
  layers_cut: {
    type: Number,
    default: 0
  },
  pieces_cut: {
    type: Number,
    default: 0
  }
});

const cuttingSchema = new mongoose.Schema({
  lot_no: {
    type: String,
    required: true,
    unique: true
  },
  pattern: {
    type: String,
    required: true
  },
  fabric: {
    type: String,
    required: true,
    description: 'The vendor name or source of the fabric'
  },
  datetime: {
    type: Date,
    default: Date.now
  },
  sizes: {
    type: [String],
    required: true
  },
  roles: [roleSchema],
  before_cutting_complete: {
    type: Boolean,
    default: false
  },
  after_cutting_complete: {
    type: Boolean,
    default: false
  },
  total_pieces: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to calculate total pieces
cuttingSchema.methods.calculateTotalPieces = function() {
  const totalLayers = this.roles.reduce((sum, role) => sum + (role.layers_cut || 0), 0);
  const totalSizes = this.sizes.length;
  return totalLayers * totalSizes;
};

// Pre-save middleware to update total pieces
cuttingSchema.pre('save', function(next) {
  this.total_pieces = this.calculateTotalPieces();
  next();
});

module.exports = mongoose.model('Cutting', cuttingSchema); 