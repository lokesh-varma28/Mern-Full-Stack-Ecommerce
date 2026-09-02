import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicRoute from "./routes/PublicRoute";
import SellerRoute from "./routes/SellerRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerPending from "./pages/SellerPending";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import SellerOrders from "./pages/SellerOrders";
import SellerCustomers from "./pages/SellerCustomers";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerProfile from "./pages/SellerProfile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Pending Status Page */}
          <Route path="/pending" element={<SellerPending />} />

          {/* Protected Seller Portal Routes */}
          <Route element={<SellerRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/products" element={<SellerProducts />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/:id/edit" element={<EditProduct />} />
            <Route path="/products/edit/:id" element={<EditProduct />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/orders" element={<SellerOrders />} />
            <Route path="/customers" element={<SellerCustomers />} />
            <Route path="/analytics" element={<SellerAnalytics />} />
            <Route path="/profile" element={<SellerProfile />} />
          </Route>


          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

