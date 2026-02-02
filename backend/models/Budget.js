const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    period: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Monthly',
    },
    totalLimit: {
        type: Number,
        required: [true, 'Please provide a total budget limit'],
        min: [0, 'Budget limit cannot be negative'],
    },
    categoryLimits: [{
        category: {
            type: String,
            required: true,
        },
        limit: {
            type: Number,
            required: true,
            min: 0,
        },
    }],
    alertThresholds: {
        warning: {
            type: Number,
            default: 80, // Alert at 80%
            min: 0,
            max: 100,
        },
        critical: {
            type: Number,
            default: 100, // Alert at 100%
            min: 0,
            max: 100,
        },
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date'],
    },
    currentSpending: {
        type: Number,
        default: 0,
    },
    lastAlertSent: {
        warning: Date,
        critical: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
budgetSchema.index({ user: 1, isActive: 1 });
budgetSchema.index({ user: 1, startDate: 1, endDate: 1 });

// Method to check if budget period is current
budgetSchema.methods.isCurrentPeriod = function () {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
};

// Method to calculate spending percentage
budgetSchema.methods.getSpendingPercentage = function () {
    return (this.currentSpending / this.totalLimit) * 100;
};

module.exports = mongoose.model('Budget', budgetSchema);
