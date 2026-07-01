const prisma = require('../config/prismaClient');

const VALID_TYPES = ['purchase', 'sale', 'transfer', 'adjustment'];

const createTransaction = async (req, res, next) => {
  try {
    const {
      itemId, type, quantity, price, referenceNo,
      transactionDate, supplierOrBuyer, notes,
      gstRate: gstRateInput, paymentMethod,
    } = req.body;

    // Bug 1 fix: validate transaction type
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid transaction type. Must be one of: ${VALID_TYPES.join(', ')}.`,
      });
    }

    // Bug 2 fix: validate transactionDate before passing to Prisma
    if (!transactionDate) {
      return res.status(400).json({ error: 'Transaction date is required.' });
    }
    const parsedDate = new Date(transactionDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid transaction date.' });
    }

    const parsedQty = parseInt(quantity);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    let newQuantity = item.quantity;
    if (type === 'purchase' || type === 'transfer') {
      newQuantity += parsedQty;
    } else if (type === 'sale') {
      newQuantity -= parsedQty;
      if (newQuantity < 0)
        return res.status(400).json({ error: 'Insufficient stock' });
    } else if (type === 'adjustment') {
      newQuantity += parsedQty;
      // Bug 9 fix: prevent stock going negative on adjustment
      if (newQuantity < 0)
        return res.status(400).json({ error: 'Adjustment would result in negative stock.' });
    }

    // GST calculation — only for sales; auto-derive rate from item if not provided
    const subtotal = parsedPrice * parsedQty;
    let gstRate = null;
    let gstAmount = null;
    let netAmount = null;
    if (type === 'sale') {
      const rate = parseFloat(gstRateInput ?? item.gstRate ?? 0);
      if (!isNaN(rate) && rate >= 0) {
        gstRate = String(rate);
        gstAmount = parseFloat((subtotal * rate / 100).toFixed(2));
        netAmount = parseFloat((subtotal + gstAmount).toFixed(2));
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        itemId,
        type,
        quantity: parsedQty,
        price: parsedPrice,
        totalAmount: subtotal,
        referenceNo: referenceNo || '',
        transactionDate: parsedDate,
        supplierOrBuyer: supplierOrBuyer || '',
        notes,
        gstRate,
        gstAmount,
        netAmount,
        paymentMethod: paymentMethod || null,
      },
    });

    await prisma.item.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

const getTransactionsByItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Bug 8 fix: verify item exists before querying transactions
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const transactions = await prisma.transaction.findMany({
      where: { itemId, userId: req.user.userId },
      orderBy: { transactionDate: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

module.exports = { createTransaction, getTransactions, getTransactionsByItem };
