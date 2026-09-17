# System Test Guide - Complete Authentication Flow

## System Status
- ✅ Backend: http://localhost:3001/api/v1
- ✅ Frontend: http://localhost:3000
- ✅ PostgreSQL: Running on port 5432
- ✅ Database migrations applied

## Test Scenario: Complete User Journey

### 1. Register New User
**Endpoint**: `POST http://localhost:3001/api/v1/auth/register`

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected**:
- 201 Created
- Response includes `accessToken`, `refreshToken`, and `user` object
- `user.password` field is NOT present
- `user.emailVerifiedAt` is `null`
- Email verification token created in database (hashed)

### 2. Verify Email Token Created
```bash
# Check database for verification token
psql -U postgres -d rental_marketplace -c "SELECT id, user_id, expires_at FROM email_verification_tokens ORDER BY created_at DESC LIMIT 1;"
```

**Expected**: Token exists with 24-hour expiry

### 3. Try Creating Listing (Should Fail - Unverified)
**Endpoint**: `POST http://localhost:3001/api/v1/listings`

```bash
# Replace <ACCESS_TOKEN> with the token from step 1
curl -X POST http://localhost:3001/api/v1/auth/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "title": "Test Camping Gear",
    "description": "Premium tent for rent",
    "category": "CAMPING",
    "pricePerDay": 50,
    "location": "San Francisco, CA"
  }'
```

**Expected**:
- 403 Forbidden
- Message: "Please verify your email before performing this action"

### 4. Verify Email (Simulated)
**Option A - Get token from database**:
```bash
# Get the raw token (for testing only - normally sent via email)
psql -U postgres -d rental_marketplace -c "SELECT token_hash FROM email_verification_tokens ORDER BY created_at DESC LIMIT 1;"
```

**Option B - Call verification endpoint**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<TOKEN_FROM_EMAIL_OR_DB>"
  }'
```

**Expected**:
- 200 OK
- Message: "Email verified successfully"
- `user.emailVerifiedAt` is now set
- Token is deleted from database

### 5. Try Creating Listing Again (Should Succeed)
```bash
curl -X POST http://localhost:3001/api/v1/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "title": "Test Camping Gear",
    "description": "Premium tent for rent",
    "category": "CAMPING",
    "pricePerDay": 50,
    "location": "San Francisco, CA"
  }'
```

**Expected**:
- 201 Created
- Listing object returned

### 6. Test Rate Limiting on Resend Verification
```bash
# First request
curl -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Immediate second request (should be rate limited)
curl -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected**:
- First request: 200 OK (even if email doesn't exist)
- Second request: 429 Too Many Requests

### 7. Browse as Unverified User (Should Work)
**Endpoint**: `GET http://localhost:3001/api/v1/listings`

```bash
curl http://localhost:3001/api/v1/auth/listings
```

**Expected**:
- 200 OK
- Listings array returned (no authentication required for browsing)

### 8. Test Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Expected**:
- 200 OK
- Response includes `accessToken`, `refreshToken`, and `user` object
- `user.emailVerifiedAt` is set (from earlier verification)

### 9. Test Refresh Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN_FROM_LOGIN>"
  }'
```

**Expected**:
- 200 OK
- New `accessToken` and `refreshToken` returned

### 10. Test Logout (Invalidates Refresh Tokens)
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected**:
- 200 OK
- User's `tokenVersion` incremented
- Previous refresh tokens no longer work

---

## Frontend Testing

### 1. Homepage
Navigate to: http://localhost:3000

**Expected**:
- Hero section with tent.jpg background
- Search bar
- Category tabs
- Featured listings (if any)
- Responsive design

### 2. Registration Flow
- Click "Sign Up" or navigate to registration
- Fill form: email, password, firstName, lastName
- Submit
- Check for success message
- Verify tokens stored in memory (check AuthContext)

### 3. Email Verification Flow
- After registration, user should see "Please verify your email" message
- Try to create a listing → should show error
- (In production: check email for verification link)
- After verification, listing creation should work

### 4. Login Flow
- Navigate to login page
- Enter credentials
- Submit
- Should redirect to dashboard/home
- Check protected routes work

### 5. Protected Routes
- Try accessing `/profile`, `/list-item`, `/chats` without login
- Should redirect to login page

---

## Security Checklist Verification

### ✅ Password Security
- [ ] Passwords hashed with bcrypt (10 rounds)
- [ ] Password min 8 chars enforced
- [ ] Plaintext password never stored or logged
- [ ] Password hash never returned in responses

### ✅ Email Normalization
- [ ] Emails lowercased and trimmed
- [ ] Duplicate email returns 409 Conflict
- [ ] Login failures return generic message

### ✅ Token Security
- [ ] Verification tokens cryptographically random
- [ ] Tokens hashed before storage (SHA-256)
- [ ] Raw tokens never stored or logged
- [ ] 24-hour expiry enforced
- [ ] Single-use (deleted after verification)

### ✅ Rate Limiting
- [ ] Login: 5 attempts per 15 minutes
- [ ] Register: 3 attempts per 15 minutes
- [ ] Resend verification: 1 per 60 seconds

### ✅ Email Enumeration Prevention
- [ ] Resend verification returns same success message
- [ ] Login failures don't reveal if email exists

### ✅ Authorization
- [ ] Unverified users can register, login, browse
- [ ] Unverified users blocked from creating listings (403)
- [ ] Unverified users blocked from creating bookings (403)
- [ ] EmailVerifiedGuard properly applied

---

## Database Verification Queries

```bash
# Check user was created with email normalized
psql -U postgres -d rental_marketplace -c "SELECT id, email, first_name, last_name, email_verified_at, token_version FROM users WHERE email = 'test@example.com';"

# Check verification token
psql -U postgres -d rental_marketplace -c "SELECT id, user_id, expires_at FROM email_verification_tokens WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');"

# Check token version after logout
psql -U postgres -d rental_marketplace -c "SELECT id, email, token_version FROM users WHERE email = 'test@example.com';"
```

---

## Notes

- All unit tests passing: `pnpm test` in `apps/api`
- All e2e tests passing: `pnpm test:e2e` in `apps/api`
- Email service uses Resend (graceful failure if not configured)
- For production: configure `RESEND_API_KEY` and `EMAIL_FROM` in `.env`
