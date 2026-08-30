const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");
const adminMiddleware = require("../MiddleWare/adminMiddleware");


const upload = require("../MiddleWare/imageMiddleware");
const {

dashboard,

getUsers,

getOrders,

getProducts,

getCoupons,

addProduct,

updateProduct,

deleteProduct,

updateOrderStatus,

deleteUser,

getSalesAnalytics,

getTopProducts,
 assignTracking } = require("../Controller/adminController");
// ===============================
// Protect All Admin Routes
// ===============================

router.use(authMiddleware);
router.use(adminMiddleware);

// ===============================
// Dashboard
// ===============================

router.get("/dashboard", dashboard);

// ===============================
// Sales Analytics
// ===============================

router.get("/sales", getSalesAnalytics);

// ===============================
// Top Selling Products
// ===============================

router.get("/top-products", getTopProducts);

// ===============================
// Users
// ===============================

router.get("/users", getUsers);
router.delete("/user/:id", deleteUser);

// Orders

router.get("/orders", getOrders);

router.put("/order/:id/status", updateOrderStatus);

// Assign Courier / Tracking

router.put("/order/:id/tracking", assignTracking);

// ===============================
// Products
// ===============================

router.get("/products", getProducts);

router.post( "/product", upload.single("image"), addProduct);

// router.put("/product/:id", updateProduct);

router.put( "/product/:id", upload.single("image"), updateProduct);

router.delete("/product/:id", deleteProduct);

const {
  getAdminSellers,
  approveSeller,
  rejectSeller,
} = require("../Controller/sellerApplicationController");

// ===============================
// Sellers Management
// ===============================

router.get("/sellers", getAdminSellers);
router.put("/sellers/:id/approve", approveSeller);
router.put("/sellers/:id/reject", rejectSeller);

// ===============================
// Coupons
// ===============================

router.get("/coupons", getCoupons);

module.exports = router;