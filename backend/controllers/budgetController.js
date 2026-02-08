const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { sendBudgetAlert } = require('../services/emailService');

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
    try {
        const { isActive } = req.query;

        const query = { user: req.user._id };

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const budgets = await Budget.find(query).sort('-startDate');

        // Calculate totalSpent and remaining for each budget
        const budgetsWithStats = await Promise.all(budgets.map(async (budget) => {
            const expenses = await Expense.find({
                user: req.user._id,
                date: { $gte: budget.startDate, $lte: budget.endDate }
            });

            const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const remaining = budget.totalLimit - totalSpent;

            return {
                ...budget.toObject(),
                totalSpent,
                remaining
            };
        }));

        res.json({
            success: true,
            count: budgetsWithStats.length,
            data: budgetsWithStats,
        });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
const getBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        // Check ownership
        if (budget.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this budget',
            });
        }

        res.json({
            success: true,
            data: budget,
        });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
    try {
        // Deactivate previous budgets for the same period
        await Budget.updateMany(
            {
                user: req.user._id,
                isActive: true,
            },
            { isActive: false }
        );

        const budgetData = {
            ...req.body,
            user: req.user._id,
        };

        const budget = await Budget.create(budgetData);

        // Calculate current spending for the budget period
        const expenses = await Expense.find({
            user: req.user._id,
            date: {
                $gte: budget.startDate,
                $lte: budget.endDate,
            },
        });

        budget.currentSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        await budget.save();

        res.status(201).json({
            success: true,
            data: budget,
        });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
    try {
        let budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        // Check ownership
        if (budget.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this budget',
            });
        }

        budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            data: budget,
        });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        // Check ownership
        if (budget.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this budget',
            });
        }

        await budget.deleteOne();

        res.json({
            success: true,
            message: 'Budget deleted successfully',
        });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get current budget status
// @route   GET /api/budgets/current/status
// @access  Private
const getCurrentBudgetStatus = async (req, res) => {
    try {
        const now = new Date();

        const budget = await Budget.findOne({
            user: req.user._id,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        });

        if (!budget) {
            return res.json({
                success: true,
                data: null,
                message: 'No active budget found for current period',
            });
        }

        const spendingPercentage = budget.getSpendingPercentage();
        const remaining = budget.totalLimit - budget.currentSpending;

        // Check if alerts should be sent
        let alertLevel = null;

        if (spendingPercentage >= budget.alertThresholds.critical) {
            alertLevel = 'critical';
        } else if (spendingPercentage >= budget.alertThresholds.warning) {
            alertLevel = 'warning';
        }

        res.json({
            success: true,
            data: {
                budget,
                currentSpending: budget.currentSpending,
                totalLimit: budget.totalLimit,
                remaining,
                spendingPercentage: Math.round(spendingPercentage * 100) / 100,
                alertLevel,
                isOverBudget: spendingPercentage > 100,
            },
        });
    } catch (error) {
        console.error('Get current budget status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Check budget alerts
// @route   GET /api/budgets/check-alerts
// @access  Private
const checkBudgetAlerts = async (req, res) => {
    try {
        const now = new Date();

        const budget = await Budget.findOne({
            user: req.user._id,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).populate('user');

        if (!budget) {
            return res.json({
                success: true,
                message: 'No active budget found',
            });
        }

        const spendingPercentage = budget.getSpendingPercentage();
        const alerts = [];

        // Check critical threshold (100%)
        if (spendingPercentage >= budget.alertThresholds.critical) {
            const lastCriticalAlert = budget.lastAlertSent?.critical;
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            if (!lastCriticalAlert || lastCriticalAlert < oneDayAgo) {
                await sendBudgetAlert(budget.user, budget, 'critical', spendingPercentage);
                budget.lastAlertSent = budget.lastAlertSent || {};
                budget.lastAlertSent.critical = now;
                await budget.save();
                alerts.push('critical');
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
                alerts.push('warning');
            }
        }

        res.json({
            success: true,
            message: alerts.length > 0 ? 'Alerts sent' : 'No alerts needed',
            alertsSent: alerts,
        });
    } catch (error) {
        console.error('Check budget alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

module.exports = {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    getCurrentBudgetStatus,
    checkBudgetAlerts,
};
