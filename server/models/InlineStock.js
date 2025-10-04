const mongoose = require('mongoose');

const inlineStockSchema = new mongoose.Schema({
  loadId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  size: {
    type: String,
    required: true
    // Removed enum restriction to allow any size string
  },
  colors: {
    type: Map,
    of: {
      quantity: Number,
      bundle: Number
    }
  },
  total: {
    type: Number,
    required: true
  },
  cutting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cutting',
    required: true  // Make the reference required
  },
  // These fields are kept for backward compatibility and quick access
  // but they're derived from the cutting_id reference
  lotNo: {
    type: String
  },
  pattern: {
    type: String
  },
  // Fields to track processing status
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  processOutputId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessOutput'
  }
}, {
  timestamps: true
});

// Pre-save middleware to populate lotNo and pattern from the referenced cutting
inlineStockSchema.pre('save', async function(next) {
  if (this.cutting_id) {
    try {
      // Fetch the referenced cutting record
      const cutting = await mongoose.model('Cutting').findById(this.cutting_id);
      if (cutting) {
        // Update lotNo and pattern from the cutting record
        this.lotNo = cutting.lot_no;
        this.pattern = cutting.pattern;
      } else {
        return next(new Error('Referenced cutting record not found'));
      }
    } catch (error) {
      return next(error);
    }
  } else {
    return next(new Error('Cutting reference is required'));
  }
  next();
});

// Virtual to get the lot number directly from the referenced cutting
inlineStockSchema.virtual('lot_number').get(function() {
  return this.lotNo;
});

// Virtual to get the pattern directly from the referenced cutting
inlineStockSchema.virtual('cutting_pattern').get(function() {
  return this.pattern;
});

module.exports = mongoose.model('InlineStock', inlineStockSchema);