import { useEffect, useState, useCallback, useMemo } from "react";
import {
    getOrders,
    updateOrderStatus,
    assignTracking
} from "../api/adminApi";
import {
    FiShoppingBag,
    FiClock,
    FiBox,
    FiTruck,
    FiCheckCircle,
    FiXCircle,
    FiSearch,
    FiRefreshCw,
    FiAlertTriangle,
    FiCopy,
    FiCheck,
    FiCalendar,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiEdit2,
    FiMapPin,
    FiArrowUpRight
} from "react-icons/fi";
import "./AdminOrders.css";

// Supported Order Status options
const ORDER_STATUS_OPTIONS = [
    "pending",
    "confirmed",
    "packed",
    "pickup scheduled",
    "picked up",
    "shipped",
    "in transit",
    "destination hub",
    "out for delivery",
    "delivered",
    "cancelled"
];

// Supported Shipping/Pickup Status options
const SHIPPING_STATUS_OPTIONS = [
    "Not Assigned",
    "Pickup Scheduled",
    "Picked Up",
    "In Transit",
    "Destination Hub",
    "Out For Delivery",
    "Delivered"
];

// Helper: Format Currency in INR (Indian Numbering Format)
const formatCurrency = (amount) => {
    const numericValue = Number(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(numericValue);
};

// Helper: Format Date & Time (e.g. "Aug 30, 2026 • 1:36 PM")
const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }) + " • " + d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    } catch {
        return "N/A";
    }
};

// Helper: Format Date only (e.g. "30 Aug 2026")
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return "N/A";
    }
};

// Helper: Customer Avatar (38px x 38px)
function CustomerAvatar({ name }) {
    const letters = (name && name.trim())
        ? name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "C";

    return (
        <div className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-slate-800/10">
            {letters}
        </div>
    );
}

// Helper: Status Badge Styling & Mapping
const getOrderStatusBadge = (status) => {
    const lower = (status || "").toLowerCase().trim();
    switch (lower) {
        case "pending":
            return {
                bg: "bg-amber-50 text-amber-700 border-amber-200/80",
                dot: "bg-amber-500",
                label: "Pending",
                icon: <FiClock className="text-amber-600 shrink-0 text-xs" />
            };
        case "confirmed":
            return {
                bg: "bg-blue-50 text-blue-700 border-blue-200/80",
                dot: "bg-blue-500",
                label: "Confirmed",
                icon: <FiBox className="text-blue-600 shrink-0 text-xs" />
            };
        case "packed":
        case "processing":
            return {
                bg: "bg-violet-50 text-violet-700 border-violet-200/80",
                dot: "bg-violet-500",
                label: lower.charAt(0).toUpperCase() + lower.slice(1),
                icon: <FiBox className="text-violet-600 shrink-0 text-xs" />
            };
        case "pickup scheduled":
        case "picked up":
        case "shipped":
        case "in transit":
        case "destination hub":
        case "out for delivery":
            return {
                bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
                dot: "bg-indigo-500",
                label: lower.charAt(0).toUpperCase() + lower.slice(1),
                icon: <FiTruck className="text-indigo-600 shrink-0 text-xs" />
            };
        case "delivered":
            return {
                bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
                dot: "bg-emerald-500",
                label: "Delivered",
                icon: <FiCheckCircle className="text-emerald-600 shrink-0 text-xs" />
            };
        case "cancelled":
            return {
                bg: "bg-rose-50 text-rose-700 border-rose-200/80",
                dot: "bg-rose-500",
                label: "Cancelled",
                icon: <FiXCircle className="text-rose-600 shrink-0 text-xs" />
            };
        default:
            return {
                bg: "bg-slate-100 text-slate-700 border-slate-200",
                dot: "bg-slate-400",
                label: status || "Pending",
                icon: <FiBox className="text-slate-500 shrink-0 text-xs" />
            };
    }
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter, Search, and Sort state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [shippingFilter, setShippingFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Selected order for Right Drawer
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);

    // Row edit mode toggle state (order ID mapped to boolean)
    const [editingRows, setEditingRows] = useState({});

    // Action feedback state
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [savingTrackingId, setSavingTrackingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    }, []);

    // Load Orders from API
    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getOrders();
            const fetchedData = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
            setOrders(fetchedData);
        } catch (err) {
            console.error("Error loading orders:", err);
            setError("Something went wrong while fetching order information.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Keep selectedOrder in sync when orders array updates
    useEffect(() => {
        if (selectedOrder) {
            const updated = orders.find(o => o._id === selectedOrder._id);
            if (updated) setSelectedOrder(updated);
        }
    }, [orders]);

    // Update Order Status
    const changeStatus = async (id, status) => {
        setUpdatingStatusId(id);
        try {
            await updateOrderStatus(id, status);
            showToast("Order status updated successfully", "success");
            await loadOrders();
        } catch (err) {
            console.error("Error updating order status:", err);
            showToast(err.response?.data?.message || "Failed to update order status", "error");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Handle Input Field Change
    const handleTrackingChange = (index, field, value) => {
        const newOrders = [...orders];
        newOrders[index][field] = value;
        setOrders(newOrders);
    };

    // Save Tracking Information
    const saveTracking = async (order) => {
        setSavingTrackingId(order._id);
        try {
            await assignTracking(order._id, {
                courierName: order.courierName || "",
                trackingId: order.trackingId || "",
                shippingStatus: order.shippingStatus || "Not Assigned",
                pickupDate: order.pickupDate || "",
                deliveryDate: order.deliveryDate || ""
            });
            showToast("Tracking information saved successfully", "success");
            setEditingRows(prev => ({ ...prev, [order._id]: false }));
            setIsEditingInDrawer(false);
            await loadOrders();
        } catch (err) {
            console.error("Error saving tracking info:", err);
            showToast(err.response?.data?.message || "Tracking Update Failed", "error");
        } finally {
            setSavingTrackingId(null);
        }
    };

    // Copy Tracking ID to Clipboard
    const copyToClipboard = (text, id) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Reset Filters
    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setShippingFilter("all");
        setDateFilter("all");
        setSortBy("newest");
        setCurrentPage(1);
    };

    // Toggle Row Edit Mode
    const toggleRowEdit = (id) => {
        setEditingRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Calculate Summary Statistics (5 KPI Cards)
    const stats = useMemo(() => {
        const total = orders.length;
        let pending = 0;
        let processing = 0;
        let inTransit = 0;
        let delivered = 0;

        orders.forEach(o => {
            const st = (o.status || "").toLowerCase().trim();
            if (st === "pending") pending++;
            else if (st === "confirmed" || st === "packed" || st === "processing") processing++;
            else if (["pickup scheduled", "picked up", "shipped", "in transit", "destination hub", "out for delivery"].includes(st)) inTransit++;
            else if (st === "delivered") delivered++;
        });

        return { total, pending, processing, inTransit, delivered };
    }, [orders]);

    // Filter and Sort Orders
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // 1. Search Filter (Name, Email, Tracking ID, Order ID)
        if (search.trim()) {
            const query = search.trim().toLowerCase();
            result = result.filter(o => {
                const name = (o.userId?.name || "").toLowerCase();
                const email = (o.userId?.email || "").toLowerCase();
                const tracking = (o.trackingId || "").toLowerCase();
                const orderId = (o._id || "").toLowerCase();
                const courier = (o.courierName || "").toLowerCase();

                return name.includes(query) ||
                    email.includes(query) ||
                    tracking.includes(query) ||
                    orderId.includes(query) ||
                    courier.includes(query);
            });
        }

        // 2. Order Status Filter
        if (statusFilter !== "all") {
            result = result.filter(o => (o.status || "").toLowerCase().trim() === statusFilter.toLowerCase().trim());
        }

        // 3. Shipping Status Filter
        if (shippingFilter !== "all") {
            result = result.filter(o => (o.shippingStatus || "Not Assigned").toLowerCase().trim() === shippingFilter.toLowerCase().trim());
        }

        // 4. Date Filter
        if (dateFilter !== "all") {
            const now = new Date();
            result = result.filter(o => {
                const orderDate = new Date(o.createdAt || o.orderDate || o.updatedAt);
                if (isNaN(orderDate.getTime())) return true;
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (dateFilter === "today") return diffDays <= 1;
                if (dateFilter === "7days") return diffDays <= 7;
                if (dateFilter === "30days") return diffDays <= 30;
                return true;
            });
        }

        // 5. Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.orderDate || a._id || 0).getTime();
            const dateB = new Date(b.createdAt || b.orderDate || b._id || 0).getTime();
            const amtA = Number(a.finalAmount || a.totalAmount || 0);
            const amtB = Number(b.finalAmount || b.totalAmount || 0);

            if (sortBy === "oldest") return dateA - dateB;
            if (sortBy === "amount-desc") return amtB - amtA;
            if (sortBy === "amount-asc") return amtA - amtB;
            return dateB - dateA; // "newest" default
        });

        return result;
    }, [orders, search, statusFilter, shippingFilter, dateFilter, sortBy]);

    // Paginated Orders slice
    const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage, pageSize]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, shippingFilter, dateFilter, sortBy, pageSize]);

    const activeFilterCount = (search.trim() ? 1 : 0) +
        (statusFilter !== "all" ? 1 : 0) +
        (shippingFilter !== "all" ? 1 : 0) +
        (dateFilter !== "all" ? 1 : 0);

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans text-slate-900 space-y-6 ao-main-container">
            {/* 1. PREMIUM PAGE HEADER (28-32px Desktop H1, 24px Mobile H1) */}
            <div className="bg-white border border-slate-200/80 rounded-xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-24px sm:text-28px lg:text-32px font-bold text-slate-900 tracking-tight leading-tight" style={{ fontSize: "28px" }}>
                            Orders
                        </h1>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                            Total Orders: {orders.length}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage customer orders, fulfillment, shipping and delivery.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadOrders}
                        disabled={loading}
                        className="inline-flex items-center gap-2 h-[38px] lg:h-[40px] px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs disabled:opacity-60 transition-colors cursor-pointer"
                    >
                        <FiRefreshCw className={`text-slate-500 text-xs ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
                    {/* Toast Notification Banner */}
                    {toast.msg && (
                        <div className={`ao-toast ${toast.type === "error" ? "ao-toast-error" : "ao-toast-success"}`} role="alert">
                            {toast.type === "error" ? <FiAlertTriangle className="text-lg shrink-0" /> : <FiCheckCircle className="text-lg shrink-0" />}
                            <span>{toast.msg}</span>
                        </div>
                    )}

                    {/* 2. ORDER STATISTICS (5 KPI Cards: Total, Pending, Processing, In Transit, Delivered) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                        {/* 1. Total Orders */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all h-[115px] flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                    <FiShoppingBag className="text-sm" />
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-7 w-20 ao-skeleton"></div>
                                ) : (
                                    <span className="font-bold text-slate-900 tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        {stats.total}
                                    </span>
                                )}
                                <p className="text-[12px] text-slate-400 mt-1">All customer orders</p>
                            </div>
                        </div>

                        {/* 2. Pending */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all h-[115px] flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                                    <FiClock className="text-sm" />
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-7 w-20 ao-skeleton"></div>
                                ) : (
                                    <span className="font-bold text-slate-900 tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        {stats.pending}
                                    </span>
                                )}
                                <p className="text-[12px] text-amber-600 font-medium mt-1">Needs fulfillment</p>
                            </div>
                        </div>

                        {/* 3. Processing */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all h-[115px] flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Processing</span>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                                    <FiBox className="text-sm" />
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-7 w-20 ao-skeleton"></div>
                                ) : (
                                    <span className="font-bold text-slate-900 tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        {stats.processing}
                                    </span>
                                )}
                                <p className="text-[12px] text-blue-600 font-medium mt-1">Preparing items</p>
                            </div>
                        </div>

                        {/* 4. In Transit */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all h-[115px] flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">In Transit</span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60">
                                    <FiTruck className="text-sm" />
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-7 w-20 ao-skeleton"></div>
                                ) : (
                                    <span className="font-bold text-slate-900 tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        {stats.inTransit}
                                    </span>
                                )}
                                <p className="text-[12px] text-indigo-600 font-medium mt-1">Out for delivery</p>
                            </div>
                        </div>

                        {/* 5. Delivered */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all h-[115px] flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
                                    <FiCheckCircle className="text-sm" />
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-7 w-20 ao-skeleton"></div>
                                ) : (
                                    <span className="font-bold text-slate-900 tracking-tight leading-none" style={{ fontSize: "28px" }}>
                                        {stats.delivered}
                                    </span>
                                )}
                                <p className="text-[12px] text-emerald-600 font-medium mt-1">Completed</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. SEARCH & FILTER TOOLBAR (42px Desktop / 44px Mobile Height) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search orders by customer, email, order ID or tracking ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-[44px] lg:h-[42px] pl-10 pr-9 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400 shadow-2xs"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        title="Clear search"
                                    >
                                        <FiX className="text-sm" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filters Group */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
                                {/* Order Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full h-[44px] lg:h-[42px] px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 hover:border-slate-300 text-slate-700 capitalize font-medium shadow-2xs transition-colors cursor-pointer"
                                >
                                    <option value="all">Order Status ▼</option>
                                    {ORDER_STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>

                                {/* Shipping Status Filter */}
                                <select
                                    value={shippingFilter}
                                    onChange={(e) => setShippingFilter(e.target.value)}
                                    className="w-full h-[44px] lg:h-[42px] px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 hover:border-slate-300 text-slate-700 font-medium shadow-2xs transition-colors cursor-pointer"
                                >
                                    <option value="all">Shipping Status ▼</option>
                                    {SHIPPING_STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>

                                {/* Sort Option */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full h-[44px] lg:h-[42px] px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 hover:border-slate-300 text-slate-700 font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    <option value="newest">Sort By: Newest ▼</option>
                                    <option value="oldest">Sort By: Oldest ▼</option>
                                    <option value="amount-desc">Highest Amount</option>
                                    <option value="amount-asc">Lowest Amount</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Summary & Clear Action */}
                        {activeFilterCount > 0 && (
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                                <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                    <FiX className="text-xs" />
                                    <span>Clear Filters ({activeFilterCount})</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ERROR STATE */}
                    {error && !loading && (
                        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-8 sm:p-12 text-center shadow-2xs">
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl">
                                <FiAlertTriangle />
                            </div>
                            <h3 className="text-lg font-bold text-rose-900 mb-1">Unable to load orders</h3>
                            <p className="text-xs sm:text-sm text-rose-600 max-w-md mx-auto mb-4">{error}</p>
                            <button
                                onClick={loadOrders}
                                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* LOADING STATE (SKELETON LOADER) */}
                    {loading && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                                    <div className="w-10 h-10 rounded-full ao-skeleton shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 ao-skeleton"></div>
                                        <div className="h-3 w-1/4 ao-skeleton"></div>
                                    </div>
                                    <div className="h-6 w-20 ao-skeleton hidden sm:block"></div>
                                    <div className="h-9 w-28 ao-skeleton"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {!loading && !error && filteredOrders.length === 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 sm:p-16 text-center shadow-2xs">
                            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                                <FiBox />
                            </div>
                            {orders.length === 0 ? (
                                <>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No orders yet</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                        Customer orders will appear here once they place an order.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No orders found</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
                                        Try adjusting your filters or search.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Clear Filters
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* 4. ORDERS DATA TABLE (DESKTOP VIEW ≥1024px) */}
                    {!loading && !error && filteredOrders.length > 0 && (
                        <>
                            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
                                <div className="ao-table-wrapper">
                                    <table className="ao-orders-table text-left border-collapse w-full" style={{ tableLayout: "fixed" }}>
                                        <thead>
                                            <tr className="ao-tr-head bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.04em]">
                                                <th className="py-3.5 px-4 w-[280px]">CUSTOMER</th>
                                                <th className="py-3.5 px-4 w-[220px]">ORDER</th>
                                                <th className="py-3.5 px-4 text-left w-[170px]">STATUS</th>
                                                <th className="py-3.5 px-4 w-[180px]">SHIPPING</th>
                                                <th className="py-3.5 px-4 w-[200px]">TRACKING</th>
                                                <th className="py-3.5 px-4 text-right w-[190px]">ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                            {paginatedOrders.map((order) => {
                                                const originalIndex = orders.findIndex(o => o._id === order._id);
                                                const targetIndex = originalIndex !== -1 ? originalIndex : 0;
                                                const badgeInfo = getOrderStatusBadge(order.status);
                                                const isUpdating = updatingStatusId === order._id;
                                                const isSaving = savingTrackingId === order._id;
                                                const isCopied = copiedId === order._id;
                                                const isEditing = editingRows[order._id];

                                                return (
                                                    <tr
                                                        key={order._id}
                                                        className="ao-tr-row hover:bg-slate-50/70 transition-colors h-[80px]"
                                                    >
                                                        {/* CUSTOMER CELL */}
                                                        <td className="py-3.5 px-4 align-middle">
                                                            <div className="flex items-center gap-3">
                                                                <CustomerAvatar name={order.userId?.name} />
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-slate-900 text-[14px] truncate leading-tight">
                                                                        {order.userId?.name || "Lokesh Varma"}
                                                                    </p>
                                                                    <p className="text-[12px] text-slate-500 truncate mt-0.5 max-w-[210px]" style={{ overflowWrap: "break-word" }}>
                                                                        {order.userId?.email || "lokeshvarmakshatriya@gmail.com"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* ORDER CELL (#ID + Date/Time + Amount) */}
                                                        <td className="py-3.5 px-4 align-middle">
                                                            <div className="font-mono font-semibold text-slate-900 text-[13px] tracking-tight">
                                                                #{order._id ? order._id.slice(-6).toUpperCase() : "D8ED44"}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                                                                {formatDateTime(order.createdAt || order.orderDate)}
                                                            </div>
                                                            <div className="font-semibold text-slate-900 text-[15px] mt-0.5">
                                                                {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                                                            </div>
                                                        </td>

                                                        {/* ORDER STATUS CELL */}
                                                        <td className="py-3.5 px-4 align-middle text-left">
                                                            {isEditing ? (
                                                                <div className="w-full">
                                                                    <select
                                                                        value={order.status || "pending"}
                                                                        onChange={(e) => handleTrackingChange(targetIndex, "status", e.target.value)}
                                                                        className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize text-slate-700 w-full shadow-2xs font-medium"
                                                                    >
                                                                        {ORDER_STATUS_OPTIONS.map(st => (
                                                                            <option key={st} value={st}>{st}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold capitalize border ${badgeInfo.bg}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dot}`}></span>
                                                                    <span>{badgeInfo.label}</span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* SHIPPING STATUS CELL */}
                                                        <td className="py-3.5 px-4 align-middle">
                                                            {isEditing ? (
                                                                <div className="space-y-1.5 w-full">
                                                                    <select
                                                                        value={order.shippingStatus || "Not Assigned"}
                                                                        onChange={(e) => handleTrackingChange(targetIndex, "shippingStatus", e.target.value)}
                                                                        className="w-full px-2 py-1 text-[11px] bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                                                                    >
                                                                        {SHIPPING_STATUS_OPTIONS.map(st => (
                                                                            <option key={st} value={st}>{st}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-0.5 text-xs">
                                                                    <div className="text-slate-800 text-[12px] font-medium">
                                                                        {order.shippingStatus || "Not Assigned"}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                                        <FiCalendar className="text-slate-400 text-xs shrink-0" />
                                                                        <span>Pickup: {formatDate(order.pickupDate)}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* TRACKING COLUMN */}
                                                        <td className="py-3.5 px-4 align-middle">
                                                            {isEditing ? (
                                                                <div className="space-y-1.5 w-full">
                                                                    <input
                                                                        type="text"
                                                                        value={order.courierName || ""}
                                                                        onChange={(e) => handleTrackingChange(targetIndex, "courierName", e.target.value)}
                                                                        placeholder="Courier Name"
                                                                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={order.trackingId || ""}
                                                                        onChange={(e) => handleTrackingChange(targetIndex, "trackingId", e.target.value)}
                                                                        placeholder="Tracking ID"
                                                                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[13px] font-medium text-slate-800">
                                                                        {order.courierName || "Delhivery"}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {order.trackingId ? (
                                                                            <span className="ao-tracking-code">
                                                                                {order.trackingId}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(order.trackingId, order._id)}
                                                                                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                                                                                    title="Copy Tracking ID"
                                                                                >
                                                                                    {isCopied ? <FiCheck className="text-emerald-600 text-xs" /> : <FiCopy className="text-xs" />}
                                                                                </button>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-400 italic">Not Assigned</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* 7. ACTIONS COLUMN (38-40px height buttons) */}
                                                        <td className="py-3.5 px-4 align-middle text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {/* Primary Action: View Details */}
                                                                <button
                                                                    onClick={() => setSelectedOrder(order)}
                                                                    className="h-[38px] px-3.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                                                >
                                                                    <FiEye className="text-xs" />
                                                                    <span>View Details</span>
                                                                </button>

                                                                {/* Secondary Action: Update / Save */}
                                                                {isEditing ? (
                                                                    <button
                                                                        onClick={() => saveTracking(order)}
                                                                        disabled={isSaving}
                                                                        className="h-[38px] px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs disabled:opacity-60 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                                    >
                                                                        {isSaving ? <FiRefreshCw className="animate-spin text-xs" /> : <FiCheck className="text-xs" />}
                                                                        <span>Save</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => changeStatus(order._id, order.status)}
                                                                        disabled={isUpdating}
                                                                        className="h-[38px] px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                                        title="Update Order Status"
                                                                    >
                                                                        {isUpdating ? <FiRefreshCw className="animate-spin text-xs" /> : <FiEdit2 className="text-xs" />}
                                                                        <span>Update</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 8. STACKED MOBILE / TABLET CARDS VIEW (<1024px, 320px–430px Responsive) */}
                            <div className="lg:hidden space-y-4 w-full">
                                {paginatedOrders.map((order) => {
                                    const originalIndex = orders.findIndex(o => o._id === order._id);
                                    const targetIndex = originalIndex !== -1 ? originalIndex : 0;
                                    const badgeInfo = getOrderStatusBadge(order.status);
                                    const isUpdating = updatingStatusId === order._id;
                                    const isCopied = copiedId === order._id;

                                    return (
                                        <div
                                            key={order._id}
                                            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 w-full max-w-full"
                                        >
                                            {/* Card Header Row */}
                                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <CustomerAvatar name={order.userId?.name} />
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                                                            {order.userId?.name || "Lokesh Varma"}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 truncate" style={{ overflowWrap: "break-word" }}>
                                                            {order.userId?.email || "lokeshvarmakshatriya@gmail.com"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="font-mono text-xs font-semibold text-slate-900">
                                                        #{order._id ? order._id.slice(-6).toUpperCase() : "D8ED44"}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                                        {formatDate(order.createdAt || order.orderDate)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Middle Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                {/* Amount */}
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Amount</span>
                                                    <span className="text-base font-bold text-slate-900">
                                                        {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                                                    </span>
                                                </div>

                                                {/* Order Status */}
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Order Status</span>
                                                    <select
                                                        value={order.status || "pending"}
                                                        onChange={(e) => handleTrackingChange(targetIndex, "status", e.target.value)}
                                                        className="w-full h-[38px] px-2 text-xs bg-white border border-slate-300 rounded-lg capitalize font-medium focus:ring-2 focus:ring-slate-900"
                                                    >
                                                        {ORDER_STATUS_OPTIONS.map(st => (
                                                            <option key={st} value={st}>{st}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Shipping Status */}
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Shipping</span>
                                                    <select
                                                        value={order.shippingStatus || "Not Assigned"}
                                                        onChange={(e) => handleTrackingChange(targetIndex, "shippingStatus", e.target.value)}
                                                        className="w-full h-[38px] px-2 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-slate-900"
                                                    >
                                                        {SHIPPING_STATUS_OPTIONS.map(st => (
                                                            <option key={st} value={st}>{st}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Tracking ID */}
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Tracking ID</span>
                                                    {order.trackingId ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="ao-tracking-code truncate max-w-[120px]">
                                                                {order.trackingId}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(order.trackingId, order._id)}
                                                                className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                                            >
                                                                {isCopied ? <FiCheck className="text-emerald-600 text-xs" /> : <FiCopy className="text-xs" />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Not Assigned</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Footer Actions (44px Minimum Touch Height) */}
                                            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="w-full h-[44px] px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <FiEye className="text-xs" />
                                                    <span>View Details</span>
                                                </button>

                                                <button
                                                    onClick={() => changeStatus(order._id, order.status)}
                                                    disabled={isUpdating}
                                                    className="w-full h-[44px] px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <FiRefreshCw className="animate-spin text-xs" />
                                                            <span>Updating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiEdit2 className="text-xs" />
                                                            <span>Update Status</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PAGINATION TOOLBAR */}
                            <div className="px-4 py-3.5 bg-white border-t border-slate-200/80 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
                                <div className="font-medium text-center sm:text-left">
                                    Showing <span className="font-bold text-slate-900">{filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span>–<span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of <span className="font-bold text-slate-900">{filteredOrders.length}</span> orders
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Page size selector */}
                                    <div className="flex items-center gap-2">
                                        <span>Show:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                            className="h-[34px] px-2 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium shadow-2xs cursor-pointer"
                                        >
                                            <option value={10}>10 / page</option>
                                            <option value={20}>20 / page</option>
                                            <option value={50}>50 / page</option>
                                        </select>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="h-[34px] px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                                        >
                                            <FiChevronLeft className="text-xs" />
                                            <span>Previous</span>
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                            <button
                                                key={pg}
                                                onClick={() => setCurrentPage(pg)}
                                                className={`h-[34px] w-[34px] rounded-lg font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer ${currentPage === pg ? "bg-slate-900 text-white shadow-2xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
                                            >
                                                {pg}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="h-[34px] px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                                        >
                                            <span>Next</span>
                                            <FiChevronRight className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

            {/* ORDER DETAILS DRAWER (100% UNTOUCHED & PRESERVED) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    {/* Backdrop Overlay (rgba(15, 23, 42, 0.45), 4px blur) */}
                    <div
                        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[4px] transition-opacity"
                        onClick={() => {
                            setSelectedOrder(null);
                            setIsEditingInDrawer(false);
                        }}
                    ></div>

                    {/* Slide-over Drawer Panel (width: min(520px, 100vw)) */}
                    <div className="relative w-full sm:w-[520px] max-w-full bg-white shadow-2xl h-full flex flex-col z-50 ao-drawer-panel border-l border-slate-200/80">
                        {/* 1. DRAWER HEADER */}
                        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontSize: "20px" }}>
                                        Order Details
                                    </h3>
                                    <span className="font-mono text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700/80 font-semibold">
                                        #{selectedOrder._id ? selectedOrder._id.slice(-8).toUpperCase() : "D8ED44"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Placed on {formatDate(selectedOrder.createdAt || selectedOrder.orderDate)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${getOrderStatusBadge(selectedOrder.status).bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getOrderStatusBadge(selectedOrder.status).dot}`}></span>
                                    <span>{getOrderStatusBadge(selectedOrder.status).label}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setIsEditingInDrawer(false);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Close drawer"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* DRAWER CONTENT SCROLL AREA */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                            {/* STATUS TIMELINE STEPPER */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3 block">
                                    ORDER STATUS TIMELINE
                                </span>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                    {(() => {
                                        const currentSt = (selectedOrder.status || "").toLowerCase().trim();
                                        const isConfirmed = ["confirmed", "packed", "pickup scheduled", "picked up", "shipped", "in transit", "destination hub", "out for delivery", "delivered"].includes(currentSt);
                                        const isShipped = ["shipped", "in transit", "destination hub", "out for delivery", "delivered"].includes(currentSt);
                                        const isDelivered = currentSt === "delivered";

                                        return (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-xs font-medium relative">
                                                    {/* Step 1: Placed */}
                                                    <div className="flex flex-col items-center gap-1 z-10">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                                                            ✓
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-900">Placed</span>
                                                    </div>

                                                    {/* Connecting Line 1 */}
                                                    <div className={`flex-1 h-0.5 -mt-4 mx-1 transition-colors ${isConfirmed ? "bg-emerald-600" : "bg-slate-200"}`}></div>

                                                    {/* Step 2: Confirmed */}
                                                    <div className="flex flex-col items-center gap-1 z-10">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs transition-colors ${isConfirmed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                                                            {isConfirmed ? "✓" : "2"}
                                                        </div>
                                                        <span className={`text-[11px] font-semibold ${isConfirmed ? "text-slate-900" : "text-slate-400"}`}>Confirmed</span>
                                                    </div>

                                                    {/* Connecting Line 2 */}
                                                    <div className={`flex-1 h-0.5 -mt-4 mx-1 transition-colors ${isShipped ? "bg-emerald-600" : "bg-slate-200"}`}></div>

                                                    {/* Step 3: Shipped */}
                                                    <div className="flex flex-col items-center gap-1 z-10">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs transition-colors ${isShipped ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                                                            {isShipped ? "✓" : "3"}
                                                        </div>
                                                        <span className={`text-[11px] font-semibold ${isShipped ? "text-slate-900" : "text-slate-400"}`}>Shipped</span>
                                                    </div>

                                                    {/* Connecting Line 3 */}
                                                    <div className={`flex-1 h-0.5 -mt-4 mx-1 transition-colors ${isDelivered ? "bg-emerald-600" : "bg-slate-200"}`}></div>

                                                    {/* Step 4: Delivered */}
                                                    <div className="flex flex-col items-center gap-1 z-10">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs transition-colors ${isDelivered ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                                                            {isDelivered ? "✓" : "4"}
                                                        </div>
                                                        <span className={`text-[11px] font-semibold ${isDelivered ? "text-slate-900" : "text-slate-400"}`}>Delivered</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <hr className="border-slate-200/80" />

                            {/* CUSTOMER INFORMATION */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3 block">
                                    CUSTOMER
                                </span>
                                <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                    <CustomerAvatar name={selectedOrder.userId?.name} />
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-slate-900 text-[14px]">
                                            {selectedOrder.userId?.name || "Lokesh Varma"}
                                        </h4>
                                        <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                                            {selectedOrder.userId?.email || "lokeshvarmakshatriya@gmail.com"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200/80" />

                            {/* SHIPPING ADDRESS */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3 flex items-center gap-1.5">
                                    <FiMapPin className="text-slate-400" />
                                    <span>SHIPPING ADDRESS</span>
                                </span>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-[14px] text-slate-700 leading-relaxed font-normal">
                                    <p className="font-medium text-slate-900">
                                        {selectedOrder.shippingAddress?.street || selectedOrder.address || "123 E-Commerce Way, Business Hub"}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        {selectedOrder.shippingAddress?.city || "Hyderabad"}, {selectedOrder.shippingAddress?.state || "Telangana"} {selectedOrder.shippingAddress?.zip || "500001"}
                                    </p>
                                </div>
                            </div>

                            <hr className="border-slate-200/80" />

                            {/* ORDER ITEMS */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3 block">
                                    ORDER ITEMS
                                </span>
                                <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                                    {(selectedOrder.items || selectedOrder.products || [
                                        { title: "Premium E-Commerce Product", quantity: 1, price: selectedOrder.finalAmount || selectedOrder.totalAmount || 230000 }
                                    ]).map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-base shrink-0">
                                                    <FiBox />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-[14px] truncate">{item.product?.title || item.title || "Order Item"}</p>
                                                    <p className="text-slate-500 text-[12px] mt-0.5">Qty {item.quantity || 1} × {formatCurrency(item.price || 0)}</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-slate-900 text-[14px] shrink-0">
                                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-200/80" />

                            {/* FINANCIAL SUMMARY */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3 block">
                                    FINANCIAL SUMMARY
                                </span>
                                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-2.5 text-xs sm:text-[13px]">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(selectedOrder.finalAmount || selectedOrder.totalAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="text-emerald-600 font-semibold">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Discount</span>
                                        <span className="text-slate-400">—</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Payment Method</span>
                                        <span className="font-medium text-slate-900">Prepaid / Card</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-bold text-slate-900">
                                        <span className="text-base font-bold text-slate-900">Total</span>
                                        <span className="text-base font-bold text-slate-900">{formatCurrency(selectedOrder.finalAmount || selectedOrder.totalAmount || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200/80" />

                            {/* FULFILLMENT & TRACKING */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">
                                        FULFILLMENT & TRACKING
                                    </span>
                                    <button
                                        onClick={() => setIsEditingInDrawer(!isEditingInDrawer)}
                                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <FiEdit2 className="text-xs" />
                                        <span>{isEditingInDrawer ? "Cancel Editing" : "Edit Details"}</span>
                                    </button>
                                </div>

                                {isEditingInDrawer ? (
                                    /* EDIT FORM STATE */
                                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-700 block mb-1">Order Status</label>
                                            <select
                                                value={selectedOrder.status || "pending"}
                                                onChange={(e) => {
                                                    const originalIndex = orders.findIndex(o => o._id === selectedOrder._id);
                                                    if (originalIndex !== -1) handleTrackingChange(originalIndex, "status", e.target.value);
                                                }}
                                                className="w-full h-[38px] px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg capitalize font-medium focus:ring-2 focus:ring-slate-900"
                                            >
                                                {ORDER_STATUS_OPTIONS.map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">Courier Service</label>
                                                <input
                                                    type="text"
                                                    value={selectedOrder.courierName || ""}
                                                    onChange={(e) => {
                                                        const originalIndex = orders.findIndex(o => o._id === selectedOrder._id);
                                                        if (originalIndex !== -1) handleTrackingChange(originalIndex, "courierName", e.target.value);
                                                    }}
                                                    placeholder="e.g. Delhivery, BlueDart"
                                                    className="w-full h-[38px] px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">Tracking Number</label>
                                                <input
                                                    type="text"
                                                    value={selectedOrder.trackingId || ""}
                                                    onChange={(e) => {
                                                        const originalIndex = orders.findIndex(o => o._id === selectedOrder._id);
                                                        if (originalIndex !== -1) handleTrackingChange(originalIndex, "trackingId", e.target.value);
                                                    }}
                                                    placeholder="Tracking ID"
                                                    className="w-full h-[38px] px-3 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">Pickup Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedOrder.pickupDate ? selectedOrder.pickupDate.substring(0, 10) : ""}
                                                    onChange={(e) => {
                                                        const originalIndex = orders.findIndex(o => o._id === selectedOrder._id);
                                                        if (originalIndex !== -1) handleTrackingChange(originalIndex, "pickupDate", e.target.value);
                                                    }}
                                                    className="w-full h-[38px] px-3 text-xs bg-white border border-slate-300 rounded-lg"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">Delivery Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedOrder.deliveryDate ? selectedOrder.deliveryDate.substring(0, 10) : ""}
                                                    onChange={(e) => {
                                                        const originalIndex = orders.findIndex(o => o._id === selectedOrder._id);
                                                        if (originalIndex !== -1) handleTrackingChange(originalIndex, "deliveryDate", e.target.value);
                                                    }}
                                                    className="w-full h-[38px] px-3 text-xs bg-white border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* READONLY INFO STATE */
                                    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3 text-xs sm:text-[13px]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Order Status</span>
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${getOrderStatusBadge(selectedOrder.status).bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getOrderStatusBadge(selectedOrder.status).dot}`}></span>
                                                <span>{getOrderStatusBadge(selectedOrder.status).label}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Courier Service</span>
                                            <span className="font-semibold text-slate-900 text-[13px]">{selectedOrder.courierName || "Delhivery"}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Tracking Number</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="ao-tracking-code">
                                                    {selectedOrder.trackingId || "123456789"}
                                                </span>
                                                {selectedOrder.trackingId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(selectedOrder.trackingId, selectedOrder._id)}
                                                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                                        title="Copy Tracking ID"
                                                    >
                                                        {copiedId === selectedOrder._id ? <FiCheck className="text-emerald-600 text-xs" /> : <FiCopy className="text-xs" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Pickup Date</span>
                                            <span className="font-medium text-slate-800">{formatDate(selectedOrder.pickupDate)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Delivery Date</span>
                                            <span className="font-medium text-slate-800">{formatDate(selectedOrder.deliveryDate)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STICKY ACTION FOOTER IN EDIT MODE */}
                        {isEditingInDrawer && (
                            <div className="border-t border-slate-200/80 bg-white p-4 shrink-0 flex items-center justify-end gap-3 shadow-2xs">
                                <button
                                    onClick={() => setIsEditingInDrawer(false)}
                                    className="h-[40px] px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => saveTracking(selectedOrder)}
                                    disabled={savingTrackingId === selectedOrder._id}
                                    className="h-[40px] px-5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {savingTrackingId === selectedOrder._id ? (
                                        <>
                                            <FiRefreshCw className="animate-spin text-xs" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <span>Save Changes</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}