const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getTransactions,
  getTransactionsByItem,
} = require('../controllers/transactionController');

const router = express.Router();

router.use(verifyToken);

router.post('/', checkRole(['admin', 'manager', 'staff']), createTransaction);
router.get('/', getTransactions);
router.get('/item/:itemId', getTransactionsByItem);

module.exports = router;
