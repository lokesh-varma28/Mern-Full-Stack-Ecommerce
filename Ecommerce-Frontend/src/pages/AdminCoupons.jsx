import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { getCoupons, deleteCoupon } from "../api/adminApi";
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiX,
  FiRefreshCw,
  FiPercent,
  FiClock,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";
import "./AdminCoupons.css";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingId, setDeletingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCoupons();
      setCoupons(res.data?.coupons || res.data || []);
    } catch (err) {
      console.error("Failed to load coupons:", err);
      setError("Unable to load coupons. We couldn't retrieve the coupon list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const remove = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

    try {
      setDeletingId(id);
      await deleteCoupon(id);
      await loadCoupons();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      alert(err.response?.data?.message || "Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponStatus = (c) => {
    const now = new Date();
    const isExpired = c.expiry && new Date(c.expiry) <= now;
    const isScheduled = c.startDate && new Date(c.startDate) > now;

    if (isScheduled) return "scheduled";
    if (isExpired || c.active === false) return "expired";
    return "active";
  };

  // Metrics derived from coupon dataset
  const metrics = useMemo(() => {
    let total = coupons.length;
    let active = 0;
    let expired = 0;
    let scheduled = 0;

    coupons.forEach((c) => {
      const st = getCouponStatus(c);
      if (st === "active") active++;
      else if (st === "expired") expired++;
      else if (st === "scheduled") scheduled++;
    });

    return { total, active, expired, scheduled };
  }, [coupons]);

  // Filtering & Sorting
  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    // 1. Search Filter (Code)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => (c.code || "").toLowerCase().includes(q));
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      result = result.filter((c) => getCouponStatus(c) === statusFilter);
    }

    // 3. Discount Type Filter
    if (typeFilter !== "all") {
      result = result.filter((c) => {
        const type = (c.discountType || "").toLowerCase();
        if (typeFilter === "percentage") return type === "percentage" || type === "percent";
        if (typeFilter === "fixed") return type === "flat" || type === "fixed" || type === "amount";
        return true;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.expiry || a._id || 0).getTime();
      const dateB = new Date(b.createdAt || b.expiry || b._id || 0).getTime();
      const valA = Number(a.discountValue) || 0;
      const valB = Number(b.discountValue) || 0;

      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "highest") return valB - valA;
      if (sortBy === "lowest") return valA - valB;
      return dateB - dateA; // newest default
    });

    return result;
  }, [coupons, search, statusFilter, typeFilter, sortBy]);

  const isFiltered = search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("newest");
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="ac-container">
      {/* 1. Page Header */}
      <header className="ac-header-card">
        <div>
          <h1 className="ac-title">
            <FiTag className="text-amber-500" /> Coupons
          </h1>
          <p className="ac-subtitle">
            Manage promotional codes, discounts and campaigns.
          </p>
        </div>

        <div className="ac-header-actions">
          <button
            onClick={loadCoupons}
            disabled={loading}
            className="ac-btn-refresh"
            title="Refresh coupon dataset"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link to="/admin/add-coupon" className="ac-btn-cta">
            <FiPlus className="text-lg" />
            <span>Add Coupon</span>
          </Link>
        </div>
      </header>

      {/* 2. KPI Cards */}
      <section className="ac-kpi-grid">
        {/* Total Coupons */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-top">
            <span className="ac-kpi-label">Total Coupons</span>
            <div className="ac-kpi-icon ac-kpi-icon--total">
              <FiTag />
            </div>
          </div>
          <div className="ac-kpi-value">{metrics.total}</div>
          <p className="ac-kpi-subtext">All promotional codes</p>
        </div>

        {/* Active */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-top">
            <span className="ac-kpi-label">Active</span>
            <div className="ac-kpi-icon ac-kpi-icon--active">
              <FiCheckCircle />
            </div>
          </div>
          <div className="ac-kpi-value">{metrics.active}</div>
          <p className="ac-kpi-subtext">Currently available</p>
        </div>

        {/* Expired */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-top">
            <span className="ac-kpi-label">Expired</span>
            <div className="ac-kpi-icon ac-kpi-icon--expired">
              <FiXCircle />
            </div>
          </div>
          <div className="ac-kpi-value">{metrics.expired}</div>
          <p className="ac-kpi-subtext">No longer valid</p>
        </div>

        {/* Scheduled */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-top">
            <span className="ac-kpi-label">Scheduled</span>
            <div className="ac-kpi-icon ac-kpi-icon--scheduled">
              <FiClock />
            </div>
          </div>
          <div className="ac-kpi-value">{metrics.scheduled}</div>
          <p className="ac-kpi-subtext">Upcoming campaigns</p>
        </div>
      </section>

      {/* 3. Toolbar: Search + Filters */}
      <section className="ac-toolbar">
        <div className="ac-toolbar-row">
          {/* Search Box */}
          <div className="ac-search-wrap">
            <FiSearch className="ac-search-icon" />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ac-search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="ac-search-clear" title="Clear search">
                <FiX />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="ac-filters-group">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ac-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="scheduled">Scheduled</option>
            </select>

            {/* Discount Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ac-select"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ac-select"
            >
              <option value="newest">Sort By: Newest</option>
              <option value="oldest">Sort By: Oldest</option>
              <option value="highest">Highest Discount</option>
              <option value="lowest">Lowest Discount</option>
            </select>
          </div>
        </div>

        {/* Toolbar Footer (Clear Filters & Count) */}
        {isFiltered && (
          <div className="ac-toolbar-footer">
            <span>
              Showing {filteredCoupons.length} of {coupons.length} coupons
            </span>
            <button onClick={clearFilters} className="ac-btn-clear">
              <FiX className="text-xs" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Main Content Area */}
      {error ? (
        /* Error State */
        <div className="ac-error-card">
          <div className="ac-error-icon">
            <FiAlertTriangle />
          </div>
          <h3 className="ac-error-title">Unable to load coupons</h3>
          <p className="ac-error-msg">{error}</p>
          <button onClick={loadCoupons} className="ac-btn-retry">
            <FiRefreshCw /> Retry
          </button>
        </div>
      ) : loading ? (
        /* Loading Skeleton State */
        <div className="ac-table-card p-6 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ac-skeleton ac-skeleton-row" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        /* Empty State */
        <div className="ac-table-card">
          <div className="ac-empty-card">
            <div className="ac-empty-icon">
              <FiTag />
            </div>
            {coupons.length === 0 ? (
              <>
                <h3 className="ac-empty-title">No coupons yet</h3>
                <p className="ac-empty-desc">
                  Create your first promotional coupon to start a campaign.
                </p>
                <Link to="/admin/add-coupon" className="ac-btn-cta">
                  <FiPlus /> Add Coupon
                </Link>
              </>
            ) : (
              <>
                <h3 className="ac-empty-title">No coupons found</h3>
                <p className="ac-empty-desc">
                  There are no promotional codes matching your current filters.
                </p>
                <button onClick={clearFilters} className="ac-btn-clear">
                  Clear Filters
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Coupons Data Surface */
        <div className="ac-table-card">
          {/* Desktop Table View (≥1024px) */}
          <div className="hidden lg:block ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  <th className="ac-th">COUPON</th>
                  <th className="ac-th">DISCOUNT</th>
                  <th className="ac-th">VALIDITY</th>
                  <th className="ac-th">USAGE</th>
                  <th className="ac-th">STATUS</th>
                  <th className="ac-th text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const isDeleting = deletingId === coupon._id;
                  const isCopied = copiedCode === coupon.code;
                  const formattedExpiry = formatDate(coupon.expiry);
                  const formattedStart = formatDate(coupon.startDate);

                  return (
                    <tr key={coupon._id} className="ac-tr">
                      {/* COUPON CELL */}
                      <td className="ac-td">
                        <div className="ac-code-wrap">
                          <span className="ac-code-badge">
                            <FiTag className="text-amber-500 text-xs" />
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="ac-code-copy"
                            title="Copy coupon code"
                          >
                            {isCopied ? (
                              <FiCheck className="text-emerald-600 text-xs" />
                            ) : (
                              <FiCopy className="text-xs" />
                            )}
                          </button>
                        </div>
                        <div className="ac-min-amount">
                          {coupon.minimumAmount
                            ? `Min order ₹${Number(coupon.minimumAmount).toLocaleString("en-IN")}`
                            : "No Minimum Order"}
                        </div>
                      </td>

                      {/* DISCOUNT CELL */}
                      <td className="ac-td">
                        {coupon.discountType === "percentage" || coupon.discountType === "percent" ? (
                          <span className="ac-discount-pill ac-discount-pill--percentage">
                            <FiPercent className="text-xs" /> {coupon.discountValue}% OFF
                          </span>
                        ) : (
                          <span className="ac-discount-pill ac-discount-pill--fixed">
                            ₹{Number(coupon.discountValue || 0).toLocaleString("en-IN")} FLAT OFF
                          </span>
                        )}
                        {coupon.maximumDiscount && (
                          <div className="ac-min-amount">
                            Max discount: ₹{Number(coupon.maximumDiscount).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* VALIDITY CELL */}
                      <td className="ac-td">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <FiCalendar className="text-slate-400 text-xs" />
                          <span>
                            {formattedStart && formattedExpiry
                              ? `${formattedStart} — ${formattedExpiry}`
                              : formattedExpiry
                              ? `Expires ${formattedExpiry}`
                              : "No Expiry"}
                          </span>
                        </div>
                      </td>

                      {/* USAGE CELL */}
                      <td className="ac-td font-semibold text-slate-800">
                        {coupon.usageLimit ? (
                          <span>
                            {coupon.usageCount || 0} / {coupon.usageLimit}
                          </span>
                        ) : (
                          <span>{coupon.usageCount !== undefined ? `${coupon.usageCount} uses` : "Unlimited"}</span>
                        )}
                      </td>

                      {/* STATUS CELL */}
                      <td className="ac-td">
                        {status === "active" ? (
                          <span className="ac-status-badge ac-status-badge--active">
                            <span className="ac-status-dot" /> Active
                          </span>
                        ) : status === "scheduled" ? (
                          <span className="ac-status-badge ac-status-badge--scheduled">
                            <span className="ac-status-dot" /> Scheduled
                          </span>
                        ) : (
                          <span className="ac-status-badge ac-status-badge--expired">
                            <span className="ac-status-dot" /> Expired
                          </span>
                        )}
                      </td>

                      {/* ACTIONS CELL */}
                      <td className="ac-td text-right">
                        <div className="ac-actions">
                          <button
                            onClick={() => remove(coupon._id, coupon.code)}
                            disabled={isDeleting}
                            className="ac-btn-delete"
                            title="Delete coupon"
                          >
                            <FiTrash2 className="text-xs" />
                            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (<1024px) */}
          <div className="block lg:hidden ac-cards-mobile">
            {filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              const isDeleting = deletingId === coupon._id;
              const isCopied = copiedCode === coupon.code;
              const formattedExpiry = formatDate(coupon.expiry);
              const formattedStart = formatDate(coupon.startDate);

              return (
                <div key={coupon._id} className="ac-mobile-card">
                  {/* Card Header: Code + Status */}
                  <div className="ac-mc-head">
                    <div className="ac-code-wrap">
                      <span className="ac-code-badge">
                        <FiTag className="text-amber-500 text-xs" />
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="ac-code-copy"
                        title="Copy code"
                      >
                        {isCopied ? <FiCheck className="text-emerald-600 text-xs" /> : <FiCopy className="text-xs" />}
                      </button>
                    </div>

                    {status === "active" ? (
                      <span className="ac-status-badge ac-status-badge--active">
                        <span className="ac-status-dot" /> Active
                      </span>
                    ) : status === "scheduled" ? (
                      <span className="ac-status-badge ac-status-badge--scheduled">
                        <span className="ac-status-dot" /> Scheduled
                      </span>
                    ) : (
                      <span className="ac-status-badge ac-status-badge--expired">
                        <span className="ac-status-dot" /> Expired
                      </span>
                    )}
                  </div>

                  {/* Card Body: Discount & Validity */}
                  <div className="ac-mc-body">
                    <div>
                      <div className="ac-mc-label">Discount</div>
                      <div className="ac-mc-val">
                        {coupon.discountType === "percentage" || coupon.discountType === "percent"
                          ? `${coupon.discountValue}% OFF`
                          : `₹${Number(coupon.discountValue || 0).toLocaleString("en-IN")} FLAT OFF`}
                      </div>
                      <div className="ac-min-amount">
                        {coupon.minimumAmount
                          ? `Min ₹${Number(coupon.minimumAmount).toLocaleString("en-IN")}`
                          : "No Min"}
                      </div>
                    </div>

                    <div>
                      <div className="ac-mc-label">Validity</div>
                      <div className="ac-mc-val text-xs font-medium">
                        {formattedStart && formattedExpiry
                          ? `${formattedStart} — ${formattedExpiry}`
                          : formattedExpiry
                          ? `Expires ${formattedExpiry}`
                          : "No Expiry"}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Usage & Delete Action */}
                  <div className="ac-mc-foot">
                    <div className="text-xs text-slate-500 font-medium">
                      Usage:{" "}
                      <strong className="text-slate-800">
                        {coupon.usageLimit ? `${coupon.usageCount || 0} / ${coupon.usageLimit}` : `${coupon.usageCount || 0} uses`}
                      </strong>
                    </div>

                    <button
                      onClick={() => remove(coupon._id, coupon.code)}
                      disabled={isDeleting}
                      className="ac-btn-delete"
                    >
                      <FiTrash2 className="text-xs" />
                      <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}