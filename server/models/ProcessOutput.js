const mongoose = require('mongoose');

const processOutputSchema = new mongoose.Schema({
  loadId: {
    type: String,
    required: true
  },
  lotNo: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  processItems: [
    {
      color: {
        type: String,
        required: true
      },
      expectedQuantity: {
        type: Number,
        required: true
      },
      actualQuantity: {
        type: Number,
        required: true
      },
      difference: {
        type: Number,
        required: true
      }
    }
  ],
  workerName: {
    type: String,
    required: true
  },
  completedBy: {
    type: String,
    default: 'System'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProcessOutput', processOutputSchema);
