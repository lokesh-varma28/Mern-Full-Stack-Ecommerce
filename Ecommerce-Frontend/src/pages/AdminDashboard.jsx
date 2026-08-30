import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiTag,
  FiShoppingBag,
  FiArrowRight,
  FiRefreshCw,
  FiPlusCircle,
  FiAlertTriangle,
  FiTrendingUp,
} from "react-icons/fi";

import SalesChart from "../components/admin/SalesChart";
import OrdersChart from "../components/admin/OrdersChart";

import {
  getDashboard,
  getSalesAnalytics,
  getOrders,
} from "../api/adminApi";

import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCoupons: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  const [sales, setSales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, salesRes, ordersRes] = await Promise.all([
        getDashboard(),
        getSalesAnalytics().catch(() => ({ data: [] })),
        getOrders().catch(() => ({ data: [] })),
      ]);

      setDashboard(dashRes.data || {});
      setSales(salesRes.data || []);

      const ordersList = ordersRes.data?.orders || ordersRes.data || [];
      setRecentOrders(ordersList.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Unable to load dashboard. We couldn't retrieve the latest store statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || "Pending").toLowerCase();
    if (s.includes("deliver")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Delivered
        </span>
      );
    }
    if (s.includes("transit") || s.includes("ship")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Shipped
        </span>
      );
    }
    if (s.includes("confirm") || s.includes("process")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Processing
        </span>
      );
    }
    if (s.includes("cancel")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
      </span>
    );
  };

  return (
    <div className="ad-container">
      {/* 1. Page Header */}
      <header className="ad-header-card">
        <div>
          <h1 className="ad-title">Dashboard</h1>
          <p className="ad-subtitle">
            Welcome back. Here's what's happening with your store today.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="ad-btn-refresh"
          title="Refresh dashboard data"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </header>

      {error ? (
        /* Error State */
        <div className="ad-error-card">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mb-3">
            <FiAlertTriangle />
          </div>
          <h3 className="ad-error-title">Unable to load dashboard</h3>
          <p className="ad-error-msg">{error}</p>
          <button onClick={loadData} className="ad-btn-retry">
            <FiRefreshCw /> Retry
          </button>
        </div>
      ) : loading ? (
        /* Skeleton Loading State */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ad-skeleton h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 ad-skeleton h-80" />
            <div className="ad-skeleton h-80" />
          </div>
        </div>
      ) : (
        /* Dashboard Content Surface */
        <div className="space-y-6">
          {/* 2. KPI Statistics Row (5 Cards) */}
          <section className="ad-kpi-grid">
            {/* Revenue */}
            <div className="ad-kpi-card">
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">Total Revenue</span>
                <div className="ad-kpi-icon ad-kpi-icon--revenue">
                  <FiDollarSign />
                </div>
              </div>
              <div className="ad-kpi-value">{formatCurrency(dashboard.totalRevenue)}</div>
              <p className="ad-kpi-subtext">Total store earnings</p>
            </div>

            {/* Total Orders */}
            <div className="ad-kpi-card">
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">Total Orders</span>
                <div className="ad-kpi-icon ad-kpi-icon--orders">
                  <FiShoppingCart />
                </div>
              </div>
              <div className="ad-kpi-value">{dashboard.totalOrders?.toLocaleString() || 0}</div>
              <p className="ad-kpi-subtext">{dashboard.pendingOrders || 0} pending fulfillment</p>
            </div>

            {/* Customers */}
            <div className="ad-kpi-card">
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">Customers</span>
                <div className="ad-kpi-icon ad-kpi-icon--users">
                  <FiUsers />
                </div>
              </div>
              <div className="ad-kpi-value">{dashboard.totalUsers?.toLocaleString() || 0}</div>
              <p className="ad-kpi-subtext">Registered buyers</p>
            </div>

            {/* Products */}
            <div className="ad-kpi-card">
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">Products</span>
                <div className="ad-kpi-icon ad-kpi-icon--products">
                  <FiBox />
                </div>
              </div>
              <div className="ad-kpi-value">{dashboard.totalProducts?.toLocaleString() || 0}</div>
              <p className="ad-kpi-subtext">Active catalog items</p>
            </div>

            {/* Pending Orders */}
            <div className="ad-kpi-card">
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">Pending Orders</span>
                <div className="ad-kpi-icon ad-kpi-icon--pending">
                  <FiClock />
                </div>
              </div>
              <div className="ad-kpi-value">{dashboard.pendingOrders?.toLocaleString() || 0}</div>
              <p className="ad-kpi-subtext">Needs attention</p>
            </div>
          </section>

          {/* 3. Main Analytics & Status Grid */}
          <section className="ad-main-grid">
            {/* Sales Chart (Monthly Revenue) */}
            <div className="ad-card min-h-[380px]">
              <div className="ad-card-head">
                <div>
                  <h2 className="ad-card-title flex items-center gap-2">
                    <FiTrendingUp className="text-blue-600" /> Sales Overview
                  </h2>
                  <p className="ad-card-subtitle">Revenue performance over time</p>
                </div>
              </div>
              <div className="flex-1">
                {sales && sales.length > 0 ? (
                  <SalesChart data={sales} />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg">
                    <FiTrendingUp className="text-3xl text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No sales data yet</p>
                    <p className="text-xs text-slate-500 mt-1">Sales information will appear here once orders are completed.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Fulfillment Status */}
            <div className="ad-card min-h-[380px]">
              <div className="ad-card-head">
                <div>
                  <h2 className="ad-card-title">Order Status</h2>
                  <p className="ad-card-subtitle">Fulfillment breakdown</p>
                </div>
              </div>

              <div className="ad-status-list">
                {/* Pending */}
                <div className="ad-status-item">
                  <div className="ad-status-info">
                    <span className="ad-status-dot ad-status-dot--pending" />
                    <span className="ad-status-name">Pending</span>
                  </div>
                  <span className="ad-status-count">{dashboard.pendingOrders || 0}</span>
                </div>

                {/* Confirmed / Processing */}
                <div className="ad-status-item">
                  <div className="ad-status-info">
                    <span className="ad-status-dot ad-status-dot--confirmed" />
                    <span className="ad-status-name">Confirmed</span>
                  </div>
                  <span className="ad-status-count">{dashboard.confirmedOrders || 0}</span>
                </div>

                {/* In Transit */}
                <div className="ad-status-item">
                  <div className="ad-status-info">
                    <span className="ad-status-dot ad-status-dot--transit" />
                    <span className="ad-status-name">In Transit</span>
                  </div>
                  <span className="ad-status-count">{dashboard.inTransitOrders || 0}</span>
                </div>

                {/* Delivered */}
                <div className="ad-status-item">
                  <div className="ad-status-info">
                    <span className="ad-status-dot ad-status-dot--delivered" />
                    <span className="ad-status-name">Delivered</span>
                  </div>
                  <span className="ad-status-count">{dashboard.deliveredOrders || 0}</span>
                </div>
              </div>

              {/* Order Status Distribution Bar */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex justify-between">
                  <span>Fulfillment Progress</span>
                  <span>{dashboard.totalOrders ? Math.round(((dashboard.deliveredOrders || 0) / dashboard.totalOrders) * 100) : 0}% Delivered</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${dashboard.totalOrders ? ((dashboard.deliveredOrders || 0) / dashboard.totalOrders) * 100 : 0}%`,
                    }}
                    className="bg-emerald-500 h-full transition-all"
                  />
                  <div
                    style={{
                      width: `${dashboard.totalOrders ? ((dashboard.inTransitOrders || 0) / dashboard.totalOrders) * 100 : 0}%`,
                    }}
                    className="bg-indigo-500 h-full transition-all"
                  />
                  <div
                    style={{
                      width: `${dashboard.totalOrders ? ((dashboard.confirmedOrders || 0) / dashboard.totalOrders) * 100 : 0}%`,
                    }}
                    className="bg-blue-500 h-full transition-all"
                  />
                  <div
                    style={{
                      width: `${dashboard.totalOrders ? ((dashboard.pendingOrders || 0) / dashboard.totalOrders) * 100 : 0}%`,
                    }}
                    className="bg-amber-500 h-full transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Secondary Grid: Recent Orders & Quick Actions */}
          <section className="ad-secondary-grid">
            {/* Recent Orders Section */}
            <div className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2 className="ad-card-title">Recent Orders</h2>
                  <p className="ad-card-subtitle">Latest customer purchases</p>
                </div>
                <Link to="/admin/orders" className="ad-link-all">
                  <span>View All</span>
                  <FiArrowRight className="text-xs" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg">
                  <FiShoppingCart className="text-3xl text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No recent orders</p>
                  <p className="text-xs text-slate-500 mt-1">Orders will appear here when customers place them.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (≥768px) */}
                  <div className="hidden md:block ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th className="ad-th">ORDER</th>
                          <th className="ad-th">CUSTOMER</th>
                          <th className="ad-th">DATE</th>
                          <th className="ad-th">AMOUNT</th>
                          <th className="ad-th text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => {
                          const orderId = order._id ? `#${order._id.slice(-6).toUpperCase()}` : "#ORDER";
                          const customerName = order.user?.name || order.shippingAddress?.name || "Customer";
                          const total = order.totalAmount || order.totalPrice || 0;
                          const status = order.orderStatus || order.status || "Pending";

                          return (
                            <tr key={order._id || Math.random()} className="ad-tr">
                              <td className="ad-td">
                                <span className="ad-order-id">{orderId}</span>
                              </td>
                              <td className="ad-td font-semibold text-slate-800">
                                {customerName}
                              </td>
                              <td className="ad-td text-slate-500 font-medium">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="ad-td font-bold text-slate-900">
                                {formatCurrency(total)}
                              </td>
                              <td className="ad-td text-right">
                                {getStatusBadge(status)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (<768px) */}
                  <div className="block md:hidden ad-mobile-orders">
                    {recentOrders.map((order) => {
                      const orderId = order._id ? `#${order._id.slice(-6).toUpperCase()}` : "#ORDER";
                      const customerName = order.user?.name || order.shippingAddress?.name || "Customer";
                      const total = order.totalAmount || order.totalPrice || 0;
                      const status = order.orderStatus || order.status || "Pending";

                      return (
                        <div key={order._id || Math.random()} className="ad-mo-card">
                          <div className="ad-mo-top">
                            <span className="ad-order-id">{orderId}</span>
                            {getStatusBadge(status)}
                          </div>
                          <div className="text-xs text-slate-600">
                            Customer: <strong className="text-slate-900">{customerName}</strong>
                          </div>
                          <div className="ad-mo-bottom">
                            <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                            <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h2 className="ad-card-title">Quick Actions</h2>
                  <p className="ad-card-subtitle">Shortcuts to key tasks</p>
                </div>
              </div>

              <div className="ad-actions-grid">
                <Link to="/admin/products/add" className="ad-action-btn">
                  <FiPlusCircle className="ad-action-icon text-blue-600" />
                  <span className="ad-action-text">Add Product</span>
                </Link>

                <Link to="/admin/orders" className="ad-action-btn">
                  <FiShoppingCart className="ad-action-icon text-emerald-600" />
                  <span className="ad-action-text">View Orders</span>
                </Link>

                <Link to="/admin/coupons" className="ad-action-btn">
                  <FiTag className="ad-action-icon text-purple-600" />
                  <span className="ad-action-text">Coupons</span>
                </Link>

                <Link to="/admin/sellers" className="ad-action-btn">
                  <FiShoppingBag className="ad-action-icon text-amber-600" />
                  <span className="ad-action-text">Sellers</span>
                </Link>
              </div>

              {/* Seller Approval Callout */}
              <div className="mt-6 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm">
                    <FiShoppingBag />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Seller Portal</h4>
                    <p className="text-[11px] text-slate-500">Review partner applications</p>
                  </div>
                </div>

                <Link
                  to="/admin/sellers"
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  Manage
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}