import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getSellerProducts, deleteSellerProduct } from "../api/sellerApi";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiBox,
  FiAlertTriangle,
  FiGrid,
  FiList,
  FiTag,
} from "react-icons/fi";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerProducts();
      setProducts(res.data?.products || res.products || []);
    } catch (err) {
      console.error("Error fetching seller products:", err);
      setError(
        err.response?.data?.message || "Failed to load seller products"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    )
      return;

    try {
      setDeletingId(id);
      await deleteSellerProduct(id);
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting seller product:", err);
      alert(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Product Catalog
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
            Manage your store items, pricing, stock levels, and storefront listings.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* View Toggle */}
          <div style={{ display: "inline-flex", backgroundColor: "#f1f5f9", borderRadius: "0.5rem", padding: "0.2rem", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`sp-btn ${viewMode === "grid" ? "sp-btn-primary" : "sp-btn-secondary"}`}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.375rem" }}
              title="Grid View"
            >
              <FiGrid />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`sp-btn ${viewMode === "table" ? "sp-btn-primary" : "sp-btn-secondary"}`}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.375rem" }}
              title="Table View"
            >
              <FiList />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={fetchProducts}
            disabled={loading}
            className="sp-btn sp-btn-secondary"
            style={{ minHeight: "40px", padding: "0 0.875rem" }}
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <Link to="/products/add" className="sp-btn sp-btn-primary" style={{ minHeight: "40px", padding: "0 1rem" }}>
            <FiPlus />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {error ? (
        <div style={{ padding: "1.5rem", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "0.75rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <FiAlertTriangle style={{ fontSize: "2rem", color: "#e11d48", margin: "0 auto 0.5rem auto" }} />
          <h3 style={{ fontWeight: 700, color: "#9f1239", fontSize: "1.125rem" }}>
            Error Loading Catalog
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#be123c", marginBottom: "1rem" }}>{error}</p>
          <button onClick={fetchProducts} className="sp-btn sp-btn-danger">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="sp-card" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading store products...
        </div>
      ) : products.length === 0 ? (
        <div className="sp-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", fontSize: "1.5rem" }}>
            <FiBox />
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
            No Products Found
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "400px", margin: "0 auto 1.25rem auto" }}>
            You haven't listed any products yet. Add your first product to start selling on the storefront.
          </p>
          <Link to="/products/add" className="sp-btn sp-btn-primary" style={{ display: "inline-flex" }}>
            <FiPlus /> Add Your First Product
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* Controlled Product Cards Grid View */
        <div className="sp-product-grid">
          {products.map((p) => {
            const isDeleting = deletingId === p._id;
            const imgUrl = typeof p.image === "string" ? p.image : p.image?.url;

            return (
              <div key={p._id} className="sp-product-card">
                {/* Controlled Product Image Container */}
                <div className="product-image-wrapper sp-product-img-wrapper">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={p.title}
                      className="sp-product-img"
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#94a3b8" }}>
                      <FiBox style={{ fontSize: "2rem", marginBottom: "0.25rem" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>No Image</span>
                    </div>
                  )}
                  {p.stock <= 0 && (
                    <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "#ef4444", color: "#ffffff", fontSize: "0.6875rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "9999px", textTransform: "uppercase" }}>
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Product Information Area */}
                <div className="sp-product-info">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#2563eb", backgroundColor: "#eff6ff", padding: "0.15rem 0.5rem", borderRadius: "0.375rem" }}>
                        {p.category || "General"}
                      </span>
                      {p.brand && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                          {p.brand}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", lineHeight: "1.35", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: "2.7rem" }}>
                      {p.title}
                    </h3>
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", display: "block" }}>
                        {formatCurrency(p.price)}
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: p.stock > 0 ? "#059669" : "#dc2626" }}>
                        {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(p._id, p.title)}
                      disabled={isDeleting}
                      className="sp-btn sp-btn-danger"
                      style={{ padding: "0.4rem 0.65rem", fontSize: "0.75rem" }}
                      title="Delete Product"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Controlled Table View */
        <div className="sp-card overflow-hidden p-0">
          <div className="sp-table-scroll">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isDeleting = deletingId === p._id;
                  const imgUrl = typeof p.image === "string" ? p.image : p.image?.url;
                  return (
                    <tr key={p._id}>
                      {/* Title & Thumbnail */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                          <div className="sp-table-thumb-wrapper">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.title}
                                className="sp-table-thumb-img"
                              />
                            ) : (
                              <FiBox style={{ color: "#94a3b8" }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                              {p.title}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                              Brand: {p.brand || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", backgroundColor: "#f1f5f9", color: "#334155", borderRadius: "0.375rem" }}>
                          {p.category || "Uncategorized"}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>
                        {formatCurrency(p.price)}
                      </td>

                      {/* Stock */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.625rem",
                            borderRadius: "9999px",
                            backgroundColor: p.stock > 10 ? "#ecfdf5" : p.stock > 0 ? "#fffbe6" : "#fff1f2",
                            color: p.stock > 10 ? "#047857" : p.stock > 0 ? "#b45309" : "#be123c",
                          }}
                        >
                          {p.stock} in stock
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="sp-badge sp-badge-delivered">
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(p._id, p.title)}
                          disabled={isDeleting}
                          className="sp-btn sp-btn-danger"
                          style={{ padding: "0.4rem 0.65rem", fontSize: "0.75rem" }}
                          title="Delete Product"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

