// ── imports MUST come first in ES modules ──────────────────────────────────
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import Compare from "./pages/Compare";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Address from "./pages/Address";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import TrackOrder from "./pages/TrackOrder";
import ReturnRequest from "./pages/ReturnRequest";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminUsers from "./pages/AdminUsers";
import AdminCoupons from "./pages/AdminCoupons";
import AddProduct from "./pages/AddProduct";
import AddCoupon from "./pages/AddCoupon";
import AdminSales from "./pages/AdminSales";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminReturns from "./pages/AdminReturns";
import SellerRoute from "./routes/SellerRoute";
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import AddSellerProduct from "./pages/seller/AddSellerProduct";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerProfile from "./pages/seller/SellerProfile";
import SellerApplication from "./pages/seller/SellerApplication";
import AdminSellers from "./pages/admin/AdminSellers";
import PublicSellerStore from "./pages/PublicSellerStore";

// ── Purge stale recentProducts with invalid ObjectIds (runs once on load) ──
const VALID_OID = /^[a-f\d]{24}$/i;
try {
    const stored = JSON.parse(localStorage.getItem("recentProducts")) || [];
    const clean  = stored.filter((p) => p?._id && VALID_OID.test(p._id));
    if (clean.length !== stored.length) {
        localStorage.setItem("recentProducts", JSON.stringify(clean));
    }
} catch {
    localStorage.removeItem("recentProducts");
}

export default function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                {/* ── User routes ── */}
                <Route path="/"               element={<Home />} />
                <Route path="/search"         element={<Search />} />
                <Route path="/login"          element={<Login />} />
                <Route path="/register"       element={<Register />} />
                <Route path="/verify-otp"     element={<VerifyOtp />} />
                <Route path="/forgot-password"element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/product/:id"    element={<ProductDetails />} />
                <Route path="/cart"           element={<PrivateRoute><Cart /></PrivateRoute>} />
                <Route path="/wishlist"       element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                <Route path="/address"        element={<PrivateRoute><Address /></PrivateRoute>} />
                <Route path="/checkout"       element={<PrivateRoute><Checkout /></PrivateRoute>} />
                <Route path="/orders"         element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/track/:id"      element={<PrivateRoute><TrackOrder /></PrivateRoute>} />
                <Route path="/compare"        element={<Compare />} />
                <Route path="/return"         element={<PrivateRoute><ReturnRequest /></PrivateRoute>} />
                <Route path="/seller/apply"   element={<PrivateRoute><SellerApplication /></PrivateRoute>} />
                <Route path="/seller/:sellerId" element={<PublicSellerStore />} />

                {/* ── Admin routes ── */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index                element={<AdminDashboard />} />
                        <Route path="products"       element={<AdminProducts />} />
                        <Route path="products/add"   element={<AddProduct />} />
                        <Route path="add-product"    element={<AddProduct />} />
                        <Route path="orders"         element={<AdminOrders />} />
                        <Route path="users"          element={<AdminUsers />} />
                        <Route path="sellers"        element={<AdminSellers />} />
                        <Route path="coupons"        element={<AdminCoupons />} />
                        <Route path="add-coupon"     element={<AddCoupon />} />
                        <Route path="sales"          element={<AdminSales />} />
                        <Route path="analytics"      element={<AdminSales />} />
                        <Route path="questions"      element={<AdminQuestions />} />
                        <Route path="returns"        element={<AdminReturns />} />
                    </Route>
                </Route>

                {/* ── Seller routes ── */}
                <Route element={<SellerRoute />}>
                    <Route element={<SellerLayout />}>
                        <Route path="/seller/dashboard"    element={<SellerDashboard />} />
                        <Route path="/seller/products"     element={<SellerProducts />} />
                        <Route path="/seller/products/add" element={<AddSellerProduct />} />
                        <Route path="/seller/orders"       element={<SellerOrders />} />
                        <Route path="/seller/profile"      element={<SellerProfile />} />
                    </Route>
                </Route>
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}
