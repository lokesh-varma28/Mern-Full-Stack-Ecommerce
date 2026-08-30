import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getSellerProducts,
  deleteSellerProduct,
  updateSellerProduct
} from "../../api/sellerApi";
import {
  FiPlus,
  FiTrash2,
  FiEdit,
  FiRefreshCw,
  FiSearch,
  FiX
} from "react-icons/fi";

const DEFAULT_IMAGE = "https://via.placeholder.com/80x80?text=No+Image";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState({ msg: "", type: "" });

  // Edit Modal State
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    stock: "",
    category: "",
    brand: "",
    isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage({ msg: "", type: "" }), 3500);
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerProducts();
      setProducts(res.products || res.data || []);
    } catch (err) {
      console.error("Error loading seller products:", err);
      setError(err.response?.data?.message || "Failed to load seller products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setDeletingId(id);
      await deleteSellerProduct(id);
      showToast(`Product "${title}" deleted successfully`, "success");
      await loadProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast(err.response?.data?.message || "Failed to delete product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (prod) => {
    setEditProduct(prod);
    setEditForm({
      title: prod.title || "",
      price: prod.price || 0,
      stock: prod.stock || 0,
      category: prod.category || "",
      brand: prod.brand || "",
      isActive: prod.isActive !== undefined ? prod.isActive : true,
    });
  };

  const handleCloseEdit = () => {
    setEditProduct(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      setSavingEdit(true);
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("price", editForm.price);
      formData.append("stock", editForm.stock);
      formData.append("category", editForm.category);
      formData.append("brand", editForm.brand);
      formData.append("isActive", editForm.isActive);

      await updateSellerProduct(editProduct._id, formData);
      showToast("Product updated successfully", "success");
      handleCloseEdit();
      await loadProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      showToast(err.response?.data?.message || "Failed to update product", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="seller-products-page">
      {/* Toast Feedback */}
      {toastMessage.msg && (
        <div className={`seller-toast toast-${toastMessage.type}`}>
          {toastMessage.msg}
        </div>
      )}

      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Product Catalog</h1>
          <p className="seller-page-subtitle">Manage your product listings, inventory, pricing, and availability.</p>
        </div>
        <div className="seller-header-actions">
          <Link to="/seller/products/add" className="seller-primary-btn">
            <FiPlus size={18} /> Add Product
          </Link>
          <button onClick={loadProducts} className="seller-secondary-btn" title="Refresh catalog">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="seller-table-controls">
        <div className="seller-search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className="product-count-badge">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {loading ? (
        <div className="seller-page-loading">
          <div className="seller-spinner"></div>
          <p>Loading your products...</p>
        </div>
      ) : error ? (
        <div className="seller-error-banner">
          <div>
            <h3>Failed to Load Catalog</h3>
            <p>{error}</p>
          </div>
          <button onClick={loadProducts} className="seller-retry-btn">
            <FiRefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="seller-empty-state">
          <div className="empty-icon">📦</div>
          <h3>{searchQuery ? "No matching products found" : "Your catalog is empty"}</h3>
          <p>{searchQuery ? "Try refining your search terms." : "Add your first product to start selling on the platform."}</p>
          {!searchQuery && (
            <Link to="/seller/products/add" className="seller-primary-btn" style={{ marginTop: "16px" }}>
              <FiPlus size={18} /> Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="seller-table-wrapper">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const imgUrl = product.image?.url || product.image || DEFAULT_IMAGE;
                const isOutOfStock = product.stock <= 0;

                return (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <img
                          src={imgUrl}
                          alt={product.title}
                          className="product-thumbnail"
                          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                        />
                        <div>
                          <div className="product-title">{product.title}</div>
                          <div className="product-brand">{product.brand || "Generic"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{product.category || "Uncategorized"}</span>
                    </td>
                    <td className="price-cell">
                      ₹{product.price?.toLocaleString()}
                      {product.discount > 0 && (
                        <span className="discount-tag">-{product.discount}%</span>
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${isOutOfStock ? "out-of-stock" : "in-stock"}`}>
                        {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${product.isActive !== false ? "pill-active" : "pill-inactive"}`}>
                        {product.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="action-btn edit-btn"
                          title="Edit product"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.title)}
                          disabled={deletingId === product._id}
                          className="action-btn delete-btn"
                          title="Delete product"
                        >
                          {deletingId === product._id ? (
                            <span className="btn-spinner"></span>
                          ) : (
                            <FiTrash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="seller-modal-backdrop">
          <div className="seller-modal">
            <div className="modal-header">
              <h2>Quick Edit Product</h2>
              <button onClick={handleCloseEdit} className="close-btn"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  <span>Active & Listed in Catalog</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseEdit} className="seller-secondary-btn">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="seller-primary-btn">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
