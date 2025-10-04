const mongoose = require('mongoose');

const cuttingTrackingSchema = new mongoose.Schema({
  programNumber: {
    type: String,
    required: true
  },
  pattern: {
    type: String,
    required: true
  },
  datetime: {
    type: Date,
    required: true,
    default: Date.now
  },
  lineNumber: {
    type: String,
    required: true
  },
  sizes: [{
    type: String,
    required: true
  }],
  rolls: [{
    rollNumber: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    layers: [{
      type: Number,
      required: true
    }],
    sizeDistribution: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 }
    },
    remarks: String
  }],
  workerProcesses: [{
    workerName: {
      type: String,
      required: true
    },
    operation: {
      type: String,
      required: true
    },
    inPieces: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 }
    },
    outPieces: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['OK', 'PENDING', 'ERROR'],
      default: 'PENDING'
    },
    salary: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  }],
  orderDetails: {
    orderCode: String,
    client: String,
    recipient: String,
    readyBy: Date,
    colorSizeMatrix: [{
      color: String,
      sizes: {
        S: { type: Number, default: 0 },
        M: { type: Number, default: 0 },
        L: { type: Number, default: 0 },
        XL: { type: Number, default: 0 },
        XXL: { type: Number, default: 0 }
      },
      total: { type: Number, default: 0 }
    }],
    orderTotal: { type: Number, default: 0 }
  },
  additionalInfo: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
cuttingTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate totals before saving
cuttingTrackingSchema.pre('save', function(next) {
  // Calculate roll totals
  this.rolls.forEach(roll => {
    roll.sizeDistribution.total = Object.values(roll.sizeDistribution).reduce((sum, val) => sum + val, 0);
  });

  // Calculate worker process totals
  this.workerProcesses.forEach(process => {
    process.inPieces.total = Object.values(process.inPieces).reduce((sum, val) => sum + val, 0);
    process.outPieces.total = Object.values(process.outPieces).reduce((sum, val) => sum + val, 0);
    process.status = process.inPieces.total === process.outPieces.total ? 'OK' : 'ERROR';
  });

  // Calculate order totals
  if (this.orderDetails && this.orderDetails.colorSizeMatrix) {
    this.orderDetails.orderTotal = this.orderDetails.colorSizeMatrix.reduce((sum, item) => sum + item.total, 0);
  }

  next();
});

module.exports = mongoose.model('CuttingTracking', cuttingTrackingSchema); 