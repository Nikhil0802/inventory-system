const express = require('express');
const prisma = require('../config/prismaClient');
const { validateCreateItem, validateUpdateItem } = require('../validators/itemValidator');

const router = express.Router();

// Get items for authenticated user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const items = await prisma.item.findMany({ where: { userId } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Create an item for authenticated user
router.post('/', validateCreateItem, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sku, name, description, quantity, price, category, location, barcode } = req.body;

    const item = await prisma.item.create({
      data: {
        sku,
        name,
        description: description || null,
        barcode: barcode || sku,
        quantity: Number(quantity) || 0,
        price: price != null ? price.toString() : '0',
        category: category || 'general',
        location: location || '',
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

  // Get single item by id (must belong to authenticated user)
  router.get('/:id', async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const item = await prisma.item.findUnique({ where: { id } });
      if (!item || item.userId !== userId) return res.status(404).json({ error: 'Item not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  // Update an item (ownership required)
  router.put('/:id', validateUpdateItem, async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { sku, name, description, quantity, price, category, location, barcode } = req.body;

      const existing = await prisma.item.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Item not found' });

      const data = {};
      if (sku) data.sku = sku;
      if (name) data.name = name;
      if (description !== undefined) data.description = description || null;
      if (quantity !== undefined) data.quantity = Number(quantity) || 0;
      if (price !== undefined) data.price = price != null ? price.toString() : '0';
      if (category !== undefined) data.category = category;
      if (location !== undefined) data.location = location;
      if (barcode !== undefined) data.barcode = barcode || sku || existing.barcode;

      const updated = await prisma.item.update({ where: { id }, data });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Delete an item (ownership required)
  router.delete('/:id', async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const existing = await prisma.item.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Item not found' });
      await prisma.item.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
