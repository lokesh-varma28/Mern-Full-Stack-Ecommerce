import { useEffect, useState, useCallback } from "react";
import { getSellerAnalytics } from "../api/sellerApi";
import {
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiRefreshCw,
  FiAlertTriangle,
  FiTrendingUp,
} from "react-icons/fi";

export default function SellerAnalytics() {
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
      console.error("Error fetching analytics:", err);
      setError(
        err.response?.data?.message || "Failed to load seller analytics."
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
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sales & Revenue Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Performance metrics, total store revenue, and order fulfillment breakdown.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="sp-btn sp-btn-secondary"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center mb-6">
          <FiAlertTriangle className="text-3xl text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-lg">
            Error Loading Analytics
          </h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="sp-btn sp-btn-danger">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="sp-card">
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading sales analytics...
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="sp-grid sp-grid-4 mb-6">
            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Gross Revenue</div>
                <div className="sp-stat-val">
                  {formatCurrency(revenue)}
                </div>
              </div>
              <div className="sp-stat-icon bg-blue-50 text-blue-600">
                <FiDollarSign />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Total Units Sold</div>
                <div className="sp-stat-val">
                  {unitsSold}
                </div>
              </div>
              <div className="sp-stat-icon bg-emerald-50 text-emerald-600">
                <FiPackage />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Total Orders Received</div>
                <div className="sp-stat-val">
                  {totalOrders}
                </div>
              </div>
              <div className="sp-stat-icon bg-indigo-50 text-indigo-600">
                <FiShoppingBag />
              </div>
            </div>

            <div className="sp-stat-card">
              <div>
                <div className="sp-stat-lbl">Avg Order Value</div>
                <div className="sp-stat-val">
                  {formatCurrency(avgOrderValue)}
                </div>
              </div>
              <div className="sp-stat-icon bg-amber-50 text-amber-600">
                <FiTrendingUp />
              </div>
            </div>
          </div>

          {/* Fulfillment Status Breakdown */}
          <div className="sp-card">
            <h3 className="font-bold text-slate-900 text-lg mb-4">
              Fulfillment Status Distribution
            </h3>
            {itemStatusCounts && Object.keys(itemStatusCounts).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(itemStatusCounts).map(([st, count]) => (
                  <div
                    key={st}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center"
                  >
                    <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                      {st}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-800">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No status breakdown data available.
              </p>
            )}
          </div>
        </>
      )}

    </div>
  );
}
