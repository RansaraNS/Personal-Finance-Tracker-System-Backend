const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add transfer date'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Please add transfer amount'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please select source account']
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please select destination account']
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

// Middleware to update account balances after transfer
transferSchema.post('save', async function() {
  try {
    const Account = this.model('Account');
    
    // Deduct from source account
    await Account.findByIdAndUpdate(
      this.fromAccount,
      { $inc: { amount: -this.amount } }
    );
    
    // Add to destination account
    await Account.findByIdAndUpdate(
      this.toAccount,
      { $inc: { amount: this.amount } }
    );
  } catch (err) {
    console.error('Error updating account balances:', err);
  }
});

// Middleware to restore account balances after removing transfer
transferSchema.post('remove', async function() {
  try {
    const Account = this.model('Account');
    
    // Return to source account
    await Account.findByIdAndUpdate(
      this.fromAccount,
      { $inc: { amount: this.amount } }
    );
    
    // Remove from destination account
    await Account.findByIdAndUpdate(
      this.toAccount,
      { $inc: { amount: -this.amount } }
    );
  } catch (err) {
    console.error('Error restoring account balances:', err);
  }
});

module.exports = mongoose.model('Transfer', transferSchema);