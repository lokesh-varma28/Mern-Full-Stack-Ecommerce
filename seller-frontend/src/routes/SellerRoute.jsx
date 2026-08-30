import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "../layouts/SellerLayout";

export default function SellerRoute() {
  const { user, token, loading, isSeller, sellerStatus, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">
            Verifying seller authentication...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> redirect to /login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated non-seller -> show Access Denied UI
  if (!isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            Logged in as <strong>{user.email}</strong> ({user.role}). You must have a verified merchant partner account to access the Seller Web Portal.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={logout}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Sign In with Seller Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Seller pending or rejected -> redirect to /pending status page
  if (sellerStatus === "pending" || sellerStatus === "rejected") {
    return <Navigate to="/pending" replace />;
  }

  // Approved seller -> render layout and child routes
  return (
    <SellerLayout>
      <Outlet />
    </SellerLayout>
  );
}
