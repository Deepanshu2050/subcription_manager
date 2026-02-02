const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0, 'Amount cannot be negative'],
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: [
            'Food & Dining',
            'Transportation',
            'Shopping',
            'Entertainment',
            'Bills & Utilities',
            'Healthcare',
            'Education',
            'Travel',
            'Groceries',
            'Rent',
            'Insurance',
            'Personal Care',
            'Gifts & Donations',
            'Other',
        ],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true,
    },
    date: {
        type: Date,
        required: [true, 'Please provide a date'],
        default: Date.now,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
        default: 'Cash',
    },
    tags: [{
        type: String,
        trim: true,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
