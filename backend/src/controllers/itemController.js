const prisma = require('../config/prismaClient');

const getItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const createItem = async (req, res) => {
  try {
    const {
      sku, name, description, barcode, quantity, price, category,
      manufacturingDate, expiryDate, serialNumber, location,
    } = req.body;

    // Check license limit — license is on the User model (licenseId FK)
    const userWithLicense = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { license: true },
    });
    const license = userWithLicense?.license;

    if (license && license.type === 'free') {
      const itemCount = await prisma.item.count({
        where: { userId: req.user.userId },
      });
      if (itemCount >= license.itemLimit) {
        return res.status(403).json({
          error: 'Free plan limit reached. Upgrade to add more items.',
        });
      }
    }

    const item = await prisma.item.create({
      data: {
        userId: req.user.userId,
        sku,
        name,
        description,
        barcode: barcode || '',
        quantity: parseInt(quantity) || 0,
        price: parseFloat(price),
        category,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        serialNumber,
        location: location || '',
      },
    });

    res.status(201).json(item);
  } catch (error) {
    // Bug 3 fix: catch duplicate SKU (Prisma unique constraint error code P2002)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An item with this SKU already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sku, name, description, barcode, quantity, price,
      category, manufacturingDate, expiryDate, serialNumber, location,
    } = req.body;

    const item = await prisma.item.update({
      where: { id },
      data: {
        sku,
        name,
        description,
        barcode,
        quantity: quantity !== undefined ? parseInt(quantity) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        category,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        serialNumber,
        location,
      },
    });

    res.json(item);
  } catch (error) {
    // Bug 6 fix: catch record not found (Prisma error code P2025)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An item with this SKU already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.item.delete({
      where: { id },
    });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

const getItemByBarcode = async (req, res) => {
  try {
    const { barcode } = req.query;

    // Bug 5 fix: return 400 if barcode param is missing
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode query parameter is required.' });
    }

    const item = await prisma.item.findFirst({
      where: {
        barcode,
        userId: req.user.userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getItemByBarcode,
};
