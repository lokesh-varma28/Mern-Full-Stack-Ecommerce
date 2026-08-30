const Order = require("../Model/orderModel");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

// ======================
// GET ALL ORDERS
// ======================

const getAllOrders = async (req, res) => {
    try {

        const userId = req.user.userId;

        const orders = await Order.find({ userId })
            .populate({
                path: "items.product",
                select: "title price image"
            })
            .populate("shippingAddress")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// ======================
// CREATE ORDER
// ======================

const createOrder = async (req, res) => {

    try {

        const userId = req.user.userId;
        const email = req.user.email;

        const {
            paymentId,
            shippingAddress,
            couponCode,
            discount,
            finalAmount
        } = req.body;

        const { createOrderService } = require("../service/orderService");

        const order = await createOrderService({
            userId,
            email,
            paymentId,
            shippingAddress,
            couponCode,
            discount,
            finalAmount
        });

        return res.status(201).json({
            success: true,
            message: "Order Created Successfully",
            order
        });

    } catch (err) {

        console.log("ORDER ERROR =", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ======================
// GET SINGLE ORDER
// ======================

const getSingleOrder = async (req, res) => {

    try {

        const userId = req.user.userId;
        const orderId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {

            return res.status(400).json({
                message: "Invalid Order ID"
            });

        }

        const order = await Order.findOne({
            _id: orderId,
            userId
        }).populate({
            path: "items.product",
            select: "title price image"
        });

        if (!order) {

            return res.status(404).json({
                message: "Order not found"
            });

        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================
// CANCEL ORDER
// ======================

const cancelOrder = async (req, res) => {

    try {

        const userId = req.user.userId;

        const order = await Order.findOne({
            _id: req.params.id,
            userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const nonCancelable = [
            "pickup scheduled",
            "picked up",
            "in transit",
            "destination hub",
            "out for delivery",
            "delivered",
            "cancelled"
        ];

        if (nonCancelable.includes(order.status.toLowerCase())) {
            return res.status(400).json({
                message: "This order cannot be cancelled"
            });
        }

        order.status = "cancelled";
        await order.save();

        return res.json({
            success: true,
            message: "Order Cancelled Successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};

// ======================
// DOWNLOAD INVOICE
// ======================

const downloadInvoice = async (req, res) => {

    try {

        const userId = req.user.userId;

        const order = await Order.findOne({
            _id: req.params.id,
            userId
        }).populate({
            path: "items.product",
            select: "title"
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Invoice-${order._id}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(22).text("HOME STORE", { align: "center" });

        doc.moveDown();

        doc.fontSize(16).text("INVOICE");

        doc.moveDown();

        doc.text(`Invoice ID : ${order._id}`);
        doc.text(`Date       : ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Status     : ${order.status}`);

        doc.moveDown();

        doc.fontSize(18).text("Products");

        doc.moveDown();

        order.items.forEach(item => {

            doc.fontSize(12).text(
                `${item.product.title}\nQuantity : ${item.quantity}\nPrice : ₹${item.price}\nTotal : ₹${item.quantity * item.price}`
            );

            doc.moveDown();

        });

        doc.moveDown();

        doc.fontSize(16).text(`Grand Total : ₹${order.finalAmount}`);

        doc.end();

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

module.exports = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    cancelOrder,
    downloadInvoice
};
