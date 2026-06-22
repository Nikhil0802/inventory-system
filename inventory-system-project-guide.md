# Inventory Management System — Complete Task-by-Task Project Guide

## Overview
This guide takes you from zero to a fully functional MVP (Minimum Viable Product) in 3-4 months of part-time work. Each task builds on the previous one.

**Total Tasks: 47 | Estimated Duration: 12-16 weeks**

---

# PART 1: PREPARATION & SETUP (Week 1)

## Task 1: Set Up Your Development Environment
**Objective:** Get all tools installed and working
**Duration:** 2-3 hours

### Steps:
1. **Install Node.js** (v18 or higher)
   - Download from nodejs.org
   - Verify: Open terminal/PowerShell, run `node -v` and `npm -v`

2. **Install VS Code**
   - Download from code.visualstudio.com
   - Install these extensions:
     - ES7+ React/Redux/React-Native snippets
     - Prettier (code formatter)
     - Thunder Client (API testing)

3. **Install Git**
   - Download from git-scm.com
   - Verify: Run `git --version` in terminal

4. **Create GitHub Account**
   - Sign up at github.com
   - Create a new repository called `inventory-system`
   - Clone it to your computer: `git clone <your-repo-url>`

### Deliverable:
- ✅ All tools installed and verified
- ✅ GitHub repo created and cloned locally

---

## Task 2: Create Project Folder Structure
**Objective:** Organize your codebase from the start
**Duration:** 30 minutes

### Steps:
1. Inside your cloned repo, create this structure:
```
inventory-system/
├── frontend/
├── backend/
├── docs/
├── .gitignore
└── README.md
```

2. Create a `.gitignore` file in the root:
```
node_modules/
.env
.env.local
*.log
.DS_Store
dist/
build/
```

3. Create `README.md` in root:
```markdown
# Inventory Management System

An inventory management platform with barcode scanning, 
role-based access, and license tiers.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: Azure SQL
- Hosting: Azure

## Getting Started
(We'll fill this in as we build)
```

### Deliverable:
- ✅ Project structure created
- ✅ `.gitignore` file added
- ✅ Initial README.md created

---

## Task 3: Plan Your Database Schema
**Objective:** Design the data model before coding
**Duration:** 2 hours

### Steps:
1. Create `docs/database-schema.md` with these tables:

```markdown
## Database Schema

### Users Table
- id (PRIMARY KEY, UUID)
- email (UNIQUE, VARCHAR)
- password (HASHED, VARCHAR)
- name (VARCHAR)
- role (ENUM: 'admin', 'manager', 'staff', 'reader')
- licenseId (FOREIGN KEY → Licenses)
- createdAt (TIMESTAMP)

### Items Table
- id (PRIMARY KEY, UUID)
- userId (FOREIGN KEY → Users)
- sku (UNIQUE, VARCHAR) - Stock Keeping Unit
- name (VARCHAR)
- description (TEXT)
- barcode (VARCHAR)
- quantity (INTEGER)
- price (DECIMAL)
- category (VARCHAR) - electronics, consumables, raw materials, etc.
- manufacturingDate (DATE)
- expiryDate (DATE, NULLABLE)
- serialNumber (VARCHAR, NULLABLE)
- location (VARCHAR) - shelf/bin location in store
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

### Transactions Table
- id (PRIMARY KEY, UUID)
- userId (FOREIGN KEY → Users)
- itemId (FOREIGN KEY → Items)
- type (ENUM: 'purchase', 'sale', 'transfer', 'adjustment')
- quantity (INTEGER)
- price (DECIMAL) - per unit
- totalAmount (DECIMAL)
- referenceNo (VARCHAR) - invoice/PO number
- transactionDate (DATE)
- supplierOrBuyer (VARCHAR)
- notes (TEXT, NULLABLE)
- createdAt (TIMESTAMP)

### Licenses Table
- id (PRIMARY KEY, UUID)
- userId (FOREIGN KEY → Users)
- type (ENUM: 'free', 'basic', 'pro')
- itemLimit (INTEGER) - 1000 for free, unlimited for paid
- maxUsers (INTEGER) - users allowed under this license
- expiryDate (DATE, NULLABLE)
- purchasedAt (TIMESTAMP)
```

### Deliverable:
- ✅ Database schema documented
- ✅ Relationships defined
- ✅ Field types decided

---

# PART 2: BACKEND SETUP (Week 2-3)

## Task 4: Initialize Node.js Backend Project
**Objective:** Create Express.js server with basic structure
**Duration:** 1.5 hours

### Steps:
1. Navigate to `backend/` folder:
```bash
cd backend
npm init -y
```

2. Install dependencies:
```bash
npm install express dotenv bcryptjs jsonwebtoken cors
npm install --save-dev nodemon
```

3. Create folder structure:
```
backend/
├── src/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── controllers/
│   ├── config/
│   └── server.js
├── .env
├── .env.example
├── package.json
└── README.md
```

4. Create `src/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (we'll add these soon)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

5. Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

6. Create `.env` file:
```
PORT=5000
DATABASE_URL=<we'll add this later>
JWT_SECRET=your_super_secret_key_change_this_later
NODE_ENV=development
```

7. Test: Run `npm run dev` and visit `http://localhost:5000/api/health`

### Deliverable:
- ✅ Express server running
- ✅ Health check endpoint working
- ✅ Folder structure ready

---

## Task 5: Set Up Azure SQL Database
**Objective:** Create managed database in Azure cloud
**Duration:** 1 hour

### Steps:
1. **Create Azure Account**
   - Visit azure.microsoft.com
   - Sign up (free ₹11,000 credit for first 30 days)

2. **Create SQL Database:**
   - Go to Azure Portal
   - Search for "SQL databases"
   - Click "Create"
   - Fill in:
     - **Subscription:** (default)
     - **Resource group:** Create new → `inventory-rg`
     - **Database name:** `inventory-db`
     - **Server:** Create new
       - **Server name:** `inventory-server-<random>`
       - **Region:** East India (Pune) for low latency
       - **Authentication:** SQL authentication
         - Admin username: `adminuser`
         - Password: `ComplexPassword123!` (save this!)
     - **Pricing tier:** Basic (B) for MVP (~₹550/month)
   - Click "Review + Create" → "Create"
   - Wait 2-3 minutes for deployment

3. **Get connection string:**
   - Open created SQL database
   - Click "Connection strings"
   - Copy "ADO.NET" connection string
   - Replace `{your_username}` and `{your_password}` with your credentials
   - Store in `.env`:
   ```
   DATABASE_URL=Server=tcp:inventory-server-xxx.database.windows.net,1433;Initial Catalog=inventory-db;Persist Security Info=False;User ID=adminuser;Password=ComplexPassword123!;Encrypt=True;Connection Timeout=30;
   ```

4. **Allow your IP:**
   - In Azure Portal, find your SQL server
   - Click "Firewalls and virtual networks"
   - Click "Add current client IP address"
   - Save

### Deliverable:
- ✅ Azure SQL database created
- ✅ Connection string in .env
- ✅ Network access configured

---

## Task 6: Set Up Prisma ORM (Database Queries)
**Objective:** Connect backend to database with type-safe queries
**Duration:** 1.5 hours

### Steps:
1. Install Prisma:
```bash
npm install @prisma/client
npm install --save-dev prisma
npx prisma init
```

2. Update `.env` with your DATABASE_URL (done in Task 5)

3. Create `prisma/schema.prisma`:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed
  name      String
  role      String   @default("staff") // admin, manager, staff, reader
  license   License?
  items     Item[]
  transactions Transaction[]
  createdAt DateTime @default(now())
  
  @@map("users")
}

model Item {
  id               String  @id @default(cuid())
  userId           String
  user             User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  sku              String  @unique
  name             String
  description      String?
  barcode          String?
  quantity         Int     @default(0)
  price            Decimal @db.Decimal(10, 2)
  category         String
  manufacturingDate DateTime?
  expiryDate       DateTime?
  serialNumber     String?
  location         String?
  transactions     Transaction[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@map("items")
}

model Transaction {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemId           String
  item             Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  type             String   // purchase, sale, transfer, adjustment
  quantity         Int
  price            Decimal  @db.Decimal(10, 2)
  totalAmount      Decimal  @db.Decimal(10, 2)
  referenceNo      String?
  transactionDate  DateTime
  supplierOrBuyer  String?
  notes            String?
  createdAt        DateTime @default(now())
  
  @@map("transactions")
}

model License {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type         String   @default("free") // free, basic, pro
  itemLimit    Int      @default(1000)
  maxUsers     Int      @default(1)
  expiryDate   DateTime?
  purchasedAt  DateTime @default(now())
  
  @@map("licenses")
}
```

4. Push schema to database:
```bash
npx prisma db push
```

5. Verify in Azure Portal → Query Editor (optional)

### Deliverable:
- ✅ Prisma configured
- ✅ Database schema created
- ✅ Tables visible in Azure SQL

---

## Task 7: Create Authentication Routes (Login/Register)
**Objective:** Allow users to sign up and log in
**Duration:** 2.5 hours

### Steps:
1. Create `src/controllers/authController.js`:
```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'staff', // Default role
      },
    });

    // Create free license
    await prisma.license.create({
      data: {
        userId: user.id,
        type: 'free',
        itemLimit: 1000,
        maxUsers: 1,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { license: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        license: user.license,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { register, login };
```

2. Create `src/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
```

3. Create `src/routes/authRoutes.js`:
```javascript
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

4. Update `src/server.js` to include auth routes:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

5. Test with Thunder Client (or Postman):
   - **POST** `http://localhost:5000/api/auth/register`
   - Body: `{ "email": "test@example.com", "password": "password123", "name": "Test User" }`
   - Expected: Status 201

### Deliverable:
- ✅ Register endpoint working
- ✅ Login endpoint returning JWT token
- ✅ Authentication middleware created

---

## Task 8: Create Item Management Routes (CRUD)
**Objective:** Add endpoints to create, read, update, delete items
**Duration:** 2 hours

### Steps:
1. Create `src/controllers/itemController.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Check license limit
    const license = await prisma.license.findUnique({
      where: { userId: req.user.userId },
    });

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
```

2. Create `src/routes/itemRoutes.js`:
```javascript
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getItemByBarcode,
} = require('../controllers/itemController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getItems);
router.get('/barcode/search', getItemByBarcode);
router.post('/', checkRole(['admin', 'manager', 'staff']), createItem);
router.put('/:id', checkRole(['admin', 'manager', 'staff']), updateItem);
router.delete('/:id', checkRole(['admin', 'manager']), deleteItem);

module.exports = router;
```

3. Update `src/server.js`:
```javascript
const itemRoutes = require('./routes/itemRoutes');

// Add this line with other routes:
app.use('/api/items', itemRoutes);
```

### Deliverable:
- ✅ GET /api/items working
- ✅ POST /api/items (create) working
- ✅ PUT /api/items/:id (update) working
- ✅ DELETE /api/items/:id working
- ✅ License check implemented

---

## Task 9: Create Transaction Routes (Purchase/Sale)
**Objective:** Track inventory movement
**Duration:** 2 hours

### Steps:
1. Create `src/controllers/transactionController.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createTransaction = async (req, res) => {
  try {
    const {
      itemId, type, quantity, price, referenceNo,
      transactionDate, supplierOrBuyer, notes,
    } = req.body;

    // Get item to update quantity
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (type === 'purchase' || type === 'transfer') {
      newQuantity += parseInt(quantity);
    } else if (type === 'sale') {
      newQuantity -= parseInt(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        itemId,
        type,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        totalAmount: parseFloat(price) * parseInt(quantity),
        referenceNo,
        transactionDate: new Date(transactionDate),
        supplierOrBuyer,
        notes,
      },
    });

    // Update item quantity
    await prisma.item.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const getTransactionsByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const transactions = await prisma.transaction.findMany({
      where: { itemId, userId: req.user.userId },
      orderBy: { transactionDate: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionsByItem,
};
```

2. Create `src/routes/transactionRoutes.js`:
```javascript
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  getTransactionsByItem,
} = require('../controllers/transactionController');

const router = express.Router();

router.use(verifyToken);

router.post('/', checkRole(['admin', 'manager', 'staff']), createTransaction);
router.get('/', getTransactions);
router.get('/item/:itemId', getTransactionsByItem);

module.exports = router;
```

3. Update `src/server.js`:
```javascript
const transactionRoutes = require('./routes/transactionRoutes');

app.use('/api/transactions', transactionRoutes);
```

### Deliverable:
- ✅ POST /api/transactions (create) working
- ✅ GET /api/transactions working
- ✅ Inventory quantity updating automatically

---

## Task 10: Git Commit Backend Progress
**Objective:** Save your backend work to version control
**Duration:** 15 minutes

### Steps:
```bash
cd inventory-system
git add .
git commit -m "Backend setup: Auth, items, transactions, database"
git push origin main
```

### Deliverable:
- ✅ Code committed to GitHub

---

# PART 3: FRONTEND SETUP (Week 4-5)

## Task 11: Create React App Frontend
**Objective:** Set up the user interface project
**Duration:** 1 hour

### Steps:
1. Navigate to root directory and create React app:
```bash
cd inventory-system
npx create-react-app frontend
cd frontend
```

2. Install dependencies:
```bash
npm install axios react-router-dom tailwindcss
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. Configure Tailwind in `frontend/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. Update `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

5. Create folder structure:
```
frontend/src/
├── components/
│   ├── Navbar.jsx
│   ├── BarcodeScanner.jsx
│   ├── ItemForm.jsx
│   ├── ItemTable.jsx
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Items.jsx
│   └── Transactions.jsx
├── api/
│   └── api.js
├── App.jsx
└── App.css
```

6. Create `frontend/src/api/api.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const itemAPI = {
  getAll: () => api.get('/items'),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getByBarcode: (barcode) => api.get(`/items/barcode/search?barcode=${barcode}`),
};

export const transactionAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: () => api.get('/transactions'),
  getByItem: (itemId) => api.get(`/transactions/item/${itemId}`),
};

export default api;
```

7. Test: Run `npm start` and verify it loads on `http://localhost:3000`

### Deliverable:
- ✅ React app created
- ✅ Tailwind CSS configured
- ✅ Folder structure organized
- ✅ API client set up

---

## Task 12: Create Authentication Pages (Login & Register)
**Objective:** Allow users to sign up and log in
**Duration:** 2 hours

### Steps:
1. Create `frontend/src/pages/Register.jsx`:
```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

2. Create `frontend/src/pages/Login.jsx`:
```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Inventory System
        </h1>
        <p className="text-center text-gray-600 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

3. Create `frontend/src/components/ProtectedRoute.jsx`:
```javascript
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

### Deliverable:
- ✅ Register page created
- ✅ Login page created
- ✅ Protected route component working

---

## Task 13: Create Navbar Component
**Objective:** Navigation header with logout
**Duration:** 1 hour

### Steps:
1. Create `frontend/src/components/Navbar.jsx`:
```javascript
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">📦 Inventory</h1>
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/items')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Items
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Deliverable:
- ✅ Navbar component created with navigation

---

## Task 14: Create Dashboard Page
**Objective:** Show inventory overview and stats
**Duration:** 2 hours

### Steps:
1. Create `frontend/src/pages/Dashboard.jsx`:
```javascript
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { itemAPI, transactionAPI } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const itemsRes = await itemAPI.getAll();
        const transactionsRes = await transactionAPI.getAll();

        const items = itemsRes.data;
        const transactions = transactionsRes.data;

        const totalValue = items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);

        const lowStockCount = items.filter(item => item.quantity < 10).length;

        setStats({
          totalItems: items.length,
          totalValue: totalValue.toFixed(2),
          lowStockCount,
          recentTransactions: transactions.slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium">Total Items</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalItems}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium">Inventory Value</h3>
                <p className="text-3xl font-bold text-green-600">₹{stats.totalValue}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium">Low Stock Items</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.lowStockCount}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium">License</h3>
                <p className="text-lg font-bold text-purple-600">Free</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Item</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Quantity</th>
                      <th className="text-left py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{tx.item?.name}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-white text-sm ${
                            tx.type === 'purchase' ? 'bg-green-500' :
                            tx.type === 'sale' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-2">{tx.quantity}</td>
                        <td className="py-2 px-2">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

### Deliverable:
- ✅ Dashboard displaying stats
- ✅ Recent transactions showing
- ✅ Real data from backend

---

## Task 15: Create Items Management Page
**Objective:** List, create, edit, delete items
**Duration:** 2.5 hours

### Steps:
1. Create `frontend/src/components/ItemForm.jsx`:
```javascript
import { useState, useEffect } from 'react';
import { itemAPI } from '../api/api';

export default function ItemForm({ onSuccess, editingItem, onCancel }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    barcode: '',
    quantity: 0,
    price: 0,
    category: 'electronics',
    manufacturingDate: '',
    expiryDate: '',
    serialNumber: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingItem) {
        await itemAPI.update(editingItem.id, formData);
        alert('Item updated successfully');
      } else {
        await itemAPI.create(formData);
        alert('Item created successfully');
        setFormData({
          sku: '',
          name: '',
          description: '',
          barcode: '',
          quantity: 0,
          price: 0,
          category: 'electronics',
          manufacturingDate: '',
          expiryDate: '',
          serialNumber: '',
          location: '',
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {editingItem ? 'Edit Item' : 'Add New Item'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="SKU-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Item Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="electronics">Electronics</option>
              <option value="consumables">Consumables</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Item description"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Shelf A1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturing Date
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

2. Create `frontend/src/components/ItemTable.jsx`:
```javascript
import { itemAPI } from '../api/api';

export default function ItemTable({ items, onEdit, onRefresh }) {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemAPI.delete(id);
        alert('Item deleted successfully');
        onRefresh();
      } catch (error) {
        alert('Failed to delete item');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{item.sku}</td>
                <td className="py-3 px-4 font-medium">{item.name}</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-bold ${item.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="py-3 px-4">₹{item.price}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.location || '-'}</td>
                <td className="py-3 px-4 flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

3. Create `frontend/src/pages/Items.jsx`:
```javascript
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ItemForm from '../components/ItemForm';
import ItemTable from '../components/ItemTable';
import { itemAPI } from '../api/api';

export default function Items() {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = async () => {
    try {
      const response = await itemAPI.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Inventory Items</h2>

        <ItemForm
          onSuccess={fetchItems}
          editingItem={editingItem}
          onCancel={() => setEditingItem(null)}
        />

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading items...</p>
        ) : (
          <ItemTable
            items={filteredItems}
            onEdit={setEditingItem}
            onRefresh={fetchItems}
          />
        )}
      </div>
    </>
  );
}
```

### Deliverable:
- ✅ Items page with add/edit/delete
- ✅ Item form working
- ✅ Item table displaying
- ✅ Search functionality

---

## Task 16: Create App.jsx and Routing
**Objective:** Connect all pages with navigation
**Duration:** 1 hour

### Steps:
1. Create `frontend/src/App.jsx`:
```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Transactions from './pages/Transactions';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

2. Update `frontend/src/pages/Transactions.jsx` (placeholder):
```javascript
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI, itemAPI } from '../api/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'purchase',
    quantity: 1,
    price: 0,
    referenceNo: '',
    transactionDate: new Date().toISOString().split('T')[0],
    supplierOrBuyer: '',
    notes: '',
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, itemRes] = await Promise.all([
        transactionAPI.getAll(),
        itemAPI.getAll(),
      ]);
      setTransactions(txRes.data);
      setItems(itemRes.data);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionAPI.create(formData);
      alert('Transaction recorded successfully');
      setFormData({
        itemId: '',
        type: 'purchase',
        quantity: 1,
        price: 0,
        referenceNo: '',
        transactionDate: new Date().toISOString().split('T')[0],
        supplierOrBuyer: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      alert('Failed to create transaction');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Transactions</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Record Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier/Buyer
                </label>
                <input
                  type="text"
                  name="supplierOrBuyer"
                  value={formData.supplierOrBuyer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Name"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Record Transaction
            </button>
          </form>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Item</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{tx.item?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-white text-sm ${
                          tx.type === 'purchase' ? 'bg-green-500' :
                          tx.type === 'sale' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tx.quantity}</td>
                      <td className="py-3 px-4">₹{tx.totalAmount}</td>
                      <td className="py-3 px-4">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
```

### Deliverable:
- ✅ Full routing working
- ✅ All pages connected
- ✅ Navigation working

---

## Task 17: Fix CORS and Test Full Integration
**Objective:** Ensure frontend and backend communicate properly
**Duration:** 1 hour

### Steps:
1. In `backend/src/server.js`, ensure CORS is properly configured:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
```

2. Start both servers:
   - **Backend:** `cd backend && npm run dev` (runs on port 5000)
   - **Frontend:** `cd frontend && npm start` (runs on port 3000)

3. Test the full workflow:
   - Register a new user
   - Log in
   - Add an item
   - Record a transaction
   - View dashboard

### Deliverable:
- ✅ Frontend and backend communicating
- ✅ Full MVP working end-to-end

---

## Task 18: Git Commit Frontend Progress
**Objective:** Save frontend work
**Duration:** 15 minutes

```bash
git add .
git commit -m "Frontend complete: auth, items, transactions, dashboard"
git push origin main
```

---

# PART 4: ADVANCED FEATURES (Week 6-8)

## Task 19: Implement Barcode Scanning
**Objective:** Scan items by barcode using device camera
**Duration:** 2 hours

(Detailed implementation for barcode scanning component will follow in extended sections)

---

## Task 20: Add Reports & Export (PDF/Excel)
**Objective:** Export inventory data
**Duration:** 2 hours

(Detailed PDF/Excel export implementation)

---

## Task 21: Deploy Backend to Azure VM
**Objective:** Host the backend server on Azure so it runs 24/7 — no more shutdowns when Mac is off
**Duration:** 2-3 hours

### Why Azure VM instead of running locally?
- Server stays up even when your Mac is off or sleeping
- Same Azure region as your SQL database = near-zero latency (~1ms vs ~100ms)
- Fixed public IP so the frontend can always reach the API
- Deploy new code with one command

### Architecture
```
Your Mac  →  git push  →  GitHub  →  git pull on VM  →  Azure VM (Node.js + PM2)
                                                                  │
                                                                  ▼
                                                         Azure SQL Database
```

---

### Part A: Create the Azure VM

1. Go to Azure Portal → search "Virtual Machines" → **Create**
2. Fill in:
   - **Resource group:** `inventory-rg` (same as your SQL server)
   - **VM name:** `inventory-vm`
   - **Region:** Same region as your SQL server (e.g., Central India)
   - **Image:** Ubuntu Server 22.04 LTS
   - **Size:** B1s (1 vCPU, 1GB RAM — ~₹600/month)
   - **Authentication type:** SSH public key
     - Key pair name: `inventory-vm-key`
     - Click **Download private key** when prompted — save the `.pem` file safely
3. **Networking tab:**
   - Allow selected inbound ports: check **SSH (22)** and **HTTP (80)**
4. Click **Review + Create** → **Create**
5. Wait ~2 minutes for deployment

---

### Part B: Open Port 5001 on the VM Firewall

1. Azure Portal → Your VM → **Networking** → **Add inbound port rule**
2. Fill in:
   - Destination port ranges: `5001`
   - Protocol: TCP
   - Name: `allow-backend-5001`
3. Click **Add**

---

### Part C: SSH Into the VM

Run these on your Mac:
```bash
# Move key to .ssh folder and fix permissions
mv ~/Downloads/inventory-vm-key.pem ~/.ssh/
chmod 400 ~/.ssh/inventory-vm-key.pem

# Find your VM's public IP: Azure Portal → VM → Overview → Public IP address
ssh -i ~/.ssh/inventory-vm-key.pem azureuser@<YOUR-VM-PUBLIC-IP>
```

---

### Part D: Install Node.js, PM2, and Git on the VM

Run these commands inside the VM after SSH:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v    # should show v18.x
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Verify Git (pre-installed on Ubuntu)
git --version
```

---

### Part E: Clone Repo and Configure Environment

```bash
# Clone your GitHub repo onto the VM
git clone https://github.com/<your-username>/inventory-system.git
cd inventory-system/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create .env file
nano .env
```

Paste your real credentials into nano:
```
PORT=5001
DATABASE_URL=<your Azure SQL connection string from Task 5>
JWT_SECRET=<your JWT secret>
NODE_ENV=production
```
Save: `Ctrl+O` → Enter → `Ctrl+X`

---

### Part F: Start Server with PM2

```bash
# Start the server
pm2 start src/server.js --name "inventory-backend"

# Check it is running
pm2 status

# Test locally on the VM
curl http://localhost:5001/api/health

# Configure PM2 to auto-start when the VM reboots
pm2 startup
# Copy the command PM2 prints and run it (starts with: sudo env PATH=...)

pm2 save
```

---

### Part G: Verify from Outside the VM

From your Mac browser or Thunder Client:
```
GET http://<YOUR-VM-PUBLIC-IP>:5001/api/health
```
Expected response:
```json
{ "status": "Backend is running!", "timestamp": "..." }
```

---

### Part H: Deploy Code Updates (Manual)

Each time you push changes to GitHub and want to deploy to the VM:
```bash
# SSH into VM
ssh -i ~/.ssh/inventory-vm-key.pem azureuser@<YOUR-VM-PUBLIC-IP>

# Pull latest code and restart
cd inventory-system/backend
git pull
npm install          # only needed if package.json changed
npx prisma generate  # only needed if schema.prisma changed
pm2 restart inventory-backend
pm2 logs inventory-backend --lines 20   # verify no errors
```

---

### Part I (Optional): Auto-Deploy with GitHub Actions

Set this up so every `git push` to `main` auto-deploys to the VM — no manual SSH needed.

**Step 1 — Add secrets to your GitHub repo:**
- Go to your GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**
- Add these three secrets:

| Secret name | Value |
|---|---|
| `VM_HOST` | Your VM's public IP address |
| `VM_USER` | `azureuser` |
| `VM_SSH_KEY` | Full contents of your `.pem` file (open in VS Code, copy all text) |

**Step 2 — Create the workflow file** at `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Azure VM

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd inventory-system/backend
            git pull origin main
            npm install --production
            npx prisma generate
            pm2 restart inventory-backend
```

**Step 3 — Push the workflow file to GitHub:**
```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions auto-deploy to Azure VM"
git push origin main
```

Every future `git push` to `main` will now automatically deploy to your VM.

---

### Useful PM2 Commands (on the VM)

| Command | What it does |
|---|---|
| `pm2 status` | See if server is running |
| `pm2 logs inventory-backend` | View live logs |
| `pm2 restart inventory-backend` | Restart after code changes |
| `pm2 monit` | Live CPU/RAM/log dashboard |
| `pm2 stop inventory-backend` | Stop the server |

---

### Deliverable:
- ✅ Azure VM created and running Ubuntu 22.04
- ✅ Node.js 18 + PM2 + Git installed on VM
- ✅ Backend running on VM, managed by PM2
- ✅ PM2 configured to auto-start on VM reboot
- ✅ API reachable at `http://<VM-IP>:5001/api/health` from browser
- ✅ Code deployment process working (manual SSH or GitHub Actions)

---

# PART 5: TESTING & OPTIMIZATION (Week 9-10)

## Task 22: Testing Checklist
- Test all CRUD operations
- Test license limits
- Test role-based access
- Test with multiple users
- Test on mobile devices

---

# SUMMARY & NEXT STEPS

**What You've Built:**
✅ Full-stack inventory system
✅ User authentication with JWT
✅ Item management with CRUD
✅ Transaction tracking
✅ License system
✅ Dashboard with analytics

**Next Phases (Beyond MVP):**
- Mobile app (React Native)
- Advanced reporting (charts, graphs)
- Barcode generation
- Payment integration with Razorpay
- Notification system
- Audit logs

---

## Developer Resources

**Learning:**
- React: https://react.dev
- Node.js: https://nodejs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com

**Tools:**
- VS Code: https://code.visualstudio.com
- GitHub: https://github.com
- Postman: https://www.postman.com
- Azure Portal: https://portal.azure.com

**Support:**
- Stack Overflow for questions
- GitHub Discussions for community help
- Prisma Discord for database issues
- Azure Support for cloud issues
