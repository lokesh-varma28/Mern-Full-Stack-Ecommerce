import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiLogOut,
  FiShoppingBag,
  FiMail,
  FiUser,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function SellerPending() {
  const { user, sellerStatus, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    if (sellerStatus === "approved") {
      navigate("/dashboard", { replace: true });
    }
  }, [sellerStatus, navigate]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setErrorMsg("");
      setFeedbackMsg("");
      const updatedData = await refreshUser();

      if (updatedData?.sellerStatus === "approved") {
        setFeedbackMsg("Congratulations! Your seller account has been approved.");
        navigate("/dashboard", { replace: true });
      } else {
        setFeedbackMsg("Status checked: Your application remains under review.");
      }
    } catch (err) {
      console.error("Error checking seller status:", err);
      setErrorMsg("Unable to check approval status at this time. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const isRejected = sellerStatus === "rejected";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b132b] relative overflow-hidden font-sans text-slate-100 p-4 sm:p-6">
      {/* Background ambient lighting effects */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none opacity-60"
        aria-hidden="true"
      />

      <div className="max-w-md sm:max-w-lg w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center relative z-10 my-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/30">
            <FiShoppingBag />
          </div>
          <div className="text-left">
            <span className="block text-sm font-extrabold text-white tracking-tight">
              Seller Web Portal
            </span>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Merchant Workspace
            </span>
          </div>
        </div>

        {/* Status Header & Icon */}
        {isRejected ? (
          <>
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-rose-500/25 shadow-lg shadow-rose-500/10">
              <FiXCircle />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Application Declined
            </h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your merchant partner application for{" "}
              <strong className="text-slate-200">
                {user?.storeName || "your store"}
              </strong>{" "}
              has been declined by platform administrators.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-amber-500/25 shadow-lg shadow-amber-500/10">
              <FiClock className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Application Under Review
            </h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Thank you for registering! Your seller application is currently being
              reviewed by our administration team. You will receive full portal access once approved.
            </p>
          </>
        )}

        {/* Status Alerts */}
        <div aria-live="polite" className="w-full">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 text-left flex items-start gap-2.5 shadow-sm">
              <FiAlertCircle className="text-rose-400 text-base shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {feedbackMsg && !errorMsg && (
            <div className="mb-5 p-3.5 bg-blue-950/60 border border-blue-800/80 rounded-xl text-xs text-blue-300 text-left flex items-start gap-2.5 shadow-sm">
              <FiCheckCircle className="text-blue-400 text-base shrink-0 mt-0.5" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Store Information Hierarchy Card */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 sm:p-5 mb-6 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 pb-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <FiShoppingBag className="text-blue-400 shrink-0" />
              Store Name
            </span>
            <span className="font-semibold text-slate-100 truncate max-w-[200px]">
              {user?.storeName || "Not Provided"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 pb-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <FiMail className="text-blue-400 shrink-0" />
              Account Email
            </span>
            <span className="font-semibold text-slate-100 truncate max-w-[200px]">
              {user?.email || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 pb-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <FiUser className="text-blue-400 shrink-0" />
              Account Role
            </span>
            <span className="font-semibold text-slate-200 capitalize">
              {user?.role || "Seller"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
            <span className="text-slate-400 flex items-center gap-2">
              <FiShield className="text-blue-400 shrink-0" />
              Application Status
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isRejected
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {sellerStatus || "pending"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Check approval status"
          >
            <FiRefreshCw className={`text-base ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Checking Status..." : "Check Approval Status"}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 transition-all duration-150 active:scale-[0.99]"
            aria-label="Sign out of seller account"
          >
            <FiLogOut className="text-base" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Card Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          Integrated with Multi-Vendor E-Commerce Platform
        </div>
      </div>
    </div>
  );
}

