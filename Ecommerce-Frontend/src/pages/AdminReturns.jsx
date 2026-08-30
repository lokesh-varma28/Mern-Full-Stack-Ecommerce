import { useEffect, useState } from "react";
import {
    getAllReturns,
    updateReturnStatus
} from "../api/returnApi";

export default function AdminReturns() {

    const [returns, setReturns] = useState([]);

    useEffect(() => {
        loadReturns();
    }, []);

    const loadReturns = async () => {

        try {

            const res = await getAllReturns();

            setReturns(res.data.requests);

        }

        catch (err) {

            console.log(err);

        }

    };

    const updateStatus = async (id, status) => {

        try {

            await updateReturnStatus(id, status);

            alert("Return Status Updated");

            loadReturns();

        }

        catch (err) {

            console.log(err);

            alert("Update Failed");

        }

    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">
                    ↩ Return Requests
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage customer return applications and refund statuses.
                </p>
            </div>

            {

                returns.length === 0 ?

                (

                    <div className="bg-white rounded-xl shadow p-10 text-center">

                        No Return Requests

                    </div>

                )

                :

                returns.map(item => (

                    <div
                        key={item._id}
                        className="bg-white shadow rounded-xl p-6 mb-6"
                    >

                        <div className="flex justify-between">

                            <div>

                                <h2 className="text-xl font-bold">

                                    {item.user?.name}

                                </h2>

                                <p>

                                    {item.user?.email}

                                </p>

                                <p className="mt-2">

                                    Order :
                                    {" "}
                                    {item.order?._id?.slice(-8)}

                                </p>

                                <p>

                                    Product :
                                    {" "}
                                    {item.product?.title}

                                </p>

                                <p className="mt-2">

                                    <b>Reason :</b>
                                    {" "}
                                    {item.reason}

                                </p>

                                <p>

                                    <b>Description :</b>
                                    {" "}
                                    {item.description || "-"}

                                </p>

                            </div>

                            <div>

                                <span className="bg-blue-600 text-white px-4 py-2 rounded">

                                    {item.status}

                                </span>

                            </div>

                        </div>

                        {

                            item.images?.length > 0 && (

                                <div className="flex gap-3 mt-5">

                                    {

                                        item.images.map(img => (

                                            <img
                                                key={img.publicId}
                                                src={img.url}
                                                alt=""
                                                className="w-24 h-24 rounded border object-cover"
                                            />

                                        ))

                                    }

                                </div>

                            )

                        }

                        <div className="flex gap-3 mt-6 flex-wrap">

                            <button
                                onClick={() =>
                                    updateStatus(
                                        item._id,
                                        "Approved"
                                    )
                                }
                                className="bg-green-600 text-white px-5 py-2 rounded"
                            >
                                Approve
                            </button>

                            <button
                                onClick={() =>
                                    updateStatus(
                                        item._id,
                                        "Rejected"
                                    )
                                }
                                className="bg-red-600 text-white px-5 py-2 rounded"
                            >
                                Reject
                            </button>

                            <button
                                onClick={() =>
                                    updateStatus(
                                        item._id,
                                        "Picked"
                                    )
                                }
                                className="bg-purple-600 text-white px-5 py-2 rounded"
                            >
                                Picked
                            </button>

                            <button
                                onClick={() =>
                                    updateStatus(
                                        item._id,
                                        "Refunded"
                                    )
                                }
                                className="bg-orange-600 text-white px-5 py-2 rounded"
                            >
                                Refunded
                            </button>

                        </div>

                    </div>

                ))

            }

        </div>

    );

}