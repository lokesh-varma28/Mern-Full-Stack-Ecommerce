import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getSellerAnalytics } from "../api/sellerApi";
import { useAuth } from "../context/AuthContext";
import {
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiClock,
  FiRefreshCw,
  FiAlertTriangle,
  FiPlusSquare,
  FiBox,
  FiArrowRight,
} from "react-icons/fi";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerAnalytics();
      setAnalytics(res.data?.analytics || res.data || null);
    } catch (err) {
      console.error("Error loading seller analytics:", err);
      setError(
        err.response?.data?.message || "Failed to load dashboard metrics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (val = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const revenue = analytics?.sellerRevenue ?? analytics?.totalRevenue ?? 0;
  const unitsSold = analytics?.totalItemsSold ?? analytics?.unitsSold ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const itemStatusCounts = analytics?.itemStatusCounts ?? analytics?.statusBreakdown ?? {};
  const pendingOrders = itemStatusCounts?.pending ?? 0;


  return (
    <div>
      {/* Dashboard Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.storeName || user?.name || "Merchant"}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is your live store performance overview and sales analytics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="sp-btn sp-btn-secondary self-start sm:self-auto"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center mb-6">
          <FiAlertTriangle className="text-3xl text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-lg">
            Failed to Load Dashboard Metrics
          </h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="sp-btn sp-btn-danger">
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="sp-grid sp-grid-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sp-stat-card animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-6 bg-slate-300 rounded w-3/4"></div>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="sp-grid sp-grid-4 mb-6">
            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Total Revenue</div>
                <div className="sp-stat-val">{formatCurrency(revenue)}</div>
              </div>
              <div className="sp-stat-icon bg-blue-50 text-blue-600">
                <FiDollarSign />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Units Sold</div>
                <div className="sp-stat-val">{unitsSold}</div>
              </div>
              <div className="sp-stat-icon bg-emerald-50 text-emerald-600">
                <FiPackage />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Total Orders</div>
                <div className="sp-stat-val">{totalOrders}</div>
              </div>
              <div className="sp-stat-icon bg-indigo-50 text-indigo-600">
                <FiShoppingBag />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Pending Orders</div>
                <div className="sp-stat-val">{pendingOrders}</div>
              </div>
              <div className="sp-stat-icon bg-amber-50 text-amber-600">
                <FiClock />
              </div>
            </div>
          </div>

          {/* Quick Actions & Status Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Status Breakdown Card */}
            <div className="sp-card lg:col-span-2">
              <h3 className="font-bold text-slate-900 text-lg mb-4">
                Order Item Status Breakdown
              </h3>
              {itemStatusCounts && Object.keys(itemStatusCounts).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(itemStatusCounts).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-lg"
                      >
                        <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                          {status}
                        </span>
                        <span className="text-2xl font-extrabold text-slate-800">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (

                <p className="text-sm text-slate-500">
                  No order status data available yet.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="sp-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-3">
                  Quick Actions
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Manage your store catalog and fulfill incoming orders.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/products/add"
                  className="sp-btn sp-btn-primary justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FiPlusSquare /> Add New Product
                  </span>
                  <FiArrowRight />
                </Link>

                <Link
                  to="/products"
                  className="sp-btn sp-btn-secondary justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FiBox /> View Product Catalog
                  </span>
                  <FiArrowRight />
                </Link>

                <Link
                  to="/orders"
                  className="sp-btn sp-btn-secondary justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FiShoppingBag /> Manage Orders
                  </span>
                  <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

