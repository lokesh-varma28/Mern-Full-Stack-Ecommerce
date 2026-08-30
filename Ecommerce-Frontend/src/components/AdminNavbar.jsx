import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminNavbar() {

    const navigate = useNavigate();

    const [open, setOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

    };

    return (

        <div className="bg-white shadow p-5 flex justify-between items-center">

            <h2 className="text-2xl font-bold">
                Dashboard
            </h2>

            <div className="relative">

                <button
                    onClick={() => setOpen(!open)}
                    className="bg-gray-100 px-5 py-2 rounded hover:bg-gray-200"
                >
                    Hello, {user?.name} ▼
                </button>

                {
                    open && (

                        <div className="absolute right-0 mt-2 bg-white shadow-lg rounded w-56 z-50">

                            <Link
                                to="/admin"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                📊 Dashboard
                            </Link>

                            <Link
                                to="/admin/products"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                📦 Products
                            </Link>

                            <Link
                                to="/admin/orders"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                🛒 Orders
                            </Link>

                            <Link
                                to="/admin/users"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                👥 Users
                            </Link>

                            <Link
                                to="/admin/sellers"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                🏪 Sellers
                            </Link>

                            <Link
                                to="/admin/coupons"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                🎟 Coupons
                            </Link>

                            <Link
                                to="/admin/sales"
                                className="block px-4 py-3 hover:bg-gray-100"
                            >
                                📈 Sales Analytics
                            </Link>

                            <hr />

                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
                            >
                                🚪 Logout
                            </button>

                        </div>

                    )
                }

            </div>

        </div>

    );

}