# Authentication Architecture

## Design Decision: No Cookies

**Decision**: Both access and refresh tokens are JWTs returned in the response body and stored client-side in memory (Next.js context), attached manually via `Authorization: Bearer <token>` header on every authenticated request.

**Rationale**: No CSRF middleware needed, simpler implementation, and standard Bearer token flow.

---

## Token Design

### Access Token
- **Lifetime**: 15 minutes
- **Payload**: `{ sub: userId, email, iat, exp }`
- **Signing**: `JWT_ACCESS_SECRET` environment variable
- **Purpose**: Short-lived, used for API authentication
- **Storage**: In-memory (React context)

### Refresh Token
- **Lifetime**: 30 days
- **Payload**: `{ sub: userId, tokenVersion, iat, exp }`
- **Signing**: `JWT_REFRESH_SECRET` environment variable (separate from access secret)
- **Purpose**: Long-lived, used to obtain new access tokens
- **Storage**: In-memory (React context) with optional localStorage fallback for persistence
- **Revocation**: Via `tokenVersion` field in database - increment on logout/password change/compromise
- **Rotation**: New refresh token issued on every `/auth/refresh` call

---

## Email Verification Flow

### Overview
Users can register and login, but must verify their email before creating listings or bookings. Browsing and viewing content is allowed for unverified users.

### Implementation

**Database Schema:**
- `users.emailVerifiedAt` - Nullable timestamp, set when email is verified
- `email_verification_tokens` table:
  - `id` - Primary key
  - `userId` - Foreign key to users
  - `tokenHash` - SHA-256 hash of the token (never store raw token)
  - `expiresAt` - 24-hour expiry from creation
  - `createdAt` - Timestamp

**Token Generation:**
1. Generate 32-byte cryptographically random token using `crypto.randomBytes()`
2. Hash with SHA-256 before storing in database
3. Send raw token in verification email (never log or store raw token server-side)
4. Email contains link: `{FRONTEND_URL}/verify-email?token={rawToken}`

**Verification Process:**
1. User clicks link in email
2. Frontend sends token to `POST /auth/verify-email`
3. Backend hashes incoming token and looks up match
4. If valid and not expired:
   - Set `users.emailVerifiedAt = NOW()`
   - Delete used token
   - Return success
5. If invalid/expired, return clear error message

**Resend Flow:**
- `POST /auth/resend-verification` with email
- Rate limited to 1 request per 60 seconds per email
- Always returns same success message (prevents email enumeration)
- If email exists and is unverified:
  - Invalidate any existing unexpired tokens for that user
  - Generate and send new token

**Unverified User Policy:**
- ✅ Can register and login
- ✅ Can browse listings
- ✅ Can view their profile
- ❌ Cannot create listings (403: "Please verify your email before listing an item")
- ❌ Cannot create bookings (403: "Please verify your email before making a booking")

**Guard Implementation:**
- `EmailVerifiedGuard` - Reusable guard checking `user.emailVerifiedAt IS NOT NULL`
- Applied to:
  - `POST /listings` (create listing)
  - `POST /bookings` (create booking)

**Email Service:**
- Uses Resend (transactional email provider)
- `EmailService.sendVerificationEmail(to, token, firstName)`
- HTML template with branded email
- Gracefully handles email sending failures (doesn't block registration)

---

## API Endpoints

### `POST /auth/register`
- **Body**: `{ email, password, firstName, lastName, phone? }`
- **Response**: `{ accessToken, refreshToken, user }`
- **Action**: Creates user, returns tokens

### `POST /auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ accessToken, refreshToken, user }`
- **Action**: Validates credentials, returns tokens

### `POST /auth/refresh`
- **Body**: `{ refreshToken }`
- **Response**: `{ accessToken, refreshToken }`
- **Action**: Validates signature + tokenVersion, returns new token pair (refresh token rotation)

### `POST /auth/logout`
- **Body**: `{ refreshToken }`
- **Response**: `204 No Content`
- **Action**: Increments user's tokenVersion, invalidating all outstanding refresh tokens

### `POST /auth/verify-email`
- **Body**: `{ token }`
- **Response**: `{ message: "Email verified successfully" }`
- **Action**: Validates token, sets emailVerifiedAt, deletes used token
- **Errors**: 400 for invalid/expired token

### `POST /auth/resend-verification`
- **Body**: `{ email }`
- **Response**: `{ message: "If your email is registered..." }`
- **Rate Limit**: 1 request per 60 seconds per email
- **Action**: Invalidates old tokens, sends new verification email
- **Note**: Always returns success to prevent email enumeration

---

## Client-Side Handling (Next.js)

### Token Storage
- ✅ Tokens stored in memory via React Context (`AuthContext`)
- ⚠️ Optional localStorage fallback for persistence across page reloads
- ❌ NOT in sessionStorage or unprotected localStorage by default

### Token Attachment
- API client wrapper (Axios interceptor) reads from memory
- Automatically attaches via `Authorization: Bearer <token>` header

### Token Refresh Flow
1. API call returns 401
2. Attempt silent `/auth/refresh` with refresh token
3. Store new tokens in memory
4. Retry original request once with new access token
5. If refresh fails, force logout and redirect to `/auth/signin`

### On App Load / Hard Refresh
- If tokens exist in memory: continue session
- If no tokens in memory but persistence enabled: attempt silent refresh
- If no tokens available: require login

---

## NestJS Implementation

### Passport Strategies

#### JwtStrategy (Access Token)
- Validates access tokens
- Used as `@UseGuards(JwtAuthGuard)` on protected routes
- Extracts from `Authorization: Bearer <token>` header
- `ignoreExpiration: false` - Passport rejects expired tokens

#### JwtRefreshStrategy (Refresh Token) - NOT IMPLEMENTED YET
- Would validate refresh tokens
- Would only be used on `/auth/refresh` route
- Not needed for v1 since we validate manually in service

### Route Protection

**Current**: Manual guards on each protected route
**Better**: Global `AuthGuard('jwt')` via `APP_GUARD` + `@Public()` decorator for opt-out

### Token Versioning

**Current**: Refresh tokens stored in `refresh_tokens` table with expiry
**Recommended**: Add `tokenVersion` field to `User` model, increment on:
- Logout
- Password change
- Suspected compromise
- Manual revocation

---

## What's Implemented ✅

1. ✅ Access tokens (15 min, JWT_ACCESS_SECRET)
2. ✅ Refresh tokens (7 days → **NEEDS UPDATE TO 30 DAYS**)
3. ✅ Token refresh endpoint with rotation
4. ✅ Token storage in database (refresh_tokens table)
5. ✅ Logout invalidates tokens
6. ✅ In-memory storage via React Context
7. ✅ Automatic token refresh on 401
8. ✅ Bearer token authentication
9. ✅ Protected routes with JwtAuthGuard
10. ✅ Rate limiting on auth endpoints

---

## What Needs to Be Implemented 🔧

1. ❌ `tokenVersion` field in User model
2. ❌ Increment tokenVersion on logout/password change
3. ❌ Validate tokenVersion in refresh endpoint
4. ❌ Update refresh token lifetime from 7 days → 30 days
5. ❌ Global AuthGuard with @Public() decorator pattern
6. ❌ Remove cookie-related code
7. ❌ Clean up CSRF utilities (not needed)

---

## What NOT to Build for v1

- ❌ CSRF middleware (not needed - no cookies)
- ❌ Per-token blocklist/table (tokenVersion covers this)
- ❌ "Remember me" toggle (flat 30-day window for all)
- ❌ httpOnly cookies (using Bearer tokens)
- ❌ Separate JwtRefreshStrategy (manual validation is fine for v1)

---

## Security Features

### Rate Limiting ✅
- Global: 10 requests/minute
- Register: 3 attempts/15 minutes
- Login: 5 attempts/15 minutes
- Refresh: 10 attempts/5 minutes

### Input Validation ✅
- Email format validation
- Password strength checking
- XSS protection via sanitization
- Backend validation with class-validator

### Session Management ✅
- 30-minute inactivity timeout
- Activity tracking on user interactions
- Automatic logout on timeout

---

## Next Steps

1. Add `tokenVersion` to User model
2. Update refresh token logic to validate tokenVersion
3. Change refresh token expiry to 30 days
4. Implement global AuthGuard + @Public() decorator
5. Remove cookie-related code from auth controller
6. Test complete flow
