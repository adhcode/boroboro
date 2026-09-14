# Rental Marketplace

Production-grade peer-to-peer rental marketplace for renting physical items.

## Architecture Overview

### Technology Stack

- **Backend**: NestJS with Fastify adapter (chosen for ~20% better performance vs Express, minimal API differences)
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: Plain pnpm workspaces (sufficient for 3 packages, no need for Turborepo overhead)
- **Auth**: JWT with refresh tokens (stateless, scalable, supports mobile later)
- **Testing**: Jest (unit), Supertest (e2e API), Playwright (frontend e2e)
- **Validation**: class-validator/class-transformer (NestJS DTOs), zod (Next.js forms)
- **Linting**: ESLint + Prettier (shared config)

### Project Structure

```
rental-marketplace/
├── apps/
│   ├── api/              # NestJS backend (Fastify)
│   │   ├── src/
│   │   │   ├── auth/           # JWT auth with refresh tokens
│   │   │   ├── users/          # User management
│   │   │   ├── listings/       # (future) Listing CRUD
│   │   │   ├── bookings/       # (future) Booking logic
│   │   │   ├── payments/       # (future) Paystack escrow
│   │   │   ├── messaging/      # (future) In-booking messages
│   │   │   ├── reviews/        # (future) Review system
│   │   │   ├── search/         # (future) Search + demand logging
│   │   │   ├── prisma/         # Prisma service + module
│   │   │   ├── config/         # Env validation (Joi)
│   │   │   ├── common/         # Filters, guards, interceptors
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma   # All DB entities
│   │   ├── test/               # e2e tests
│   │   └── package.json
│   └── web/              # Next.js frontend (App Router)
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   └── components/     # (future) React components
│       ├── e2e/                # Playwright tests
│       └── package.json
├── packages/
│   └── shared/           # Shared types, enums, constants
│       ├── src/
│       │   ├── types.ts
│       │   ├── enums.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── package.json
├── pnpm-workspace.yaml
├── package.json          # Root scripts
├── .eslintrc.js          # Shared ESLint config
├── .prettierrc           # Shared Prettier config
└── README.md             # This file
```

### Module Organization

Each NestJS feature module follows this structure:

```
<feature>/
├── <feature>.controller.ts    # Thin HTTP layer
├── <feature>.service.ts       # Business logic
├── <feature>.service.spec.ts  # Unit tests
├── <feature>.module.ts        # DI wiring
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

**Why**: Keeps related code together, avoids giant `controllers/`, `services/` folders. Tests live next to implementation for discoverability.

### Key Architectural Decisions

#### 1. Fastify over Express

- ~20% faster request handling
- Better TypeScript support
- Minimal migration risk (NestJS abstracts most differences)

#### 2. JWT with Refresh Tokens

- Access token: 15 minutes (stored in memory/state)
- Refresh token: 7 days (stored in DB, can be revoked)
- Compromise: mostly stateless (scales easily) but with revocation capability
- Refresh tokens stored in `refresh_tokens` table with expiry
- On logout, refresh token deleted from DB

#### 3. Plain pnpm Workspaces

- Simpler than Turborepo for 3 packages
- Workspaces give us shared dependencies and cross-package imports
- If we grow to 10+ packages with complex build graphs, revisit Turborepo

#### 4. Prisma Direct Usage (No Repository Pattern)

- Prisma already abstracts DB access cleanly
- Services inject `PrismaService`, call `prisma.user.findMany()` etc.
- Avoids extra abstraction layer for marginal benefit
- If we need query reuse later, extract to helper methods in services

#### 5. Shared Package for Types

- `packages/shared` exports TypeScript interfaces, enums, constants
- Both apps import `@rental-marketplace/shared`
- Eliminates type drift between API contracts and frontend code
- No runtime code, just types (compiled to `.d.ts`)

### Domain Model

#### Core Entities

**users**

- Authentication (email/password)
- Profile info (name, phone)
- Role (USER, ADMIN)

**listings**

- Items for rent (title, description, category, price per day)
- Owner relationship
- Status (DRAFT, PUBLISHED, PAUSED, ARCHIVED)
- Location (string + optional lat/lng for future map search)

**availability_blocks**

- Date ranges for listings
- `isBlocked: true` = unavailable, `false` = available
- Supports owner blocking off dates or availability windows

**bookings**

- Rental requests/confirmed rentals
- Date range, total price, deposit
- Status flow: PENDING → CONFIRMED → ACTIVE → COMPLETED (or CANCELLED/DISPUTED)

**payments**

- Paystack escrow integration (v1)
- Status: PENDING → HELD (on booking) → RELEASED (after return) or REFUNDED
- Tracks `paystackReference` for reconciliation

**messages**

- Scoped to a booking (renter ↔ owner communication)
- Simple text messages (no attachments in v1)

**reviews**

- One review per booking (renter reviews owner OR owner reviews renter)
- Rating (1-5) + optional comment

**search_queries**

- Silent demand logging: query, category, location, result count, timestamp
- No user-facing UI yet — analytics/product data only

#### Business Rules (to be enforced in services)

1. **Booking overlap prevention**: No two bookings can overlap for the same listing
2. **Payment escrow**: Deposit + booking fee held on confirmation, released after return or dispute window (3 days post-end)
3. **Messaging scope**: Messages only between booking participants (renter + listing owner)
4. **Review eligibility**: Can only review after booking status = COMPLETED

### Payment Flow (Paystack Escrow - v1)

1. User books listing → booking status = PENDING
2. Frontend initiates Paystack payment (deposit + rental fee)
3. Backend receives Paystack webhook → payment status = HELD
4. Booking status → CONFIRMED
5. Booking period starts → ACTIVE
6. Booking period ends → COMPLETED (auto or manual)
7. After 3-day dispute window → payment status = RELEASED (funds to owner)
8. If dispute raised → manual resolution, payment = REFUNDED or RELEASED

**Why separate `payments` module**: Isolates third-party logic, makes it easy to add insurance/multi-provider later without touching booking logic.

## Local Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- PostgreSQL >= 14 (local or Docker)
- Git

### Initial Setup

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd rental-marketplace
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment files**

   Copy example files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```

   Edit `apps/api/.env`:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Generate secure secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
   - Add Paystack keys (get from Paystack dashboard)

4. **Set up the database**

   ```bash
   cd apps/api
   pnpm db:push    # Push schema to DB (dev)
   # OR
   pnpm db:migrate # Create migration (recommended for prod)
   ```

5. **Generate Prisma client**

   ```bash
   pnpm db:generate
   ```

6. **Build shared package**
   ```bash
   cd ../../packages/shared
   pnpm build
   ```

### Running the Apps

From the **project root**:

```bash
# Run both API and web in parallel
pnpm dev
```

Or run individually:

```bash
# API only
cd apps/api
pnpm dev
# Runs on http://localhost:3001/api/v1

# Web only
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

### Database Commands

```bash
cd apps/api

# Push schema to DB (quick for dev, no migration files)
pnpm db:push

# Create a migration (recommended for version control)
pnpm db:migrate

# Open Prisma Studio (GUI for DB)
pnpm db:studio

# Generate Prisma client (after schema changes)
pnpm db:generate
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
cd apps/api
pnpm test:cov
```

### E2E Tests (API)

```bash
cd apps/api
pnpm test:e2e
```

Tests use the same DB as dev (for now). For production, set up a separate test database in CI.

### E2E Tests (Frontend)

```bash
cd apps/web
pnpm test:e2e
```

Uses Playwright. Starts dev server automatically.

## Code Quality

```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Build

```bash
# Build everything (shared → apps)
pnpm build

# API only
cd apps/api
pnpm build
# Output: dist/

# Web only
cd apps/web
pnpm build
# Output: .next/
```

## Deployment (Future)

- **API**: Build + run `node dist/main` (ensure `NODE_ENV=production`, DB migrations run)
- **Web**: `pnpm build` → deploy `.next/` to Vercel/similar
- **Env vars**: Set all `.env.example` vars in prod (never commit real `.env` files)

## Current Implementation Status

✅ **Completed**:

- Monorepo scaffold (pnpm workspaces)
- NestJS API with Fastify adapter
- Next.js web app (App Router)
- Shared types package
- Prisma schema (all entities defined)
- Auth module (register, login, refresh, logout)
- JWT strategy with refresh token storage
- Global exception filter (consistent error shapes)
- Environment validation (fail fast on startup)
- Unit tests for AuthService
- E2E tests for auth endpoints + user profile
- ESLint + Prettier config (shared)
- Test infrastructure (Jest, Supertest, Playwright setup)

🚧 **Next Steps** (in priority order):

1. Verify local setup (run `pnpm dev`, `pnpm test`, `pnpm test:e2e`)
2. Implement listings module (CRUD, validation, ownership checks)
3. Implement availability blocks (create, check for date ranges)
4. Implement bookings module (create booking, overlap validation, status transitions)
5. Implement payments module (Paystack webhook handling, escrow logic)
6. Implement messaging module (create message, fetch by booking)
7. Implement reviews module (create review, eligibility checks)
8. Implement search module (search listings, log queries with low/zero results)
9. Add frontend pages (login, browse listings, booking flow)
10. Add admin features (review disputes, user management)

## Git Conventions

- **Commit messages**: Imperative mood, conventional commits prefix
  - `feat: add booking overlap validation`
  - `fix: prevent duplicate user registration`
  - `chore: update dependencies`
  - `test: add e2e tests for login flow`
  - `docs: update setup instructions`

- **Branching**: Feature branches off `main`, PR to `main`

## Team Notes

- **This README is the single source of truth** for architecture and setup. Update it as the project evolves.
- **No scattered READMEs**: Inline code comments and JSDoc for implementation details only.
- **Fail fast**: Env validation runs on app startup — missing vars = crash (by design).
- **No premature abstraction**: We use Prisma directly, not a repository pattern. We'll refactor if we hit real pain.
- **Test what matters**: Cover critical paths (auth, booking logic, payments), not 100% coverage for its own sake.
- **Keep modules decoupled**: `payments/` doesn't know about `messaging/`, only `bookings/`.

## Troubleshooting

**"Module not found: @rental-marketplace/shared"**
→ Build the shared package: `cd packages/shared && pnpm build`

**"Prisma Client not generated"**
→ Run `cd apps/api && pnpm db:generate`

**Database connection errors**
→ Check `DATABASE_URL` in `apps/api/.env`, ensure PostgreSQL is running

**Tests failing with DB errors**
→ Ensure test database exists and migrations are run (or use `db:push` for dev)

**Port 3000 or 3001 already in use**
→ Kill the process or change `PORT` in `.env` / Next.js config

## Questions?

For architectural questions, check this README first. For Prisma/DB questions, check `apps/api/prisma/schema.prisma` and comments. For API contracts, check DTOs in `apps/api/src/<module>/dto/`.
