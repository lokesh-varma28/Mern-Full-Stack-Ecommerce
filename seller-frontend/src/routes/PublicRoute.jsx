import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute() {
  const { user, token, loading, isSeller, sellerStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (token && user && isSeller) {
    if (sellerStatus === "approved") {
      return <Navigate to="/dashboard" replace />;
    }
    if (sellerStatus === "pending" || sellerStatus === "rejected") {
      return <Navigate to="/pending" replace />;
    }
  }

  return <Outlet />;
}
