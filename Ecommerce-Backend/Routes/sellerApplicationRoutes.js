const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");
const {
  applySeller,
  getSellerApplication,
} = require("../Controller/sellerApplicationController");

// Customer seller onboarding routes
router.post("/apply", authMiddleware, applySeller);
router.get("/application", authMiddleware, getSellerApplication);

module.exports = router;
