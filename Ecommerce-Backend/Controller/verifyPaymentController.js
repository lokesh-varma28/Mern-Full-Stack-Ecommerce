const crypto = require("crypto");
const { createOrderService } = require("../service/orderService");
const Order = require("../Model/orderModel");
const razorpay = require("../config/razorpay");

// ==============================
// VERIFY ONLINE PAYMENT
// ==============================

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
            couponCode,
            buyNowProductId
        } = req.body;

        const userId = req.user.userId;
        const email = req.user.email;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment Details Missing"
            });
        }

        // Idempotency check: Return existing order if already processed
        if (razorpay_payment_id) {
            const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id.trim() });
            if (existingOrder) {
                return res.status(200).json({
                    success: true,
                    message: "Payment Verified Successfully",
                    order: existingOrder
                });
            }
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment Verification Failed: Invalid Signature"
            });
        }

        // Fetch Razorpay order details to verify actual paid amount
        let expectedPaidAmount = null;
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            try {
                const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
                if (rzpOrder && rzpOrder.amount) {
                    expectedPaidAmount = rzpOrder.amount;
                }
            } catch (rzpErr) {
                console.error("Razorpay order fetch warning:", rzpErr.message);
            }
        }

        console.log("VERIFY PAYMENT CALLED for order:", razorpay_order_id);

        const order = await createOrderService({
            userId,
            email,
            paymentId: razorpay_payment_id,
            paymentMethod: "ONLINE",
            shippingAddress,
            couponCode,
            buyNowProductId,
            expectedPaidAmount
        });

        console.log("ORDER CREATED =", order._id || order);

        return res.status(200).json({
            success: true,
            message: "Payment Verified Successfully",
            order
        });

    } catch (err) {
        console.error("Verify payment error:", err.message);

        return res.status(500).json({
            success: false,
            message: err.message || "Payment verification failed"
        });
    }
};


// ==============================
// CASH ON DELIVERY ORDER
// ==============================

const placeCodOrder = async (req, res) => {

    try {

        const {
            shippingAddress,
            couponCode,
            discount,
            finalAmount,
            buyNowProductId
        } = req.body;

        const userId = req.user.userId;
        const email = req.user.email;

        const order = await createOrderService({

            userId,
            email,

            paymentId: "",

            paymentMethod: "COD",

            shippingAddress,

            couponCode,

            discount,

            finalAmount,
            
            buyNowProductId

        });

        return res.status(201).json({

            success: true,

            message: "Cash On Delivery Order Placed Successfully",

            order

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {
    verifyPayment,
    placeCodOrder
};