import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * SellerRoute guard:
 * - Redirects unauthenticated users to /login
 * - Redirects non-seller users to /
 * - Renders <Outlet /> for authorized sellers
 */
export default function SellerRoute() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Outlet />;
  }

  if (user.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  if (user.sellerStatus !== "approved") {
    return <Navigate to="/seller/apply" replace />;
  }

  return <Outlet />;
}
