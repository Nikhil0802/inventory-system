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

    if (license.type === 'free') {
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
        barcode,
        quantity: parseInt(quantity) || 0,
        price: parseFloat(price),
        category,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        serialNumber,
        location,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...data,
        quantity: data.quantity ? parseInt(data.quantity) : undefined,
        price: data.price ? parseFloat(data.price) : undefined,
      },
    });

    res.json(item);
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

const getItemByBarcode = async (req, res) => {
  try {
    const { barcode } = req.query;

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