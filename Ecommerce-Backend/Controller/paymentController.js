var Cart = require("../Model/cartModel")
var Product = require("../Model/ProductModel")
var razorpay = require("../config/razorpay")
var mongoose = require("mongoose")

var checkout = async (req, res) => {
    // Guard: fail fast if Razorpay credentials are missing
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
            error: "Payment gateway not configured. RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing on the server."
        })
    }
    console.log("RAZORPAY INSTANCE:", razorpay);
    try {
        var userId = req.user.userId

        // Support Buy Now flow — productId sent in request body
        var { buyNowProductId } = req.body

        var totalAmount = 0

        if (buyNowProductId) {
            // ── Buy Now: price from single product ──────────────────────────
            if (!mongoose.Types.ObjectId.isValid(buyNowProductId)) {
                return res.status(400).json({ message: "Invalid buyNowProductId" })
            }

            const product = await Product.findById(buyNowProductId)

            if (!product) {
                return res.status(404).json({ message: "Product not found" })
            }

            if (product.stock < 1) {
                return res.status(400).json({ message: "Product is out of stock" })
            }

            totalAmount = product.price

        } else {
            // ── Cart checkout: price from cart items ────────────────────────
            var cart = await Cart.findOne({ user: userId })

            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({ message: "cart empty" })
            }

            console.log("CART FOUND:", cart)

            var productIds = cart.items
                .map(item => item.product)
                .filter(id => mongoose.Types.ObjectId.isValid(id))

            if (productIds.length === 0) {
                return res.status(400).json({
                    message: "cart has invalid productId(s); please clear cart and add valid products"
                })
            }

            var products = await Product.find({ _id: { $in: productIds } })

            var productById = new Map(products.map(p => [p._id.toString(), p]))
            var missingProductIds = []

            for (let item of cart.items) {
                if (!mongoose.Types.ObjectId.isValid(item.product)) continue

                var product = productById.get(item.product.toString())
                if (!product) {
                    missingProductIds.push(item.product.toString())
                    continue
                }
                totalAmount += product.price * item.quantity
            }

            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    message: "some cart products no longer exist; remove them from cart",
                    missingProductIds
                })
            }
        }

        console.log("Total Amount:", totalAmount)

        if (totalAmount <= 0) {
            return res.status(400).json({ message: "invalid amount" })
        }

        var order = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: { userId }
        })

        console.log("ORDER CREATED:", order)

        res.status(200).json({
            message: "checkout created",
            order,
            totalAmount
        })

    } catch (error) {
        console.log("FULL ERROR:", error)

        // Razorpay API errors come back as objects with a nested error field
        const razorpayMsg =
            error?.error?.description ||
            error?.error?.reason ||
            error?.message ||
            "server error"

        return res.status(500).json({
            error: razorpayMsg,
            // Only expose details in non-production for easier debugging
            details: process.env.NODE_ENV !== "production" ? error : undefined
        })
    }
}

module.exports = { checkout }
