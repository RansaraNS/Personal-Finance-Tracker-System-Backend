const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Please add saving goal amount'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  name: {
    type: String,
    required: [true, 'Please add a name for this saving goal'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  targetDate: {
    type: Date,
    required: [true, 'Please specify target date']
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Abandoned'],
    default: 'In Progress'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Savings', savingsSchema);