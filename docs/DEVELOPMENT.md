# HomeStore — Local Development Guide

This guide provides instructions for setting up, configuring, and running the **HomeStore — MERN Full-Stack Ecommerce Platform** in a local development environment.

---

## 📋 1. Prerequisites

Ensure your workstation has the following software installed:

- **Node.js**: `v18.0.0` or higher (`node -v`)
- **npm**: `v9.0.0` or higher (`npm -v`)
- **Git**: Installed (`git --version`)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas cloud connection URI.
- **Redis**: Local Redis server (`redis://localhost:6379`) or Redis Cloud instance.

---

## 📁 2. Repository Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/lokesh-varma28/Mern-Full-Stack-Ecommerce.git
cd Mern-Full-Stack-Ecommerce
```

---

## ⚙️ 3. Component Setup & Startup Commands

HomeStore consists of three independent Node applications. You will need 3 terminal windows to run them concurrently.

### A. Backend API Server (`Ecommerce-Backend`)

1. Navigate to the backend directory:
```bash
cd Ecommerce-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file inside `Ecommerce-Backend/`:
```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/homestore
JWT_TOKEN=your_local_jwt_secret_key_123
REFRESH_TOKEN_SECRET=your_local_refresh_token_secret_456

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

4. Start the backend server:
```bash
npm start
```
*The server will start on `http://localhost:3000`.*

---

### B. Customer Storefront App (`Ecommerce-Frontend`)

1. Open a new terminal window and navigate to the customer frontend directory:
```bash
cd Ecommerce-Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file inside `Ecommerce-Frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

4. Launch Vite development server:
```bash
npm run dev
```
*The customer storefront will open at `http://localhost:5173`.*

---

### C. Seller Portal App (`seller-frontend`)

1. Open a third terminal window and navigate to the seller frontend directory:
```bash
cd seller-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file inside `seller-frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

4. Launch Vite development server:
```bash
npm run dev
```
*The seller portal will open at `http://localhost:5174` (or `http://localhost:5173` if running separately).*

---

## 🛠️ 4. Package Scripts Summary

| Application | Path | Dev Script | Production Build | Start Script |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `Ecommerce-Backend/` | `npm run dev` (Nodemon) | N/A | `npm start` |
| **Customer Store** | `Ecommerce-Frontend/` | `npm run dev` | `npm run build` | `npm run preview` |
| **Seller Portal** | `seller-frontend/` | `npm run dev` | `npm run build` | `npm run preview` |

---

## ❓ 5. Local Development Troubleshooting

### Issue 1: Redis Connection Failed
- **Symptom**: Console logs `Redis connection failed` or `Redis rate limiter warning (failing open)`.
- **Solution**: Ensure your Redis instance is running locally (`redis-server`) or update `REDIS_URL` in `Ecommerce-Backend/.env` to a valid Redis Cloud URI. The application will fail open for rate limiting if Redis is unavailable, allowing basic development to continue.

### Issue 2: CORS Blocked
- **Symptom**: Browser console error: `Not allowed by CORS`.
- **Solution**: Confirm that your local frontend origin (e.g. `http://localhost:5173` or `http://localhost:5174`) is included in `allowedOrigins` in `Ecommerce-Backend/Index.js`.

### Issue 3: Google OAuth Popup Closed / COOP Error
- **Symptom**: Google OAuth popup window closes unexpectedly or fails to pass tokens back.
- **Solution**: Ensure `crossOriginOpenerPolicy` is set to `{ policy: "unsafe-none" }` in Helmet middleware inside `Index.js` and that your local origin is registered in your Google Cloud Console Authorized JavaScript Origins.
