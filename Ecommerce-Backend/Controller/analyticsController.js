const Order = require("../Model/orderModel");
const Product = require("../Model/ProductModel");
const User = require("../Model/UserModel");

const dashboardAnalytics = async (req, res) => {
    try {

        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        const revenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$finalAmount"
                    }
                }
            }
        ]);

        const monthlySales = await Order.aggregate([
            {
                $group: {
                    _id: {
                        month: {
                            $month: "$createdAt"
                        }
                    },
                    sales: {
                        $sum: "$finalAmount"
                    },
                    orders: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            }
        ]);

        const topProducts = await Product.find()
            .sort({
                numReviews: -1,
                averageRating: -1
            })
            .limit(10);

        const recentOrders = await Order.find()
            .sort({
                createdAt: -1
            })
            .limit(10);

        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: revenue.length ? revenue[0].totalRevenue : 0,
            monthlySales,
            topProducts,
            recentOrders
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    dashboardAnalytics
};