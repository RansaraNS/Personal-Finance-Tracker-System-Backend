const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add income date'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Please add income amount'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select income category']
  },
  label: {
    type: String,
    trim: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please select account']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//middleware to update account balance after adding income
incomeSchema.post('save', async function() {
  try {
    const Account = this.model('Account');
    await Account.findByIdAndUpdate(
      this.account,
      { $inc: { amount: this.amount } }
    );
  } catch (err) {
    console.error('Error updating account balance:', err);
  }
});

//middleware to update account balance after removing income
incomeSchema.post('remove', async function() {
  try {
    const Account = this.model('Account');
    await Account.findByIdAndUpdate(
      this.account,
      { $inc: { amount: -this.amount } }
    );
  } catch (err) {
    console.error('Error updating account balance:', err);
  }
});

module.exports = mongoose.model('Income', incomeSchema);