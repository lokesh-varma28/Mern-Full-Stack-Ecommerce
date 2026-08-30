var Order = require("../Model/orderModel")

exports.addTracking = async (req, res) => {
    try {
        const { orderId, trackingId, courierName } = req.body

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        order.trackingId = trackingId
        order.courierName = courierName
        order.status = "shipped"

        await order.save()

        res.json({
            message: "Shipping updated",
            order
        })

    } catch (error) {
        res.status(500).json({ message: "error", error })
    }
}