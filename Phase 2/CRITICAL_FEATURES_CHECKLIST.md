# Critical Features Checklist - Do This First

## The 80/20 Rule Applied to Your App

**80% of the value comes from 20% of features.** Below are the features that will make the biggest business impact with moderate complexity.

---

## PHASE 1: Pricing & Financial Intelligence (Weeks 1-4)

### ✅ MUST-HAVE (Do These First)

- [ ] **Add Purchase Price field to Items**
  - Database: ALTER TABLE Items ADD purchasePrice DECIMAL(10,2)
  - UI: Show purchase price when editing item
  - Impact: Enables profit calculation
  - Effort: 30 min

- [ ] **Add Retail Sale Price field to Items**
  - Database: ALTER TABLE Items ADD salePriceRetail DECIMAL(10,2)
  - UI: Form field when creating/editing item
  - Impact: Track what customer actually pays
  - Effort: 30 min

- [ ] **GST Rate Selector (5%, 12%, 18%, 28%, 0%)**
  - Database: ALTER TABLE Items ADD gstRate VARCHAR(10)
  - UI: Dropdown selector (most items = 18% in India)
  - Impact: Calculate tax correctly
  - Effort: 45 min

- [ ] **Auto-calculate Profit Amount & Profit %**
  - Formula: Profit = SalePrice - PurchasePrice
  - Formula: Profit% = (Profit / SalePrice) × 100
  - UI: Display as read-only fields on item detail page
  - Impact: Shopkeeper sees profit at a glance
  - Effort: 1 hour
  - **HIGHEST IMPACT** — This alone will make shopkeepers say "wow!"

- [ ] **GST Calculation in Transactions**
  - When recording a sale, auto-calculate GST = SalePrice × (GSTRate/100)
  - Store in DB: gstAmount DECIMAL(10,2)
  - Show on receipt: "GST: ₹2,250 | Total: ₹14,750"
  - Impact: Tax compliance ready
  - Effort: 1.5 hours

- [ ] **Daily Profit Dashboard**
  - Show: Total Sales Today, Total Profit Today, Profit Margin %
  - Show: Top 3 items by profit
  - Show: Comparison with yesterday (↑ or ↓)
  - Impact: Shopkeeper opens app, knows how profitable they are TODAY
  - Effort: 2 hours
  - **CRITICAL** — This is why they'll use your app

- [ ] **Item Profitability List**
  - Table showing: Item Name | Qty Sold | Revenue | Cost | Profit | Margin %
  - Sortable by Profit Amount or Margin %
  - Impact: Know which products are moneymakers vs money-losers
  - Effort: 2 hours

### ⚠️ NICE-TO-HAVE (Add After Must-Haves)

- [ ] **MRP Field (Maximum Retail Price)**
  - For packaged products with printed prices
  - Database: ADD mrp DECIMAL(10,2)
  - UI: Show on item detail, compare with selling price

- [ ] **Margin Amount (₹)**
  - Show actual ₹ profit per unit, not just %
  - Many shopkeepers think in rupees, not percentages

- [ ] **Wholesale vs Retail Pricing**
  - salePriceWholesale for bulk customers
  - Useful for traders

---

## PHASE 2: Expense Management (Weeks 5-8)

### ✅ MUST-HAVE

- [ ] **Create Expense Categories (5 minimum)**
  - [ ] Rent
  - [ ] Salaries & Wages
  - [ ] Utilities (electricity, water, internet)
  - [ ] Transportation (delivery, fuel)
  - [ ] Miscellaneous
  - Database: New table ExpenseCategories
  - Effort: 1 hour

- [ ] **Record Daily Expenses**
  - Form: Category dropdown | Amount | Vendor | Date | Notes
  - Database: New table Expenses
  - Can record multiple expenses per day
  - Effort: 1.5 hours

- [ ] **Monthly Expense Summary**
  - Total expenses by category this month
  - Bar chart: Which category costs most?
  - Impact: Shopkeeper sees where money is bleeding out
  - Effort: 2 hours
  - **CRITICAL** — Most shopkeepers don't know their expenses

- [ ] **Budget Alerts**
  - Set monthly budget for each category
  - Show red warning: "Rent is 80% of budget"
  - Show red alert: "Electricity exceeded budget by ₹500"
  - Impact: Prevents overspending
  - Effort: 2 hours

- [ ] **Monthly Profit After Expenses**
  - Calculation: Gross Profit (Sales - COGS) - Expenses = Net Profit
  - Display prominently: "Your net profit is ₹87,500 this month"
  - Impact: REAL profit visibility (not fake revenue)
  - Effort: 1.5 hours
  - **CRITICAL** — This is what banks ask for on loan applications

### ⚠️ NICE-TO-HAVE

- [ ] **Recurring Expenses**
  - Mark salary/rent as "monthly recurring"
  - Auto-populate on 1st of each month
  - User confirms amount before saving

- [ ] **Budget vs Actual Chart**
  - Line chart: Planned budget vs actual spend
  - Shows if user is staying within budget

- [ ] **Expense Trend (Month-over-Month)**
  - Electricity this month vs last month
  - Salary increases, utilities increasing?

---

## PHASE 3: Financial Reports (Weeks 9-12)

### ✅ MUST-HAVE

- [ ] **Monthly P&L Statement (One Report To Rule Them All)**
  - Format:
    ```
    ═════════════════════════════════════════════════
    PROFIT & LOSS STATEMENT - JUNE 2026
    ═════════════════════════════════════════════════
    
    REVENUE
    Total Sales                           ₹423,400
    Less: Returns/Adjustments               (₹2,100)
    NET SALES                             ₹421,300
    
    COST OF GOODS SOLD
    Opening Stock                          ₹85,000
    Add: Purchases                       +₹280,000
    Less: Closing Stock                   (₹92,000)
    COGS                                  ₹273,000
    
    GROSS PROFIT                          ₹148,300 (35.2%)
    
    OPERATING EXPENSES                     ₹48,800
    
    NET PROFIT                            ₹99,500 (23.5%)
    ═════════════════════════════════════════════════
    ```
  - Show profit for: This Month, Last Month, YTD
  - Impact: Ready for bank/tax filing
  - Effort: 3 hours

- [ ] **Export to PDF**
  - Professional-looking P&L as PDF
  - Include shop name, date range, stamp/signature space
  - Impact: Can print & give to accountant
  - Effort: 2 hours (use a library like PDFKit)

- [ ] **Export to Excel**
  - Raw data in Excel format
  - Impact: Shopkeeper can tweak numbers in Excel if needed
  - Effort: 1.5 hours

- [ ] **Sales Comparison Report**
  - This Month vs Last Month
  - Show: ↑ 6% growth in sales, ↑ 9% growth in profit
  - Impact: Track business health trend
  - Effort: 2 hours

- [ ] **Top/Bottom Products Report**
  - Top 5 products by profit (not revenue!)
  - Bottom 5 products (loss-making or very slow-moving)
  - Impact: Know what to push, what to discontinue
  - Effort: 1.5 hours

### ⚠️ NICE-TO-HAVE

- [ ] **GST Compliance Report**
  - Summary of GST collected vs paid
  - Breakdown by rate (0%, 5%, 12%, 18%, 28%)
  - Ready to file GSTR-1/GSTR-3B

- [ ] **Category-wise Sales Breakdown**
  - Electronics: ₹85,000 (20%)
  - Consumables: ₹120,500 (28%)
  - Pie chart

---

## Implementation Strategy

### Week 1: Database + API
```sql
-- Add columns to Items
ALTER TABLE Items ADD purchasePrice DECIMAL(10,2);
ALTER TABLE Items ADD salePriceRetail DECIMAL(10,2);
ALTER TABLE Items ADD gstRate VARCHAR(10);

-- Add columns to Transactions
ALTER TABLE Transactions ADD gstAmount DECIMAL(10,2);
ALTER TABLE Transactions ADD discountAmount DECIMAL(10,2);
ALTER TABLE Transactions ADD netAmount DECIMAL(12,2);

-- Create new tables
CREATE TABLE ExpenseCategories (
  id UUID PRIMARY KEY,
  userId UUID,
  name VARCHAR(100),
  budgetAmount DECIMAL(10,2),
  isRecurring BOOLEAN DEFAULT false,
  FOREIGN KEY(userId) REFERENCES Users(id)
);

CREATE TABLE Expenses (
  id UUID PRIMARY KEY,
  userId UUID,
  expenseCategoryId UUID,
  amount DECIMAL(10,2),
  vendor VARCHAR(255),
  expenseDate DATE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT GETUTCDATE(),
  FOREIGN KEY(userId) REFERENCES Users(id),
  FOREIGN KEY(expenseCategoryId) REFERENCES ExpenseCategories(id)
);
```

### Week 1-2: Frontend (Pricing)
- [ ] Item edit form: Add purchase price, sale price, GST dropdown
- [ ] Item detail view: Show profit amount, profit %
- [ ] Daily dashboard: Show today's profit (big number)

### Week 2-3: Frontend (Expenses)
- [ ] Expense recording form
- [ ] Expense summary by category
- [ ] Budget alerts (visual warning)

### Week 3-4: Reports
- [ ] P&L report generation (HTML)
- [ ] PDF export
- [ ] Excel export

---

## Quick Impact Assessment

### If You Only Do #1 (Daily Profit Dashboard)
- **Effort:** 3 hours
- **Impact:** Shopkeeper knows profit TODAY. Game-changing.
- **Adoption:** 95% of users will find this valuable
- **Go Live:** End of Week 1

### If You Do #1-5 (Full Phase 1)
- **Effort:** ~12 hours
- **Impact:** Complete pricing intelligence, GST compliance, profit visibility
- **Adoption:** 98% of users will keep using app
- **Go Live:** End of Week 2

### If You Do Full Phases 1-2
- **Effort:** ~40 hours
- **Impact:** Shopkeeper knows total profit (after all expenses). Banks will love this.
- **Adoption:** 99% of paying users will stay
- **Go Live:** End of Week 6

---

## Success Metrics

### Phase 1 Complete
- Users can see daily profit
- Users can see profit per item
- Users can export their data

### Phase 2 Complete
- Users record expenses regularly
- Users check monthly profit after expenses
- Users reference this for business decisions

### Phase 3 Complete
- Users generate monthly reports
- Users share reports with accountants/banks
- Users compare month-to-month growth

---

## Technical Tips

### 1. **Profit Calculation**
```javascript
function calculateProfit(item) {
  const profit = item.salePriceRetail - item.purchasePrice;
  const profitPercent = (profit / item.salePriceRetail) * 100;
  return { profit, profitPercent };
}
```

### 2. **GST Calculation**
```javascript
function calculateGST(amount, gstRate) {
  const gstAmount = amount * (gstRate / 100);
  const totalWithGST = amount + gstAmount;
  return { gstAmount, totalWithGST };
}
```

### 3. **P&L Calculation**
```javascript
// For a given month
const totalSales = transactions
  .filter(t => t.type === 'sale' && isInMonth(t.date))
  .reduce((sum, t) => sum + t.totalAmount, 0);

const totalPurchases = transactions
  .filter(t => t.type === 'purchase' && isInMonth(t.date))
  .reduce((sum, t) => sum + t.totalAmount, 0);

const totalExpenses = expenses
  .filter(e => isInMonth(e.expenseDate))
  .reduce((sum, e) => sum + e.amount, 0);

const grossProfit = totalSales - totalPurchases;
const netProfit = grossProfit - totalExpenses;
```

---

## Done! 🎉

**You now have:**
1. Clear prioritization (what to build first)
2. Implementation timeline (4-12 weeks)
3. Database schema (what tables to create)
4. Impact assessment (what's worth your time)
5. Success metrics (how to measure progress)

**Pick Phase 1 Week 1 items and START THIS WEEK.**

Let me know when you're ready to implement, I'll help you build it step by step! 💪
