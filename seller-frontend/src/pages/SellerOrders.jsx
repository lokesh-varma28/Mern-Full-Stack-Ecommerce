import { useEffect, useState, useCallback } from "react";
import { getSellerOrders, updateSellerItemStatus } from "../api/sellerApi";
import {
  FiShoppingBag,
  FiRefreshCw,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerOrders();
      setOrders(res.data?.orders || res.orders || []);
    } catch (err) {
      console.error("Error loading seller orders:", err);
      setError(err.response?.data?.message || "Failed to load seller orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Allowed next status options respecting backend state machine rules
  const getAllowedStatuses = (currentStatus = "pending") => {
    const s = currentStatus.toLowerCase();
    switch (s) {
      case "pending":
        return ["confirmed", "cancelled"];
      case "confirmed":
        return ["packed", "cancelled"];
      case "packed":
        return ["shipped", "cancelled"];
      case "shipped":
        return ["delivered"];
      case "delivered":
      case "cancelled":
      default:
        return []; // Terminal state
    }
  };

  const handleStatusChange = async (orderId, itemId, currentStatus, newStatus) => {
    if (!newStatus || newStatus === currentStatus) return;
    if (
      !window.confirm(
        `Update item status from "${currentStatus.toUpperCase()}" to "${newStatus.toUpperCase()}"?`
      )
    )
      return;

    try {
      setUpdatingItemId(itemId);
      await updateSellerItemStatus(orderId, itemId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error("Error updating seller item status:", err);
      alert(err.response?.data?.message || "Failed to update item status.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const formatCurrency = (val = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status = "pending") => {
    const s = status.toLowerCase();
    switch (s) {
      case "confirmed":
        return <span className="sp-badge sp-badge-confirmed">Confirmed</span>;
      case "packed":
        return <span className="sp-badge sp-badge-packed">Packed</span>;
      case "shipped":
        return <span className="sp-badge sp-badge-shipped">Shipped</span>;
      case "delivered":
        return <span className="sp-badge sp-badge-delivered">Delivered</span>;
      case "cancelled":
        return <span className="sp-badge sp-badge-cancelled">Cancelled</span>;
      case "pending":
      default:
        return <span className="sp-badge sp-badge-pending">Pending</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Order Fulfillment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer orders containing your items and update fulfillment status.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="sp-btn sp-btn-secondary"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center mb-6">
          <FiAlertTriangle className="text-3xl text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-lg">
            Error Loading Orders
          </h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button onClick={fetchOrders} className="sp-btn sp-btn-danger">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="sp-card">
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading order fulfillment data...
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="sp-card text-center py-12 px-6">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FiShoppingBag />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No Orders Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You don't have any customer orders yet. Orders will appear here as customers purchase your items.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.items || order.products || [];
            const sellerSubtotal = items.reduce(
              (acc, item) =>
                item.itemStatus !== "cancelled"
                  ? acc + (item.price || 0) * (item.quantity || 1)
                  : acc,
              0
            );

            return (
              <div key={order._id} className="sp-card p-0 overflow-hidden">
                {/* Order Card Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                      #
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Order #{order._id}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                        {order.shippingAddress?.fullName && (
                          <span>• Customer: <strong className="text-slate-800">{order.shippingAddress.fullName}</strong></span>
                        )}
                        {order.shippingAddress?.city && (
                          <span>({order.shippingAddress.city})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Seller Subtotal</div>
                      <div className="text-sm font-extrabold text-emerald-600">{formatCurrency(sellerSubtotal)}</div>
                    </div>
                    <span className="font-semibold text-slate-600">
                      Payment: <strong className="text-slate-900 uppercase">{order.paymentStatus || "PAID"}</strong>
                    </span>
                  </div>
                </div>


              {/* Order Items Table */}
              <div className="sp-table-scroll">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Item Total</th>
                      <th>Current Status</th>
                      <th className="text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || order.products || []).map((item) => {
                      const itemId = item._id || item.itemId;
                      const currentStatus = item.sellerStatus || item.itemStatus || "pending";
                      const allowedNext = getAllowedStatuses(currentStatus);
                      const isUpdating = updatingItemId === itemId;
                      const productInfo = item.product || item.productId || item;

                      return (
                        <tr key={itemId}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {productInfo?.image ? (
                                  <img
                                    src={productInfo.image}
                                    alt={productInfo.title}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <FiPackage className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 line-clamp-1">
                                  {productInfo?.title || item.name || "Product"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Price: {formatCurrency(item.price || productInfo?.price)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="font-bold text-slate-800">
                            x{item.quantity || 1}
                          </td>

                          <td className="font-bold text-slate-900">
                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                          </td>

                          <td>{getStatusBadge(currentStatus)}</td>

                          <td className="text-right">
                            {allowedNext.length > 0 ? (
                              <div className="inline-flex items-center gap-2 justify-end">
                                <select
                                  disabled={isUpdating}
                                  value=""
                                  onChange={(e) =>
                                    handleStatusChange(
                                      order._id,
                                      itemId,
                                      currentStatus,
                                      e.target.value
                                    )
                                  }
                                  className="sp-select text-xs py-1 px-2.5 w-36 bg-white"
                                >
                                  <option value="" disabled>
                                    Select Next Status...
                                  </option>
                                  {allowedNext.map((st) => (
                                    <option key={st} value={st}>
                                      Mark as {st.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-medium">
                                Terminal State
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        </div>

      )}
    </div>
  );
}
