import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getSellerAnalytics } from "../../api/sellerApi";
import {
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiRefreshCw,
  FiPlusCircle
} from "react-icons/fi";

export default function SellerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerAnalytics();
      setAnalytics(res.analytics || res.data || null);
    } catch (err) {
      console.error("Error fetching seller analytics:", err);
      setError(err.response?.data?.message || "Failed to load seller analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="seller-page-loading">
        <div className="seller-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-error-banner">
        <div className="seller-error-content">
          <FiXCircle size={24} className="error-icon" />
          <div>
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
          </div>
        </div>
        <button onClick={fetchAnalytics} className="seller-retry-btn">
          <FiRefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const {
    sellerRevenue = 0,
    totalItemsSold = 0,
    totalOrders = 0,
    itemStatusCounts = {}
  } = analytics || {};

  const pending = itemStatusCounts.pending || 0;
  const confirmed = itemStatusCounts.confirmed || 0;
  const packed = itemStatusCounts.packed || 0;
  const shipped = itemStatusCounts.shipped || 0;
  const delivered = itemStatusCounts.delivered || 0;
  const cancelled = itemStatusCounts.cancelled || 0;

  const isZeroState = totalOrders === 0 && totalItemsSold === 0 && sellerRevenue === 0;

  return (
    <div className="seller-dashboard-page">
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Seller Overview</h1>
          <p className="seller-page-subtitle">Track your revenue, sales performance, and order status breakdown.</p>
        </div>
        <div className="seller-header-actions">
          <Link to="/seller/products/add" className="seller-primary-btn">
            <FiPlusCircle size={18} /> Add New Product
          </Link>
          <button onClick={fetchAnalytics} className="seller-secondary-btn" title="Refresh analytics">
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {isZeroState && (
        <div className="seller-info-banner">
          <h3>Welcome to your Seller Dashboard!</h3>
          <p>You haven't made any sales yet. Start by adding your products to the catalog.</p>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="seller-metrics-grid">
        <div className="seller-metric-card revenue-card">
          <div className="metric-header">
            <span className="metric-title">Total Revenue</span>
            <div className="metric-icon revenue-icon">
              <FiDollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">₹{sellerRevenue.toLocaleString()}</div>
          <div className="metric-subtext">Net earnings excluding cancelled items</div>
        </div>

        <div className="seller-metric-card sales-card">
          <div className="metric-header">
            <span className="metric-title">Units Sold</span>
            <div className="metric-icon sales-icon">
              <FiPackage size={20} />
            </div>
          </div>
          <div className="metric-value">{totalItemsSold}</div>
          <div className="metric-subtext">Total items fulfilled</div>
        </div>

        <div className="seller-metric-card orders-card">
          <div className="metric-header">
            <span className="metric-title">Total Orders</span>
            <div className="metric-icon orders-icon">
              <FiShoppingBag size={20} />
            </div>
          </div>
          <div className="metric-value">{totalOrders}</div>
          <div className="metric-subtext">Orders containing your products</div>
        </div>
      </div>

      {/* Item Status Breakdown */}
      <h2 className="seller-section-title">Order Item Status Breakdown</h2>
      <div className="seller-status-grid">
        <div className="status-card status-pending">
          <div className="status-icon"><FiClock size={18} /></div>
          <div className="status-info">
            <span className="status-label">Pending</span>
            <span className="status-count">{pending}</span>
          </div>
        </div>

        <div className="status-card status-confirmed">
          <div className="status-icon"><FiCheckCircle size={18} /></div>
          <div className="status-info">
            <span className="status-label">Confirmed</span>
            <span className="status-count">{confirmed}</span>
          </div>
        </div>

        <div className="status-card status-packed">
          <div className="status-icon"><FiPackage size={18} /></div>
          <div className="status-info">
            <span className="status-label">Packed</span>
            <span className="status-count">{packed}</span>
          </div>
        </div>

        <div className="status-card status-shipped">
          <div className="status-icon"><FiTruck size={18} /></div>
          <div className="status-info">
            <span className="status-label">Shipped</span>
            <span className="status-count">{shipped}</span>
          </div>
        </div>

        <div className="status-card status-delivered">
          <div className="status-icon"><FiCheckCircle size={18} /></div>
          <div className="status-info">
            <span className="status-label">Delivered</span>
            <span className="status-count">{delivered}</span>
          </div>
        </div>

        <div className="status-card status-cancelled">
          <div className="status-icon"><FiXCircle size={18} /></div>
          <div className="status-info">
            <span className="status-label">Cancelled</span>
            <span className="status-count">{cancelled}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
