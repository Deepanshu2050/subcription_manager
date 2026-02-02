const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceName: {
        type: String,
        required: [true, 'Please provide a service name'],
        trim: true,
    },
    cost: {
        type: Number,
        required: [true, 'Please provide the cost'],
        min: [0, 'Cost cannot be negative'],
    },
    billingCycle: {
        type: String,
        required: [true, 'Please provide a billing cycle'],
        enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
        default: 'Monthly',
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    nextBillingDate: {
        type: Date,
        required: [true, 'Please provide the next billing date'],
    },
    status: {
        type: String,
        enum: ['Active', 'Cancelled', 'Paused'],
        default: 'Active',
    },
    category: {
        type: String,
        enum: [
            'Entertainment',
            'Music',
            'Video Streaming',
            'Gaming',
            'Software',
            'Cloud Storage',
            'News & Magazines',
            'Fitness',
            'Education',
            'Productivity',
            'Other',
        ],
        default: 'Other',
    },
    reminderDays: {
        type: Number,
        default: 3, // Remind 3 days before renewal
        min: 0,
    },
    autoRenew: {
        type: Boolean,
        default: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
subscriptionSchema.index({ user: 1, nextBillingDate: 1 });
subscriptionSchema.index({ user: 1, status: 1 });

// Method to calculate next billing date
subscriptionSchema.methods.calculateNextBillingDate = function () {
    const currentDate = new Date(this.nextBillingDate);

    switch (this.billingCycle) {
        case 'Daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        case 'Weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case 'Monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        case 'Quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
        case 'Yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
    }

    return currentDate;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
