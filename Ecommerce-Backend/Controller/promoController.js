var Coupon = require("../Model/couponModel")

exports.applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body
        const userId = req.user.userId

        const coupon = await Coupon.findOne({ code })

        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon" })
        }

        if (coupon.expiry < new Date()) {
            return res.status(400).json({ message: "Coupon expired" })
        }

        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: "Already used coupon" })
        }

        if (cartTotal < coupon.minCartValue) {
            return res.status(400).json({ message: "Min cart value not met" })
        }

        let discount = 0

        if (coupon.discountType === "percentage") {
            discount = (cartTotal * coupon.value) / 100
        } else {
            discount = coupon.value
        }

        if (discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount
        }

        const finalAmount = cartTotal - discount

        res.json({
            cartTotal,
            discount,
            finalAmount
        })

    } catch (error) {
        res.status(500).json({ message: "error", error })
    }
}