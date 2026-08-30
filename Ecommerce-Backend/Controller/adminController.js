const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const sendEmail = require("../helper/sendEmail");
const { uploadToCloudinary } = require("../helper/cloudinaryhelper");

// ======================
// DASHBOARD
// ======================

const dashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalCoupons = await Coupon.countDocuments();

        const revenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$finalAmount" }
                }
            }
        ]);

        const pendingOrders = await Order.countDocuments({ status: "pending" });
        const confirmedOrders = await Order.countDocuments({ status: "confirmed" });
        const inTransitOrders = await Order.countDocuments({ status: "in transit" });
        const deliveredOrders = await Order.countDocuments({ status: "delivered" });

        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalCoupons,
            totalRevenue: revenue.length ? revenue[0].total : 0,
            pendingOrders,
            confirmedOrders,
            inTransitOrders,
            deliveredOrders
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// GET ALL USERS
// ======================

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password -refreshToken");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ======================
// GET ALL ORDERS
// ======================

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("userId", "name email");

        res.json(orders);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// GET ALL PRODUCTS
// ======================

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// UPDATE ORDER STATUS
// ======================

const updateOrderStatus = async (req, res) => {
    try {

        const { status } = req.body;

        // Matches the enum values in orderModel exactly
        const allowedStatus = [
            "pending",
            "confirmed",
            "packed",
            "pickup scheduled",
            "picked up",
            "in transit",
            "destination hub",
            "out for delivery",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatus.includes(status.toLowerCase())) {

            return res.status(400).json({
                message: "Invalid Status"
            });

        }

        const order = await Order.findById(req.params.id)
            .populate("userId", "name email");

        if (!order) {

            return res.status(404).json({
                message: "Order Not Found"
            });

        }

        order.status = status.toLowerCase();

        if (status.toLowerCase() === "delivered") {
            order.deliveredAt = new Date();
        }

        await order.save();

        // Send Email
        if (order.userId?.email) {

            await sendEmail(
                order.userId.email,
                `Your Order is ${status}`,
                `
                <h2>Hello ${order.userId.name},</h2>

                <p>Your order status has been updated.</p>

                <h3>Order ID</h3>
                <p>${order._id}</p>

                <h3>New Status</h3>
                <p style="font-size:18px;color:green;">
                    <b>${status}</b>
                </p>

                <br/>

                <p>Thank you for shopping with us ❤️</p>
                `
            );

        }

        res.json({
            success: true,
            message: "Order Status Updated Successfully",
            order
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }
};

// ======================
// ADD PRODUCT
// ======================

const addProduct = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please select an image"
            });

        }

        const {
            title,
            description,
            price,
            stock,
            category,
            brand,
            discount,
            featured
        } = req.body;

        // Upload image to Cloudinary instead of using a hardcoded localhost URL
        const { url, publicId } = await uploadToCloudinary(req.file.path);

        const product = await Product.create({
            title,
            description,
            price,
            stock,
            category,
            brand,
            discount,
            featured,
            image: {
                url,
                publicId
            }
        });

        return res.status(201).json({
            success: true,
            message: "Product Added Successfully",
            product
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ======================
// UPDATE PRODUCT
// ======================

const updateProduct = async (req, res) => {
    try {

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            });
        }

        res.json({
            message: "Product Updated",
            product
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// DELETE PRODUCT
// ======================

const deleteProduct = async (req, res) => {

    try {

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            });
        }

        res.json({
            message: "Product Deleted Successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// GET ALL COUPONS
// ======================

const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// ======================
// SALES ANALYTICS
// ======================

const getSalesAnalytics = async (req, res) => {

    try {

        const sales = await Order.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$finalAmount" },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            }
        ]);

        res.json(sales);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ======================
// TOP SELLING PRODUCTS
// ======================

const getTopProducts = async (req, res) => {

    try {

        const topProducts = await Order.aggregate([

            { $unwind: "$items" },

            {
                $group: {
                    _id: "$items.product",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: {
                        $sum: {
                            $multiply: ["$items.quantity", "$items.price"]
                        }
                    }
                }
            },

            { $sort: { totalSold: -1 } },

            { $limit: 5 },

            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },

            { $unwind: "$product" },

            {
                $project: {
                    _id: 1,
                    title: "$product.title",
                    image: "$product.image",
                    totalSold: 1,
                    revenue: 1
                }
            }

        ]);

        res.json(topProducts);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ======================
// DELETE USER
// ======================

const deleteUser = async (req, res) => {

    try {

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {

            return res.status(404).json({
                message: "User Not Found"
            });

        }

        res.json({
            success: true,
            message: "User Deleted Successfully"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ======================
// ASSIGN TRACKING
// ======================

const assignTracking = async (req, res) => {

    try {

        const {
            courierName,
            trackingId,
            shippingStatus,
            pickupDate,
            deliveryDate
        } = req.body;

        const order = await Order.findById(req.params.id)
            .populate("userId", "name email");

        if (!order) {
            return res.status(404).json({
                message: "Order Not Found"
            });
        }

        order.courierName = courierName;
        order.trackingId = trackingId;
        order.shippingStatus = shippingStatus;
        order.pickupDate = pickupDate;
        order.deliveryDate = deliveryDate;

        if (shippingStatus) {
            order.status = shippingStatus.toLowerCase();
        }

        if (shippingStatus?.toLowerCase() === "delivered") {
            order.deliveredAt = new Date();
        }

        await order.save();

        if (order.userId?.email) {

            await sendEmail(
                order.userId.email,
                `Your Order is ${shippingStatus}`,
                `
                <h2>Hello ${order.userId.name}</h2>

                <p>Your shipment has been updated.</p>

                <p><b>Courier :</b> ${courierName}</p>

                <p><b>Tracking ID :</b> ${trackingId}</p>

                <p><b>Status :</b> ${shippingStatus}</p>
                `
            );

        }

        res.json({
            success: true,
            message: "Tracking Updated Successfully",
            order
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

module.exports = {
    dashboard,
    getUsers,
    getOrders,
    getProducts,
    getCoupons,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    deleteUser,
    getSalesAnalytics,
    getTopProducts,
    assignTracking
};
