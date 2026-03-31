# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── adega/              # Adega Pro - Inventory Management Frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Adega Pro - Inventory Management System

A complete inventory control system for an adega/minimercado (wine shop/convenience store). Focused on gas cylinders, water gallons, beverages, and other small shop products.

### Default Login Credentials
- **Email**: admin@adega.com
- **Password**: admin123

### Features
- Login with JWT authentication (stored in localStorage as "adega_token")
- Dashboard with summary cards, low stock alerts, category breakdown chart, recent movements
- Products management: CRUD, search, filter by category/stock status, sort
- Stock movements: entry, exit, loss, adjustment — auto-updates product quantities
- Categories management: CRUD
- Reports: Stock, Financial, Movements with filters
- All values in Brazilian Real (R$), dates in Brazilian format

### DB Schema Tables
- `users` — authentication and user management
- `categories` — product categories
- `products` — product catalog with cost/price/stock tracking
- `movements` — stock movement log (entry/exit/loss/adjustment)

### API Routes (all under /api)
- `POST /auth/login` — returns JWT token
- `GET /auth/me` — current user
- `GET/POST /categories`
- `PUT/DELETE /categories/:id`
- `GET/POST /products`
- `GET/PUT/DELETE /products/:id`
- `GET/POST /movements`
- `GET /dashboard/summary`
- `GET /dashboard/low-stock`
- `GET /dashboard/recent-movements`
- `GET /dashboard/category-breakdown`
- `GET /reports/stock`
- `GET /reports/financial`
- `GET /reports/movements`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` with auth middleware using JWT.

- Auth: bcryptjs + jsonwebtoken, SESSION_SECRET env var
- `pnpm --filter @workspace/api-server run dev` — run the dev server

### `artifacts/adega` (`@workspace/adega`)

React + Vite frontend for the inventory management system.

- `pnpm --filter @workspace/adega run dev` — run the dev server

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `pnpm --filter @workspace/db run push` — push schema changes

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config.

- `pnpm --filter @workspace/api-spec run codegen` — regenerate clients
