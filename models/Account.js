const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: String,
        enum: ['cash', 'bank', 'card', 'savings'],
        required: [true, 'Please select account group']
    },
    name: {
        type: String,
        required: [true, 'Please add account name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    amount: {
        type: Number,
        required: [true, 'Please add initial amount'],
        default: 0
    },
    baseCurrency: {
        type: String,
        required: true,
        default: 'LKR',
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

module.exports = mongoose.model('Account', accountSchema);