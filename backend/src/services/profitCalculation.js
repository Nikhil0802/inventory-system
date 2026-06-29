const calculateProfit = (purchasePrice, salePriceRetail) => {
  const purchase = parseFloat(purchasePrice) || 0;
  const sale = parseFloat(salePriceRetail) || 0;
  if (sale === 0) return { profitAmount: 0, profitPercentage: 0 };
  const profitAmount = sale - purchase;
  const profitPercentage = (profitAmount / sale) * 100;
  return {
    profitAmount: parseFloat(profitAmount.toFixed(2)),
    profitPercentage: parseFloat(profitPercentage.toFixed(2)),
  };
};

const calculateGST = (amount, gstRate) => {
  const base = parseFloat(amount) || 0;
  const rate = parseFloat(gstRate) || 0;
  const gstAmount = base * (rate / 100);
  return {
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    totalWithGST: parseFloat((base + gstAmount).toFixed(2)),
  };
};

const calculateNetAmount = (subtotal, gstAmount = 0, discountAmount = 0) => {
  const net = parseFloat(subtotal) + parseFloat(gstAmount) - parseFloat(discountAmount);
  return parseFloat(net.toFixed(2));
};

const calculateDiscount = (amount, discountPercentage) => {
  const base = parseFloat(amount) || 0;
  const pct = parseFloat(discountPercentage) || 0;
  const discountAmount = base * (pct / 100);
  return {
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    amountAfterDiscount: parseFloat((base - discountAmount).toFixed(2)),
  };
};

const validatePrices = (purchasePrice, salePriceRetail, mrp) => {
  const errors = [];
  const purchase = parseFloat(purchasePrice);
  const sale = parseFloat(salePriceRetail);
  const mrpVal = mrp ? parseFloat(mrp) : null;

  if (isNaN(purchase) || purchase < 0) errors.push('Purchase price must be a positive number.');
  if (isNaN(sale) || sale < 0) errors.push('Sale price must be a positive number.');
  if (!isNaN(purchase) && !isNaN(sale) && sale < purchase) errors.push('Sale price cannot be less than purchase price.');
  if (mrpVal !== null && !isNaN(sale) && sale > mrpVal) errors.push('Sale price cannot exceed MRP.');

  return { isValid: errors.length === 0, errors };
};

module.exports = { calculateProfit, calculateGST, calculateNetAmount, calculateDiscount, validatePrices };
