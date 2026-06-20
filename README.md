# Planora — Server

Express + Prisma + PostgreSQL backend for Planora.

## Setup

```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, SSLCommerz keys
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Server runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Seeded accounts
- Admin: `admin@planora.app` / `Admin123!`
- User: `demo@planora.app` / `User123!`

## API overview

| Resource | Base path |
|---|---|
| Auth | `/api/auth` |
| Events | `/api/events` |
| Participations | `/api/participations` |
| Invitations | `/api/invitations` |
| Reviews | `/api/reviews` |
| Payments (SSLCommerz) | `/api/payments` |
| Users / Admin | `/api/users` |

All protected routes require `Authorization: Bearer <token>` (or the `token` cookie set on login).
Admin-only routes are guarded with `authorize("ADMIN")`.
