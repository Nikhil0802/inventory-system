# Inventory Management System - Phase 1 Enhancement Tasks
**Deployment Guide for Claude Code (VS Code)**

---

## Overview

This document provides **8 sequential tasks** to add Pricing & Financial Intelligence to your existing Inventory Management System. Each task is designed to be completed in 1-2 hours with Claude Code.

**Prerequisites:**
- ✅ Your backend is running on port 5001
- ✅ Azure SQL Database connected via Prisma
- ✅ VS Code with Claude Code extension enabled
- ✅ Terminal access in VS Code

**Total Time:** ~12-14 hours for Phase 1
**Target:** Production-ready by end of Week 1

---

## Task 7: Database Schema Enhancement - Pricing Fields

**Objective:** Add pricing columns to Items table (purchasePrice, salePriceRetail, mrp, gstRate, profitPercentage)

**Status:** 🔵 READY TO START

### Step 1: Update Prisma Schema

**File to modify:** `backend/prisma/schema.prisma`

**Claude Code Prompt:**

```
I'm building pricing features for my inventory system. 

In the Items model in my Prisma schema (backend/prisma/schema.prisma), I need to add these new fields:

1. purchasePrice - DECIMAL(10,2) - the cost I paid
2. salePriceRetail - DECIMAL(10,2) - the price customers pay
3. mrp - DECIMAL(10,2) - Maximum Retail Price (for packaged goods)
4. gstRate - String (enum-like) - "0", "5", "12", "18", "28"
5. additionalTax - DECIMAL(5,2) - any state/local tax %
6. profitPercentage - DECIMAL(5,2) - auto-calculated: ((salePriceRetail - purchasePrice) / salePriceRetail) × 100
7. marginAmount - DECIMAL(10,2) - auto-calculated: salePriceRetail - purchasePrice

Add these fields to the Items model with appropriate types and comments.
Make profitPercentage and marginAmount optional (@default(0)) since they'll be computed.

Also add a note in the schema: These fields enable profit calculation and GST compliance.
```

**Expected Output:**
- Updated `schema.prisma` with new fields
- Comments explaining each field
- Ready for next step

**Verification:**
```bash
cd backend
npx prisma format  # Format the schema
```

---

### Step 2: Create & Run Migration

**Claude Code Prompt:**

```
I need to create a Prisma migration to add the pricing fields to the Items table.

My database is Azure SQL Server.
The prisma.config.ts file reads DATABASE_URL from .env

Create a migration with:
1. A descriptive name: add-pricing-fields-to-items
2. Add purchasePrice DECIMAL(10,2) to Items table
3. Add salePriceRetail DECIMAL(10,2) to Items table
4. Add mrp DECIMAL(10,2) to Items table
5. Add gstRate VARCHAR(10) to Items table
6. Add additionalTax DECIMAL(5,2) to Items table
7. Add profitPercentage DECIMAL(5,2) DEFAULT 0 to Items table
8. Add marginAmount DECIMAL(10,2) DEFAULT 0 to Items table

Generate the migration file and tell me the exact command to run it.

Note: Azure SQL doesn't use shadow database, so I'll use npx prisma db push
```

**Expected Output:**
- Migration file created in `backend/prisma/migrations/`
- Command to execute: `npx prisma db push`
- Confirmation message when migration succeeds

**Verification:**
```bash
cd backend
npx prisma db push
# Should show: ✔ Database synced with schema
```

---

## Task 8: Database Schema Enhancement - Transaction Fields

**Objective:** Add GST and discount fields to Transactions table

**Status:** 🔵 READY TO START

### Step 1: Update Prisma Schema (Transactions)

**Claude Code Prompt:**

```
In my Prisma schema (backend/prisma/schema.prisma), I need to add these fields to the Transactions model:

1. gstAmount - DECIMAL(10,2) - GST amount charged on sale
2. gstRate - String - GST rate applied ("0", "5", "12", "18", "28")
3. discountPercentage - DECIMAL(5,2) - discount % given
4. discountAmount - DECIMAL(10,2) - discount amount in rupees
5. netAmount - DECIMAL(12,2) - final amount after GST and discount
6. paymentMethod - String - how they paid ("cash", "cheque", "online", "credit")

Also update totalAmount to be a computed field based on: (quantity × price) + gstAmount - discountAmount

Add comments explaining each field.
```

**Expected Output:**
- Updated Transactions model in schema.prisma
- All fields documented

---

### Step 2: Create & Run Migration

**Claude Code Prompt:**

```
Create a Prisma migration to add GST and discount fields to the Transactions table.

Add these columns:
1. gstAmount DECIMAL(10,2) DEFAULT 0
2. gstRate VARCHAR(10) DEFAULT '18'
3. discountPercentage DECIMAL(5,2) DEFAULT 0
4. discountAmount DECIMAL(10,2) DEFAULT 0
5. netAmount DECIMAL(12,2) - this should equal (quantity × price) + gstAmount - discountAmount
6. paymentMethod VARCHAR(50) DEFAULT 'cash'

Generate migration file and provide the command to run it.
```

**Verification:**
```bash
cd backend
npx prisma db push
```

---

## Task 9: Backend API - Profit Calculation Service

**Objective:** Create utility functions for profit calculation

**Status:** 🔵 READY TO START

### Create ProfitCalculation Service

**File to create:** `backend/src/services/profitCalculation.ts`

**Claude Code Prompt:**

```
I need to create a profit calculation service in backend/src/services/profitCalculation.ts

This service should export these functions:

1. calculateProfit(salePriceRetail: number, purchasePrice: number)
   - Returns { profitAmount: number, profitPercentage: number }
   - profitAmount = salePriceRetail - purchasePrice
   - profitPercentage = (profitAmount / salePriceRetail) × 100

2. calculateGST(amount: number, gstRate: number)
   - Returns { gstAmount: number, totalWithGST: number }
   - gstAmount = amount × (gstRate / 100)
   - totalWithGST = amount + gstAmount

3. calculateNetAmount(subtotal: number, gstAmount: number, discountAmount: number)
   - Returns netAmount = subtotal + gstAmount - discountAmount

4. calculateMargin(salePriceRetail: number, purchasePrice: number)
   - Returns marginAmount = salePriceRetail - purchasePrice (same as profit amount)

5. validatePrices(purchasePrice: number, salePriceRetail: number, mrp: number)
   - Validates: purchasePrice > 0
   - Validates: salePriceRetail > purchasePrice (must have profit)
   - Validates: mrp >= salePriceRetail (can't sell above MRP)
   - Returns: { isValid: boolean, errors: string[] }

Include proper error handling and TypeScript types.
Add JSDoc comments for each function.
```

**Expected Output:**
- `backend/src/services/profitCalculation.ts` created
- All functions exported and ready to use

---

## Task 10: Backend API - Update Item Model Service

**Objective:** Add profit calculation to Item creation & updates

**Status:** 🔵 READY TO START

### Update ItemService

**File to modify:** `backend/src/services/itemService.ts` (or create if doesn't exist)

**Claude Code Prompt:**

```
I have a service for Items at backend/src/services/itemService.ts

I need to update the createItem() and updateItem() functions to:

1. Accept new fields in request body:
   - purchasePrice
   - salePriceRetail
   - mrp
   - gstRate (default "18")
   - additionalTax (optional)

2. When creating/updating an item:
   - Validate prices using validatePrices() from profitCalculation service
   - Calculate profitPercentage = ((salePriceRetail - purchasePrice) / salePriceRetail) × 100
   - Calculate marginAmount = salePriceRetail - purchasePrice
   - Store these calculated values in DB

3. In getItem() and getAllItems():
   - Return all pricing fields
   - Include calculated profitPercentage and marginAmount

4. Add error handling for invalid prices

Here's my current itemService structure (if it exists):
[If you have existing code, paste it here for context]

Import and use the profitCalculation service for calculations.
```

**Expected Output:**
- Updated itemService with pricing logic
- Automatic profit calculation on item create/update

---

## Task 11: Backend API - Profit Dashboard Endpoints

**Objective:** Create API endpoints for daily profit calculations

**Status:** 🔵 READY TO START

### Create Profit Controller

**File to create:** `backend/src/controllers/profitController.ts`

**Claude Code Prompt:**

```
Create a profit dashboard controller at backend/src/controllers/profitController.ts

This controller needs these endpoints:

1. GET /api/profit/today
   - Returns:
     {
       date: "2026-06-28",
       totalSales: number,
       totalCost: number,
       grossProfit: number,
       profitMargin: number (%),
       transactionCount: number,
       topItems: [ { name, sold, profit } ]
     }

2. GET /api/profit/month/:year/:month
   - Returns P&L for that month:
     {
       month: "June 2026",
       totalSales: number,
       totalPurchases: number,
       cogs: number,
       grossProfit: number,
       profitMargin: number,
       dailyBreakdown: [ { date, profit } ]
     }

3. GET /api/profit/items
   - Returns all items sorted by profit:
     [
       {
         itemId, 
         name, 
         quantitySold: number,
         totalRevenue: number,
         totalCost: number,
         totalProfit: number,
         profitMargin: number,
         rank: 1
       }
     ]

4. GET /api/profit/comparison/:period
   - Compare this period vs last period
   - period = "today", "week", "month", "year"
   - Returns { thisperiod, lastPeriod, growth%, trend }

Each endpoint should:
- Use prisma to query transactions
- Calculate profit correctly
- Return JSON with proper types
- Include error handling
```

**Expected Output:**
- `backend/src/controllers/profitController.ts` created
- All endpoints ready to test

---

### Register Routes

**File to modify:** `backend/src/routes/index.ts` or `routes.ts`

**Claude Code Prompt:**

```
I need to register the profit controller routes in my Express app.

Add these routes to my main routes file:

router.get('/api/profit/today', profitController.getTodayProfit);
router.get('/api/profit/month/:year/:month', profitController.getMonthProfit);
router.get('/api/profit/items', profitController.getItemsProfit);
router.get('/api/profit/comparison/:period', profitController.getComparison);

Import profitController at the top.
Make sure routes are protected by auth middleware (only logged-in users).

Show me the complete updated routes file.
```

---

## Task 12: Frontend - Item Form Enhancement

**Objective:** Update item creation/edit form to accept pricing fields

**Status:** 🔵 READY TO START

### Update Item Form Component

**File to modify:** `frontend/src/pages/items/ItemForm.tsx` (or similar)

**Claude Code Prompt:**

```
I need to enhance my item form component to handle pricing fields.

Current form has: sku, name, description, barcode, quantity, price, category, location

Add these new fields:

1. Purchase Price (₹)
   - Input field, type="number", required
   - Placeholder: "10000"

2. Sale Price / Retail (₹)
   - Input field, type="number", required
   - Placeholder: "12500"

3. MRP (₹) [Optional]
   - Input field, type="number"
   - Placeholder: "13999" (or leave blank for non-packaged)

4. GST Rate (%)
   - Dropdown with options: 0%, 5%, 12%, 18%, 28%
   - Default: 18%
   - Show as select element

5. Additional Tax (%) [Optional]
   - Input field, type="number", step="0.1"
   - Placeholder: "2" (for state/local tax)

6. Profit Display (Read-only, calculated):
   - Shows: "Profit Amount: ₹2,500 | Margin: 20%"
   - Updates in real-time as user changes purchase/sale price
   - Use color coding: Green if profit > 15%, Yellow if 10-15%, Red if < 10%

Layout should be:
[Purchase Price] [Sale Price]
[MRP] [GST Rate]
[Additional Tax]
[Profit Display - in a highlighted box]

When user changes purchase or sale price, auto-calculate and show profit.

Use React state to manage these fields.
Show validation errors if sale price < purchase price.
```

**Expected Output:**
- Enhanced item form with all pricing fields
- Real-time profit calculation UI

---

## Task 13: Frontend - Daily Profit Dashboard

**Objective:** Create the main profit dashboard page

**Status:** 🔵 READY TO START

### Create Dashboard Component

**File to create:** `frontend/src/pages/dashboard/ProfitDashboard.tsx`

**Claude Code Prompt:**

```
Create a new dashboard component at frontend/src/pages/dashboard/ProfitDashboard.tsx

This should display:

1. TODAY'S SNAPSHOT (Big Cards)
   ┌─────────────────────────────┐
   │ 💰 Today's Sales             │
   │ ₹12,400                      │
   │ ↑ 5% vs yesterday            │
   └─────────────────────────────┘
   
   ┌─────────────────────────────┐
   │ 📈 Today's Profit            │
   │ ₹3,100                       │
   │ 25% margin                   │
   │ ↑ 8% vs yesterday            │
   └─────────────────────────────┘
   
   ┌─────────────────────────────┐
   │ 📊 Transactions              │
   │ 34 transactions              │
   │ Avg value: ₹365              │
   └─────────────────────────────┘

2. THIS MONTH SUMMARY
   ┌─────────────────────────────┐
   │ Monthly Profit & Loss        │
   │                             │
   │ Total Sales      ₹423,400   │
   │ Total Cost       ₹273,000   │
   │ Gross Profit     ₹150,400   │
   │ Profit Margin    35.5%      │
   │                             │
   │ [📥 Download PDF] [📊 View Details]
   └─────────────────────────────┘

3. TOP 5 PRODUCTS BY PROFIT
   Table:
   # | Product | Qty Sold | Revenue | Profit | Margin %
   1 | Phone   | 45       | ₹562,500| ₹90,000| 16%
   2 | T-Shirt | 320      | ₹96,000 | ₹24,000| 25%
   ...

4. MONTH COMPARISON CHART
   Simple bar chart:
   This Month: ₹423,400
   Last Month: ₹398,700
   Growth: +6.2% ↑

Use:
- React Query to fetch data from /api/profit/today and /api/profit/month endpoints
- recharts for the comparison chart
- Tailwind CSS for styling
- Icons from lucide-react for visual appeal

Add color coding:
- Green for positive growth
- Red for negative
- Blue for neutral info

Include error handling and loading states.
```

**Expected Output:**
- `frontend/src/pages/dashboard/ProfitDashboard.tsx` created
- Fully functional profit dashboard with real data

---

## Task 14: Frontend - Profit Reports Page

**Objective:** Create reports page with export functionality

**Status:** 🔵 READY TO START

### Create Reports Component

**File to create:** `frontend/src/pages/reports/ProfitReports.tsx`

**Claude Code Prompt:**

```
Create a profit reports page at frontend/src/pages/reports/ProfitReports.tsx

This page needs:

1. DATE RANGE SELECTOR
   [From Date] [To Date] [Generate Report]
   Default: This month

2. REPORT TYPE SELECTOR
   Radio buttons:
   ○ Monthly P&L
   ○ Sales Analysis
   ○ Item Profitability
   ○ Comparison (Month vs Month)

3. DISPLAY GENERATED REPORT
   Format depends on selection:
   
   A) Monthly P&L Report
   ═══════════════════════════════════════════════════
   PROFIT & LOSS STATEMENT
   June 2026
   ═══════════════════════════════════════════════════
   
   REVENUE
   Total Sales                              ₹423,400
   Less: Returns/Refunds                    (₹2,100)
   NET SALES                                ₹421,300
   
   COST OF GOODS SOLD
   Beginning Stock Value                    ₹85,000
   Plus: Purchases                         +₹280,000
   Less: Ending Stock Value                (₹92,000)
   TOTAL COGS                               ₹273,000
   
   GROSS PROFIT                             ₹148,300 (35.2%)
   
   OPERATING EXPENSES (to add in Phase 2)   ₹0
   
   NET PROFIT (BEFORE TAX)                  ₹148,300 (35.2%)
   ═══════════════════════════════════════════════════
   
   B) Sales Analysis
   Top/Bottom items, categories, trends
   
   C) Item Profitability
   Sortable table by profit, margin, etc.
   
   D) Comparison
   This Month vs Last Month
   Side-by-side comparison with % change

4. EXPORT OPTIONS
   [📥 Download PDF] [📊 Download Excel] [📧 Email Report]

Use:
- React Query to fetch report data
- Date picker (react-datepicker)
- recharts for any charts
- jsPDF for PDF export
- xlsx for Excel export
- Tailwind CSS

Each report should be:
- Professional looking
- Print-friendly
- Include shop name, date range
- Include generated timestamp
```

**Expected Output:**
- `frontend/src/pages/reports/ProfitReports.tsx` created
- Export functionality working

---

## Task 15: Integration & Testing

**Objective:** Test all new features end-to-end

**Status:** 🔵 READY TO START

### Test Workflow

**Claude Code Prompt:**

```
I need to test the entire profit feature workflow.

Here's my test plan - help me verify each step:

1. CREATE AN ITEM with pricing:
   - Name: Test Phone
   - Purchase Price: 10,000
   - Sale Price: 12,500
   - MRP: 13,999
   - GST: 18%
   
   Verify:
   - Item saved in DB with pricing fields
   - Profit calculated: ₹2,500 (20%)
   - Can see item in item list

2. RECORD SALES TRANSACTIONS:
   - Record 5 sales of the phone
   - Each at ₹12,500
   
   Verify:
   - Each transaction stores gstAmount (18%)
   - netAmount calculated correctly
   - Transactions appear in history

3. CHECK DASHBOARD:
   - Visit /profit/today
   - Should show:
     - Today's Sales: ₹62,500
     - Today's Profit: ₹12,500 (20%)
     - Transaction count: 5
   
   Verify: Numbers are correct

4. CHECK P&L REPORT:
   - Visit /reports
   - Select "Monthly P&L"
   - Verify:
     - Total Sales correct
     - Profit calculated correctly
     - Can export to PDF

5. PROFIT INSIGHTS:
   - Check /profit/items endpoint
   - Phone should rank #1 by profit
   - Show correct profit per unit

Tell me what to test and how to verify success.
```

**Verification Checklist:**
```
✅ Database schema updated (5 new fields in Items, 6 in Transactions)
✅ Migrations run successfully  
✅ Item form accepts all pricing fields
✅ Profit automatically calculated when creating item
✅ Profit dashboard shows today's profit correctly
✅ P&L report generates with correct numbers
✅ Export to PDF works
✅ Export to Excel works
✅ All API endpoints return correct data
✅ Frontend and backend communicate properly
✅ No console errors
✅ UI looks professional
```

---

## Task 16: Deployment to Production

**Objective:** Deploy enhanced app to Azure

**Status:** 🔵 READY TO DEPLOY

### Pre-deployment Checklist

**Claude Code Prompt:**

```
I'm ready to deploy Phase 1 to production.

Help me with deployment checklist:

1. Database
   - Run migrations on production database
   - Backup existing data first
   - Verify new columns exist

2. Backend
   - Build production bundle
   - Update environment variables
   - Run tests
   - Deploy to Azure App Service

3. Frontend
   - Build production bundle
   - Update API URLs (if needed)
   - Test all endpoints
   - Deploy to Azure Static Web Apps

4. Verification
   - Test key flows in production
   - Monitor for errors
   - Check API response times

Here's my deployment setup:
- Backend: Azure App Service (Node.js)
- Frontend: Azure Static Web Apps
- Database: Azure SQL

Provide exact commands for:
1. Building backend for production
2. Building frontend for production
3. Running in production
4. Monitoring for issues

Also provide rollback plan in case something breaks.
```

---

## How To Execute Tasks with Claude Code

### Workflow for Each Task

1. **Open VS Code**
   ```
   code backend/
   # or
   code frontend/
   ```

2. **Open Claude Code Panel**
   - Press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows)
   - Claude Code panel opens on right side

3. **Copy Task Prompt**
   - Find the task above
   - Copy the "Claude Code Prompt" section

4. **Paste in Claude Code**
   - Click in Claude Code input
   - Paste the prompt
   - Press Enter

5. **Claude Generates Code**
   - Claude creates files or modifies existing ones
   - Files appear in VS Code
   - Review the changes
   - Save if happy

6. **Test**
   - Run the suggested commands
   - Verify it works
   - Mark task complete ✅

---

## Quick Command Reference

```bash
# Terminal commands you'll need

# Start backend
cd backend
npm run dev

# Run migrations
npx prisma db push

# Test API endpoint
curl http://localhost:5001/api/profit/today

# Build frontend
cd frontend
npm run build

# Start frontend dev
npm run dev
```

---

## Estimated Timeline

| Task | Effort | Status |
|------|--------|--------|
| Task 7: Prisma Schema (Items) | 30 min | 🔵 |
| Task 8: Prisma Schema (Transactions) | 30 min | 🔵 |
| Task 9: Profit Service | 1 hour | 🔵 |
| Task 10: Item Service Update | 1 hour | 🔵 |
| Task 11: Profit Controller | 1.5 hours | 🔵 |
| Task 12: Item Form UI | 1.5 hours | 🔵 |
| Task 13: Profit Dashboard | 2 hours | 🔵 |
| Task 14: Reports Page | 2 hours | 🔵 |
| Task 15: Testing | 1 hour | 🔵 |
| Task 16: Deployment | 1 hour | 🔵 |
| **TOTAL** | **~12 hours** | 🔵 |

---

## Success Criteria

By end of Phase 1, you should have:

✅ **Database:** 
- Items table with pricing fields
- Transactions table with GST/discount fields

✅ **Backend:**
- Profit calculation service
- 4 profit API endpoints
- Automatic profit calculation

✅ **Frontend:**
- Enhanced item form (pricing fields)
- Daily profit dashboard
- P&L reports with export

✅ **Deployed:**
- All changes live in production
- Working with real data
- Ready for users

---

## Next Steps

1. **Start with Task 7** - Update Prisma schema
2. **Run each task in sequence** - Don't skip ahead
3. **Test after each task** - Verify it works
4. **Ask me if stuck** - DM me the error
5. **Move to Phase 2** after Phase 1 complete

**Let's build! 🚀**
