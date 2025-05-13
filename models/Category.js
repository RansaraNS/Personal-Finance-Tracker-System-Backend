const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify category type']
  },
  name: {
    type: String,
    required: [true, 'Please add category name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure user can't create duplicate category names of the same type
categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);