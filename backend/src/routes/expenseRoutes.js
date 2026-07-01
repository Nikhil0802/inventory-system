const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getMonthlySummary, getNetProfit,
  getPendingRecurring, confirmRecurring, getExpenseTrend,
} = require('../controllers/expenseController');

router.use(verifyToken);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Expenses
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Analytics
router.get('/summary/:year/:month', getMonthlySummary);
router.get('/netprofit/:year/:month', getNetProfit);
router.get('/trend', getExpenseTrend);

// Recurring
router.get('/recurring/pending', getPendingRecurring);
router.post('/recurring/confirm', confirmRecurring);

module.exports = router;
