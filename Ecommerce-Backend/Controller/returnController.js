const Return = require("../Model/returnModel");
const Order = require("../Model/orderModel");

// =========================================
// CUSTOMER REQUEST RETURN
// =========================================

const requestReturn = async (req, res) => {

    try {

        const {
            orderId,
            productId,
            reason,
            description
        } = req.body;

        if (!reason) {

            return res.status(400).json({
                message: "Return reason is required"
            });

        }

        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).json({
                message: "Order not found"
            });

        }

        // Order Owner Check

        if (order.userId.toString() !== req.user.userId) {

            return res.status(403).json({
                message: "Unauthorized"
            });

        }

        // Delivered Orders Only

        if (order.status !== "delivered") {

            return res.status(400).json({
                message: "Only Delivered Orders can be returned"
            });

        }

        // Already Requested

        const existingReturn = await Return.findOne({

            order: orderId,

            product: productId

        });

        if (existingReturn) {

            return res.status(400).json({
                message: "Return already requested"
            });

        }

        // 7 Days Return Policy

        if (order.deliveredAt) {

            const days =

                (Date.now() - new Date(order.deliveredAt))

                /

                (1000 * 60 * 60 * 24);

            if (days > 7) {

                return res.status(400).json({
                    message: "Return period expired"
                });

            }

        }

        const request = await Return.create({

            order: orderId,

            product: productId,

            user: req.user.userId,

            reason,

            description

        });

        res.status(201).json({

            success: true,

            message: "Return Request Submitted Successfully",

            request

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// =========================================
// CUSTOMER RETURN HISTORY
// =========================================

const getMyReturns = async (req, res) => {

    try {

        const returns = await Return.find({

            user: req.user.userId

        })

        .populate("product")

        .populate("order")

        .sort({

            createdAt: -1

        });

        res.status(200).json({

            success: true,

            returns

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// =========================================
// ADMIN GET ALL RETURNS
// =========================================

const getReturnRequests = async (req, res) => {

    try {

        const requests = await Return.find()

            .populate("order")

            .populate("product")

            .populate("user", "name email")

            .sort({

                createdAt: -1

            });

        res.status(200).json({

            success: true,

            requests

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// =========================================
// ADMIN UPDATE RETURN
// =========================================

const updateReturnStatus = async (req, res) => {

    try {

        const request = await Return.findById(req.params.id);

        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Return request not found"

            });

        }

        if (req.body.status) {

            request.status = req.body.status;

        }

        if (req.body.adminRemark) {

            request.adminRemark = req.body.adminRemark;

        }

        if (req.body.pickupDate) {

            request.pickupDate = req.body.pickupDate;

        }

        if (req.body.refundStatus) {

            request.refundStatus = req.body.refundStatus;

        }

        if (req.body.refundAmount) {

            request.refundAmount = req.body.refundAmount;

        }

        await request.save();

        res.status(200).json({

            success: true,

            message: "Return Updated Successfully",

            request

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    requestReturn,

    getMyReturns,

    getReturnRequests,

    updateReturnStatus

};