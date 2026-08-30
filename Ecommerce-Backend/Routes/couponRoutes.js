
const express = require("express")

const router = express.Router()

const authMiddleware = require("../MiddleWare/authMiddleware")
const adminMiddleware = require("../MiddleWare/adminMiddleware")

const {
    createCoupon,
    getCoupons,
    applyCoupon,
    updateCoupon,
    deleteCoupon
} = require("../Controller/couponController")

// USER
router.post("/coupon/apply", authMiddleware, applyCoupon)
router.get("/", getCoupons);

router.put("/:id", updateCoupon);

router.delete("/:id", deleteCoupon);

// ADMIN
router.post("/coupon", authMiddleware, adminMiddleware, createCoupon)
router.get("/coupon", authMiddleware, adminMiddleware, getCoupons)
router.put("/coupon/:id", authMiddleware, adminMiddleware, updateCoupon)
router.delete("/coupon/:id", authMiddleware, adminMiddleware, deleteCoupon)

module.exports = router