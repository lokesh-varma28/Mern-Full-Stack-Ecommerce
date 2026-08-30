import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getSellerProducts, deleteSellerProduct } from "../api/sellerApi";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiBox,
  FiAlertTriangle,
  FiDollarSign,
} from "react-icons/fi";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
    <div>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store items, pricing, stock levels, and listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="sp-btn sp-btn-secondary"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <Link to="/products/add" className="sp-btn sp-btn-primary">
            <FiPlus />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center mb-6">
          <FiAlertTriangle className="text-3xl text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-lg">
            Error Loading Catalog
          </h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button onClick={fetchProducts} className="sp-btn sp-btn-danger">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="sp-card">
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading products...
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="sp-card text-center py-12 px-6">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FiBox />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No Products Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            You haven't listed any products yet. Add your first product to start selling on the platform.
          </p>
          <Link to="/products/add" className="sp-btn sp-btn-primary">
            <FiPlus /> Add Your First Product
          </Link>
        </div>
      ) : (
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
                      {/* Title & Image */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <FiBox className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              Brand: {p.brand || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>


                      {/* Category */}
                      <td>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                          {p.category || "Uncategorized"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="font-bold text-slate-900">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Stock */}
                      <td>
                        <span
                          className={`font-semibold text-xs px-2.5 py-1 rounded-full ${
                            p.stock > 10
                              ? "bg-emerald-50 text-emerald-700"
                              : p.stock > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
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
                          className="sp-btn sp-btn-danger p-2 text-xs"
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
