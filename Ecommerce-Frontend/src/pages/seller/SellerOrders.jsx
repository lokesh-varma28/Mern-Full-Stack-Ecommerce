import { useEffect, useState, useCallback } from "react";
import { getSellerOrders, updateSellerItemStatus } from "../../api/sellerApi";
import {
  FiRefreshCw,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiUser
} from "react-icons/fi";

const DEFAULT_IMAGE = "https://via.placeholder.com/60x60?text=No+Image";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerOrders();
      setOrders(res.orders || res.data || []);
    } catch (err) {
      console.error("Error fetching seller orders:", err);
      setError(err.response?.data?.message || "Failed to load seller orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingItemId(itemId);
      await updateSellerItemStatus(orderId, itemId, newStatus);
      showToast(`Item status updated to "${newStatus}"`, "success");
      await fetchOrders();
    } catch (err) {
      console.error("Error updating item status:", err);
      showToast(err.response?.data?.message || "Failed to update item status", "error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="seller-orders-page">
      {toast.msg && (
        <div className={`seller-toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Seller Orders</h1>
          <p className="seller-page-subtitle">Fulfill customer orders containing your products and update dispatch status.</p>
        </div>
        <div className="seller-header-actions">
          <button onClick={fetchOrders} className="seller-secondary-btn" title="Refresh orders">
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="seller-page-loading">
          <div className="seller-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="seller-error-banner">
          <div>
            <h3>Failed to Load Orders</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchOrders} className="seller-retry-btn">
            <FiRefreshCw size={16} /> Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="seller-empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>No Orders Received Yet</h3>
          <p>When customers purchase your items, their fulfillment orders will appear here.</p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {orders.map((order) => {
            const addr = order.shippingAddress;
            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A";

            return (
              <div key={order._id} className="seller-order-card">
                <div className="order-card-header">
                  <div className="order-meta">
                    <span className="order-id">Order #{order._id}</span>
                    <span className="order-date">
                      <FiCalendar size={14} /> {formattedDate}
                    </span>
                  </div>

                  <div className="order-payment-info">
                    <span className="payment-badge">
                      <FiCreditCard size={14} /> {order.paymentMethod || "COD"} ({order.paymentStatus || "Pending"})
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  {/* Seller Owned Items */}
                  <div className="order-items-section">
                    <h4 className="section-label">Your Products in this Order</h4>
                    <div className="items-list">
                      {(order.items || []).map((item) => {
                        const prod = item.product || {};
                        const imgUrl = prod.image?.url || prod.image || DEFAULT_IMAGE;
                        const itemTotal = (item.price || 0) * (item.quantity || 1);

                        return (
                          <div key={item._id} className="order-item-row">
                            <img
                              src={imgUrl}
                              alt={prod.title || "Product"}
                              className="item-img"
                              onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                            />
                            <div className="item-details">
                              <span className="item-title">{prod.title || "Product"}</span>
                              <span className="item-price-qty">
                                ₹{item.price} × {item.quantity} = <strong>₹{itemTotal}</strong>
                              </span>
                            </div>

                            <div className="item-status-control">
                              <label className="status-label">Item Status:</label>
                              <select
                                value={item.itemStatus || "pending"}
                                disabled={updatingItemId === item._id}
                                onChange={(e) => handleStatusChange(order._id, item._id, e.target.value)}
                                className={`status-select status-${item.itemStatus || "pending"}`}
                              >
                                {STATUS_OPTIONS.map((st) => (
                                  <option key={st} value={st}>
                                    {st.charAt(0).toUpperCase() + st.slice(1)}
                                  </option>
                                ))}
                              </select>
                              {updatingItemId === item._id && <span className="btn-spinner"></span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sanitized Address */}
                  {addr && (
                    <div className="order-shipping-section">
                      <h4 className="section-label">
                        <FiMapPin size={14} /> Shipping Fulfillment Address
                      </h4>
                      <div className="shipping-address-card">
                        <div className="recipient-name">
                          <FiUser size={14} /> {addr.fullName}
                        </div>
                        <div className="recipient-phone">📞 {addr.mobile}</div>
                        <div className="address-text">
                          {addr.house}, {addr.area}
                          {addr.landmark ? `, Near ${addr.landmark}` : ""}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
