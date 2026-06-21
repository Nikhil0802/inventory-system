const prisma = require('../config/prismaClient');

const createTransaction = async (req, res, next) => {
  try {
    const {
      itemId, type, quantity, price, referenceNo,
      transactionDate, supplierOrBuyer, notes,
    } = req.body;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    let newQuantity = item.quantity;
    if (type === 'purchase' || type === 'transfer') {
      newQuantity += parseInt(quantity);
    } else if (type === 'sale') {
      newQuantity -= parseInt(quantity);
      if (newQuantity < 0)
        return res.status(400).json({ error: 'Insufficient stock' });
    } else if (type === 'adjustment') {
      newQuantity += parseInt(quantity); // can be negative for write-offs
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        itemId,
        type,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        totalAmount: parseFloat(price) * parseInt(quantity),
        referenceNo: referenceNo || '',
        transactionDate: new Date(transactionDate),
        supplierOrBuyer: supplierOrBuyer || '',
        notes,
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
