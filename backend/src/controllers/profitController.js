const prisma = require('../config/prismaClient');

const getTodayProfit = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const yesterday = new Date(startOfDay);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayTx, yesterdayTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'sale',
          transactionDate: { gte: startOfDay, lt: endOfDay },
        },
        include: { item: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'sale',
          transactionDate: { gte: yesterday, lt: startOfDay },
        },
      }),
    ]);

    const totalSales = todayTx.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalCost = todayTx.reduce((sum, t) => {
      const purchasePrice = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
      return sum + purchasePrice * t.quantity;
    }, 0);
    const grossProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    const yesterdaySales = yesterdayTx.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const salesGrowth = yesterdaySales > 0
      ? ((totalSales - yesterdaySales) / yesterdaySales) * 100
      : null;

    // Top items by profit today
    const itemProfitMap = {};
    todayTx.forEach(t => {
      const itemName = t.item?.name || 'Unknown';
      const purchasePrice = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
      const revenue = parseFloat(t.totalAmount);
      const cost = purchasePrice * t.quantity;
      if (!itemProfitMap[itemName]) {
        itemProfitMap[itemName] = { name: itemName, sold: 0, profit: 0 };
      }
      itemProfitMap[itemName].sold += t.quantity;
      itemProfitMap[itemName].profit += revenue - cost;
    });

    const topItems = Object.values(itemProfitMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(i => ({ ...i, profit: parseFloat(i.profit.toFixed(2)) }));

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      transactionCount: todayTx.length,
      salesGrowth: salesGrowth !== null ? parseFloat(salesGrowth.toFixed(2)) : null,
      topItems,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthProfit = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.params;
    const y = parseInt(year);
    const m = parseInt(month) - 1;

    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: startOfMonth, lt: endOfMonth },
      },
      include: { item: true },
      orderBy: { transactionDate: 'asc' },
    });

    const sales = transactions.filter(t => t.type === 'sale');
    const purchases = transactions.filter(t => t.type === 'purchase');

    const totalSales = sales.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalPurchases = purchases.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalCost = sales.reduce((sum, t) => {
      const pp = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
      return sum + pp * t.quantity;
    }, 0);
    const grossProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // Daily breakdown
    const dailyMap = {};
    sales.forEach(t => {
      const date = t.transactionDate.toISOString().split('T')[0];
      const pp = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
      const profit = parseFloat(t.totalAmount) - pp * t.quantity;
      if (!dailyMap[date]) dailyMap[date] = { date, sales: 0, profit: 0 };
      dailyMap[date].sales += parseFloat(t.totalAmount);
      dailyMap[date].profit += profit;
    });

    const dailyBreakdown = Object.values(dailyMap).map(d => ({
      date: d.date,
      sales: parseFloat(d.sales.toFixed(2)),
      profit: parseFloat(d.profit.toFixed(2)),
    }));

    const monthName = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    res.json({
      month: monthName,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalPurchases: parseFloat(totalPurchases.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      transactionCount: transactions.length,
      dailyBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

const getItemsProfit = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'sale' },
      include: { item: true },
    });

    const itemMap = {};
    transactions.forEach(t => {
      const id = t.itemId;
      const pp = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
      const revenue = parseFloat(t.totalAmount);
      const cost = pp * t.quantity;

      if (!itemMap[id]) {
        itemMap[id] = {
          itemId: id,
          name: t.item?.name || 'Unknown',
          sku: t.item?.sku || '',
          quantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        };
      }
      itemMap[id].quantitySold += t.quantity;
      itemMap[id].totalRevenue += revenue;
      itemMap[id].totalCost += cost;
      itemMap[id].totalProfit += revenue - cost;
    });

    const result = Object.values(itemMap)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        totalRevenue: parseFloat(item.totalRevenue.toFixed(2)),
        totalCost: parseFloat(item.totalCost.toFixed(2)),
        totalProfit: parseFloat(item.totalProfit.toFixed(2)),
        profitMargin: item.totalRevenue > 0
          ? parseFloat(((item.totalProfit / item.totalRevenue) * 100).toFixed(2))
          : 0,
      }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPeriodComparison = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { period } = req.params;

    const now = new Date();
    let thisPeriodStart, thisPeriodEnd, lastPeriodStart, lastPeriodEnd;

    if (period === 'today') {
      thisPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      thisPeriodEnd = new Date(thisPeriodStart); thisPeriodEnd.setDate(thisPeriodEnd.getDate() + 1);
      lastPeriodStart = new Date(thisPeriodStart); lastPeriodStart.setDate(lastPeriodStart.getDate() - 1);
      lastPeriodEnd = new Date(thisPeriodStart);
    } else if (period === 'week') {
      const day = now.getDay();
      thisPeriodStart = new Date(now); thisPeriodStart.setDate(now.getDate() - day);
      thisPeriodStart.setHours(0, 0, 0, 0);
      thisPeriodEnd = new Date();
      lastPeriodStart = new Date(thisPeriodStart); lastPeriodStart.setDate(lastPeriodStart.getDate() - 7);
      lastPeriodEnd = new Date(thisPeriodStart);
    } else if (period === 'month') {
      thisPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      thisPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lastPeriodEnd = new Date(thisPeriodStart);
    } else {
      thisPeriodStart = new Date(now.getFullYear(), 0, 1);
      thisPeriodEnd = new Date(now.getFullYear() + 1, 0, 1);
      lastPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
      lastPeriodEnd = new Date(thisPeriodStart);
    }

    const [thisTx, lastTx] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, type: 'sale', transactionDate: { gte: thisPeriodStart, lt: thisPeriodEnd } },
        include: { item: true },
      }),
      prisma.transaction.findMany({
        where: { userId, type: 'sale', transactionDate: { gte: lastPeriodStart, lt: lastPeriodEnd } },
        include: { item: true },
      }),
    ]);

    const calcSummary = (txList) => {
      const sales = txList.reduce((s, t) => s + parseFloat(t.totalAmount), 0);
      const cost = txList.reduce((s, t) => {
        const pp = t.item?.purchasePrice ? parseFloat(t.item.purchasePrice) : 0;
        return s + pp * t.quantity;
      }, 0);
      const profit = sales - cost;
      return {
        totalSales: parseFloat(sales.toFixed(2)),
        totalProfit: parseFloat(profit.toFixed(2)),
        profitMargin: sales > 0 ? parseFloat(((profit / sales) * 100).toFixed(2)) : 0,
        transactionCount: txList.length,
      };
    };

    const thisPeriod = calcSummary(thisTx);
    const lastPeriod = calcSummary(lastTx);

    const salesGrowth = lastPeriod.totalSales > 0
      ? parseFloat((((thisPeriod.totalSales - lastPeriod.totalSales) / lastPeriod.totalSales) * 100).toFixed(2))
      : null;
    const profitGrowth = lastPeriod.totalProfit > 0
      ? parseFloat((((thisPeriod.totalProfit - lastPeriod.totalProfit) / lastPeriod.totalProfit) * 100).toFixed(2))
      : null;

    res.json({
      period,
      thisPeriod,
      lastPeriod,
      salesGrowth,
      profitGrowth,
      trend: salesGrowth >= 0 ? 'up' : 'down',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTodayProfit, getMonthProfit, getItemsProfit, getPeriodComparison };
