# Google OAuth Implementation - Complete Guide

## ✅ What's Been Implemented

### Backend (NestJS)
- ✅ Database schema updated (`googleId` field, nullable `passwordHash`)
- ✅ Migration created and applied
- ✅ `passport-google-oauth20` installed
- ✅ GoogleStrategy created with proper profile extraction
- ✅ Account linking logic in `loginOrRegisterWithGoogle`:
  - Existing `googleId` → returning user (login)
  - Existing email → link Google account to existing user
  - New user → create account with Google (email pre-verified)
- ✅ Email/password login checks for Google-only accounts
- ✅ OAuth endpoints: `GET /auth/google` and `GET /auth/google/callback`
- ✅ Callback redirects to frontend with tokens in URL fragment

### Frontend (Next.js)
- ✅ "Continue with Google" buttons on signin and register pages
- ✅ `/auth/callback` page to handle OAuth redirect
- ✅ Token extraction and storage from URL fragment
- ✅ Error handling for failed authentication

### Configuration
- ✅ `.env` updated with Google OAuth placeholders
- ✅ `.env.example` created with all required fields

---

## 🔧 Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Name: "Boroboro" (or your app name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Click "Create"
   - Fill in:
     - App name: **Boroboro**
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip for now (defaults are fine)
   - Test users: Add your Gmail for testing
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Boroboro Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs:**
     - `http://localhost:3001/api/v1/auth/google/callback`
     - (Add production URL later: `https://yourdomain.com/api/v1/auth/google/callback`)
   - Click "Create"

6. **Copy Your Credentials**
   - You'll see your **Client ID** and **Client Secret**
   - Keep this page open or download the JSON

### Step 2: Update Environment Variables

Update `apps/api/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"
```

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with the values from Google Cloud Console.

### Step 3: Restart Backend

```bash
cd apps/api
npm run build
# Restart the backend process
```

---

## 🧪 Testing the Implementation

### Test Scenario 1: New Google User

1. Navigate to `http://localhost:3000/auth/signin`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect back to app, logged in
5. Check database:
   ```sql
   SELECT id, email, "googleId", "emailVerifiedAt", "passwordHash" 
   FROM users 
   WHERE email = 'your.email@gmail.com';
   ```
6. Verify:
   - `googleId` is set
   - `emailVerifiedAt` is set (email pre-verified)
   - `passwordHash` is NULL

### Test Scenario 2: Account Linking

1. First, register with email/password:
   - Go to `/auth/register`
   - Register with an email (e.g., `test@gmail.com`)
   - Verify the email

2. Then, sign in with Google using **the same email**:
   - Go to `/auth/signin`
   - Click "Continue with Google"
   - Choose the Google account with `test@gmail.com`

3. Check database:
   ```sql
   SELECT id, email, "googleId", "passwordHash" 
   FROM users 
   WHERE email = 'test@gmail.com';
   ```

4. Verify:
   - `googleId` is now set (linked!)
   - `passwordHash` still exists
   - Only ONE user row (not duplicated!)

### Test Scenario 3: Google-Only User Tries Email Login

1. After creating a Google-only account (Scenario 1)
2. Try to login with email/password at `/auth/signin`
3. Should see error: "This account uses Google Sign-In. Please continue with Google."

### Test Scenario 4: Returning Google User

1. After signing in with Google once
2. Logout
3. Sign in with Google again
4. Should instantly log in (no account creation)

---

## 🏗️ Architecture

### Account Linking Logic

The `loginOrRegisterWithGoogle` method handles three cases:

1. **Returning Google User** (`googleId` exists)
   ```typescript
   User found by googleId → Log them in
   ```

2. **Link to Existing Account** (email exists, no `googleId`)
   ```typescript
   User found by email → Set googleId → Link accounts → Log them in
   ```

3. **New User** (email doesn't exist)
   ```typescript
   Create new user → Set googleId → Set emailVerifiedAt → Log them in
   ```

### Token Flow

```
User clicks "Continue with Google"
  ↓
Frontend redirects to: /api/v1/auth/google
  ↓
Backend redirects to: Google OAuth consent screen
  ↓
User approves
  ↓
Google redirects to: /api/v1/auth/google/callback
  ↓
Backend validates Google profile
  ↓
Backend calls loginOrRegisterWithGoogle()
  ↓
Backend generates access & refresh tokens
  ↓
Backend redirects to: /auth/callback#accessToken=xxx&refreshToken=yyy
  ↓
Frontend parses tokens from URL fragment
  ↓
Frontend stores tokens
  ↓
Frontend redirects to: / (home)
```

### Security Notes

- **Tokens in URL fragment** (`#` not `?`) so they're not sent to server logs
- **Email pre-verified** for Google users (Google already verified it)
- **Password nullable** for Google-only users
- **Account linking** prevents duplicate accounts for same email
- **Token version** still works (can logout all sessions)

---

## 📝 Environment Variables Reference

### Required for Google OAuth:

```env
GOOGLE_CLIENT_ID="1234567890-abcdefgh.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxx"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"
```

### For Production:

Update callback URL in:
1. Google Cloud Console → Authorized redirect URIs
2. `.env` file → `GOOGLE_CALLBACK_URL`

Example production URL:
```env
GOOGLE_CALLBACK_URL="https://api.yourdomain.com/api/v1/auth/google/callback"
```

---

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: Google shows "Error 400: redirect_uri_mismatch"

**Solution**: 
1. Check Google Cloud Console → Credentials
2. Ensure **Authorized redirect URIs** includes:
   - `http://localhost:3001/api/v1/auth/google/callback`
3. Wait 5 minutes for changes to propagate
4. Clear browser cache

### "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured

**Solution**:
1. Go to "OAuth consent screen"
2. Complete all required fields
3. Add your email to "Test users"
4. Status should be "Testing"

### Backend Error: "Cannot read property 'value' of undefined"

**Problem**: Google profile structure different than expected

**Solution**: Check GoogleStrategy.validate() - profile structure varies by Google account type

### Tokens Not Stored in Frontend

**Problem**: Callback page not extracting tokens

**Solution**:
1. Check browser console for errors
2. Verify URL has `#accessToken=...` not `?accessToken=...`
3. Check callback page is reading `window.location.hash`

---

## ✅ Definition of Done Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Environment variables updated in `.env`
- [ ] Backend restarted with new config
- [ ] Can sign in with Google (new user)
- [ ] Can link Google to existing email/password account
- [ ] Google-only users blocked from email/password login
- [ ] Returning Google users log in successfully
- [ ] No duplicate accounts created for same email
- [ ] Tokens stored correctly in frontend
- [ ] Users redirect to home after Google auth

---

## 🔜 Next Steps (Not Yet Implemented)

1. **Unit Tests**
   - Test `loginOrRegisterWithGoogle` with all three branches
   - Test Google-only user email/password login block
   - Mock GoogleStrategy in e2e tests

2. **Better User Experience**
   - Fetch user info in callback page instead of just storing tokens
   - Show user's Google profile picture
   - Better error messages for each failure case

3. **Production Readiness**
   - Add production callback URL to Google Console
   - Update CORS settings if needed
   - Test with multiple Google accounts
   - Add analytics for Google sign-ins

---

**Status**: ✅ Backend complete, Frontend complete, Ready for testing with real Google credentials
**Last Updated**: September 18, 2026
