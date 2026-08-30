const Order = require("../Model/orderModel");

const trackOrder = async (req, res) => {

    try {

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            tracking: {
                orderId: order._id,
                status: order.status,
                trackingId: order.trackingId,
                courierName: order.courierName,
                shippingStatus: order.shippingStatus,
                pickupDate: order.pickupDate,
                deliveryDate: order.deliveryDate
            }
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = { trackOrder };