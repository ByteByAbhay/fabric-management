const mongoose = require('mongoose');

const workerProcessSchema = new mongoose.Schema({
  line_no: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    required: true
  },
  worker_name: {
    type: String,
    required: true
  },
  cutting_reference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cutting',
    required: true
  },
  piece_count: {
    type: Number,
    required: true
  },
  datetime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerProcess', workerProcessSchema); 