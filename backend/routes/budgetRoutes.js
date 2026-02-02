const express = require('express');
const {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    getCurrentBudgetStatus,
    checkBudgetAlerts,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getBudgets)
    .post(createBudget);

router.get('/current/status', getCurrentBudgetStatus);
router.get('/check-alerts', checkBudgetAlerts);

router.route('/:id')
    .get(getBudget)
    .put(updateBudget)
    .delete(deleteBudget);

module.exports = router;
