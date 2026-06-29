# Claude Code - Ready-to-Use Prompts for Phase 1

Copy and paste these prompts directly into Claude Code in VS Code. Each prompt is self-contained and ready to execute.

---

## PROMPT 1: Update Prisma Schema - Add Pricing Fields to Items

**Copy everything below and paste into Claude Code:**

```
I'm enhancing my inventory system with pricing features. In my Prisma schema at backend/prisma/schema.prisma, I need to update the Items model to add pricing and profit tracking fields.

Here's what I need:

1. Add these fields to the Items model:
   - purchasePrice: Float (the cost price I paid for this item)
   - salePriceRetail: Float (the price I sell to customers)
   - mrp: Float? (Maximum Retail Price - optional, for packaged goods)
   - gstRate: String (GST rate applicable - values: "0", "5", "12", "18", "28")
   - additionalTax: Float? (any additional tax percentage)
   - profitPercentage: Float? @default(0) (auto-calculated)
   - marginAmount: Float? @default(0) (auto-calculated)

2. Add @db.Decimal(10,2) for price fields and @db.Decimal(5,2) for percentages
3. Add helpful comments above each field explaining what it means
4. Keep all existing fields (id, userId, sku, name, description, barcode, quantity, price, category, location, createdAt, updatedAt)

Please show me the complete updated Items model.
```

**After Claude generates the code:**
1. Copy the updated Items model
2. Replace the Items section in `backend/prisma/schema.prisma`
3. Run: `cd backend && npx prisma format`
4. Verify no errors

---

## PROMPT 2: Update Prisma Schema - Add GST/Discount Fields to Transactions

**Copy and paste into Claude Code:**

```
I need to update the Transactions model in my Prisma schema to track GST, discounts, and payment methods.

Add these fields to the Transactions model:
- gstAmount: Float @default(0) (the GST amount charged)
- gstRate: String @default("18") (the GST rate used - "0", "5", "12", "18", "28")
- discountPercentage: Float @default(0) (discount % if any)
- discountAmount: Float @default(0) (discount amount in rupees)
- netAmount: Float (final amount = quantity * price + gstAmount - discountAmount)
- paymentMethod: String @default("cash") (how they paid - "cash", "cheque", "online", "credit")

Add @db.Decimal(10,2) for amount fields and @db.Decimal(5,2) for percentages.
Add helpful comments explaining each field.
Keep all existing fields (id, userId, itemId, type, quantity, price, totalAmount, referenceNo, transactionDate, supplierOrBuyer, notes, createdAt).

Show me the complete updated Transactions model.
```

**After Claude generates:**
1. Copy the updated Transactions model
2. Replace the Transactions section in `backend/prisma/schema.prisma`
3. Run: `npx prisma format`

---

## PROMPT 3: Create Prisma Migration - Items Table

**Copy and paste into Claude Code:**

```
I need to create a Prisma migration to add pricing fields to my Items table in Azure SQL Server.

The migration should ADD these columns to the Items table:
- purchasePrice DECIMAL(10,2) DEFAULT 0
- salePriceRetail DECIMAL(10,2) DEFAULT 0
- mrp DECIMAL(10,2) NULL
- gstRate VARCHAR(10) DEFAULT '18'
- additionalTax DECIMAL(5,2) DEFAULT 0
- profitPercentage DECIMAL(5,2) DEFAULT 0
- marginAmount DECIMAL(10,2) DEFAULT 0

Generate the migration SQL statements I should run.

Also provide the exact command to execute this migration in Prisma.
```

**After Claude generates:**
1. Copy the SQL statements shown
2. Run: `cd backend && npx prisma db push`
3. You'll see confirmation: "✔ Database synced with schema"

---

## PROMPT 4: Create Prisma Migration - Transactions Table

**Copy and paste into Claude Code:**

```
I need to create a Prisma migration to add GST and discount fields to my Transactions table.

The migration should ADD these columns to the Transactions table:
- gstAmount DECIMAL(10,2) DEFAULT 0
- gstRate VARCHAR(10) DEFAULT '18'
- discountPercentage DECIMAL(5,2) DEFAULT 0
- discountAmount DECIMAL(10,2) DEFAULT 0
- netAmount DECIMAL(12,2) DEFAULT 0
- paymentMethod VARCHAR(50) DEFAULT 'cash'

Generate the migration SQL.
Provide the command to run it.
```

**After Claude generates:**
1. Run: `cd backend && npx prisma db push`

---

## PROMPT 5: Create Profit Calculation Service

**Copy and paste into Claude Code (open backend folder first):**

```
I need to create a profit calculation service at backend/src/services/profitCalculation.ts

This should export these functions with TypeScript types:

1. calculateProfit(salePriceRetail: number, purchasePrice: number)
   - Returns { profitAmount: number; profitPercentage: number }
   - profitAmount = salePriceRetail - purchasePrice
   - profitPercentage = (profitAmount / salePriceRetail) * 100
   - Handle division by zero

2. calculateGST(amount: number, gstRate: number)
   - Returns { gstAmount: number; totalWithGST: number }
   - gstAmount = amount * (gstRate / 100)
   - totalWithGST = amount + gstAmount

3. calculateNetAmount(subtotal: number, gstAmount: number, discountAmount: number)
   - Returns netAmount = subtotal + gstAmount - discountAmount
   - Ensure netAmount >= 0

4. calculateMargin(salePriceRetail: number, purchasePrice: number)
   - Returns marginAmount = salePriceRetail - purchasePrice

5. validatePrices(purchasePrice: number, salePriceRetail: number, mrp: number | null)
   - Returns { isValid: boolean; errors: string[] }
   - Validate purchasePrice > 0
   - Validate salePriceRetail > purchasePrice
   - Validate if mrp exists: mrp >= salePriceRetail
   - Return meaningful error messages

Add JSDoc comments to each function explaining parameters and return values.
Export all functions.
```

**After Claude generates:**
1. Save the file as `backend/src/services/profitCalculation.ts`
2. Run: `cd backend && npm run dev` (verify no TypeScript errors)

---

## PROMPT 6: Update Item Service - Add Pricing Logic

**Copy and paste into Claude Code (open backend folder):**

```
I have an item service at backend/src/services/itemService.ts

I need to update the createItem and updateItem functions to handle pricing fields:

1. Update the function signatures to accept these new fields:
   - purchasePrice: number
   - salePriceRetail: number
   - mrp?: number
   - gstRate: string (default "18")
   - additionalTax?: number

2. In createItem():
   - Import validatePrices from profitCalculation service
   - Validate prices before saving
   - Calculate profitPercentage = ((salePriceRetail - purchasePrice) / salePriceRetail) * 100
   - Calculate marginAmount = salePriceRetail - purchasePrice
   - Store all calculated values in prisma.item.create()
   - Return the created item with all new fields

3. In updateItem():
   - Same validation and calculation logic
   - Update using prisma.item.update()

4. In getItem() and getAllItems():
   - Include all pricing fields in the returned data
   - Make sure profitPercentage and marginAmount are included

5. Add error handling:
   - If prices invalid, throw error with message
   - If database operation fails, catch and return error

Show me the updated itemService with all these changes.
```

**After Claude generates:**
1. Review the code
2. Copy and replace your existing itemService.ts
3. Run: `npm run dev` (verify no errors)

---

## PROMPT 7: Create Profit Controller with Dashboard Endpoints

**Copy and paste into Claude Code (backend folder):**

```
Create a new profit controller at backend/src/controllers/profitController.ts

This needs 4 API endpoints:

1. GET /api/profit/today
   Handler: getTodayProfit()
   - Get all transactions from TODAY
   - Calculate: totalSales, totalCost, grossProfit, profitMargin (%)
   - Count transactions
   - Get top 3 items by profit
   - Return:
     {
       date: "2026-06-28",
       totalSales: number,
       totalCost: number,
       grossProfit: number,
       profitMargin: number,
       transactionCount: number,
       topItems: Array<{itemId, name, quantitySold, profit}>
     }

2. GET /api/profit/month/:year/:month
   Handler: getMonthProfit()
   - Get all transactions from that month/year
   - Calculate total sales, purchases, gross profit
   - Generate daily breakdown array
   - Return:
     {
       month: "June 2026",
       totalSales: number,
       totalPurchases: number,
       grossProfit: number,
       profitMargin: number,
       dailyBreakdown: Array<{date, profit}>
     }

3. GET /api/profit/items
   Handler: getItemsProfit()
   - Get all items with their total sales/profit
   - Sort by profit (highest first)
   - Return array:
     [
       {itemId, name, quantitySold, totalRevenue, totalCost, totalProfit, profitMargin, rank}
     ]

4. GET /api/profit/comparison/:period
   Handler: getComparison()
   - period = "today" | "week" | "month" | "year"
   - Compare current period vs last period
   - Return:
     {
       period: "month",
       thisPeriod: {sales, profit, margin},
       lastPeriod: {sales, profit, margin},
       growthPercent: number,
       trend: "up" | "down" | "stable"
     }

Use:
- Prisma for database queries
- calculateProfit() from profitCalculation service
- Proper error handling and async/await
- Include JSDoc comments

Show me the complete controller.
```

**After Claude generates:**
1. Save as `backend/src/controllers/profitController.ts`
2. We'll register routes next

---

## PROMPT 8: Register Profit Routes

**Copy and paste into Claude Code (backend folder):**

```
I need to register profit controller routes in my Express app.

In my main routes file (backend/src/routes/index.ts or similar), add these routes:

import profitController from '../controllers/profitController';

// Profit routes
router.get('/api/profit/today', 
  authenticateToken,  // Auth middleware
  profitController.getTodayProfit
);

router.get('/api/profit/month/:year/:month', 
  authenticateToken,
  profitController.getMonthProfit
);

router.get('/api/profit/items', 
  authenticateToken,
  profitController.getItemsProfit
);

router.get('/api/profit/comparison/:period', 
  authenticateToken,
  profitController.getComparison
);

Show me the complete updated routes file with all existing routes + new profit routes.
```

**After Claude generates:**
1. Copy and replace your routes file
2. Run: `npm run dev`
3. Test endpoint: `curl http://localhost:5001/api/profit/today`

---

## PROMPT 9: Update Item Form - Add Pricing Fields (Frontend)

**Copy and paste into Claude Code (open frontend folder):**

```
I need to enhance my item form component (frontend/src/pages/items/ItemForm.tsx or similar).

The form currently has: sku, name, description, barcode, quantity, price, category, location

Add these new fields and update the component:

1. Purchase Price field
   - Label: "Purchase Price (₹)"
   - Type: number, required
   - Placeholder: "10000"

2. Sale Price / Retail field
   - Label: "Sale Price / Retail (₹)"
   - Type: number, required
   - Placeholder: "12500"

3. MRP field (optional)
   - Label: "MRP - Maximum Retail Price (₹)"
   - Type: number, optional
   - Placeholder: "13999"

4. GST Rate dropdown
   - Label: "GST Rate (%)"
   - Options: 0%, 5%, 12%, 18%, 28%
   - Default: "18"
   - Type: select dropdown

5. Additional Tax field (optional)
   - Label: "Additional Tax (%)"
   - Type: number, step: 0.1
   - Placeholder: "2"

6. Profit Display (Read-only box)
   - Shows: "Profit Amount: ₹2,500 | Margin: 20%"
   - Styled box with background color
   - Updates in real-time as user types
   - Color coding:
     * Green if margin > 20%
     * Yellow if margin 10-20%
     * Orange if margin 5-10%
     * Red if margin < 5%

Logic:
- When user changes purchasePrice or salePriceRetail, calculate profit instantly
- Show validation: error if salePriceRetail <= purchasePrice
- Use React useState to manage these fields
- Store all fields in formData state

Layout:
Row 1: [Purchase Price] [Sale Price]
Row 2: [MRP] [GST Rate]
Row 3: [Additional Tax]
Row 4: [Profit Display - highlighted box]

Use Tailwind CSS for styling.
Make it responsive.

Show me the updated ItemForm component with all these fields.
```

**After Claude generates:**
1. Copy and replace your ItemForm component
2. Test: Create an item with pricing
3. Verify profit calculates in real-time

---

## PROMPT 10: Create Profit Dashboard Component (Frontend)

**Copy and paste into Claude Code (frontend folder):**

```
Create a new dashboard component at frontend/src/pages/dashboard/ProfitDashboard.tsx

This page shows today's profit snapshot and monthly P&L.

Layout:

1. PAGE TITLE
   "Profit Dashboard"

2. TODAY'S SNAPSHOT (3 big cards in a row)
   
   Card 1:
   💰 Today's Sales
   ₹12,400
   ↑ 5% vs yesterday
   (color: blue)
   
   Card 2:
   📈 Today's Profit
   ₹3,100
   25% margin
   ↑ 8% vs yesterday
   (color: green)
   
   Card 3:
   📊 Transactions
   34 transactions
   Avg: ₹365 per transaction
   (color: purple)

3. THIS MONTH SUMMARY (single card)
   
   Title: "Monthly Profit & Loss"
   
   Total Sales:        ₹423,400
   Total Cost:         ₹273,000
   Gross Profit:       ₹150,400
   Profit Margin:      35.5%
   
   [📥 Download PDF] [📊 View Full Report]

4. TOP 5 PRODUCTS BY PROFIT (table)
   
   Columns: # | Product Name | Qty Sold | Revenue | Cost | Profit | Margin %
   Row 1: 1 | Phone XYZ | 45 | ₹562,500 | ₹472,500 | ₹90,000 | 16%
   Row 2: 2 | T-Shirt | 320 | ₹96,000 | ₹72,000 | ₹24,000 | 25%
   ...
   Clickable rows to see more details

5. COMPARISON CHART (bar chart)
   
   Title: "Sales Comparison"
   X-axis: This Month | Last Month
   Y-axis: Amount (₹)
   Show growth % between bars
   This Month: ₹423,400
   Last Month: ₹398,700
   Growth: +6.2% ↑

Use:
- React Query to fetch /api/profit/today and /api/profit/month/2026/06
- recharts for the comparison bar chart
- Tailwind CSS for styling
- lucide-react icons
- Loading state while fetching
- Error handling if API fails

Cards should have:
- Nice background colors (light blue, light green, light purple)
- Icons on top left
- Big number in center
- Smaller text below

Make it professional and easy to read.
```

**After Claude generates:**
1. Save as `frontend/src/pages/dashboard/ProfitDashboard.tsx`
2. Add route to router (e.g., `/dashboard`)
3. Test: Navigate to dashboard and verify data loads

---

## PROMPT 11: Create Reports Component - Export P&L (Frontend)

**Copy and paste into Claude Code (frontend folder):**

```
Create a new reports page at frontend/src/pages/reports/ProfitReports.tsx

This page generates and exports profit reports.

Layout:

1. FILTERS SECTION
   Date Range Picker:
   [From Date] [To Date]
   Default: This month start to end
   
   Report Type (Radio buttons):
   ○ Monthly P&L Statement
   ○ Sales Analysis
   ○ Item Profitability
   ○ Month vs Month Comparison
   
   [Generate Report]

2. GENERATED REPORT DISPLAY
   
   A) Monthly P&L Statement Format:
   ═══════════════════════════════════════════════════
   PROFIT & LOSS STATEMENT
   June 2026
   ═══════════════════════════════════════════════════
   
   REVENUE
   Total Sales                              ₹423,400
   Less: Returns/Refunds                      (₹2,100)
   NET SALES                                ₹421,300
   
   COST OF GOODS SOLD
   Beginning Stock                          ₹85,000
   Add: Purchases                         +₹280,000
   Less: Ending Stock                    (₹92,000)
   COST OF GOODS SOLD                      ₹273,000
   
   GROSS PROFIT                            ₹148,300 (35.2%)
   
   OPERATING EXPENSES (Phase 2)            ₹0
   
   NET PROFIT (BEFORE TAX)                 ₹148,300 (35.2%)
   ═══════════════════════════════════════════════════
   
   B) Sales Analysis:
   - Transactions this period
   - Top products
   - Category breakdown
   
   C) Item Profitability:
   - Sortable table of all items
   - Columns: Item | Qty | Revenue | Cost | Profit | Margin%
   
   D) Comparison:
   - Side-by-side comparison
   - Growth percentages

3. EXPORT BUTTONS
   [📥 Download PDF] [📊 Download Excel] [📧 Email]

Use:
- React Query to fetch report data
- date-fns for date handling
- jsPDF for PDF export (generate professional PDF)
- xlsx library for Excel export
- Tailwind CSS

PDF should include:
- Shop name/logo area
- Report title and date range
- All data formatted nicely
- Page breaks if needed
- Print-friendly

Excel should include:
- Raw data in columns
- Formulas for calculated cells
- Multiple sheets if multiple report types

Make report look professional and printable.
```

**After Claude generates:**
1. Save as `frontend/src/pages/reports/ProfitReports.tsx`
2. Install required libraries: `npm install jspdf xlsx date-fns`
3. Add route to router
4. Test: Generate and export a report

---

## QUICK TESTING PROMPTS

### Test the API Endpoints

**Copy and paste into terminal:**

```bash
# Test 1: Today's Profit
curl http://localhost:5001/api/profit/today

# Test 2: Month Profit
curl http://localhost:5001/api/profit/month/2026/06

# Test 3: Items Profit
curl http://localhost:5001/api/profit/items

# Test 4: Comparison
curl http://localhost:5001/api/profit/comparison/month

# If you get CORS error, that's normal (frontend makes the requests)
# If you get 404, the routes aren't registered yet
# If you get 500, check backend console for errors
```

---

## WORKFLOW: How to Execute

1. **Open VS Code with backend folder:**
   ```bash
   cd backend
   code .
   ```

2. **Press Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows)** to open Claude Code

3. **Copy PROMPT 1** from above

4. **Paste into Claude Code text field**

5. **Press Enter** - Claude generates code

6. **Review the generated code** in VS Code

7. **Save the file** (Cmd+S or Ctrl+S)

8. **Repeat for PROMPTS 2-11**, moving to frontend folder for UI prompts

9. **Test after each prompt** using commands below

---

## Testing Checklist

After each prompt, verify:

```
Task 1-4 (Database):
☐ No TypeScript errors in schema
☐ Migration runs successfully (npx prisma db push)
☐ New columns appear in Azure SQL

Task 5-8 (Backend):
☐ npm run dev starts without errors
☐ API endpoints respond (curl commands work)
☐ Console logs show correct calculations

Task 9-11 (Frontend):
☐ npm run dev starts without errors
☐ Components load without crashes
☐ Forms accept pricing fields
☐ Dashboard shows data
☐ Exports create files
```

---

## Need Help?

If you get stuck:
1. **Copy the error message** from terminal
2. **Create a new Claude Code prompt:**
   ```
   I'm getting this error: [paste error]
   
   I was trying to: [describe what you were doing]
   
   Help me fix this.
   ```
3. **Claude will help debug**

---

## You're Ready! 🚀

Everything above is copy-paste ready. Just:
1. Open Claude Code
2. Paste prompts one by one
3. Execute tests
4. Mark tasks complete

**Start with PROMPT 1 and work through in order.**

Good luck! Let me know how it goes! 💪
