const express = require('express');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const { createTransaction, getTransactions, getTransactionsByItem } = require('../controllers/transactionController');

const router = express.Router();

router.use(verifyToken);

router.post('/', checkPermission('create:transactions'), createTransaction);
router.get('/', checkPermission('view:transactions'), getTransactions);
router.get('/item/:itemId', checkPermission('view:transactions'), getTransactionsByItem);

module.exports = router;
