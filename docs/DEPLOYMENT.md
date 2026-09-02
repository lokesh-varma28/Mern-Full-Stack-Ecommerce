# HomeStore — Production Deployment Guide

This document provides step-by-step instructions for deploying the **HomeStore — MERN Full-Stack Ecommerce Platform** across cloud hosting services including **Render** (Backend API), **Vercel** (Customer & Seller Frontends), **MongoDB Atlas** (Database), **Redis Cloud** (Rate Limiting), and **Cloudinary** (Media Storage).

---

## 🌐 Production Architecture & Live URLs

| Component | Target Platform | Live Production URL | Build Command |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render | `https://mern-full-stack-ecommerce-cwb9.onrender.com` | `npm install` |
| **Customer Storefront** | Vercel | `https://mern-full-stack-ecommerce-78493uezw-lokesh-varma28s-projects.vercel.app` | `npm run build` |
| **Seller Portal** | Vercel | `https://mern-full-stack-ecommerce-jhtr.vercel.app` | `npm run build` |
| **Database** | MongoDB Atlas | Cluster Replica Set | N/A |
| **Caching** | Redis Cloud | Managed Redis Service | N/A |

---

## 🔑 Environment Variables Manifest

> [!IMPORTANT]
> Never commit actual values or secret credentials to version control. Maintain secure environment variables within hosting platform management dashboards.

### 1. Backend Environment Variables (`Ecommerce-Backend`)

| Variable Name | Required | Description / Purpose |
| :--- | :---: | :--- |
| `PORT` | Yes | Port for Express server (e.g., `3000` or assigned by Render) |
| `MONGO_URL` | Yes | MongoDB Atlas connection string URI |
| `JWT_TOKEN` | Yes | Cryptographic secret key for signing JWT Access Tokens |
| `REFRESH_TOKEN_SECRET` | Yes | Cryptographic secret key for signing Refresh Tokens |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud account name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API Secret |
| `EMAIL` | Yes | SMTP sender email address for Nodemailer |
| `EMAIL_PASSWORD` | Yes | SMTP app password or credential |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API Key Secret |
| `REDIS_URL` | Yes | Redis Cloud connection URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `FRONTEND_URL` | Optional | Custom production customer frontend origin |
| `SELLER_FRONTEND_URL` | Optional | Custom production seller frontend origin |

### 2. Customer Frontend Environment Variables (`Ecommerce-Frontend`)

| Variable Name | Required | Description / Purpose |
| :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Yes | Production backend URL (`https://mern-full-stack-ecommerce-cwb9.onrender.com`) |
| `VITE_RAZORPAY_KEY_ID` | Yes | Public Razorpay Key ID |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |

### 3. Seller Frontend Environment Variables (`seller-frontend`)

| Variable Name | Required | Description / Purpose |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | Production backend URL (`https://mern-full-stack-ecommerce-cwb9.onrender.com`) |

---

## ⚙️ Backend Deployment (Render)

1. Connect your GitHub repository (`lokesh-varma28/Mern-Full-Stack-Ecommerce`) to Render.
2. Select **Web Service** creation.
3. Set the **Root Directory**: `Ecommerce-Backend`.
4. Configure Build and Start Commands:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node Index.js`
5. Configure Environment Variables in Render Dashboard matching the Backend Manifest above.
6. Set `trust proxy` setting is active (handled automatically in `Index.js`: `app.set("trust proxy", 1)`).

---

## 💻 Frontend Deployments (Vercel)

### Customer Frontend Setup
1. Create a new Vercel project pointing to directory `Ecommerce-Frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variables (`VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_GOOGLE_CLIENT_ID`).
6. Deploy.

### Seller Frontend Setup
1. Create a second Vercel project pointing to directory `seller-frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variable (`VITE_API_URL`).
6. Deploy.

### SPA Routing Rewrite Rules (`vercel.json`)
Both frontends include `vercel.json` to handle client-side Single Page Application (SPA) routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🛡️ Production CORS Policy

The production API enforces origin verification in `Index.js`:

```javascript
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:4173",
    "https://mern-full-stack-ecommerce-78493uezw-lokesh-varma28s-projects.vercel.app",
    "https://front-end-ecommerce-2ksnr5kid-lokesh-varma28s-projects.vercel.app",
    "https://front-end-ecommerce-fnrc-gconx3kdb-lokesh-varma28s-projects.vercel.app",
    "https://front-end-ecommerce-l6vn.vercel.app",
    process.env.FRONTEND_URL,
    process.env.SELLER_FRONTEND_URL
].filter(Boolean);

const vercelOriginRegex = /^https:\/\/(mern-full-stack-ecommerce|front-end-ecommerce).*\.vercel\.app$/;
```

---

## 🧪 Production Verification & Smoke Testing

Perform the following smoke tests following deployment:

### 1. API Health Check
```bash
curl -i https://mern-full-stack-ecommerce-cwb9.onrender.com/
```
**Expected Response (200 OK)**:
```json
{
  "message": "API running"
}
```

### 2. Google OAuth Route Ping
```bash
curl -i https://mern-full-stack-ecommerce-cwb9.onrender.com/auth/google/ping
```
**Expected Response (200 OK)**:
```json
{
  "status": "ok",
  "route": "POST /auth/google  →  Google OAuth endpoint is live",
  "configured": "✅ GOOGLE_CLIENT_ID is set"
}
```

### 3. Product Catalog Fetch
```bash
curl -i https://mern-full-stack-ecommerce-cwb9.onrender.com/products?limit=1
```
**Expected Response (200 OK)**: JSON array of products with pagination headers.
