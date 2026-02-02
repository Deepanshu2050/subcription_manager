const express = require('express');
const {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    exportExpensesCSV,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.get('/summary/:period', getExpenseSummary);
router.get('/export/csv', exportExpensesCSV);

router.route('/:id')
    .get(getExpense)
    .put(updateExpense)
    .delete(deleteExpense);

module.exports = router;
