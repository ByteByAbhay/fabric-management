const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [{
    lotNo: {
      type: String,
      required: true
    },
    pattern: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    processOutputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcessOutput'
    }
  }],
  totalQuantity: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate total quantity
deliverySchema.pre('save', function(next) {
  this.totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
