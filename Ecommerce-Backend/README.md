# E-Commerce Backend API

## Base URL

##  https://apis-6-g3nj.onrender.com

```bash
http://localhost:3000


// LIVE SERVER

```

---

# Authentication APIs

## Register User

Creates an unverified account in the database, then sends an OTP to the email.

### Endpoint

```bash
POST /register
```

### Request Body

```json
{
  "name": "Lokesh",
  "email": "lokesh@gmail.com",
  "password": "123456"
}
```

### Response

```json
{
  "message": "Account created. OTP sent to email.",
  "email": "lokesh@gmail.com"
}
```

---

## Verify OTP

Verifies the email for an existing unverified account.

### Endpoint

```bash
POST /verify-otp
```

### Request Body

```json
{
  "email": "lokesh@gmail.com",
  "otp": "123456"
}
```

---

## Resend OTP

### Endpoint

```bash
POST /resend-otp
```

### Request Body

```json
{
  "email": "lokesh@gmail.com"
}
```

---

## Login User

### Endpoint

```bash
POST /login
```

### Request Body

```json
{
  "email": "lokesh@gmail.com",
  "password": "123456"
}
```

---

# Product APIs

## Create Product

### Endpoint

```bash
POST /products
```

### Request Body

```json
{
  "name": "iPhone 15",
  "price": 70000,
  "category": "mobile"
}
```

---

## Get All Products

### Endpoint

```bash
GET /products
```

---

## Get Single Product

### Endpoint

```bash
GET /products/:id
```

### Example

```bash
GET /products/6819849d209da1e72a9de898
```

---

## Update Product

### Endpoint

```bash
PATCH /products/:id
```

### Request Body

```json
{
  "price": 65000
}
```

---

## Delete Product

### Endpoint

```bash
DELETE /products/:id
```

---

# Cart APIs

## Get Cart

### Endpoint

```bash
GET /cart
```

---

## Add To Cart

### Endpoint

```bash
POST /addcart
```

### Request Body

```json
{
  "productId": "6819849d209da1e72a9de898"
}
```

---

## Decrease Cart Quantity

### Endpoint

```bash
PATCH /decreasecart
```

### Request Body

```json
{
  "productId": "6819849d209da1e72a9de898"
}
```

---

# Profile APIs

## Get Profile

### Endpoint

```bash
GET /profile
```

---

## Update Profile

### Endpoint

```bash
PATCH /profile
```

### Request Body

```json
{
  "name": "Lokesh Varma"
}
```

---

# Order APIs

## Create Order

### Endpoint

```bash
POST /orders
```

---

## Get Orders

### Endpoint

```bash
GET /orders
```

---

# Wishlist APIs

## Add Wishlist

### Endpoint

```bash
POST /wishlist
```

### Request Body

```json
{
  "productId": "6819849d209da1e72a9de898"
}
```

---

## Get Wishlist

### Endpoint

```bash
GET /wishlist
```



# 🚀 Advanced Authentication API


A secure Node.js + Express + MongoDB authentication system with:

* JWT Authentication
* Refresh Tokens
* OTP Verification
* Forgot Password
* Role-Based Authorization
* Protected Routes
* Redis Blacklist
* Rate Limiting
* Helmet Security
* Validation Middleware
* Logging
* Secure Password Hashing

---

# 📁 Folder Structure

```bash
APIS/
│
├── Config/
│   ├── DB.js
│   ├── Mail.js
│   └── Redis.js
│
├── Controller/
│   └── UserController.js
│
├── Helper/
│   └── token.js
│
├── MiddleWare/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── rateLimiter.js
│   ├── validate.js
│   └── errorMiddleware.js
│
├── Model/
│   └── UserModel.js
│
├── Routes/
│   └── UserRoutes.js
│
├── Validation/
│   └── userValidation.js
│
├── Logs/
│   └── app.log
│
├── .env
├── Index.js
├── package.json
└── README.md
```

---

# ⚙️ Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Redis
* bcrypt
* Nodemailer
* Helmet
* express-rate-limit
* Joi

---

# 🔐 Authentication Flow

---

# 1️⃣ User Registration Flow

## Step 1

User sends:

```http
POST /register
```

Body:

```json
{
  "name":"Lokesh",
  "email":"test@gmail.com",
  "password":"123456"
}
```

---

## Step 2

Backend does:

* Validate input
* Check existing user
* Hash password
* Generate OTP
* Hash OTP
* **Create user account** (`isVerified: false`)
* Send OTP email

---

## Step 3

MongoDB stores:

```js
{
   name,
   email,
   password:hashedPassword,
   otp:hashedOtp,
   otpExpires,
   otpAttempts:0
}
```

---

# 2️⃣ Verify OTP Flow

```http
POST /verify-otp
```

Body:

```json
{
  "email":"test@gmail.com",
  "otp":"123456"
}
```

---

## Backend Checks

* User exists
* OTP attempts < 3
* OTP not expired
* bcrypt.compare()

---

## Success

```js
user.isVerified = true
```

OTP removed from DB.

---

# 3️⃣ Resend OTP Flow

```http
POST /resend-otp
```

Checks:

* Cooldown 60 seconds
* Generates new OTP
* Hashes OTP
* Sends mail again

---

# 4️⃣ Login Flow

```http
POST /login
```

Body:

```json
{
  "email":"test@gmail.com",
  "password":"123456"
}
```

---

## Backend Flow

### Step 1

Check user exists.

### Step 2

Check email verified.

### Step 3

Check account lock.

### Step 4

Compare password.

### Step 5

Generate:

* Access Token
* Refresh Token

---

# 🔑 JWT Tokens

---

# Access Token

Short life token.

Example:

```js
expiresIn:"15m"
```

Used for:

* Protected routes
* API authorization

---

# Refresh Token

Long life token.

Example:

```js
expiresIn:"7d"
```

Used for:

* Getting new access token

---

# 5️⃣ Protected Route Flow

Example route:

```js
router.get(
   "/profile",
   authMiddleware,
   profileController
)
```

---

# authMiddleware Flow

## Reads:

```js
Authorization: Bearer TOKEN
```

---

## Verifies:

```js
jwt.verify()
```

---

## Adds user to request

```js
req.user = decoded
```

---

# Example Protected Route

```js
router.get(
   "/profile",
   authMiddleware,
   (req,res)=>{
      res.json(req.user)
   }
)
```

---

# 6️⃣ Role-Based Authorization

Example:

```js
router.delete(
   "/admin",
   authMiddleware,
   roleMiddleware("admin"),
   adminController
)
```

---

# roleMiddleware Flow

Checks:

```js
req.user.role
```

If role mismatch:

```js
403 Forbidden
```

---

# 7️⃣ Refresh Token Flow

```http
POST /refresh-token
```

Body:

```json
{
   "refreshToken":"TOKEN"
}
```

---

## Backend Flow

### Step 1

Verify refresh token.

### Step 2

Find user.

### Step 3

Generate new access token.

---

# Response

```json
{
   "accessToken":"NEW_TOKEN"
}
```

---

# 8️⃣ Logout Flow

```http
POST /logout
```

---

## Backend Flow

* Takes token
* Stores token in Redis blacklist
* Token becomes invalid

---

# Redis Blacklist Example

```js
blacklist:TOKEN
```

---

# 9️⃣ Forgot Password Flow

```http
POST /forgot-password
```

---

## Backend

* Generate reset OTP
* Hash OTP
* Send email

---

# 🔟 Reset Password Flow

```http
POST /reset-password
```

Body:

```json
{
   "email":"test@gmail.com",
   "otp":"123456",
   "newPassword":"new123"
}
```

---

## Backend

* Verify OTP
* Hash new password
* Update password
* Clear OTP

---

# 🛡 Security Features

---

# 1. bcrypt Password Hashing

Passwords never stored as plain text.

Example:

```js
bcrypt.hash(password,10)
```

---

# 2. OTP Hashing

OTP also hashed using bcrypt.

---

# 3. Rate Limiting

Protects against brute force attacks.

Example:

```js
5 requests per minute
```

---

# 4. Helmet Security

Adds secure HTTP headers.

```js
app.use(helmet())
```

---

# 5. Login Attempt Lock

After 5 failed logins:

```js
Account locked for 15 minutes
```

---

# 6. OTP Attempt Limit

Only:

```js
3 OTP attempts
```

allowed.

---

# 7. OTP Expiry

OTP valid only for:

```js
5 minutes
```

---

# 8. Resend Cooldown

User must wait:

```js
60 seconds
```

before resend OTP.

---

# 📦 API Routes

| Method | Route            | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | /register        | Register user             |
| POST   | /verify-otp      | Verify OTP                |
| POST   | /resend-otp      | Resend OTP                |
| POST   | /login           | Login                     |
| POST   | /refresh-token   | Generate new access token |
| POST   | /logout          | Logout                    |
| POST   | /forgot-password | Forgot password           |
| POST   | /reset-password  | Reset password            |
| GET    | /profile         | Protected route           |

---

# 🧪 Testing in Postman

---

# Register

```http
POST /register
```

Receive OTP mail.

---

# Verify OTP

```http
POST /verify-otp
```

---

# Login

```http
POST /login
```

Receive:

* accessToken
* refreshToken

---

# Protected Route

```http
GET /profile
```

Add:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

# Refresh Token

```http
POST /refresh-token
```

Use refresh token.

---

# Logout

```http
POST /logout
```

Token becomes blacklisted.

---

# 🚨 Common Errors

---

# 400 Bad Request

Missing fields.

---

# 401 Unauthorized

Invalid token/password.

---

# 403 Forbidden

Role not allowed.

---

# 404 Not Found

Wrong route.

---

# 429 Too Many Requests

Rate limit exceeded.

---

# 🔧 Environment Variables

```env
PORT=3000

MONGO_URL=YOUR_MONGO_URL

JWT_TOKEN=YOUR_ACCESS_SECRET

REFRESH_TOKEN_SECRET=YOUR_REFRESH_SECRET

EMAIL_USER=YOUR_EMAIL

EMAIL_PASS=YOUR_PASSWORD

REDIS_URL=YOUR_REDIS_URL
```

---

# ▶️ Run Project

Install dependencies:

```bash
npm install
```

Start server:

```bash
npm start
```

---

# ✅ Features Completed

* JWT Auth
* Refresh Token
* OTP Verification
* Forgot Password
* Reset Password
* Redis Blacklist
* Protected Routes
* Role Middleware
* Rate Limiting
* Helmet Security
* Input Validation
* Logging
* Account Locking
* OTP Expiry
* OTP Attempt Limit

---

# 📌 Future Improvements

* Google Login
* Email Templates
* Docker
* CI/CD
* Unit Testing
* Swagger Docs
* Refresh Token Rotation
* Session Management
* 2FA Authentication

---

# 👨‍💻 Author

Lokesh Varma
