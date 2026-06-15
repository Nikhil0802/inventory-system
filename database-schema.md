# Inventory Management System - Database Schema

**Created:** January 2024  
**Version:** 1.0  
**Database:** Azure SQL Server  

---

## Overview

This schema defines the structure for a multi-user inventory management system with role-based access, barcode scanning, transaction tracking, and license tiers.

### Design Principles
- ✅ Normalized structure (reduces data duplication)
- ✅ Foreign keys link related data
- ✅ UUIDs for security and scalability
- ✅ Timestamps for audit trails
- ✅ Soft deletes support (future enhancement)

---

## Table Relationships

```
┌──────────────┐
│   LICENSES   │
├──────────────┤
│ id (PK)      │
│ type         │◄─────┐
│ itemLimit    │      │
│ maxUsers     │      │ (one license → many users)
│ expiryDate   │      │
└──────────────┘      │
                      │
┌──────────────┐      │
│    USERS     │──────┘
├──────────────┤
│ id (PK)      │
│ email        │
│ password     │
│ name         │
│ role         │
│ licenseId(FK)│
│ createdAt    │
└──────────────┘
       │
       │ (one user → many items)
       │ (one user → many transactions)
       │
       ├──────────────────────────┬─────────────────────┐
       │                          │                     │
       ▼                          ▼                     ▼
┌──────────────┐        ┌──────────────────┐
│    ITEMS     │        │  TRANSACTIONS    │
├──────────────┤        ├──────────────────┤
│ id (PK)      │◄───────│ itemId (FK)      │
│ userId (FK)  │        │ userId (FK)      │
│ sku          │        │ type             │
│ name         │        │ quantity         │
│ barcode      │        │ price            │
│ quantity     │        │ totalAmount      │
│ price        │        │ referenceNo      │
│ expiryDate   │        │ transactionDate  │
│ location     │        │ supplierOrBuyer  │
│ createdAt    │        │ createdAt        │
│ updatedAt    │        └──────────────────┘
└──────────────┘
```

---

## 1. LICENSES TABLE

**Purpose:** Store subscription/license information for different user tiers

### Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique license identifier |
| userId | UUID | FOREIGN KEY → Users.id | User who owns this license |
| type | ENUM | NOT NULL | Options: 'free', 'basic', 'pro' |
| itemLimit | INTEGER | NOT NULL | Max items allowed (free: 1000, pro: unlimited) |
| maxUsers | INTEGER | NOT NULL | Number of team members allowed |
| expiryDate | DATE | NULLABLE | When license expires (null = no expiration) |
| purchasedAt | TIMESTAMP | NOT NULL | When license was purchased |

### Sample Data

```sql
INSERT INTO Licenses VALUES
('lic-001-uuid', 'user-001-uuid', 'pro', 999999, 50, '2025-01-15', '2024-01-15 10:00:00'),
('lic-002-uuid', 'user-002-uuid', 'basic', 5000, 5, '2024-06-15', '2023-12-01 14:30:00'),
('lic-003-uuid', 'user-003-uuid', 'free', 1000, 1, NULL, '2024-01-10 09:15:00');
```

### Business Rules
- One user = one license
- Free tier: 1000 items max, 1 user
- Basic tier: 5000 items max, 5 users
- Pro tier: unlimited items, unlimited users
- Dates help track renewal timing

---

## 2. USERS TABLE

**Purpose:** Store user account information with role-based access control

### Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| name | VARCHAR(255) | NOT NULL | User's full name |
| role | ENUM | NOT NULL | Options: 'admin', 'manager', 'staff', 'reader' |
| licenseId | UUID | FOREIGN KEY → Licenses.id | Link to their license plan |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Account creation time |

### Role Definitions

| Role | Permissions |
|------|-------------|
| **admin** | Full access - manage users, items, transactions, licenses |
| **manager** | Manage items & transactions, view reports |
| **staff** | Add/edit items, record transactions, view inventory |
| **reader** | View-only access to reports and dashboard |

### Sample Data

```sql
INSERT INTO Users VALUES
('user-001-uuid', 'alice@company.com', '$2b$10$hashed...', 'Alice Johnson', 'admin', 'lic-001-uuid', '2024-01-15 10:30:00'),
('user-002-uuid', 'bob@company.com', '$2b$10$hashed...', 'Bob Smith', 'manager', 'lic-002-uuid', '2024-01-16 11:15:00'),
('user-003-uuid', 'carol@company.com', '$2b$10$hashed...', 'Carol Davis', 'staff', 'lic-001-uuid', '2024-01-17 09:45:00');
```

### Important Notes
- Email must be unique (no duplicates)
- Passwords are hashed using bcrypt (never stored plain)
- createdAt auto-sets to current time
- Users under same license share the same licenseId

---

## 3. ITEMS TABLE

**Purpose:** Store inventory items with detailed tracking information

### Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| userId | UUID | FOREIGN KEY → Users.id | User who created/owns this item |
| sku | VARCHAR(255) | UNIQUE, NOT NULL | Stock Keeping Unit (unique product code) |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | NULLABLE | Detailed product description |
| barcode | VARCHAR(255) | NOT NULL | Barcode for scanning (can be EAN-13, UPC, etc.) |
| quantity | INTEGER | NOT NULL, DEFAULT=0 | Current stock quantity |
| price | DECIMAL(10,2) | NOT NULL | Unit price (₹) |
| category | VARCHAR(100) | NOT NULL | Product category |
| manufacturingDate | DATE | NULLABLE | When the item was manufactured |
| expiryDate | DATE | NULLABLE | When the item expires (null if no expiry) |
| serialNumber | VARCHAR(255) | NULLABLE | Serial number for tracking (optional) |
| location | VARCHAR(255) | NOT NULL | Physical location (shelf number, bin, etc.) |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT=NOW() | When item was added to inventory |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Last modification time |

### Sample Data

```sql
INSERT INTO Items VALUES
(
  'item-001-uuid',
  'user-001-uuid',
  'ELEC-001',
  'Laptop Dell XPS 13',
  'High performance laptop with 16GB RAM',
  '9780134685991',
  45,
  85000.00,
  'electronics',
  '2024-01-01',
  NULL,
  'DELL-XPS-SN-12345',
  'Shelf A3',
  '2024-01-15 10:30:00',
  '2024-01-15 10:30:00'
),
(
  'item-002-uuid',
  'user-001-uuid',
  'CONS-005',
  'Office Paper Ream (500 sheets)',
  'Standard A4 white paper',
  '1234567890123',
  200,
  350.00,
  'consumables',
  '2024-01-10',
  '2025-01-10',
  NULL,
  'Storage Room B2',
  '2024-01-15 11:00:00',
  '2024-01-15 11:00:00'
);
```

### Category Options

```
- electronics (laptops, monitors, keyboards, etc.)
- consumables (paper, ink, cleaning supplies, etc.)
- raw_materials (for manufacturing)
- finished_goods (products ready for sale)
- tools (equipment and machinery)
- furniture (office furniture, shelving, etc.)
- software (licenses, subscriptions)
```

### Business Rules
- SKU must be unique per company
- Barcode links to product for scanning
- Quantity updates with each transaction
- Location helps with physical inventory counts
- expiryDate is optional (null for non-perishable items)
- serialNumber used for high-value items

---

## 4. TRANSACTIONS TABLE

**Purpose:** Log every inventory movement (buy, sell, transfer, adjust)

### Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique transaction identifier |
| userId | UUID | FOREIGN KEY → Users.id | User who recorded this transaction |
| itemId | UUID | FOREIGN KEY → Items.id | Item involved in transaction |
| type | ENUM | NOT NULL | Options: 'purchase', 'sale', 'transfer', 'adjustment' |
| quantity | INTEGER | NOT NULL | Number of units moved |
| price | DECIMAL(10,2) | NOT NULL | Price per unit (₹) |
| totalAmount | DECIMAL(12,2) | NOT NULL | Quantity × Price |
| referenceNo | VARCHAR(255) | NOT NULL | Invoice/PO/Receipt number |
| transactionDate | DATE | NOT NULL | Date when transaction occurred |
| supplierOrBuyer | VARCHAR(255) | NOT NULL | Company/person name |
| notes | TEXT | NULLABLE | Additional comments |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT=NOW() | When recorded in system |

### Transaction Types Explained

```
1. PURCHASE
   - Buying items from suppliers
   - Quantity increases
   - supplierOrBuyer = supplier name
   - Example: Buy 45 laptops from Dell

2. SALE
   - Selling items to customers
   - Quantity decreases
   - supplierOrBuyer = customer name
   - Example: Sell 5 laptops to ABC Corp

3. TRANSFER
   - Moving items between locations/warehouses
   - Quantity stays same, location changes
   - supplierOrBuyer = destination location
   - Example: Transfer 10 items from Warehouse A to Warehouse B

4. ADJUSTMENT
   - Inventory correction (damage, loss, counting error)
   - Quantity adjusts
   - supplierOrBuyer = reason
   - Example: Write-off 3 damaged units
```

### Sample Data

```sql
-- PURCHASE: Buying 45 laptops from Dell
INSERT INTO Transactions VALUES
(
  'tx-001-uuid',
  'user-001-uuid',
  'item-001-uuid',
  'purchase',
  45,
  75000.00,
  3375000.00,
  'PO-2024-001',
  '2024-01-10',
  'Dell India Ltd',
  'Bulk order for office expansion',
  '2024-01-10 10:00:00'
);

-- SALE: Selling 5 laptops to ABC Corporate
INSERT INTO Transactions VALUES
(
  'tx-002-uuid',
  'user-002-uuid',
  'item-001-uuid',
  'sale',
  5,
  85000.00,
  425000.00,
  'INV-2024-042',
  '2024-01-15',
  'ABC Corporate',
  'Customer order #12345',
  '2024-01-15 14:30:00'
);

-- ADJUSTMENT: Damage write-off
INSERT INTO Transactions VALUES
(
  'tx-003-uuid',
  'user-003-uuid',
  'item-001-uuid',
  'adjustment',
  -2,
  85000.00,
  -170000.00,
  'ADJ-2024-001',
  '2024-01-18',
  'Damaged in shipping',
  'Physical count revealed 2 damaged units',
  '2024-01-18 09:15:00'
);
```

### Business Rules
- Every transaction must link to an item (itemId)
- quantity can be positive or negative (adjustment/damage)
- totalAmount = quantity × price (computed)
- referenceNo helps track original documents
- Transactions are immutable (not edited, only recorded once)
- Together with Items.quantity, tracks complete audit trail

---

## Data Integrity & Relationships

### Foreign Key Constraints

```sql
-- Users table
ALTER TABLE Users ADD CONSTRAINT FK_Users_Licenses
  FOREIGN KEY (licenseId) REFERENCES Licenses(id);

-- Items table
ALTER TABLE Items ADD CONSTRAINT FK_Items_Users
  FOREIGN KEY (userId) REFERENCES Users(id);

-- Transactions table
ALTER TABLE Transactions ADD CONSTRAINT FK_Transactions_Users
  FOREIGN KEY (userId) REFERENCES Users(id);

ALTER TABLE Transactions ADD CONSTRAINT FK_Transactions_Items
  FOREIGN KEY (itemId) REFERENCES Items(id);
```

### Unique Constraints

```sql
ALTER TABLE Users ADD CONSTRAINT UQ_Users_Email
  UNIQUE (email);

ALTER TABLE Items ADD CONSTRAINT UQ_Items_SKU
  UNIQUE (sku);
```

---

## Indexes for Performance

To speed up queries, create these indexes:

```sql
-- Fast user lookups by email (login)
CREATE INDEX IX_Users_Email ON Users(email);

-- Fast item searches by SKU and barcode
CREATE INDEX IX_Items_SKU ON Items(sku);
CREATE INDEX IX_Items_Barcode ON Items(barcode);

-- Fast transaction searches by date and type
CREATE INDEX IX_Transactions_Date ON Transactions(transactionDate);
CREATE INDEX IX_Transactions_ItemId ON Transactions(itemId);

-- Fast lookups for a user's items
CREATE INDEX IX_Items_UserId ON Items(userId);
```

---

## Example Queries

### Get inventory summary
```sql
SELECT 
  name, 
  sku, 
  quantity, 
  price, 
  (quantity * price) AS total_value
FROM Items
WHERE userId = 'user-001-uuid'
ORDER BY name;
```

### Get recent transactions
```sql
SELECT 
  t.referenceNo,
  i.name,
  t.type,
  t.quantity,
  t.totalAmount,
  t.transactionDate
FROM Transactions t
JOIN Items i ON t.itemId = i.id
WHERE t.userId = 'user-001-uuid'
ORDER BY t.transactionDate DESC
LIMIT 20;
```

### Check license usage
```sql
SELECT 
  u.name,
  l.type,
  COUNT(i.id) AS items_created,
  l.itemLimit,
  (COUNT(i.id) * 100.0 / l.itemLimit) AS usage_percent
FROM Users u
JOIN Licenses l ON u.licenseId = l.id
LEFT JOIN Items i ON u.id = i.userId
GROUP BY u.id, u.name, l.type, l.itemLimit;
```

---

## Migration Notes

**For Azure SQL:**
1. UUIDs stored as UNIQUEIDENTIFIER (not VARCHAR)
2. ENUM stored as VARCHAR with CHECK constraint
3. Timestamps use GETUTCDATE() as default
4. UTF-8 collation for international characters

**Creating in SQL Server:**
```sql
CREATE TABLE Users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'reader')),
  licenseId UNIQUEIDENTIFIER,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (licenseId) REFERENCES Licenses(id)
);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 15, 2024 | Initial schema design with 4 tables |
| | | - Licenses, Users, Items, Transactions |
| | | - All relationships and constraints defined |

---

## Next Steps

✅ **Task 3 Complete!** You now have:
- Clear data model
- All table structures defined
- Business rules documented
- Sample queries ready

➡️ **Next:** Task 5 - Set up Azure SQL Database using this schema
