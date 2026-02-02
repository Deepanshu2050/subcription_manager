const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');
const User = require('../models/User');
const { sendSubscriptionReminder, sendBudgetAlert } = require('./emailService');

// Check for upcoming subscription renewals (runs daily at 9 AM)
const checkSubscriptionRenewals = cron.schedule('0 9 * * *', async () => {
    try {
        console.log('🔄 Running subscription renewal check...');

        const now = new Date();

        // Find all active subscriptions
        const subscriptions = await Subscription.find({
            status: 'Active',
            autoRenew: true,
        }).populate('user');

        for (const subscription of subscriptions) {
            const daysUntilRenewal = Math.ceil(
                (new Date(subscription.nextBillingDate) - now) / (1000 * 60 * 60 * 24)
            );

            // Send reminder based on user's preference
            if (daysUntilRenewal <= subscription.reminderDays && daysUntilRenewal > 0) {
                await sendSubscriptionReminder(
                    subscription.user,
                    subscription,
                    daysUntilRenewal
                );
            }
        }

        console.log('✅ Subscription renewal check completed');
    } catch (error) {
        console.error('❌ Error in subscription renewal check:', error);
    }
}, {
    scheduled: false, // Don't start automatically
});

// Check budget alerts (runs daily at 8 PM)
const checkBudgetAlerts = cron.schedule('0 20 * * *', async () => {
    try {
        console.log('🔄 Running budget alert check...');

        const now = new Date();

        // Find all active budgets
        const budgets = await Budget.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).populate('user');

        for (const budget of budgets) {
            const spendingPercentage = budget.getSpendingPercentage();

            // Check critical threshold (100%)
            if (spendingPercentage >= budget.alertThresholds.critical) {
                const lastCriticalAlert = budget.lastAlertSent?.critical;
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                if (!lastCriticalAlert || lastCriticalAlert < oneDayAgo) {
                    await sendBudgetAlert(budget.user, budget, 'critical', spendingPercentage);
                    budget.lastAlertSent = budget.lastAlertSent || {};
                    budget.lastAlertSent.critical = now;
                    await budget.save();
                }
            }
            // Check warning threshold (80%)
            else if (spendingPercentage >= budget.alertThresholds.warning) {
                const lastWarningAlert = budget.lastAlertSent?.warning;
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                if (!lastWarningAlert || lastWarningAlert < oneDayAgo) {
                    await sendBudgetAlert(budget.user, budget, 'warning', spendingPercentage);
                    budget.lastAlertSent = budget.lastAlertSent || {};
                    budget.lastAlertSent.warning = now;
                    await budget.save();
                }
            }
        }

        console.log('✅ Budget alert check completed');
    } catch (error) {
        console.error('❌ Error in budget alert check:', error);
    }
}, {
    scheduled: false, // Don't start automatically
});

// Initialize all cron jobs
const initCronJobs = () => {
    console.log('🚀 Initializing cron jobs...');

    checkSubscriptionRenewals.start();
    console.log('✅ Subscription renewal check scheduled (daily at 9 AM)');

    checkBudgetAlerts.start();
    console.log('✅ Budget alert check scheduled (daily at 8 PM)');
};

// Stop all cron jobs
const stopCronJobs = () => {
    checkSubscriptionRenewals.stop();
    checkBudgetAlerts.stop();
    console.log('🛑 All cron jobs stopped');
};

module.exports = {
    initCronJobs,
    stopCronJobs,
    checkSubscriptionRenewals,
    checkBudgetAlerts,
};
