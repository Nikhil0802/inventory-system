# Inventory System Backend

This is the backend service for the Inventory Management System.

## Overview

The backend is built with Node.js, Express, and Prisma. It connects to Azure SQL using a database URL stored in `backend/.env`.

## Prerequisites

- Node.js 18+ or newer
- npm
- An Azure SQL connection string configured in `backend/.env`

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in the values for `DATABASE_URL`, `JWT_SECRET`, and any other configuration.
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment configuration

The backend uses `dotenv` to load environment variables from `backend/.env`. Keep this file local and do not commit it to git. The project already ignores `backend/.env` via `.gitignore`.

Example `backend/.env`:

```env
PORT=5001
DATABASE_URL="sqlserver://inventory-server-database.database.windows.net:1433;database=inventory-db;user=adminuser;password=your-password;encrypt=true;trustServerCertificate=false;MultipleActiveResultSets=False"
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
API_URL=http://localhost:5001
```

## Run locally

Start the server from the backend folder:

```bash
cd backend
npm run dev
```

Or in production mode:

```bash
cd backend
npm start
```

The server listens on `http://localhost:5001` by default.

## Health and database checks

- `GET /api/health` - confirms the backend is running
- `GET /api/db-health` - confirms Prisma can connect to the database

## Recommended workflow for Mac restarts

- Keep `backend/.env` in place. It is loaded every time the server starts.
- Start the server from the `backend` directory.
- Do not delete `backend/.env` unless you want to reset secrets.

## Sustainable deployment guidance

For development and local testing, running the backend on your Mac is fine. For a sustainable production-grade setup, consider deploying to cloud infrastructure.

### When to move to cloud infrastructure

Use cloud hosting if you need:

- 24/7 uptime and no dependency on your Mac being on
- automatic restarts and monitoring
- secure secret management (Azure Key Vault or similar)
- scaling to more users or traffic
- a publicly accessible API endpoint

### Recommended cloud options

- Azure App Service or Azure Container Apps for the backend
- Azure SQL for the database (already in use)
- Azure Key Vault or GitHub Secrets for connection secrets

### What you do not need immediately

If this is only for local development, you do not need to move to Azure right now. Keep the backend on your Mac for testing and use cloud hosting later when you want production reliability.

## Project structure

- `src/server.js` - main Express server entrypoint
- `src/routes` - route definitions
- `src/middleware` - Express middleware
- `src/models` - data models and database schema
- `src/services` - business logic and service classes
- `src/controllers` - request handlers and controllers
- `src/config` - configuration loading and environment helpers
