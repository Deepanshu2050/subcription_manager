const express = require('express');
const {
    getSubscriptions,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getUpcomingRenewals,
    getCostAnalysis,
    renewSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getSubscriptions)
    .post(createSubscription);

router.get('/upcoming/:days', getUpcomingRenewals);
router.get('/analysis/cost', getCostAnalysis);

router.route('/:id')
    .get(getSubscription)
    .put(updateSubscription)
    .delete(deleteSubscription);

router.post('/:id/renew', renewSubscription);

module.exports = router;
