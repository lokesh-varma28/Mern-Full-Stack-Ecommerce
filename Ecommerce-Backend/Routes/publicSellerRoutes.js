const express = require("express");
const router = express.Router();

const {
  getPublicSeller,
  getPublicSellerProducts,
} = require("../Controller/publicSellerController");

// Public Customer-Facing Routes (No seller authentication required)
router.get("/:sellerId", getPublicSeller);
router.get("/:sellerId/products", getPublicSellerProducts);

module.exports = router;
