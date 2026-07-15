const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getMonthlySummary, getNetProfit,
  getPendingRecurring, confirmRecurring, getExpenseTrend,
} = require('../controllers/expenseController');

router.use(verifyToken);

// Categories
router.get('/categories', checkPermission('view:expenses'), getCategories);
router.post('/categories', checkPermission('manage:expenses'), createCategory);
router.put('/categories/:id', checkPermission('manage:expenses'), updateCategory);
router.delete('/categories/:id', checkPermission('manage:expenses'), deleteCategory);

// Expenses
router.get('/', checkPermission('view:expenses'), getExpenses);
router.post('/', checkPermission('manage:expenses'), createExpense);
router.put('/:id', checkPermission('manage:expenses'), updateExpense);
router.delete('/:id', checkPermission('manage:expenses'), deleteExpense);

// Analytics
router.get('/summary/:year/:month', checkPermission('view:expenses'), getMonthlySummary);
router.get('/netprofit/:year/:month', checkPermission('view:profit'), getNetProfit);
router.get('/trend', checkPermission('view:expenses'), getExpenseTrend);

// Recurring
router.get('/recurring/pending', checkPermission('view:expenses'), getPendingRecurring);
router.post('/recurring/confirm', checkPermission('manage:expenses'), confirmRecurring);

module.exports = router;
