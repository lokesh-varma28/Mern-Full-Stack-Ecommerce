const PDFDocument = require("pdfkit");
const Order = require("../Model/orderModel");

const downloadInvoice = async (req, res) => {
    try {

        const order = await Order.findById(req.params.id)
            .populate("items.product", "title");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const doc = new PDFDocument({
            margin: 40
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${order._id}.pdf`
        );

        doc.pipe(res);

        // Heading

        doc
            .fontSize(24)
            .text("HOME STORE", {
                align: "center"
            });

        doc
            .fontSize(18)
            .text("Invoice", {
                align: "center"
            });

        doc.moveDown();

        // Order Details

        doc.fontSize(13);

        doc.text(`Order ID : ${order._id}`);

        doc.text(`Date : ${new Date(order.createdAt).toLocaleString()}`);

        doc.text(`Status : ${order.status}`);

        doc.text(`Payment Method : ${order.paymentMethod}`);

        doc.text(`Payment Status : ${order.paymentStatus}`);

        doc.text(`Payment ID : ${order.paymentId || "-"}`);

        doc.moveDown();

        // Items

        doc
            .fontSize(18)
            .text("Items");

        doc.moveDown(0.5);

        order.items.forEach((item, index) => {

            doc.fontSize(13).text(
                `${index + 1}. ${item.product?.title || "Product"}`
            );

            doc.text(
                `Quantity : ${item.quantity}`
            );

            doc.text(
                `Price : ₹${item.price}`
            );

            doc.text(
                `Subtotal : ₹${item.price * item.quantity}`
            );

            doc.moveDown();

        });

        // Totals

        doc.moveDown();

        doc.fontSize(14);

        doc.text(
            `Total Amount : ₹${order.totalAmount}`
        );

        doc.text(
            `Discount : ₹${order.discount}`
        );

        doc.text(
            `Final Amount : ₹${order.finalAmount}`
        );

        doc.moveDown(2);

        doc.text(
            "Thank you for shopping with Home Store ❤️",
            {
                align: "center"
            }
        );

        doc.end();

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    downloadInvoice
};