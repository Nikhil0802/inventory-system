const prisma = require('../config/prismaClient');
const DEFAULT_CATEGORIES = require('../config/expenseCategories');

// ── CATEGORIES ────────────────────────────────────────────────────────────────

const getCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    let categories = await prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    // Seed defaults on first use
    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId })),
      });
      categories = await prisma.expenseCategory.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });
    }

    return res.json(categories);
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, monthlyBudget } = req.body;
    const userId = req.user.userId;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        description: description || null,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        userId,
      },
    });
    return res.status(201).json(category);
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, monthlyBudget } = req.body;
    const userId = req.user.userId;

    const existing = await prisma.expenseCategory.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        monthlyBudget: monthlyBudget !== undefined
          ? (monthlyBudget ? parseFloat(monthlyBudget) : null)
          : existing.monthlyBudget,
      },
    });
    return res.json(category);
  } catch (err) {
    console.error('updateCategory error:', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.expenseCategory.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const count = await prisma.expense.count({ where: { categoryId: id } });
    if (count > 0) {
      return res.status(400).json({ error: `Cannot delete: ${count} expense(s) use this category. Reassign them first.` });
    }

    await prisma.expenseCategory.delete({ where: { id } });
    return res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
};

// ── EXPENSES ──────────────────────────────────────────────────────────────────

const getExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    const where = { userId };
    if (year && month) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.expenseDate = { gte: start, lte: end };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { expenseDate: 'desc' },
    });
    return res.json(expenses);
  } catch (err) {
    console.error('getExpenses error:', err);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const createExpense = async (req, res) => {
  try {
    const { categoryId, amount, vendor, description, expenseDate, isRecurring } = req.body;
    const userId = req.user.userId;

    if (!categoryId || !amount || !expenseDate) {
      return res.status(400).json({ error: 'categoryId, amount and expenseDate are required' });
    }

    const category = await prisma.expenseCategory.findFirst({ where: { id: categoryId, userId } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        vendor: vendor || null,
        description: description || null,
        expenseDate: new Date(expenseDate),
        isRecurring: Boolean(isRecurring),
        userId,
      },
      include: { category: true },
    });
    return res.status(201).json(expense);
  } catch (err) {
    console.error('createExpense error:', err);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { categoryId, amount, vendor, description, expenseDate, isRecurring } = req.body;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        categoryId: categoryId ?? existing.categoryId,
        amount: amount ? parseFloat(amount) : existing.amount,
        vendor: vendor !== undefined ? vendor : existing.vendor,
        description: description !== undefined ? description : existing.description,
        expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : existing.isRecurring,
      },
      include: { category: true },
    });
    return res.json(expense);
  } catch (err) {
    console.error('updateExpense error:', err);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id } });
    return res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// ── MONTHLY SUMMARY ───────────────────────────────────────────────────────────

const getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.userId;

    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const [categories, expenses] = await Promise.all([
      prisma.expenseCategory.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      prisma.expense.findMany({
        where: { userId, expenseDate: { gte: start, lte: end } },
        include: { category: true },
      }),
    ]);

    const byCategory = categories.map(cat => {
      const catExpenses = expenses.filter(e => e.categoryId === cat.id);
      const spent = catExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const budget = cat.monthlyBudget ? parseFloat(cat.monthlyBudget) : null;
      const budgetUsed = budget ? (spent / budget) * 100 : null;
      return {
        id: cat.id,
        name: cat.name,
        spent: parseFloat(spent.toFixed(2)),
        budget,
        budgetUsed: budgetUsed ? parseFloat(budgetUsed.toFixed(1)) : null,
        isOverBudget: budget ? spent > budget : false,
        isNearBudget: budget && spent <= budget ? budgetUsed >= 80 : false,
        expenseCount: catExpenses.length,
      };
    });

    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalBudget = categories.reduce((s, c) => s + (c.monthlyBudget ? parseFloat(c.monthlyBudget) : 0), 0);

    return res.json({
      year: parseInt(year),
      month: parseInt(month),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalBudget: parseFloat(totalBudget.toFixed(2)),
      byCategory,
      expenseCount: expenses.length,
    });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    return res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
};

// ── NET PROFIT ────────────────────────────────────────────────────────────────

const getNetProfit = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.userId;

    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const [saleTx, expenses] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, type: 'sale', transactionDate: { gte: start, lte: end } },
        include: { item: { select: { purchasePrice: true } } },
      }),
      prisma.expense.findMany({
        where: { userId, expenseDate: { gte: start, lte: end } },
        include: { category: { select: { name: true } } },
      }),
    ]);

    const totalRevenue = saleTx.reduce((s, t) => s + parseFloat(t.totalAmount), 0);
    const totalCOGS = saleTx.reduce((s, t) => {
      const cost = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) * t.quantity : 0;
      return s + cost;
    }, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Expense breakdown by category
    const expByCategory = {};
    expenses.forEach(e => {
      const name = e.category.name;
      expByCategory[name] = (expByCategory[name] || 0) + parseFloat(e.amount);
    });

    return res.json({
      year: parseInt(year),
      month: parseInt(month),
      revenue: parseFloat(totalRevenue.toFixed(2)),
      cogs: parseFloat(totalCOGS.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossMargin: parseFloat(grossMargin.toFixed(1)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      netMargin: parseFloat(netMargin.toFixed(1)),
      expenseBreakdown: Object.entries(expByCategory).map(([name, amount]) => ({
        name,
        amount: parseFloat(amount.toFixed(2)),
      })),
    });
  } catch (err) {
    console.error('getNetProfit error:', err);
    return res.status(500).json({ error: 'Failed to calculate net profit' });
  }
};

// ── RECURRING AUTO-POPULATE ───────────────────────────────────────────────────

const getPendingRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [lastMonthRecurring, thisMonthExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, isRecurring: true, expenseDate: { gte: lastMonthStart, lte: lastMonthEnd } },
        include: { category: true },
        orderBy: { amount: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId, expenseDate: { gte: thisMonthStart, lte: thisMonthEnd } },
        select: { categoryId: true },
      }),
    ]);

    const thisMonthCatIds = new Set(thisMonthExpenses.map(e => e.categoryId));
    const pending = lastMonthRecurring.filter(e => !thisMonthCatIds.has(e.categoryId));

    return res.json(pending);
  } catch (err) {
    console.error('getPendingRecurring error:', err);
    return res.status(500).json({ error: 'Failed to fetch pending recurring expenses' });
  }
};

const confirmRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: 'No expenses provided' });
    }

    const categoryIds = [...new Set(expenses.map(e => e.categoryId))];
    const validCats = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds }, userId },
      select: { id: true },
    });
    const validCatIds = new Set(validCats.map(c => c.id));

    const toCreate = expenses
      .filter(e => validCatIds.has(e.categoryId))
      .map(e => ({
        userId,
        categoryId: e.categoryId,
        amount: parseFloat(e.amount),
        vendor: e.vendor || null,
        description: e.description || 'Recurring expense',
        expenseDate: new Date(e.expenseDate),
        isRecurring: true,
      }));

    await prisma.expense.createMany({ data: toCreate });
    return res.json({ created: toCreate.length });
  } catch (err) {
    console.error('confirmRecurring error:', err);
    return res.status(500).json({ error: 'Failed to confirm recurring expenses' });
  }
};

// ── EXPENSE TREND ─────────────────────────────────────────────────────────────

const getExpenseTrend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const months = Math.min(parseInt(req.query.months) || 6, 12);
    const now = new Date();

    const result = [];
    const categoryTotals = {};

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const expenses = await prisma.expense.findMany({
        where: { userId, expenseDate: { gte: start, lte: end } },
        include: { category: { select: { name: true } } },
      });

      const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const byCategory = {};
      expenses.forEach(e => {
        const name = e.category.name;
        byCategory[name] = (byCategory[name] || 0) + parseFloat(e.amount);
        categoryTotals[name] = (categoryTotals[name] || 0) + parseFloat(e.amount);
      });

      result.push({
        label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        total: parseFloat(total.toFixed(2)),
        ...Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
      });
    }

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);

    return res.json({ months: result, topCategories });
  } catch (err) {
    console.error('getExpenseTrend error:', err);
    return res.status(500).json({ error: 'Failed to fetch expense trend' });
  }
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getMonthlySummary, getNetProfit,
  getPendingRecurring, confirmRecurring, getExpenseTrend,
};
