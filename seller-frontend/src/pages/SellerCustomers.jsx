import { useEffect, useState, useCallback } from "react";
import { getSellerCustomers } from "../api/sellerApi";
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiShoppingBag,
  FiDollarSign,
  FiCalendar,
  FiMail,
  FiPhone,
  FiAlertTriangle,
  FiPackage,
} from "react-icons/fi";

export default function SellerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerCustomers();
      setCustomers(res.data?.customers || []);
    } catch (err) {
      console.error("Error loading seller customers:", err);
      setError(
        err.response?.data?.message || "Failed to load customer list."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatCurrency = (val = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-blue-600" /> My Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of buyers who have purchased products from your store.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="sp-btn sp-btn-secondary self-start sm:self-auto"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search customers by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <div className="sp-stat-card py-2.5 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block">Total Customers</span>
            <span className="text-xl font-extrabold text-slate-900">{customers.length}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FiUsers className="text-lg" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <FiAlertTriangle className="text-3xl text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-lg">Failed to Load Customers</h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button onClick={fetchCustomers} className="sp-btn sp-btn-danger">
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sp-card animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="sp-card text-center py-12">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            <FiUsers />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            {searchQuery ? "No matching customers found" : "No customers yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? "Try adjusting your search query."
              : "When customers buy products from your store, their order summary will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Customer Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-slate-900 text-white font-extrabold text-base rounded-xl flex items-center justify-center uppercase shadow-sm">
                      {customer.name
                        ? customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                        : "C"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <FiMail className="text-slate-400" /> {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <FiPhone className="text-slate-400" /> {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Customer Stats */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Orders</span>
                    <span className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1">
                      <FiShoppingBag className="text-blue-500 text-xs" /> {customer.orderCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Spent</span>
                    <span className="text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                      <FiDollarSign className="text-emerald-500 text-xs" /> {formatCurrency(customer.totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Latest Date</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1">
                      <FiCalendar className="text-slate-400 text-xs" /> {formatDate(customer.latestOrderDate)}
                    </span>
                  </div>
                </div>

                {/* Products Purchased */}
                {customer.productsPurchased && customer.productsPurchased.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <FiPackage className="text-slate-400" /> Purchased Items ({customer.productsPurchased.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {customer.productsPurchased.map((prod, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg font-medium"
                        >
                          {prod.title}
                          <span className="bg-blue-200 text-blue-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                            x{prod.quantity}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
