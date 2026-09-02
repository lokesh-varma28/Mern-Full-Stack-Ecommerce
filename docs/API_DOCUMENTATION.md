# HomeStore — Master API Reference Guide

This document provides complete, production-grade documentation for the **HomeStore REST API**. Every endpoint listed here is verified against the backend implementation (`Ecommerce-Backend/Index.js`, `Routes/`, `Controller/`, `MiddleWare/`, and `validation/`).

---

## 🌐 Base URL Configuration

- **Production API Base**: `https://mern-full-stack-ecommerce-cwb9.onrender.com`
- **Local Development Base**: `http://localhost:3000`

All endpoints described in this specification use the environment placeholder `{{BASE_URL}}`.

---

## 🔑 Authentication & Headers

### Token Specification
- **Header Name**: `Authorization`
- **Format**: `Bearer <access_token>`
- **Token Type**: JSON Web Token (JWT) signed with algorithm `HS256`.
- **Token Invalidation**: Refresh tokens expire after the configured session limit or upon password reset.

### Standard Request Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

### File Upload Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: multipart/form-data
```

---

## 🛡️ Authorization Legend

| Symbol | Auth Required | Middleware Rules / Role Requirement |
| :--- | :--- | :--- |
| 🌐 **Public** | None | Unrestricted public access |
| 🔐 **Authenticated** | Yes | Valid JWT Bearer token required (`authMiddleware`) |
| 🏪 **Approved Seller** | Yes | Valid JWT Bearer token + Approved seller status (`authMiddleware` + `sellerMiddleware`: `role === "seller"` and `sellerStatus === "approved"`, or `role === "admin"`) |
| 🛡️ **Admin** | Yes | Valid JWT Bearer token + Admin role (`authMiddleware` + `adminMiddleware`: `role === "admin"`) |

---

## 📋 Master Endpoint Inventory

| Module | Method | Endpoint | Auth Level | Role / Requirements | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | 🌐 | None | Health check & server status |
| **Auth** | `POST` | `/register` | 🌐 | Rate limited (`authLimiter`) | Register new customer or seller account |
| **Auth** | `POST` | `/verify-otp` | 🌐 | Rate limited (`authLimiter`) | Verify email address using 6-digit OTP |
| **Auth** | `POST` | `/resend-otp` | 🌐 | Rate limited (`authLimiter`) | Resend account verification OTP |
| **Auth** | `POST` | `/login` | 🌐 | Rate limited (`authLimiter`) | Authenticate user & receive access/refresh tokens |
| **Auth** | `POST` | `/refresh-token` | 🌐 | None | Exchange valid refresh token for new access token |
| **Auth** | `POST` | `/forgot-password` | 🌐 | Rate limited (`authLimiter`) | Trigger password reset OTP email |
| **Auth** | `POST` | `/reset-password` | 🌐 | Rate limited (`authLimiter`) | Reset user password using OTP |
| **Google Auth** | `GET` | `/auth/google/ping` | 🌐 | None | Check Google OAuth configuration status |
| **Google Auth** | `POST` | `/auth/google` | 🌐 | None | Authenticate or register user via Google ID Token |
| **Profile** | `GET` | `/profile` | 🔐 | Customer / Seller / Admin | Retrieve current authenticated user profile |
| **Profile** | `PUT` | `/update-profile` | 🔐 | Customer / Seller / Admin | Update user profile details |
| **Profile** | `POST` | `/profile/avatar` | 🔐 | Customer / Seller / Admin | Upload user avatar image (`avatar`) |
| **Profile** | `POST` | `/profile/cover` | 🔐 | Customer / Seller / Admin | Upload user profile cover banner (`coverImage`) |
| **Products** | `GET` | `/products` | 🌐 | Rate limited (`productLimiter`) | Fetch products with search, filter, & pagination |
| **Products** | `GET` | `/products/related/:id` | 🌐 | Rate limited (`productLimiter`) | Get related products for a product |
| **Products** | `GET` | `/products/recommend/:id` | 🌐 | Rate limited (`productLimiter`) | Get recommended products for a product |
| **Products** | `GET` | `/products/:id` | 🌐 | Rate limited (`productLimiter`) | Fetch single product by ID |
| **Products** | `POST` | `/products` | 🛡️ | Rate limited + Admin + Upload | Create new product (Admin) |
| **Products** | `PUT` | `/products/:id` | 🛡️ | Rate limited + Admin | Update existing product details (Admin) |
| **Products** | `DELETE` | `/products/:id` | 🛡️ | Rate limited + Admin | Delete product by ID (Admin) |
| **Products** | `POST` | `/products/:id/review` | 🔐 | Customer / Seller / Admin | Add product review & rating |
| **Search** | `GET` | `/search` | 🌐 | None | Quick search products by query `q` |
| **Categories** | `GET` | `/categories` | 🌐 | None | List distinct product categories |
| **Brands** | `GET` | `/brands` | 🌐 | None | List distinct product brands |
| **Cart** | `GET` | `/cart` | 🔐 | Customer | Retrieve user cart items |
| **Cart** | `POST` | `/cart` | 🔐 | Customer | Add item to cart |
| **Cart** | `PUT` | `/cart/decrease` | 🔐 | Customer | Decrease cart item quantity |
| **Cart** | `DELETE` | `/cart` | 🔐 | Customer | Remove item from cart |
| **Wishlist** | `GET` | `/wishlist` | 🔐 | Customer | Retrieve user wishlist |
| **Wishlist** | `POST` | `/wishlist` | 🔐 | Customer | Add product to wishlist |
| **Wishlist** | `DELETE` | `/wishlist/:productId` | 🔐 | Customer | Remove specific product from wishlist |
| **Wishlist** | `DELETE` | `/wishlist` | 🔐 | Customer | Remove item / clear wishlist |
| **Address** | `GET` | `/address` | 🔐 | Customer | Fetch saved delivery addresses |
| **Address** | `POST` | `/address` | 🔐 | Customer | Add new delivery address |
| **Address** | `PUT` | `/address/:id` | 🔐 | Customer | Update existing address |
| **Address** | `DELETE` | `/address/:id` | 🔐 | Customer | Delete saved address |
| **Reviews** | `POST` | `/review` | 🔐 | Customer + Multipart (5 images) | Submit detailed product review with images |
| **Reviews** | `GET` | `/review/:productId` | 🌐 | None | Get reviews for product |
| **Reviews** | `PUT` | `/review/:id` | 🔐 | Customer (Review Owner) | Update existing review |
| **Reviews** | `DELETE` | `/review/:id` | 🔐 | Customer (Review Owner) | Delete review |
| **Questions** | `POST` | `/question` | 🔐 | Customer | Ask a question on a product |
| **Questions** | `GET` | `/question/:productId` | 🌐 | None | Get public Q&A list for product |
| **Questions** | `PUT` | `/question/:id` | 🔐 | Admin / Seller | Answer a product question |
| **Questions** | `GET` | `/admin/questions` | 🔐 | Admin / Authorized | Retrieve all customer questions |
| **Orders** | `POST` | `/orders` | 🔐 | Customer | Create order |
| **Orders** | `GET` | `/orders` | 🔐 | Customer | List customer order history |
| **Orders** | `GET` | `/orders/:id` | 🔐 | Customer | Get single order details |
| **Orders** | `PUT` | `/orders/:id/cancel` | 🔐 | Customer | Cancel eligible order |
| **Orders** | `GET` | `/orders/:id/invoice` | 🔐 | Customer | Download order PDF invoice |
| **Payment** | `POST` | `/payment/checkout` | 🔐 | Customer | Create Razorpay payment order |
| **Payment** | `POST` | `/payment/verify-payment` | 🔐 | Customer | Verify Razorpay payment signature & place order |
| **Payment** | `POST` | `/payment/cod` | 🔐 | Customer | Place Cash on Delivery (COD) order |
| **Invoices** | `GET` | `/invoice/:id` | 🔐 | Customer | Download order PDF invoice document |
| **Tracking** | `GET` | `/track/:id` | 🔐 | Customer | Track order shipping & delivery status |
| **Coupons** | `POST` | `/apply-coupon` | 🔐 | Customer | Apply discount promo coupon to cart |
| **Coupons** | `POST` | `/coupon/apply` | 🔐 | Customer | Alternate route to apply promo coupon |
| **Coupons** | `POST` | `/coupon` | 🛡️ | Admin | Create discount coupon (Admin) |
| **Coupons** | `GET` | `/coupon` | 🛡️ | Admin | List all platform coupons (Admin) |
| **Coupons** | `PUT` | `/coupon/:id` | 🛡️ | Admin | Update discount coupon (Admin) |
| **Coupons** | `DELETE` | `/coupon/:id` | 🛡️ | Admin | Delete discount coupon (Admin) |
| **Returns** | `POST` | `/return` | 🔐 | Customer | Submit order return request |
| **Returns** | `GET` | `/return/my` | 🔐 | Customer | View customer return requests |
| **Returns** | `GET` | `/admin/returns` | 🛡️ | Admin | View all return requests (Admin) |
| **Returns** | `PUT` | `/admin/returns/:id` | 🛡️ | Admin | Approve or reject return request (Admin) |
| **Notifications** | `GET` | `/notifications` | 🔐 | Customer / Seller | Retrieve user notifications |
| **Notifications** | `POST` | `/notifications` | 🛡️ | Admin | Create system notification (Admin) |
| **Notifications** | `PATCH` | `/notifications/:id/read` | 🔐 | Customer / Seller | Mark single notification as read |
| **Notifications** | `PATCH` | `/notifications/read-all` | 🔐 | Customer / Seller | Mark all notifications as read |
| **Notifications** | `DELETE` | `/notifications/:id` | 🔐 | Customer / Seller | Delete notification |
| **Recommendations**| `GET` | `/recommendations/:productId` | 🌐 | None | Get item recommendations |
| **Seller Onboarding**| `POST` | `/seller/apply` | 🔐 | Customer | Submit seller onboarding application |
| **Seller Onboarding**| `GET` | `/seller/application` | 🔐 | Customer | View customer seller application status |
| **Seller Portal** | `POST` | `/seller/products` | 🏪 | Approved Seller + Upload | Create product for seller store |
| **Seller Portal** | `GET` | `/seller/products` | 🏪 | Approved Seller | List seller products |
| **Seller Portal** | `GET` | `/seller/products/:id` | 🏪 | Approved Seller | View seller product details |
| **Seller Portal** | `PUT` | `/seller/products/:id` | 🏪 | Approved Seller + Upload | Update seller product details |
| **Seller Portal** | `DELETE` | `/seller/products/:id` | 🏪 | Approved Seller | Delete seller product |
| **Seller Portal** | `GET` | `/seller/orders` | 🏪 | Approved Seller | List orders containing seller products |
| **Seller Portal** | `PUT` | `/seller/orders/:orderId/items/:itemId/status` | 🏪 | Approved Seller | Update seller order item status |
| **Seller Portal** | `GET` | `/seller/analytics` | 🏪 | Approved Seller | Get seller store analytics |
| **Seller Portal** | `GET` | `/seller/customers` | 🏪 | Approved Seller | Get seller customer insights |
| **Seller Portal** | `GET` | `/seller/profile` | 🏪 | Approved Seller | Get seller store profile |
| **Seller Portal** | `PUT` | `/seller/profile` | 🏪 | Approved Seller | Update seller store profile |
| **Seller Portal** | `POST` | `/seller/profile/avatar` | 🏪 | Approved Seller + Upload | Upload seller store avatar |
| **Seller Portal** | `POST` | `/seller/profile/cover` | 🏪 | Approved Seller + Upload | Upload seller store cover banner |
| **Public Seller** | `GET` | `/sellers/:sellerId` | 🌐 | None | View public seller store profile |
| **Public Seller** | `GET` | `/sellers/:sellerId/products` | 🌐 | None | View products offered by seller |
| **Admin Operations**| `GET` | `/admin/dashboard` | 🛡️ | Admin | Get central admin metrics |
| **Admin Operations**| `GET` | `/admin/sales` | 🛡️ | Admin | Get platform sales analytics |
| **Admin Operations**| `GET` | `/admin/top-products` | 🛡️ | Admin | Get top performing products |
| **Admin Operations**| `GET` | `/admin/users` | 🛡️ | Admin | Get all registered users |
| **Admin Operations**| `DELETE` | `/admin/user/:id` | 🛡️ | Admin | Delete user account |
| **Admin Operations**| `GET` | `/admin/orders` | 🛡️ | Admin | Get all platform orders |
| **Admin Operations**| `PUT` | `/admin/order/:id/status` | 🛡️ | Admin | Update global order status |
| **Admin Operations**| `PUT` | `/admin/order/:id/tracking` | 🛡️ | Admin | Assign courier tracking info |
| **Admin Operations**| `GET` | `/admin/products` | 🛡️ | Admin | Get all products catalog |
| **Admin Operations**| `POST` | `/admin/product` | 🛡️ | Admin + Upload | Add product (Admin) |
| **Admin Operations**| `PUT` | `/admin/product/:id` | 🛡️ | Admin + Upload | Edit product (Admin) |
| **Admin Operations**| `DELETE` | `/admin/product/:id` | 🛡️ | Admin | Remove product from catalog |
| **Admin Operations**| `GET` | `/admin/sellers` | 🛡️ | Admin | View pending seller applications |
| **Admin Operations**| `PUT` | `/admin/sellers/:id/approve` | 🛡️ | Admin | Approve seller application |
| **Admin Operations**| `PUT` | `/admin/sellers/:id/reject` | 🛡️ | Admin | Reject seller application |
| **Admin Operations**| `GET` | `/admin/coupons` | 🛡️ | Admin | View all system coupons |
| **Admin Analytics** | `GET` | `/admin/analytics` | 🛡️ | Admin | Detailed dashboard analytics |
| **Admin Inventory** | `GET` | `/admin/inventory` | 🛡️ | Admin | Full product stock inventory list |
| **Admin Inventory** | `GET` | `/admin/inventory/low-stock` | 🛡️ | Admin | List products below low-stock threshold |
| **Admin Inventory** | `GET` | `/admin/inventory/out-of-stock` | 🛡️ | Admin | List products with zero stock |
| **Admin Inventory** | `PATCH` | `/admin/inventory/:id` | 🛡️ | Admin | Update inventory stock count |

---

## 📡 Detailed API Documentation

### 1. Authentication APIs

#### `POST /register`
- **Description**: Registers a new user or seller account. Sends an OTP code to customer emails.
- **Authentication**: 🌐 Public
- **Rate Limit**: 5000 req/min (`authLimiter`)
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "user",
  "storeName": "Jane Store (Optional if role === seller)",
  "phone": "+1234567890 (Optional)",
  "businessAddress": "123 Business St (Optional)"
}
```
- **Success Response (201 Created)**:
```json
{
  "message": "Account created. OTP sent to email.",
  "email": "jane@example.com"
}
```
- **Error Responses**: `400 Bad Request` (Validation failure / user exists), `500 Server Error`.

---

#### `POST /verify-otp`
- **Description**: Verifies account email using the 6-digit OTP code received via email.
- **Authentication**: 🌐 Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Email verified successfully"
}
```
- **Error Responses**: `400 Bad Request` (Invalid or expired OTP), `429 Too Many Requests` (Max 3 failed OTP attempts exceeded).

---

#### `POST /login`
- **Description**: Authenticates email and password, resetting failed login counters on success and returning access/refresh tokens.
- **Authentication**: 🌐 Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "sellerStatus": "none"
  }
}
```
- **Error Responses**: `401 Unauthorized` (Invalid credentials / unverified email), `403 Forbidden` (Account temporarily locked due to 5 failed attempts).

---

#### `POST /refresh-token`
- **Description**: Issues a new JWT access token using a valid refresh token.
- **Authentication**: 🌐 Public
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Success Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Responses**: `401 Unauthorized` (Missing refresh token), `403 Forbidden` (Invalid/expired token).

---

#### `POST /forgot-password`
- **Description**: Triggers password reset OTP to email. Employs anti-enumeration response masking.
- **Authentication**: 🌐 Public
- **Request Body**:
```json
{
  "email": "jane@example.com"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "If an account with that email exists, a password reset code has been sent."
}
```
- **Error Responses**: `429 Too Many Requests` (Wait 60s cooldown).

---

#### `POST /reset-password`
- **Description**: Resets password using OTP code received via email.
- **Authentication**: 🌐 Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "654321",
  "newPassword": "NewStrongPassword123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Password reset successful"
}
```
- **Error Responses**: `400 Bad Request` (Invalid/expired OTP code).

---

### 2. Product APIs

#### `GET /products`
- **Description**: Fetches product listings supporting search, filtering, price boundaries, rating thresholds, and pagination.
- **Authentication**: 🌐 Public
- **Rate Limit**: 1000 req/min (`productLimiter`)
- **Query Parameters**:
  - `search` (string): Keyword search on product name/description
  - `category` (string): Filter by category name
  - `brand` (string): Filter by brand name
  - `minPrice` (number): Minimum price cutoff
  - `maxPrice` (number): Maximum price cutoff
  - `rating` (number): Minimum rating cutoff
  - `sort` (string): Sort order (`price_asc`, `price_desc`, `newest`, `rating`)
  - `page` (number, default: `1`): Page number
  - `limit` (number, default: `10`): Items per page
- **Example Request**: `GET {{BASE_URL}}/products?search=wireless&category=Electronics&minPrice=100&page=1`
- **Success Response (200 OK)**:
```json
{
  "products": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Wireless Headphones",
      "price": 199.99,
      "category": "Electronics",
      "brand": "SoundPro",
      "rating": 4.5,
      "numReviews": 12,
      "countInStock": 45,
      "image": "https://res.cloudinary.com/demo/image/upload/v12345/headphones.jpg"
    }
  ],
  "page": 1,
  "pages": 5,
  "total": 48
}
```

---

#### `GET /products/:id`
- **Description**: Retrieves single product details by MongoDB ObjectID.
- **Authentication**: 🌐 Public
- **Success Response (200 OK)**: Product object JSON structure.
- **Error Response**: `404 Not Found`.

---

#### `POST /products/:id/review`
- **Description**: Submits a review and rating for a product.
- **Authentication**: 🔐 Authenticated (`authMiddleware`)
- **Request Body**:
```json
{
  "rating": 5,
  "comment": "Outstanding audio quality and comfortable fit!"
}
```
- **Success Response (201 Created)**: `{ "message": "Review added successfully" }`

---

### 3. Seller Portal APIs

#### `POST /seller/products`
- **Description**: Creates a new product under the authenticated seller's store.
- **Authentication**: 🏪 Approved Seller (`authMiddleware` + `sellerMiddleware`)
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data Fields**:
  - `name` (text, required)
  - `price` (number, required)
  - `description` (text, required)
  - `category` (text, required)
  - `brand` (text, required)
  - `countInStock` (number, required)
  - `image` (file binary, max 5MB image)
- **Success Response (201 Created)**: Created product object.
- **Error Responses**: `401 Unauthorized`, `403 Forbidden` (Seller approval pending), `400 Bad Request`.

---

#### `PUT /seller/orders/:orderId/items/:itemId/status`
- **Description**: Updates fulfillment status for a specific item inside a customer order.
- **Authentication**: 🏪 Approved Seller (`authMiddleware` + `sellerMiddleware`)
- **Request Body**:
```json
{
  "status": "Shipped"
}
```
- **Allowed Statuses**: `"Pending"`, `"Processing"`, `"Shipped"`, `"Delivered"`, `"Cancelled"`
- **Success Response (200 OK)**:
```json
{
  "message": "Order item status updated successfully"
}
```

---

### 4. Admin APIs

#### `GET /admin/dashboard`
- **Description**: Fetches top-level system metrics including total revenue, order count, user count, and top products.
- **Authentication**: 🛡️ Admin (`authMiddleware` + `adminMiddleware`)
- **Rate Limit**: 1000 req/min (`adminLimiter`)
- **Success Response (200 OK)**:
```json
{
  "totalUsers": 1250,
  "totalOrders": 480,
  "totalSales": 94500.50,
  "pendingSellers": 3,
  "topProducts": []
}
```

---

#### `PUT /admin/sellers/:id/approve`
- **Description**: Approves a seller application, updating `sellerStatus` to `"approved"` and role to `"seller"`.
- **Authentication**: 🛡️ Admin (`authMiddleware` + `adminMiddleware`)
- **Success Response (200 OK)**:
```json
{
  "message": "Seller application approved successfully"
}
```

---

### 5. Payment APIs

#### `POST /payment/checkout`
- **Description**: Initializes Razorpay order creation for cart items.
- **Authentication**: 🔐 Authenticated
- **Request Body**:
```json
{
  "amount": 199.99,
  "currency": "INR"
}
```
- **Success Response (200 OK)**:
```json
{
  "id": "order_M123456789",
  "entity": "order",
  "amount": 19999,
  "amount_paid": 0,
  "amount_due": 19999,
  "currency": "INR",
  "receipt": "receipt_1693680000"
}
```

---

#### `POST /payment/verify-payment`
- **Description**: Verifies cryptographic HMAC-SHA256 Razorpay payment signature and creates customer order.
- **Authentication**: 🔐 Authenticated
- **Request Body**:
```json
{
  "razorpay_order_id": "order_M123456789",
  "razorpay_payment_id": "pay_P987654321",
  "razorpay_signature": "9f8e7d6c5b4a3...",
  "shippingAddress": {
    "address": "123 Main St",
    "city": "Metropolis",
    "postalCode": "10001",
    "country": "India"
  }
}
```
- **Success Response (200 OK)**: `{ "message": "Payment verified and order created successfully", "orderId": "..." }`

---

## ❌ Standardized Error Response Model

The API enforces uniform error response structures across all endpoints:

```json
{
  "message": "Human-readable error description",
  "error": "Optional technical error details"
}
```

### Standard HTTP Status Codes

| Status | Name | Meaning |
| :--- | :--- | :--- |
| `400` | Bad Request | Validation error, missing parameters, or invalid payload |
| `401` | Unauthorized | Missing, invalid, or expired JWT token |
| `403` | Forbidden | Insufficient permissions (Non-admin or unapproved seller) |
| `404` | Not Found | Requested resource does not exist |
| `429` | Too Many Requests | Rate limit threshold exceeded |
| `500` | Internal Server Error | Unhandled backend exception |
