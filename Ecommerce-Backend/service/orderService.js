const mongoose = require("mongoose");

const Cart = require("../Model/cartModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");

const sendEmail = require("../helper/sendEmail");

const createOrderService = async ({
    userId,
    email,
    paymentId = "",
    paymentMethod = "COD",
    shippingAddress,
    couponCode = "",
    buyNowProductId = null,
    expectedPaidAmount = null
}) => {
    // ===========================
    // IDEMPOTENCY CHECK
    // ===========================
    if (paymentId && paymentId.trim()) {
        const existingOrder = await Order.findOne({ paymentId: paymentId.trim() });
        if (existingOrder) {
            return existingOrder;
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let items = [];
        let total = 0;

        // ===========================
        // BUY NOW
        // ===========================
        if (buyNowProductId) {
            const product = await Product.findById(buyNowProductId).session(session);

            if (!product) {
                throw new Error("Product Not Found");
            }

            if (product.stock < 1) {
                throw new Error("Product Out Of Stock");
            }

            product.stock -= 1;
            await product.save({ session });

            items.push({
                product: product._id,
                quantity: 1,
                price: product.price,
                seller: product.seller,
                itemStatus: "pending"
            });

            total = product.price;
        }

        // ===========================
        // CART CHECKOUT
        // ===========================
        else {
            const cart = await Cart.findOne({
                user: userId
            }).session(session);

            if (!cart || !cart.items || cart.items.length === 0) {
                throw new Error("Cart Is Empty");
            }

            for (const item of cart.items) {
                if (!item.product) continue;

                const product = await Product.findById(item.product).session(session);

                if (!product) {
                    throw new Error("Product Not Found");
                }

                if (product.stock < item.quantity) {
                    throw new Error(`${product.title} is Out Of Stock`);
                }

                product.stock -= item.quantity;
                await product.save({ session });

                items.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    seller: product.seller,
                    itemStatus: "pending"
                });

                total += product.price * item.quantity;
            }
        }

        // ===========================
        // SERVER-SIDE COUPON & DISCOUNT VALIDATION
        // ===========================
        let calculatedDiscount = 0;
        let validCouponCode = "";

        if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
            const cleanCode = couponCode.trim().toUpperCase();
            const coupon = await Coupon.findOne({
                code: cleanCode,
                active: true
            }).session(session);

            if (coupon) {
                const now = new Date();
                const isNotExpired = !coupon.expiry || new Date(coupon.expiry) >= now;
                const isWithinLimit = coupon.usedCount < coupon.usageLimit;
                const meetsMinAmount = total >= (coupon.minimumAmount || 0);

                if (isNotExpired && isWithinLimit && meetsMinAmount) {
                    validCouponCode = cleanCode;
                    if (coupon.discountType === "flat") {
                        calculatedDiscount = coupon.discountValue;
                    } else if (coupon.discountType === "percentage") {
                        calculatedDiscount = (total * coupon.discountValue) / 100;
                        if (coupon.maximumDiscount > 0 && calculatedDiscount > coupon.maximumDiscount) {
                            calculatedDiscount = coupon.maximumDiscount;
                        }
                    }
                }
            }
        }

        let finalTotal = Math.max(0, total - calculatedDiscount);

        // ===========================
        // RAZORPAY PAID AMOUNT VERIFICATION
        // ===========================
        if (expectedPaidAmount !== null && expectedPaidAmount !== undefined) {
            const expectedPaise = Math.round(finalTotal * 100);
            if (expectedPaidAmount !== expectedPaise) {
                console.error(
                    `[SECURITY ALARM] Payment amount mismatch: Razorpay paid = ${expectedPaidAmount} paise, Expected = ${expectedPaise} paise`
                );
                throw new Error("Payment verification failed: Paid amount does not match server order total");
            }
        }

        // ===========================
        // CREATE ORDER
        // ===========================
        const order = await Order.create([{
            userId,
            items,
            totalAmount: total,
            couponCode: validCouponCode,
            discount: calculatedDiscount,
            finalAmount: finalTotal,
            paymentId,
            paymentMethod,
            paymentStatus:
                paymentMethod === "ONLINE"
                    ? "Paid"
                    : "Pending",
            shippingAddress,
            status: "confirmed"
        }], { session });

        // ===========================
        // UPDATE COUPON USAGE
        // ===========================
        if (validCouponCode) {
            await Coupon.findOneAndUpdate(
                { code: validCouponCode },
                { $inc: { usedCount: 1 } },
                { session }
            );
        }

        // ===========================
        // CLEAR CART
        // ===========================
        if (!buyNowProductId) {
            await Cart.findOneAndUpdate(
                { user: userId },
                { $set: { items: [] } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        // ===========================
        // SEND EMAIL (NON-BLOCKING)
        // ===========================
        if (email) {
            sendEmail(
                email,
                "Order Confirmed",
                `
                <h2>Order Confirmed ✅</h2>
                <p><b>Order ID:</b> ${order[0]._id}</p>
                <p><b>Total:</b> ₹${order[0].finalAmount}</p>
                <p><b>Payment:</b> ${order[0].paymentMethod}</p>
                <p><b>Status:</b> ${order[0].status}</p>
                <br/>
                <h3>Thank you for shopping ❤️</h3>
                `
            ).catch((err) => {
                console.error("Order confirmation email failed to send:", err.message || err);
            });
        }

        return order[0];

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

module.exports = {
    createOrderService
};