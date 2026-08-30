
const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");

const {
    getCart,
    addToCart,
    decreaseCartQuantity,
    removeCartItem
} = require("../Controller/cartController");

// Get Cart
router.get("/cart", authMiddleware, getCart);

// Add Item
router.post("/cart", authMiddleware, addToCart);

// Decrease Quantity
router.put("/cart/decrease", authMiddleware, decreaseCartQuantity);

// Remove Item
router.delete("/cart", authMiddleware, removeCartItem);

module.exports = router;