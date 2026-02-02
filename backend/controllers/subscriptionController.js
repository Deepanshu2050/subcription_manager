const Subscription = require('../models/Subscription');

// @desc    Get all subscriptions for user
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
    try {
        const { status, category } = req.query;

        const query = { user: req.user._id };

        if (status) {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        const subscriptions = await Subscription.find(query).sort('nextBillingDate');

        res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions,
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found',
            });
        }

        // Check ownership
        if (subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this subscription',
            });
        }

        res.json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
    try {
        const subscriptionData = {
            ...req.body,
            user: req.user._id,
        };

        const subscription = await Subscription.create(subscriptionData);

        res.status(201).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found',
            });
        }

        // Check ownership
        if (subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this subscription',
            });
        }

        subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found',
            });
        }

        // Check ownership
        if (subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this subscription',
            });
        }

        await subscription.deleteOne();

        res.json({
            success: true,
            message: 'Subscription deleted successfully',
        });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get upcoming renewals
// @route   GET /api/subscriptions/upcoming/:days
// @access  Private
const getUpcomingRenewals = async (req, res) => {
    try {
        const days = parseInt(req.params.days) || 7;
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const subscriptions = await Subscription.find({
            user: req.user._id,
            status: 'Active',
            nextBillingDate: {
                $gte: now,
                $lte: futureDate,
            },
        }).sort('nextBillingDate');

        res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions,
        });
    } catch (error) {
        console.error('Get upcoming renewals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get subscription cost analysis
// @route   GET /api/subscriptions/analysis/cost
// @access  Private
const getCostAnalysis = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({
            user: req.user._id,
            status: 'Active',
        });

        // Calculate costs
        let monthlyTotal = 0;
        let yearlyTotal = 0;

        const byCategory = {};
        const byBillingCycle = {};

        subscriptions.forEach(sub => {
            // Convert all to monthly cost for comparison
            let monthlyCost = 0;

            switch (sub.billingCycle) {
                case 'Daily':
                    monthlyCost = sub.cost * 30;
                    break;
                case 'Weekly':
                    monthlyCost = sub.cost * 4;
                    break;
                case 'Monthly':
                    monthlyCost = sub.cost;
                    break;
                case 'Quarterly':
                    monthlyCost = sub.cost / 3;
                    break;
                case 'Yearly':
                    monthlyCost = sub.cost / 12;
                    break;
            }

            monthlyTotal += monthlyCost;
            yearlyTotal += monthlyCost * 12;

            // By category
            if (!byCategory[sub.category]) {
                byCategory[sub.category] = 0;
            }
            byCategory[sub.category] += monthlyCost;

            // By billing cycle
            if (!byBillingCycle[sub.billingCycle]) {
                byBillingCycle[sub.billingCycle] = {
                    count: 0,
                    total: 0,
                };
            }
            byBillingCycle[sub.billingCycle].count += 1;
            byBillingCycle[sub.billingCycle].total += sub.cost;
        });

        res.json({
            success: true,
            data: {
                totalSubscriptions: subscriptions.length,
                monthlyTotal: Math.round(monthlyTotal * 100) / 100,
                yearlyTotal: Math.round(yearlyTotal * 100) / 100,
                byCategory,
                byBillingCycle,
                subscriptions,
            },
        });
    } catch (error) {
        console.error('Get cost analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Renew subscription (update next billing date)
// @route   POST /api/subscriptions/:id/renew
// @access  Private
const renewSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found',
            });
        }

        // Check ownership
        if (subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to renew this subscription',
            });
        }

        // Calculate next billing date
        subscription.nextBillingDate = subscription.calculateNextBillingDate();
        await subscription.save();

        res.json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

module.exports = {
    getSubscriptions,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getUpcomingRenewals,
    getCostAnalysis,
    renewSubscription,
};
