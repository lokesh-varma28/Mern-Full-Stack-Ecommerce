const express = require("express");

const {
    createOrder,
    getAllOrders,
    getSingleOrder,
    cancelOrder,
    downloadInvoice
} = require("../Controller/orderController");

const authMiddleware = require("../MiddleWare/authMiddleware");

const router = express.Router();

router.post("/orders", authMiddleware, createOrder);
router.get("/orders", authMiddleware, getAllOrders);
router.get("/orders/:id", authMiddleware, getSingleOrder);
router.put("/orders/:id/cancel", authMiddleware, cancelOrder);
router.get("/orders/:id/invoice", authMiddleware, downloadInvoice);

module.exports = router;
