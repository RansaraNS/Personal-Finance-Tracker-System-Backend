const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add expense date'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Please add expense amount'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select expense category']
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

//middleware to update account balance after adding expense
expenseSchema.post('save', async function() {
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

//middleware to update account balance after removing expense
expenseSchema.post('remove', async function() {
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

module.exports = mongoose.model('Expense', expenseSchema);