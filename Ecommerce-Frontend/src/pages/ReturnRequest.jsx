import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestReturn } from "../api/returnApi";

export default function ReturnRequest() {

    const navigate = useNavigate();

    const { state } = useLocation();

    const order = state?.order;

    const product = state?.product;

    const [reason, setReason] = useState("");

    const [description, setDescription] = useState("");

    const submitReturn = async () => {

        if (!reason) {

            return alert("Please select return reason");

        }

        try {

            await requestReturn({

                orderId: order._id,

                productId: product._id,

                reason,

                description

            });

            alert("Return Request Submitted Successfully");

            navigate("/orders");

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Failed"

            );

        }

    };

    if (!order || !product) {

        return (

            <h2 className="text-center text-2xl mt-20">

                Invalid Return Request

            </h2>

        );

    }

    return (

        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-8">

            <h1 className="text-3xl font-bold mb-8">

                Return Product

            </h1>

            <div className="flex gap-6 border rounded-lg p-5">

                <img
                    src={product.image?.url}
                    alt={product.title}
                    className="w-32 h-32 object-cover rounded"
                />

                <div>

                    <h2 className="font-bold text-xl">

                        {product.title}

                    </h2>

                    <p className="text-red-600 text-lg mt-2">

                        ₹ {product.price}

                    </p>

                </div>

            </div>

            <div className="mt-8">

                <label className="font-semibold">

                    Return Reason

                </label>

                <select

                    value={reason}

                    onChange={(e) => setReason(e.target.value)}

                    className="border w-full p-3 rounded mt-2"

                >

                    <option value="">

                        Select Reason

                    </option>

                    <option>

                        Wrong Product

                    </option>

                    <option>

                        Damaged Product

                    </option>

                    <option>

                        Missing Parts

                    </option>

                    <option>

                        Quality Issue

                    </option>

                    <option>

                        Changed Mind

                    </option>

                </select>

            </div>

            <div className="mt-6">

                <label className="font-semibold">

                    Description

                </label>

                <textarea

                    rows="5"

                    value={description}

                    onChange={(e) =>

                        setDescription(e.target.value)

                    }

                    className="border w-full p-3 rounded mt-2"

                    placeholder="Explain the issue..."

                />

            </div>

            <button

                onClick={submitReturn}

                className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg"

            >

                Submit Return Request

            </button>

        </div>

    );

}