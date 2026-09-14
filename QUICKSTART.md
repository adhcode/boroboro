# Quick Start Guide

Get the rental marketplace running locally in under 5 minutes.

## Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- PostgreSQL >= 14

## Setup Steps

### 1. Install Dependencies (already done ✅)

```bash
pnpm install
```

### 2. Set Up Database

**Option A: Using existing PostgreSQL**
```bash
# Create database
createdb rental_marketplace

# Update connection string in apps/api/.env
# Change: postgresql://user:password@localhost:5432/rental_marketplace
```

**Option B: Using Docker**
```bash
docker run --name rental-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rental_marketplace \
  -p 5432:5432 \
  -d postgres:14
```

### 3. Configure Environment

Edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rental_marketplace?schema=public"
JWT_ACCESS_SECRET="your-secure-random-string-here"
JWT_REFRESH_SECRET="another-different-secure-random-string"
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize Database

```bash
cd apps/api
pnpm db:push     # Push Prisma schema to database
```

### 5. Start Development Servers

**From project root:**
```bash
pnpm dev
```

This starts both:
- **API**: http://localhost:3001/api/v1
- **Web**: http://localhost:3000

**Or run separately:**
```bash
# Terminal 1 - API
cd apps/api && pnpm dev

# Terminal 2 - Web
cd apps/web && pnpm dev
```

## Test the API

### Register a user
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get profile (use token from login response)
```bash
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Run Tests

```bash
# Unit tests (API)
cd apps/api && pnpm test

# E2E tests (API) - requires database
cd apps/api && pnpm test:e2e

# All tests from root
pnpm test
```

## View Database

```bash
cd apps/api
pnpm db:studio
# Opens Prisma Studio at http://localhost:5555
```

## Common Issues

**Port already in use:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Database connection error:**
- Check PostgreSQL is running: `psql -U postgres -l`
- Verify `DATABASE_URL` in `apps/api/.env`

**Module not found errors:**
```bash
# Rebuild shared package
cd packages/shared && pnpm build

# Regenerate Prisma client
cd apps/api && pnpm db:generate
```

## What's Working

✅ User registration and login  
✅ JWT authentication with refresh tokens  
✅ Protected routes (users/me)  
✅ Token refresh and logout  
✅ Database schema with all entities  
✅ Unit and E2E test infrastructure  

## Next: Build Features

Ready to add features? Start with listings:

```bash
# Generate module scaffold
cd apps/api
npx nest g module listings
npx nest g service listings
npx nest g controller listings
```

See `README.md` for complete architecture documentation.
