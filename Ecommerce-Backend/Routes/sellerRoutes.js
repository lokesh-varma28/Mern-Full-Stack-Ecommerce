const express = require("express");
const router = express.Router();

const {
  createSellerProduct,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../Controller/sellerProductController");

const authMiddleware = require("../MiddleWare/authMiddleware");
const sellerMiddleware = require("../MiddleWare/sellerMiddleware");
const upload = require("../MiddleWare/imageMiddleware");

const {
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerAnalytics,
  getSellerCustomers,
} = require("../Controller/sellerOrderController");

const {
  getSellerProfile,
  updateSellerProfile,
} = require("../Controller/sellerProfileController");

// All seller product routes require authMiddleware + sellerMiddleware
router.post(
  "/products",
  authMiddleware,
  sellerMiddleware,
  upload.single("image"),
  createSellerProduct
);

router.get(
  "/products",
  authMiddleware,
  sellerMiddleware,
  getSellerProducts
);

router.put(
  "/products/:id",
  authMiddleware,
  sellerMiddleware,
  upload.single("image"),
  updateSellerProduct
);

router.delete(
  "/products/:id",
  authMiddleware,
  sellerMiddleware,
  deleteSellerProduct
);

// Seller Order & Analytics Routes
router.get(
  "/orders",
  authMiddleware,
  sellerMiddleware,
  getSellerOrders
);

router.put(
  "/orders/:orderId/items/:itemId/status",
  authMiddleware,
  sellerMiddleware,
  updateSellerOrderItemStatus
);

router.get(
  "/analytics",
  authMiddleware,
  sellerMiddleware,
  getSellerAnalytics
);

router.get(
  "/customers",
  authMiddleware,
  sellerMiddleware,
  getSellerCustomers
);


// Seller Profile Routes
router.get(
  "/profile",
  authMiddleware,
  sellerMiddleware,
  getSellerProfile
);

router.put(
  "/profile",
  authMiddleware,
  sellerMiddleware,
  updateSellerProfile
);

module.exports = router;
