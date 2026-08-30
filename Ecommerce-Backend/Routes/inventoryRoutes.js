const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");
const adminMiddleware = require("../MiddleWare/adminMiddleware");

const {
    getInventory,
    getLowStockProducts,
    getOutOfStockProducts,
    updateStock
} = require("../Controller/inventoryController");

// Get all inventory
router.get(
    "/inventory",
    authMiddleware,
    adminMiddleware,
    getInventory
);

// Get low stock products
router.get(
    "/inventory/low-stock",
    authMiddleware,
    adminMiddleware,
    getLowStockProducts
);

// Get out of stock products
router.get(
    "/inventory/out-of-stock",
    authMiddleware,
    adminMiddleware,
    getOutOfStockProducts
);

// Update stock
router.patch(
    "/inventory/:id",
    authMiddleware,
    adminMiddleware,
    updateStock
);

module.exports = router;