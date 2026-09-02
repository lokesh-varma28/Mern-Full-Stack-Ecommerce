# HomeStore — Security Architecture & Controls

This document details the security architecture, authorization controls, cryptographic standards, input validation procedures, and operational security rules implemented across the **HomeStore — MERN Full-Stack Ecommerce Platform**.

---

## 🔒 Security Controls Matrix

| Layer | Security Mechanism | Implementation Detail | Verified Source File |
| :--- | :--- | :--- | :--- |
| **Transport** | HTTPS / TLS 1.3 | Enforced on Render & Vercel edge networks | Environment / Gateway |
| **Headers** | Helmet Guard | Dynamic security headers, custom COOP & CORP policies | `Ecommerce-Backend/Index.js` |
| **CORS** | Strict Origin Check | Explicit origin whitelist & Vercel domain regex | `Ecommerce-Backend/Index.js` |
| **Rate Limiting** | Redis Rate Limiter | Distributed IP rate limits via `rate-limit-redis` | `MiddleWare/rateLimiter.js` |
| **Authentication** | JWT (HS256) | Bearer tokens with separate access & refresh keys | `MiddleWare/authMiddleware.js` |
| **Passwords** | Bcrypt Hashing | Salt rounds = 10; minimum length 6 characters | `Controller/UserController.js` |
| **Lockout** | Brute Force Protection | Account locked for 15m after 5 failed logins | `Controller/UserController.js` |
| **OTP Defense** | Anti-Enumeration & Throttling | Max 3 attempts, 5-minute expiration, 60s cooldown | `Controller/UserController.js` |
| **RBAC** | Role Middleware | Three-tier validation (User / Seller / Admin) | `MiddleWare/adminMiddleware.js`, `sellerMiddleware.js` |
| **Validation** | Joi Schema Guard | Request body validation prior to controller execution | `MiddleWare/validateMiddleware.js` |
| **Uploads** | Cloudinary Isolation | Memory buffer limits (5MB) & file type isolation | `MiddleWare/uploadMemory.js`, `imageMiddleware.js` |

---

## 🔑 1. Authentication & Session Control

### JWT Access & Refresh Token Standard
- **Access Tokens**: Encoded with `userId`, `email`, `role`, and `sellerStatus`. Expiration managed via token generator helpers (`helper/token.js`). Signed with secret `JWT_TOKEN`.
- **Refresh Tokens**: Signed with distinct secret `REFRESH_TOKEN_SECRET`. Exchangeable via `POST /refresh-token`.
- **Session Termination**: Password resets invalidate current refresh tokens (`user.refreshToken = undefined`).

### Account Lockout Defense
To prevent brute-force credential stuffing, the login controller (`UserController.js`) tracks consecutive failed attempts:
- **Threshold**: 5 failed login attempts.
- **Lock Duration**: 15 minutes (`lockUntil = Date.now() + 15 * 60 * 1000`).
- **Reset**: Successful authentication resets `loginAttempts` to `0` and clears `lockUntil`.

---

## 📧 2. OTP Security & Anti-Enumeration

### OTP Verification Lifecycle
- **Entropy**: Cryptographically safe random 6-digit integer string.
- **Hashing**: OTP stored in MongoDB as a `bcrypt` hash (never plaintext).
- **Expiration**: 5-minute TTL (`Date.now() + 5 * 60 * 1000`).
- **Max Attempts**: Maximum 3 verification attempts allowed per generated OTP code.
- **Rate Limit / Cooldown**: 60-second minimum delay between resend requests (`otpLastSent`).

### Anti-Enumeration Protections
In `forgotPassword` (`UserController.js`), requests for unregistered email addresses return the generic response:
`"If an account with that email exists, a password reset code has been sent."`
This prevents attackers from discovering registered user emails through response status codes or messages.

---

## 🛡️ 3. Role-Based Access Control (RBAC)

Authorization is strictly enforced server-side using middleware functions:

### 1. `authMiddleware`
Extracts `Authorization: Bearer <token>` header, verifies signature against `process.env.JWT_TOKEN`, and attaches decoded identity payload to `req.user`.

### 2. `adminMiddleware`
Executes after `authMiddleware`. Queries database for `user._id` and asserts `user.role === "admin"`. Rejects non-admin calls with `403 Forbidden`.

### 3. `sellerMiddleware`
Executes after `authMiddleware`. Evaluates role requirements:
- Allows immediate passage if `req.user.role === "admin"`.
- Otherwise requires `req.user.role === "seller"` **AND** database verification that `user.sellerStatus === "approved"`.
- Rejects unapproved or non-seller accounts with `403 Forbidden` (`"Seller account approval is required"`).

---

## 🛡️ 4. HTTP Security Headers & CORS

### Helmet Security Headers
Configured in `Index.js`:
```javascript
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        // Google OAuth popup calls window.closed on opener. COOP same-origin blocks this.
        crossOriginOpenerPolicy: { policy: "unsafe-none" },
    })
);
```

### Dynamic CORS Rules
Only requests from authorized local developer ports or matching the Vercel domain pattern (`/^https:\/\/(mern-full-stack-ecommerce|front-end-ecommerce).*\.vercel\.app$/`) are granted CORS access with credentials.

---

## 🛑 5. Rate Limiting & Denial of Service

Protected endpoints utilize Redis-backed rate limiting via `express-rate-limit` and `rate-limit-redis`:
- **Auth Routes (`/login`, `/register`, `/verify-otp`)**: `5000` requests per minute.
- **Product Routes (`/products/*`)**: `1000` requests per minute.
- **Admin Routes (`/admin/*`)**: `1000` requests per minute.

---

## 🖼️ 6. File Upload Security

- **Storage Location**: Images processed through Multer memory storage buffers or streamed directly to Cloudinary storage buckets. Local server disk persistence is avoided in production.
- **File Validation**: MIME-type checking ensures only valid image formats (`image/jpeg`, `image/png`, `image/webp`) are processed.
- **Size Caps**: File sizes restricted to 5MB maximum per upload.

---

## 📋 7. Developer & Operator Security Checklist

> [!CAUTION]
> Operators and developers MUST adhere to the following non-negotiable security rules:

1. **Never Commit Secrets**: Never commit `.env` files, JWT secrets, MongoDB credentials, Cloudinary secrets, Razorpay secret keys, Google OAuth secrets, or SMTP passwords to repository history.
2. **Backend Enforcement**: Never rely on frontend UI route checks or role toggles for security. All access controls MUST be enforced by Express backend middleware.
3. **Restricted CORS**: Maintain strict production CORS rules. Never wildcard (`*`) production CORS origins when `credentials: true` is enabled.
4. **Input Sanitization**: Validate all client payloads using Joi schemas before processing in controllers.
5. **Least Privilege**: Grant minimal database and cloud service API permissions required for operation.
