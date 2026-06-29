const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getTodayProfit, getMonthProfit, getItemsProfit, getPeriodComparison } = require('../controllers/profitController');

const router = express.Router();

router.use(verifyToken);

router.get('/today', getTodayProfit);
router.get('/month/:year/:month', getMonthProfit);
router.get('/items', getItemsProfit);
router.get('/comparison/:period', getPeriodComparison);

module.exports = router;
