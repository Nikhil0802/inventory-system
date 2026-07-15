const express = require('express');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const { validateCreateItem, validateUpdateItem } = require('../validators/itemValidator');
const { getItems, createItem, updateItem, deleteItem, getItemByBarcode } = require('../controllers/itemController');

const router = express.Router();

router.use(verifyToken);

router.get('/', checkPermission('view:inventory'), getItems);
router.get('/barcode/search', checkPermission('view:inventory'), getItemByBarcode);
router.post('/', checkPermission('manage:inventory'), validateCreateItem, createItem);
router.put('/:id', checkPermission('manage:inventory'), validateUpdateItem, updateItem);
router.delete('/:id', checkPermission('manage:inventory'), deleteItem);

module.exports = router;
