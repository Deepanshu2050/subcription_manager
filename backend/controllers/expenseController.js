const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { Parser } = require('json2csv');

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { category, startDate, endDate, sortBy = '-date' } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (category) {
            query.category = category;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query).sort(sortBy);

        res.json({
            success: true,
            count: expenses.length,
            data: expenses,
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        // Check ownership
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this expense',
            });
        }

        res.json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            user: req.user._id,
        };

        const expense = await Expense.create(expenseData);

        // Update budget spending if exists
        await updateBudgetSpending(req.user._id, expense.amount, expense.date);

        res.status(201).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        // Check ownership
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this expense',
            });
        }

        const oldAmount = expense.amount;
        const oldDate = expense.date;

        expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Update budget spending
        if (oldAmount !== expense.amount || oldDate !== expense.date) {
            await updateBudgetSpending(req.user._id, -oldAmount, oldDate);
            await updateBudgetSpending(req.user._id, expense.amount, expense.date);
        }

        res.json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        // Check ownership
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this expense',
            });
        }

        // Update budget spending
        await updateBudgetSpending(req.user._id, -expense.amount, expense.date);

        await expense.deleteOne();

        res.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary/:period
// @access  Private
const getExpenseSummary = async (req, res) => {
    try {
        const { period } = req.params; // 'monthly' or 'yearly'
        const now = new Date();
        let startDate;

        if (period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'yearly') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid period. Use "monthly" or "yearly"',
            });
        }

        const expenses = await Expense.find({
            user: req.user._id,
            date: { $gte: startDate },
        });

        // Calculate totals
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Group by category
        const byCategory = expenses.reduce((acc, exp) => {
            if (!acc[exp.category]) {
                acc[exp.category] = 0;
            }
            acc[exp.category] += exp.amount;
            return acc;
        }, {});

        // Group by payment method
        const byPaymentMethod = expenses.reduce((acc, exp) => {
            if (!acc[exp.paymentMethod]) {
                acc[exp.paymentMethod] = 0;
            }
            acc[exp.paymentMethod] += exp.amount;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                period,
                startDate,
                endDate: now,
                total,
                count: expenses.length,
                byCategory,
                byPaymentMethod,
                expenses,
            },
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Export expenses to CSV
// @route   GET /api/expenses/export/csv
// @access  Private
const exportExpensesCSV = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = { user: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query).sort('-date');

        // Convert to CSV
        const fields = ['date', 'category', 'description', 'amount', 'paymentMethod', 'tags'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(expenses);

        res.header('Content-Type', 'text/csv');
        res.attachment('expenses.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// Helper function to update budget spending
const updateBudgetSpending = async (userId, amount, expenseDate) => {
    try {
        const budget = await Budget.findOne({
            user: userId,
            isActive: true,
            startDate: { $lte: expenseDate },
            endDate: { $gte: expenseDate },
        });

        if (budget) {
            budget.currentSpending += amount;
            await budget.save();
        }
    } catch (error) {
        console.error('Update budget spending error:', error);
    }
};

module.exports = {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    exportExpensesCSV,
};
