import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminSellers,
  approveSeller,
  rejectSeller,
} from "../../api/adminApi";
import {
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiMapPin,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import "./AdminSellers.css";

export default function AdminSellers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "approve", // 'approve' or 'reject'
    sellerId: null,
    sellerName: "",
    storeName: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search && search.trim()) params.search = search.trim();

      const res = await getAdminSellers(params);
      setSellers(res.data?.sellers || res.sellers || []);
    } catch (err) {
      console.error("Error loading admin sellers:", err);
      setError(
        err.response?.data?.message || "Failed to load seller applications"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const openApproveModal = (seller) => {
    setConfirmModal({
      isOpen: true,
      type: "approve",
      sellerId: seller._id,
      sellerName: seller.name || "Seller",
      storeName: seller.storeName || seller.name || "Merchant Store",
    });
  };

  const openRejectModal = (seller) => {
    setConfirmModal({
      isOpen: true,
      type: "reject",
      sellerId: seller._id,
      sellerName: seller.name || "Seller",
      storeName: seller.storeName || seller.name || "Merchant Store",
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: "approve",
      sellerId: null,
      sellerName: "",
      storeName: "",
    });
  };

  const handleConfirmAction = async () => {
    const { sellerId, sellerName, storeName, type } = confirmModal;
    if (!sellerId) return;

    try {
      setActionId(sellerId);
      if (type === "approve") {
        await approveSeller(sellerId);
        showToast(`Seller "${storeName}" approved successfully`, "success");
      } else {
        await rejectSeller(sellerId);
        showToast(`Seller "${storeName}" rejected`, "success");
      }
      closeConfirmModal();
      await loadSellers();
    } catch (err) {
      console.error(`Error processing ${type}:`, err);
      showToast(
        err.response?.data?.message || `Failed to ${type} seller application`,
        "error"
      );
    } finally {
      setActionId(null);
    }
  };

  // Metrics summary calculated from existing seller dataset
  const metrics = useMemo(() => {
    const total = sellers.length;
    const pending = sellers.filter((s) => s.sellerStatus === "pending").length;
    const approved = sellers.filter((s) => s.sellerStatus === "approved").length;
    const rejected = sellers.filter((s) => s.sellerStatus === "rejected").length;
    return { total, pending, approved, rejected };
  }, [sellers]);

  // Client-side fallback filter/search for instantaneous typing feedback
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const matchesFilter =
        statusFilter === "all" || s.sellerStatus === statusFilter;
      const matchesSearch =
        !search.trim() ||
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.storeName || "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sellers, statusFilter, search]);

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "S"
    );
  };

  return (
    <>
      <div className="as-container">
          {/* Toast Notification Banner */}
          {toast.msg && (
            <div
              className={`as-toast-banner ${
                toast.type === "success" ? "as-toast-success" : "as-toast-error"
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <FiCheckCircle className="text-lg" />
                ) : (
                  <FiAlertTriangle className="text-lg" />
                )}
                <span>{toast.msg}</span>
              </div>
              <button
                onClick={() => setToast({ msg: "", type: "" })}
                className="hover:opacity-75 text-lg"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="as-header-wrap">
            <div>
              <h1 className="as-title">
                <FiUsers className="text-amber-500" /> Seller Management & Approval
              </h1>
              <p className="as-subtitle">
                Review, approve, or reject merchant partner applications and track active store owners.
              </p>
            </div>

            <button
              onClick={loadSellers}
              disabled={loading}
              className="as-btn-refresh"
              title="Refresh seller applications list"
            >
              <FiRefreshCw className={loading ? "as-spin" : ""} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Summary Metric Cards */}
          <div className="as-stats-grid">
            <div className="as-stat-card">
              <div className="as-stat-top">
                <span className="as-stat-label">Total Applications</span>
                <div className="as-stat-icon as-icon-total">
                  <FiUsers />
                </div>
              </div>
              <div className="as-stat-value">{metrics.total}</div>
              <div className="as-stat-subtext">All registered merchants</div>
            </div>

            <div className="as-stat-card">
              <div className="as-stat-top">
                <span className="as-stat-label">Pending Review</span>
                <div className="as-stat-icon as-icon-pending">
                  <FiClock />
                </div>
              </div>
              <div className="as-stat-value">{metrics.pending}</div>
              <div className="as-stat-subtext">Awaiting admin approval</div>
            </div>

            <div className="as-stat-card">
              <div className="as-stat-top">
                <span className="as-stat-label">Approved Sellers</span>
                <div className="as-stat-icon as-icon-approved">
                  <FiCheckCircle />
                </div>
              </div>
              <div className="as-stat-value">{metrics.approved}</div>
              <div className="as-stat-subtext">Active store owners</div>
            </div>

            <div className="as-stat-card">
              <div className="as-stat-top">
                <span className="as-stat-label">Rejected</span>
                <div className="as-stat-icon as-icon-rejected">
                  <FiXCircle />
                </div>
              </div>
              <div className="as-stat-value">{metrics.rejected}</div>
              <div className="as-stat-subtext">Applications declined</div>
            </div>
          </div>

          {/* Controls Bar: Filter Tabs & Search Box */}
          <div className="as-controls-card">
            {/* Filter Tabs */}
            <div className="as-filter-tabs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`as-tab-btn ${statusFilter === "all" ? "active" : ""}`}
              >
                <span>All</span>
                <span className="as-tab-count">{metrics.total}</span>
              </button>

              <button
                onClick={() => setStatusFilter("pending")}
                className={`as-tab-btn ${statusFilter === "pending" ? "active" : ""}`}
              >
                <span>Pending</span>
                <span className="as-tab-count">{metrics.pending}</span>
              </button>

              <button
                onClick={() => setStatusFilter("approved")}
                className={`as-tab-btn ${statusFilter === "approved" ? "active" : ""}`}
              >
                <span>Approved</span>
                <span className="as-tab-count">{metrics.approved}</span>
              </button>

              <button
                onClick={() => setStatusFilter("rejected")}
                className={`as-tab-btn ${statusFilter === "rejected" ? "active" : ""}`}
              >
                <span>Rejected</span>
                <span className="as-tab-count">{metrics.rejected}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="as-search-box">
              <FiSearch className="as-search-icon" />
              <input
                type="text"
                placeholder="Search seller, email, store..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="as-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="as-clear-btn"
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          {error ? (
            /* Error State */
            <div className="as-error-state">
              <div className="as-error-icon-wrap">
                <FiAlertTriangle />
              </div>
              <h3 className="as-error-title">Unable to Load Sellers</h3>
              <p className="as-error-msg">{error}</p>
              <button onClick={loadSellers} className="as-btn-retry">
                <FiRefreshCw />
                <span>Try Again</span>
              </button>
            </div>
          ) : loading ? (
            /* Loading Skeleton State */
            <div className="as-table-card">
              <div className="as-table-scroll">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Seller & Store</th>
                      <th>Contact Info</th>
                      <th>Products</th>
                      <th>Orders</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="as-skeleton as-skeleton-avatar"></div>
                            <div className="flex-1">
                              <div className="as-skeleton as-skeleton-text mb-1"></div>
                              <div className="as-skeleton as-skeleton-sub"></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="as-skeleton as-skeleton-text mb-1"></div>
                          <div className="as-skeleton as-skeleton-sub"></div>
                        </td>
                        <td>
                          <div className="as-skeleton as-skeleton-text w-8"></div>
                        </td>
                        <td>
                          <div className="as-skeleton as-skeleton-text w-8"></div>
                        </td>
                        <td>
                          <div className="as-skeleton as-skeleton-pill"></div>
                        </td>
                        <td className="text-right">
                          <div className="as-skeleton as-skeleton-pill ml-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : filteredSellers.length === 0 ? (
            /* Empty State */
            <div className="as-table-card">
              <div className="as-empty-state">
                <div className="as-empty-icon-wrap">
                  <FiUsers />
                </div>
                <h3 className="as-empty-title">No Seller Applications Found</h3>
                <p className="as-empty-desc">
                  {search || statusFilter !== "all"
                    ? "No seller applications match your active search term or status filter."
                    : "There are currently no seller onboarding applications in the system."}
                </p>
                {(search || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="as-btn-reset"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Seller Table */
            <div className="as-table-card">
              <div className="as-table-scroll">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Seller & Store</th>
                      <th>Contact Info</th>
                      <th>Products</th>
                      <th>Orders</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map((seller) => {
                      const isPending = seller.sellerStatus === "pending";
                      const isApproved = seller.sellerStatus === "approved";
                      const isRejected = seller.sellerStatus === "rejected";
                      const isProcessing = actionId === seller._id;

                      return (
                        <tr key={seller._id}>
                          {/* Seller & Store Info */}
                          <td>
                            <div className="as-seller-cell">
                              <div className="as-avatar">
                                {getInitials(seller.name)}
                              </div>
                              <div>
                                <div className="as-seller-name">{seller.name}</div>
                                <div className="as-store-name">
                                  <FiShoppingBag className="text-amber-500 flex-shrink-0" />
                                  <span>{seller.storeName || "Store Name Not Provided"}</span>
                                </div>
                                <div className="as-seller-email">
                                  <FiMail className="flex-shrink-0" />
                                  <span>{seller.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td>
                            <div className="as-contact-info">
                              <div className="as-phone">
                                <FiPhone className="text-gray-400 flex-shrink-0" />
                                <span>{seller.phone || "N/A"}</span>
                              </div>
                              {seller.businessAddress && (
                                <div className="as-address" title={seller.businessAddress}>
                                  <FiMapPin className="text-gray-400 flex-shrink-0" />
                                  <span>{seller.businessAddress}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Products Count */}
                          <td>
                            <span className="as-count-pill">
                              {seller.productCount !== undefined ? seller.productCount : 0}
                            </span>
                          </td>

                          {/* Orders Count */}
                          <td>
                            <span className="as-count-pill">
                              {seller.orderCount !== undefined ? seller.orderCount : 0}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td>
                            {isApproved ? (
                              <span className="as-badge as-badge-approved">
                                <span className="as-badge-dot"></span>
                                Approved
                              </span>
                            ) : isRejected ? (
                              <span className="as-badge as-badge-rejected">
                                <span className="as-badge-dot"></span>
                                Rejected
                              </span>
                            ) : (
                              <span className="as-badge as-badge-pending">
                                <span className="as-badge-dot"></span>
                                Pending Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="text-right">
                            <div className="as-actions-wrap">
                              {isPending && isAdmin ? (
                                <>
                                  <button
                                    onClick={() => openApproveModal(seller)}
                                    disabled={isProcessing}
                                    className="as-btn-approve"
                                  >
                                    <FiCheck />
                                    <span>
                                      {isProcessing ? "Processing..." : "Approve"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(seller)}
                                    disabled={isProcessing}
                                    className="as-btn-reject"
                                  >
                                    <FiX />
                                    <span>
                                      {isProcessing ? "Processing..." : "Reject"}
                                    </span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium italic">
                                  {isApproved
                                    ? "Approved Merchant"
                                    : isRejected
                                    ? "Application Rejected"
                                    : "Pending Review"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Summary Footer */}
              <div className="as-table-footer">
                <span>
                  Showing <strong>{filteredSellers.length}</strong> of{" "}
                  <strong>{sellers.length}</strong> seller applications
                </span>
                {search && (
                  <span>
                    Filtered by <em>"{search}"</em>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="as-modal-backdrop">
          <div className="as-modal-card">
            <div className="as-modal-header">
              <div
                className={`as-modal-icon ${
                  confirmModal.type === "approve"
                    ? "as-modal-icon-approve"
                    : "as-modal-icon-reject"
                }`}
              >
                {confirmModal.type === "approve" ? (
                  <FiCheckCircle />
                ) : (
                  <FiAlertCircle />
                )}
              </div>
              <div>
                <h3 className="as-modal-title">
                  {confirmModal.type === "approve"
                    ? "Approve Seller Application?"
                    : "Reject Seller Application?"}
                </h3>
                <p className="as-modal-subtitle">
                  Store: <strong>{confirmModal.storeName}</strong> ({confirmModal.sellerName})
                </p>
              </div>
            </div>

            <div className="as-modal-body">
              {confirmModal.type === "approve" ? (
                <p>
                  Once approved, this seller will be able to log in to the <strong>Seller Portal</strong>, add products to the catalog, and fulfill customer orders.
                </p>
              ) : (
                <p>
                  Rejecting this application will decline partner access for <strong>{confirmModal.storeName}</strong>. The seller will remain blocked from accessing the Seller Portal dashboard.
                </p>
              )}
            </div>

            <div className="as-modal-footer">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={Boolean(actionId)}
                className="as-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={Boolean(actionId)}
                className={
                  confirmModal.type === "approve"
                    ? "as-btn-confirm-approve"
                    : "as-btn-confirm-reject"
                }
              >
                {actionId ? "Processing..." : confirmModal.type === "approve" ? "Approve Seller" : "Reject Seller"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
