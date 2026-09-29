# TFRS Super Admin

Responsive Next.js administration for BPLO, CTMO, and Finance/CTO, including authentication, server-side route protection, RBAC, a normalized Prisma database, dashboard analytics, searchable registries, transactions, reports, print previews, user management, audit logs, and settings.

## Run locally

```bash
npm run setup
npm run dev
```

Open `http://localhost:3000`. Demo login: `admin@tfrs.gov.ph` / `Admin@123`.

Useful commands: `npm run build`, `npm run lint`, `npm run db:push`, and `npm run db:seed`.

SQLite is configured for an immediately runnable installation. Change Prisma's datasource provider to `postgresql` and set `DATABASE_URL` for production. Replace `AUTH_SECRET` before deployment. Sessions use signed HTTP-only cookies, protected pages validate server-side, mutation APIs use Zod and permission checks, passwords are bcrypt-hashed, and audit records have no edit endpoint.
