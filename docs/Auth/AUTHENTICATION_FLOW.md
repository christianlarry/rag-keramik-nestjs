# 🔐 Authentication Flow Documentation

## Overview

Sistem autentikasi Keramik Store Platform mengimplementasikan berbagai metode autentikasi yang aman dan modern, termasuk:

- ✅ **Email/Password** dengan verifikasi email
- ✅ **OAuth2** (Google & Facebook)
- ✅ **Password Reset** flow yang aman
- ✅ **JWT Tokens** (Access + Refresh tokens)
- ✅ **Rate Limiting** untuk keamanan

---

## 📋 Table of Contents

1. [Email/Password Registration Flow](#1-emailpassword-registration-flow)
2. [Email Verification Flow](#2-email-verification-flow)
3. [Login Flow](#3-login-flow)
4. [Forgot Password Flow](#4-forgot-password-flow)
5. [Reset Password Flow](#5-reset-password-flow)
6. [Change Password Flow](#6-change-password-flow-authenticated)
7. [OAuth2 Flow (Google/Facebook)](#7-oauth2-flow-googlefacebook)
8. [Token Refresh Flow](#8-token-refresh-flow)
9. [Logout Flow](#9-logout-flow)
10. [Security Best Practices](#10-security-best-practices)

---

## 1. Email/Password Registration Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Backend │                │  Email   │
└────┬────┘                └────┬────┘                │ Service  │
     │                          │                     └────┬─────┘
     │ POST /auth/register      │                          │
     │ { email, password, name }│                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 1. Validate input        │
     │                          │ 2. Hash password         │
     │                          │ 3. Create user (unverified)
     │                          │ 4. Generate verification token
     │                          │                          │
     │                          │ Send verification email  │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 201 Created              │                          │
     │ { message, userId }      │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

### API Endpoint

**POST** `/v1/auth/register`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

### Response (201 Created)

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

### Backend Implementation Steps

1. **Validate input**
   - Email format validation
   - Password strength check (min 8 characters)
   - Check if email already exists

2. **Hash password**
   - Use bcrypt with salt rounds (12+)
   - Never store plain text passwords

3. **Create user record**
   - Set `emailVerified: false`
   - Set `provider: 'local'`
   - Generate unique userId

4. **Generate verification token**
   - Create JWT with short expiration (24 hours)
   - Include userId and email in payload

5. **Send verification email**
   - Email subject: "Verify your Keramik Store account"
   - Include verification link with token
   - Template: `https://keramik-store.com/verify-email?token=xyz`

---

## 2. Email Verification Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ User clicks link in email│
     │                          │
     │ POST /auth/verify-email  │
     │ { token }                │
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Verify token signature
     │                          │ 2. Check token expiration
     │                          │ 3. Extract userId from token
     │                          │ 4. Update user.emailVerified = true
     │                          │
     │ 200 OK                   │
     │ { message }              │
     │<─────────────────────────┤
     │                          │
     │ Redirect to /login       │
     │                          │
```

### API Endpoint

**POST** `/v1/auth/verify-email`

### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)

```json
{
  "message": "Email verified successfully. You can now login."
}
```

### Backend Implementation Steps

1. **Verify token**
   - Validate JWT signature
   - Check expiration (reject if expired)
   - Extract userId from payload

2. **Update user**
   - Find user by userId
   - Set `emailVerified: true`
   - Set `emailVerifiedAt: new Date()`

3. **Return success**
   - Frontend redirects to login page

### Resend Verification Email

**POST** `/v1/auth/resend-verification`

```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

**Rate Limiting:** Max 3 requests per 15 minutes per email

---

## 3. Login Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ POST /auth/login         │
     │ { email, password }      │
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Find user by email
     │                          │ 2. Check emailVerified = true
     │                          │ 3. Compare password hash
     │                          │ 4. Generate access token (15m)
     │                          │ 5. Generate refresh token (7d)
     │                          │ 6. Save refresh token to DB
     │                          │
     │ 200 OK                   │
     │ { accessToken,           │
     │   refreshToken,          │
     │   expiresIn,             │
     │   user }                 │
     │<─────────────────────────┤
     │                          │
     │ Store tokens in storage  │
     │                          │
```

### API Endpoint

**POST** `/v1/auth/login`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "provider": "local",
    "createdAt": "2025-12-30T10:00:00Z"
  }
}
```

### Response (401 Unauthorized) - Email Not Verified

```json
{
  "statusCode": 401,
  "message": "Please verify your email before logging in",
  "error": "Unauthorized"
}
```

### Backend Implementation Steps

1. **Find user**
   - Query by email
   - Return 401 if not found (don't reveal if email exists)

2. **Check email verification**
   - Ensure `emailVerified === true`
   - Return 401 with specific message if not verified

3. **Verify password**
   - Use bcrypt to compare hashed password
   - Return 401 if password doesn't match

4. **Generate tokens**
   - **Access Token**: JWT with 15 minutes expiration
     ```javascript
     payload: {
       sub: userId,
       email: user.email,
       role: user.role,
       type: 'access'
     }
     ```
   - **Refresh Token**: JWT with 7 days expiration
     ```javascript
     payload: {
       sub: userId,
       type: 'refresh',
       jti: uniqueTokenId // for token revocation
     }
     ```

5. **Store refresh token**
   - Save to database with expiration date
   - Associate with userId for tracking

6. **Return response**
   - Include both tokens and user info

---

## 4. Forgot Password Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Backend │                │  Email   │
└────┬────┘                └────┬────┘                │ Service  │
     │                          │                     └────┬─────┘
     │ POST /auth/forgot-password│                         │
     │ { email }                │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 1. Find user by email    │
     │                          │ 2. Generate reset token (1h expiry)
     │                          │ 3. Store token hash in DB│
     │                          │                          │
     │                          │ Send reset email         │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 200 OK                   │                          │
     │ { message }              │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ User receives email with reset link                 │
     │                          │                          │
```

### API Endpoint

**POST** `/v1/auth/forgot-password`

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Response (200 OK)

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

> **Security Note:** Always return success response even if email doesn't exist to prevent email enumeration attacks.

### Backend Implementation Steps

1. **Find user**
   - Query by email
   - If not found, still return success (security)

2. **Generate reset token**
   - Create JWT with 1 hour expiration
   - Include userId in payload
   - Generate unique token ID (jti)

3. **Store token**
   - Hash token and store in `passwordResetTokens` table
   - Include expiration timestamp
   - Invalidate previous reset tokens for this user

4. **Send email**
   - Email subject: "Reset your Keramik Store password"
   - Include reset link: `https://keramik-store.com/reset-password?token=xyz`
   - Template with instructions and expiration time

5. **Rate limiting**
   - Max 3 requests per email per 15 minutes
   - Prevent abuse

---

## 5. Reset Password Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ User clicks reset link   │
     │                          │
     │ POST /auth/reset-password│
     │ { token, newPassword }   │
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Verify token signature
     │                          │ 2. Check token in DB (not used)
     │                          │ 3. Check expiration (1 hour)
     │                          │ 4. Hash new password
     │                          │ 5. Update user password
     │                          │ 6. Mark token as used
     │                          │ 7. Invalidate all refresh tokens
     │                          │
     │ 200 OK                   │
     │ { message }              │
     │<─────────────────────────┤
     │                          │
     │ Redirect to /login       │
     │                          │
```

### API Endpoint

**POST** `/v1/auth/reset-password`

### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass123!"
}
```

### Response (200 OK)

```json
{
  "message": "Password reset successful. You can now login with your new password."
}
```

### Backend Implementation Steps

1. **Verify token**
   - Validate JWT signature
   - Check expiration
   - Extract userId from payload

2. **Check token usage**
   - Query `passwordResetTokens` table
   - Ensure token hasn't been used
   - Ensure token is within expiration window

3. **Update password**
   - Hash new password with bcrypt
   - Update user's password field
   - Update `passwordChangedAt` timestamp

4. **Cleanup**
   - Mark reset token as used
   - Delete/invalidate old reset tokens
   - Invalidate all existing refresh tokens (force re-login)

5. **Send confirmation email**
   - Notify user that password was changed
   - Include timestamp and IP address

---

## 6. Change Password Flow (Authenticated)

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ POST /auth/change-password│
     │ Authorization: Bearer token│
     │ { currentPassword,       │
     │   newPassword }          │
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Verify access token
     │                          │ 2. Get userId from token
     │                          │ 3. Verify currentPassword
     │                          │ 4. Hash newPassword
     │                          │ 5. Update password
     │                          │ 6. Invalidate refresh tokens
     │                          │
     │ 200 OK                   │
     │ { message }              │
     │<─────────────────────────┤
     │                          │
```

### API Endpoint

**POST** `/v1/auth/change-password`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body

```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass123!"
}
```

### Response (200 OK)

```json
{
  "message": "Password changed successfully"
}
```

### Backend Implementation Steps

1. **Authenticate user**
   - Verify access token
   - Extract userId from token

2. **Verify current password**
   - Compare with stored hash
   - Return 400 if incorrect

3. **Validate new password**
   - Check strength requirements
   - Ensure different from current password

4. **Update password**
   - Hash new password
   - Update database
   - Update `passwordChangedAt` timestamp

5. **Security actions**
   - Invalidate all refresh tokens
   - User must re-login with new password
   - Send confirmation email

---

## 7. OAuth2 Flow (Google/Facebook)

### Flow Diagram

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│ Client  │     │ Backend │     │  OAuth   │     │  Email  │
│         │     │         │     │ Provider │     │ Service │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬────┘
     │               │               │                 │
     │ Click "Login with Google"     │                 │
     ├──────────────>│               │                 │
     │               │               │                 │
     │ Redirect to Google            │                 │
     │ /auth/google  │               │                 │
     ├──────────────>│               │                 │
     │               │               │                 │
     │               │ Redirect to OAuth consent       │
     │<──────────────┤───────────────>│                 │
     │               │               │                 │
     │ User approves │               │                 │
     ├───────────────┼───────────────>│                 │
     │               │               │                 │
     │               │ Callback with auth code         │
     │               │<───────────────┤                 │
     │               │               │                 │
     │               │ Exchange code for tokens        │
     │               ├───────────────>│                 │
     │               │               │                 │
     │               │ User profile  │                 │
     │               │<───────────────┤                 │
     │               │               │                 │
     │               │ 1. Find/create user             │
     │               │ 2. Set emailVerified = true     │
     │               │ 3. Generate JWT tokens          │
     │               │               │                 │
     │ 200 OK        │               │                 │
     │ { accessToken,│               │                 │
     │   refreshToken,│              │                 │
     │   user }      │               │                 │
     │<──────────────┤               │                 │
     │               │               │                 │
```

### Google OAuth2 Endpoints

**Initiate:** `GET /v1/auth/google`

**Callback:** `GET /v1/auth/google/callback?code=xxx&state=yyy`

### Facebook OAuth2 Endpoints

**Initiate:** `GET /v1/auth/facebook`

**Callback:** `GET /v1/auth/facebook/callback?code=xxx&state=yyy`

### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "provider": "google",
    "providerId": "1234567890",
    "emailVerified": true,
    "createdAt": "2025-12-30T10:00:00Z"
  }
}
```

### Backend Implementation Steps

1. **Redirect to OAuth provider**
   - Generate state parameter (CSRF protection)
   - Include scope: `email profile`
   - Redirect user to OAuth consent screen

2. **Handle callback**
   - Verify state parameter
   - Exchange authorization code for access token

3. **Fetch user profile**
   - Call provider's API to get user info
   - Extract email, name, profile picture

4. **Find or create user**
   - Search by `provider` + `providerId`
   - If not found, search by email
   - If still not found, create new user

5. **Set user properties**
   - `provider: 'google'` or `'facebook'`
   - `providerId: <oauth_user_id>`
   - `emailVerified: true` (OAuth emails are pre-verified)
   - `password: null` (OAuth users don't have passwords)

6. **Generate JWT tokens**
   - Same as email/password login
   - Return access + refresh tokens

---

## 8. Token Refresh Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ Access token expired     │
     │ (401 from API call)      │
     │                          │
     │ POST /auth/refresh       │
     │ { refreshToken }         │
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Verify refresh token
     │                          │ 2. Check token in DB
     │                          │ 3. Check expiration
     │                          │ 4. Generate new access token
     │                          │ 5. Optionally rotate refresh token
     │                          │
     │ 200 OK                   │
     │ { accessToken,           │
     │   expiresIn }            │
     │<─────────────────────────┤
     │                          │
     │ Retry original API call  │
     │                          │
```

### API Endpoint

**POST** `/v1/auth/refresh`

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Backend Implementation Steps

1. **Verify refresh token**
   - Validate JWT signature
   - Check expiration
   - Extract userId and token ID (jti)

2. **Check database**
   - Query `refreshTokens` table
   - Ensure token exists and is not revoked
   - Verify userId matches

3. **Generate new access token**
   - Create new JWT with 15 minutes expiration
   - Include userId, email, role

4. **Optional: Refresh token rotation**
   - Generate new refresh token
   - Revoke old refresh token
   - Return new refresh token (enhanced security)

---

## 9. Logout Flow

### Flow Diagram

```
┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │
└────┬────┘                └────┬────┘
     │                          │
     │ POST /auth/logout        │
     │ Authorization: Bearer token│
     ├─────────────────────────>│
     │                          │
     │                          │ 1. Verify access token
     │                          │ 2. Extract userId
     │                          │ 3. Revoke refresh tokens
     │                          │ 4. Add access token to blacklist
     │                          │
     │ 200 OK                   │
     │ { message }              │
     │<─────────────────────────┤
     │                          │
     │ Clear tokens from storage│
     │ Redirect to /login       │
     │                          │
```

### API Endpoint

**POST** `/v1/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response (200 OK)

```json
{
  "message": "Logout successful"
}
```

### Backend Implementation Steps

1. **Verify access token**
   - Extract userId from token

2. **Revoke refresh tokens**
   - Delete all refresh tokens for user
   - Or mark as revoked in database

3. **Blacklist access token**
   - Add token to Redis blacklist
   - TTL = token remaining lifetime
   - Check blacklist on all authenticated requests

4. **Return success**
   - Frontend clears tokens from storage

---

## 10. Security Best Practices

### Password Security

✅ **DO:**
- Use bcrypt with salt rounds ≥ 12
- Enforce minimum 8 characters
- Require mix of uppercase, lowercase, numbers, symbols (optional)
- Implement password strength meter on frontend
- Hash passwords before storing

❌ **DON'T:**
- Store passwords in plain text
- Use weak hashing algorithms (MD5, SHA1)
- Share passwords via email
- Log passwords in application logs

### Token Security

✅ **DO:**
- Use short-lived access tokens (15 minutes)
- Use longer refresh tokens (7 days)
- Implement token rotation for refresh tokens
- Store refresh tokens securely in database
- Use HTTPS for all token transmission
- Implement token blacklisting for logout
- Sign tokens with strong secret key (min 256 bits)

❌ **DON'T:**
- Store access tokens in localStorage (use httpOnly cookies if possible)
- Use long-lived access tokens (>1 hour)
- Expose JWT secret key
- Reuse token IDs (jti)

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 3 requests | 15 minutes |
| `/auth/login` | 5 attempts | 15 minutes |
| `/auth/forgot-password` | 3 requests | 15 minutes |
| `/auth/resend-verification` | 3 requests | 15 minutes |
| `/auth/refresh` | 10 requests | 1 minute |

### Email Security

✅ **DO:**
- Use verified email service (SendGrid, AWS SES, Mailgun)
- Implement SPF, DKIM, DMARC records
- Include expiration time in emails
- Use HTTPS links only
- Rate limit email sending
- Log email delivery status

❌ **DON'T:**
- Include sensitive data in email subject
- Use GET requests for sensitive actions (use POST)
- Send passwords via email

### Session Security

✅ **DO:**
- Implement CSRF protection
- Use secure, httpOnly cookies
- Set SameSite=Strict or Lax
- Implement device tracking (optional)
- Log authentication events
- Monitor for suspicious activity

❌ **DON'T:**
- Allow concurrent sessions from different IPs (flag as suspicious)
- Skip user-agent validation
- Ignore unusual login patterns

### OAuth2 Security

✅ **DO:**
- Validate state parameter (CSRF protection)
- Use PKCE for mobile apps
- Verify redirect URIs
- Store OAuth tokens securely
- Implement scope restrictions
- Handle OAuth errors gracefully

❌ **DON'T:**
- Skip state parameter validation
- Trust OAuth profile data without verification
- Allow open redirect vulnerabilities

---

## 📊 Complete Authentication Flow Summary

```
Registration Flow:
Register → Send Email → Verify Email → Login

Login Flow:
Login → Validate Credentials → Return Tokens → Access Protected Routes

Forgot Password Flow:
Request Reset → Send Email → Reset Password → Login

Password Change Flow:
Authenticate → Verify Current Password → Update → Invalidate Sessions

OAuth2 Flow:
Redirect to Provider → User Approves → Callback → Return Tokens

Token Management:
Access Token Expires → Refresh Token → New Access Token → Continue

Logout Flow:
Revoke Tokens → Blacklist Access Token → Clear Client Storage
```

---

## 🔧 Implementation Checklist

### Backend

- [ ] User model with `emailVerified`, `provider`, `providerId` fields
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] JWT token generation (access + refresh)
- [ ] Refresh token storage in database
- [ ] Token blacklist (Redis recommended)
- [ ] Email service integration (SendGrid/AWS SES)
- [ ] Email templates (verification, password reset, confirmation)
- [ ] Rate limiting middleware
- [ ] OAuth2 Passport strategies (Google, Facebook)
- [ ] Password validation (strength, common passwords)
- [ ] Audit logging for authentication events
- [ ] CSRF protection
- [ ] Input sanitization and validation

### Frontend

- [ ] Registration form with validation
- [ ] Email verification page
- [ ] Login form with error handling
- [ ] Forgot password flow
- [ ] Reset password page
- [ ] Change password form
- [ ] OAuth2 buttons (Google, Facebook)
- [ ] Token storage (secure method)
- [ ] Automatic token refresh interceptor
- [ ] Logout functionality
- [ ] Password strength indicator
- [ ] Loading states and error messages
- [ ] Redirect after authentication

### Database

- [ ] Users table with authentication fields
- [ ] RefreshTokens table
- [ ] PasswordResetTokens table
- [ ] AuditLog table for authentication events
- [ ] Indexes on email, provider, providerId

### Email Templates

- [ ] Welcome email
- [ ] Email verification
- [ ] Password reset request
- [ ] Password changed confirmation
- [ ] New login notification (optional)
- [ ] Suspicious activity alert (optional)

---

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [NestJS Passport Documentation](https://docs.nestjs.com/security/authentication)
- [Bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

---

## 🎯 Next Steps

1. Implement DTOs for all authentication endpoints
2. Create AuthService with all authentication methods
3. Set up email service and templates
4. Implement Passport strategies for OAuth2
5. Add rate limiting middleware
6. Create authentication guards and decorators
7. Write integration tests for all flows
8. Document environment variables
9. Set up monitoring and alerts

---

**Last Updated:** December 31, 2025
**Version:** 1.0.0
