const express = require("express");
const router = express.Router();

const {
  createSellerProduct,
  getSellerProducts,
  getSellerProductById,
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
  uploadSellerAvatar,
  uploadSellerCover,
} = require("../Controller/sellerProfileController");
const uploadMemory = require("../MiddleWare/uploadMemory");

const handleSellerUpload = (field) => (req, res, next) => {
  uploadMemory.single(field)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    }
    next();
  });
};


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

router.get(
  "/products/:id",
  authMiddleware,
  sellerMiddleware,
  getSellerProductById
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

router.post(
  "/profile/avatar",
  authMiddleware,
  sellerMiddleware,
  handleSellerUpload("avatar"),
  uploadSellerAvatar
);

router.post(
  "/profile/cover",
  authMiddleware,
  sellerMiddleware,
  handleSellerUpload("coverImage"),
  uploadSellerCover
);

module.exports = router;
