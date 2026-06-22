# Inventory Management System

An inventory management platform with barcode scanning,
role-based access, and license tiers.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: Azure SQL
- Hosting: Azure

## Getting Started

### Backend

1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
3. Update `backend/.env` with your database and JWT settings.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### Health checks

- `GET /api/health`
- `GET /api/db-health`

## Notes

- Keep `backend/.env` local; it is excluded from git.
- If you want production stability, deploy the backend to Azure or another cloud provider.
- Local Mac development is fine for testing; cloud hosting is recommended for long-term uptime.

## Backend documentation

See `backend/README.md` for full backend setup and deployment guidance.
