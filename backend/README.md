# Inventory System Backend

This is the backend service for the Inventory Management System.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in the values for `DATABASE_URL`, `JWT_SECRET`, and any other configuration.
3. Install dependencies:
   ```bash
   npm install
   ```

## Available scripts

- `npm run dev` - start the server in development mode with `nodemon`
- `npm start` - start the server in production mode

## Local development

Run:

```bash
npm run dev
```

Then open:

```bash
http://localhost:5000/api/health
```

## Health check

The backend exposes a health check endpoint at `/api/health`.

## Project structure

- `src/server.js` - main Express server entrypoint
- `src/routes` - route definitions
- `src/middleware` - Express middleware
- `src/models` - data models and database schema
- `src/services` - business logic and service classes
- `src/controllers` - request handlers and controllers
- `src/config` - configuration loading and environment helpers
