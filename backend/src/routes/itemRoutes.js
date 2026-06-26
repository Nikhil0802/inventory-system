const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { validateCreateItem, validateUpdateItem } = require('../validators/itemValidator');
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getItemByBarcode,
} = require('../controllers/itemController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getItems);
router.get('/barcode/search', getItemByBarcode);
router.post('/', checkRole(['admin', 'manager', 'staff']), validateCreateItem, createItem);
router.put('/:id', checkRole(['admin', 'manager', 'staff']), validateUpdateItem, updateItem);
router.delete('/:id', checkRole(['admin', 'manager']), deleteItem);

module.exports = router;
