import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCoupon } from "../api/adminApi";

export default function AddCoupon() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minimumAmount: "",
        maximumDiscount: "",
        usageLimit: "",
        expiry: "",
        onlyFirstOrder: false,
        active: true
    });

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addCoupon(form);

            alert("Coupon Added Successfully");

            navigate("/admin/coupons");

        } catch (err) {

            console.log(err);

            alert(err.response?.data?.message || "Failed");

        }

    };

    return (

        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">
                        Add New Coupon
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure discount code, validity, and usage limits.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5 bg-white shadow p-6 rounded"
            >

                <input
                    type="text"
                    name="code"
                    placeholder="Coupon Code"
                    value={form.code}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                    required
                />

                <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                </select>

                <input
                    type="number"
                    name="discountValue"
                    placeholder="Discount Value"
                    value={form.discountValue}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                    required
                />

                <input
                    type="number"
                    name="minimumAmount"
                    placeholder="Minimum Amount"
                    value={form.minimumAmount}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                    required
                />

                <input
                    type="number"
                    name="maximumDiscount"
                    placeholder="Maximum Discount"
                    value={form.maximumDiscount}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                />

                <input
                    type="number"
                    name="usageLimit"
                    placeholder="Usage Limit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                    required
                />

                <input
                    type="date"
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                    required
                />

                <label className="flex items-center gap-3">

                    <input
                        type="checkbox"
                        name="onlyFirstOrder"
                        checked={form.onlyFirstOrder}
                        onChange={handleChange}
                    />

                    Only First Order

                </label>

                <label className="flex items-center gap-3">

                    <input
                        type="checkbox"
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                    />

                    Active Coupon

                </label>

                <button
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded"
                >

                    Save Coupon

                </button>

            </form>

        </div>

    );

}