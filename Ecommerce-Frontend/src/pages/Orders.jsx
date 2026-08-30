import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrders, cancelOrder, downloadInvoice } from "../api/orderApi";
import "./Orders.css";

const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23999'%3EN/A%3C/text%3E%3C/svg%3E";

const API_BASE = "https://back-end-ecommerce-i3o8.onrender.com";

function getImageUrl(url) {
    if (!url) return PLACEHOLDER;
    // Rewrite localhost URLs to the deployed backend
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
        return `${API_BASE}${url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "")}`;
    }
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const STATUS_CONFIG = {
    pending:            { label: "Pending",            color: "#e47911", bg: "#fff4e0" },
    confirmed:          { label: "Confirmed",          color: "#0066c0", bg: "#e8f0fe" },
    packed:             { label: "Packed",             color: "#6d28d9", bg: "#f3e8ff" },
    "pickup scheduled": { label: "Pickup Scheduled",   color: "#4338ca", bg: "#eef2ff" },
    "picked up":        { label: "Picked Up",          color: "#0891b2", bg: "#e0f7fa" },
    "in transit":       { label: "In Transit",         color: "#d97706", bg: "#fef3c7" },
    "destination hub":  { label: "Destination Hub",    color: "#db2777", bg: "#fce7f3" },
    "out for delivery": { label: "Out for Delivery",   color: "#0d9488", bg: "#ccfbf1" },
    delivered:          { label: "Delivered",          color: "#007600", bg: "#f0fdf4" },
    cancelled:          { label: "Cancelled",          color: "#cc0c39", bg: "#fff1f2" },
};

const CANCELLABLE = ["pending", "confirmed", "packed"];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: "#555", bg: "#f0f0f0" };
    return (
        <span
            className="ord-status-badge"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        >
            {cfg.label}
        </span>
    );
}

export default function Orders() {
    const navigate = useNavigate();
    const [orders,   setOrders]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [toast,    setToast]    = useState({ msg: "", type: "" });
    const [expanded, setExpanded] = useState({});

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3200);
    };

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getOrders();
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error(err);
            showToast("Failed to load orders", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const toggleExpand = (id) =>
        setExpanded((p) => ({ ...p, [id]: !p[id] }));

    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this order?")) return;
        try {
            await cancelOrder(id);
            showToast("Order cancelled successfully");
            loadOrders();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to cancel order", "error");
        }
    };

    const handleInvoice = async (id) => {
        try {
            const res = await downloadInvoice(id);
            const url  = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href     = url;
            link.download = `Invoice-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            showToast("Invoice download failed", "error");
        }
    };

    return (
        <div className="ord-page">
            {toast.msg && (
                <div className={`ord-toast ord-toast--${toast.type}`} role="alert">{toast.msg}</div>
            )}

            <div className="ord-inner">
                <div className="ord-page-header">
                    <h1 className="ord-page-title">Your Orders</h1>
                    {!loading && (
                        <p className="ord-page-sub">
                            {orders.length} order{orders.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="ord-loading"><div className="ord-spinner" /><p>Loading orders…</p></div>
                ) : orders.length === 0 ? (
                    <div className="ord-empty">
                        <p className="ord-empty-icon">📦</p>
                        <h2 className="ord-empty-title">No orders yet</h2>
                        <p className="ord-empty-sub">Looks like you haven't placed any orders.</p>
                        <Link to="/" className="ord-shop-btn">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="ord-list">
                        {orders.map((order) => {
                            const isOpen = expanded[order._id];
                            const canCancel = CANCELLABLE.includes(order.status);
                            const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                            });
                            return (
                                <div key={order._id} className="ord-card">
                                    {/* ── Card header ── */}
                                    <div className="ord-card-header">
                                        <div className="ord-header-meta">
                                            <div className="ord-meta-group">
                                                <span className="ord-meta-label">ORDER PLACED</span>
                                                <span className="ord-meta-val">{date}</span>
                                            </div>
                                            <div className="ord-meta-group">
                                                <span className="ord-meta-label">TOTAL</span>
                                                <span className="ord-meta-val">
                                                    ₹{Number(order.finalAmount).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            <div className="ord-meta-group">
                                                <span className="ord-meta-label">PAYMENT</span>
                                                <span className="ord-meta-val">
                                                    {order.paymentMethod === "ONLINE"
                                                        ? "Online Payment"
                                                        : "Cash on Delivery"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ord-header-right">
                                            <span className="ord-id">
                                                Order # <strong>{order._id.slice(-10).toUpperCase()}</strong>
                                            </span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </div>

                                    {/* ── Items ── */}
                                    <div className="ord-items">
                                        {order.items.map((item, idx) => {
                                            const product  = item.product;
                                            const imgUrl   = getImageUrl(product?.image?.url);
                                            const visible  = isOpen || idx === 0;
                                            if (!visible) return null;
                                            return (
                                                <div key={item._id} className="ord-item">
                                                    <div className="ord-item-img-wrap">
                                                        <img
                                                            src={imgUrl}
                                                            alt={product?.title || "Product"}
                                                            className="ord-item-img"
                                                            loading="lazy"
                                                            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                                                        />
                                                    </div>
                                                    <div className="ord-item-info">
                                                        <p className="ord-item-title">
                                                            {product?.title || "Product no longer available"}
                                                        </p>
                                                        <p className="ord-item-price">
                                                            ₹{Number(item.price).toLocaleString("en-IN")} each
                                                        </p>
                                                        <p className="ord-item-qty">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="ord-item-subtotal">
                                                        ₹{Number(item.price * item.quantity).toLocaleString("en-IN")}
                                                    </div>
                                                    {order.status === "delivered" && product && (
                                                        <button
                                                            onClick={() => navigate("/return", { state: { order, product } })}
                                                            className="ord-return-btn"
                                                        >
                                                            Return
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {order.items.length > 1 && (
                                            <button className="ord-toggle-btn" onClick={() => toggleExpand(order._id)}>
                                                {isOpen
                                                    ? "▲ Show less"
                                                    : `▼ Show ${order.items.length - 1} more item${order.items.length - 1 > 1 ? "s" : ""}`}
                                            </button>
                                        )}
                                    </div>

                                    {/* ── Footer actions ── */}
                                    <div className="ord-card-footer">
                                        <Link to={`/track/${order._id}`} className="ord-btn ord-btn--track">
                                            🚚 Track Order
                                        </Link>
                                        <button
                                            onClick={() => handleInvoice(order._id)}
                                            className="ord-btn ord-btn--invoice"
                                        >
                                            📄 Invoice
                                        </button>
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancel(order._id)}
                                                className="ord-btn ord-btn--cancel"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
