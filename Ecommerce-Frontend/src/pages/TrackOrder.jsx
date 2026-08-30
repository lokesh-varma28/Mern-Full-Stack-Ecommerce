import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { trackOrder } from "../api/trackingApi";

export default function TrackOrder() {

    const { id } = useParams();

    const [tracking, setTracking] = useState(null);

    useEffect(() => {
        loadTracking();
    }, []);

    const loadTracking = async () => {

        try {

            const res = await trackOrder(id);

            setTracking(res.data.tracking);

        } catch (err) {

            console.log(err);

        }

    };

    if (!tracking) {

        return (
            <div className="text-center mt-20 text-2xl font-bold">
                Loading...
            </div>
        );

    }

    const steps = [
        "confirmed",
        "packed",
        "pickup scheduled",
        "picked up",
        "in transit",
        "destination hub",
        "out for delivery",
        "delivered"
    ];

    const currentStep = steps.findIndex(
        s => s.toLowerCase() === tracking.status.toLowerCase()
    );

    return (

        <div className="max-w-5xl mx-auto p-8">

            <h1 className="text-4xl font-bold mb-10 text-center">
                📦 Track Your Order
            </h1>

            <div className="bg-white shadow-lg rounded-xl p-8">

                <div className="grid md:grid-cols-2 gap-6">

                    <div>

                        <h2 className="text-xl font-bold mb-4">
                            Order Details
                        </h2>

                        <p className="mb-3">
                            <b>Order ID:</b> {tracking.orderId}
                        </p>

                        <p className="mb-3">
                            <b>Order Status:</b>

                            <span className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-full">
                                {tracking.status}
                            </span>

                        </p>

                        <p className="mb-3">
                            <b>Courier:</b>

                            {" "}

                            {tracking.courierName || "Not Assigned"}

                        </p>

                        <p className="mb-3">
                            <b>Tracking ID:</b>

                            {" "}

                            {tracking.trackingId || "Not Assigned"}

                        </p>

                    </div>

                    <div>

                        <h2 className="text-xl font-bold mb-4">
                            Shipping Details
                        </h2>

                        <p className="mb-3">
                            <b>Shipping Status:</b>

                            {" "}

                            {tracking.shippingStatus}

                        </p>

                        <p className="mb-3">

                            <b>Pickup Date:</b>

                            {" "}

                            {tracking.pickupDate
                                ? new Date(tracking.pickupDate).toLocaleDateString()
                                : "Not Available"}

                        </p>

                        <p className="mb-3">

                            <b>Expected Delivery:</b>

                            {" "}

                            {tracking.deliveryDate
                                ? new Date(tracking.deliveryDate).toLocaleDateString()
                                : "Not Available"}

                        </p>

                    </div>

                </div>

            </div>

            <div className="bg-white shadow-lg rounded-xl mt-10 p-8">

                <h2 className="text-2xl font-bold mb-8">

                    Shipment Progress

                </h2>

                <div className="space-y-6">

                    {steps.map((step, index) => (

                        <div
                            key={step}
                            className="flex items-center gap-5"
                        >

                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                                ${
                                    index <= currentStep
                                        ? "bg-green-600"
                                        : "bg-gray-300"
                                }`}
                            >

                                ✓

                            </div>

                            <div>

                                <p
                                    className={`font-semibold capitalize
                                    ${
                                        index <= currentStep
                                            ? "text-green-700"
                                            : "text-gray-500"
                                    }`}
                                >

                                    {step}

                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>

    );

}