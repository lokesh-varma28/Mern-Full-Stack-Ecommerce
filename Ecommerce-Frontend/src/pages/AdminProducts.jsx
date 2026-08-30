import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct, editProduct } from "../api/adminApi";
import {
  FiBox,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import "./AdminProducts.css";

const PLACEHOLDER = "https://via.placeholder.com/60x60?text=Product";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Inline edit state
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(res.data?.products || res.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ── Delete product ── */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      showToast(`"${title}" deleted successfully`);
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete product", "error");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Open inline edit ── */
  const openEdit = (product) => {
    setEditRow(product._id);
    setEditForm({
      title: product.title || "",
      price: product.price || "",
      stock: product.stock ?? "",
      category: product.category || "",
      brand: product.brand || "",
      description: product.description || "",
    });
  };

  /* ── Save inline edit ── */
  const handleSaveEdit = async (id) => {
    if (!editForm.title.trim()) {
      showToast("Title is required", "warn");
      return;
    }
    if (!editForm.price || editForm.price <= 0) {
      showToast("Enter a valid price", "warn");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", editForm.title.trim());
      fd.append("price", editForm.price);
      fd.append("stock", editForm.stock);
      fd.append("category", editForm.category.trim());
      fd.append("brand", editForm.brand.trim());
      fd.append("description", editForm.description.trim());
      await editProduct(id, fd);
      showToast("Product updated successfully");
      setEditRow(null);
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update product", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Metrics calculation ── */
  const metrics = useMemo(() => {
    let total = products.length;
    let active = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const st = Number(p.stock) || 0;
      if (st === 0) {
        outOfStock++;
      } else if (st <= 5) {
        lowStock++;
        active++;
      } else {
        active++;
      }
    });

    return { total, active, lowStock, outOfStock };
  }, [products]);

  /* ── Dynamic Category & Brand Dropdown Options ── */
  const categoriesList = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const brandsList = useMemo(() => {
    const brands = new Set(products.map((p) => p.brand).filter(Boolean));
    return Array.from(brands);
  }, [products]);

  /* ── Filtering and Sorting ── */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // 3. Brand Filter
    if (brandFilter !== "all") {
      result = result.filter((p) => p.brand === brandFilter);
    }

    // 4. Stock Filter
    if (stockFilter !== "all") {
      result = result.filter((p) => {
        const st = Number(p.stock) || 0;
        if (stockFilter === "instock") return st > 5;
        if (stockFilter === "lowstock") return st > 0 && st <= 5;
        if (stockFilter === "outstock") return st === 0;
        return true;
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const stockA = Number(a.stock) || 0;
      const stockB = Number(b.stock) || 0;
      const dateA = new Date(a.createdAt || a._id || 0).getTime();
      const dateB = new Date(b.createdAt || b._id || 0).getTime();

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "stock_asc") return stockA - stockB;
      return dateB - dateA;
    });

    return result;
  }, [products, search, categoryFilter, brandFilter, stockFilter, sortBy]);

  const isFiltered =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    stockFilter !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  const getStockBadge = (stock) => {
    const st = Number(stock) || 0;
    if (st === 0) {
      return (
        <span className="ap-badge ap-badge--stock-out">
          Out of Stock
        </span>
      );
    }
    if (st <= 5) {
      return (
        <span className="ap-badge ap-badge--stock-low">
          Low Stock ({st} left)
        </span>
      );
    }
    return (
      <span className="ap-badge ap-badge--stock-ok">
        In Stock ({st})
      </span>
    );
  };

  return (
    <div className="ap-container">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`ap-toast ap-toast--${toast.type}`} role="alert">
          {toast.msg}
        </div>
      )}

      {/* 1. Page Header */}
      <header className="ap-header-card">
        <div>
          <h1 className="ap-title">
            <FiBox className="text-blue-600" /> Products
          </h1>
          <p className="ap-subtitle">
            Manage your product catalog, inventory and pricing.
          </p>
        </div>

        <div className="ap-header-actions">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="ap-btn-refresh"
            title="Refresh product catalog"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link to="/admin/add-product" className="ap-btn-cta">
            <FiPlus className="text-lg" />
            <span>Add Product</span>
          </Link>
        </div>
      </header>

      {/* 2. Summary KPI Cards */}
      <section className="ap-kpi-grid">
        {/* Total Products */}
        <div className="ap-kpi-card">
          <div className="ap-kpi-top">
            <span className="ap-kpi-label">Total Products</span>
            <div className="ap-kpi-icon ap-kpi-icon--total">
              <FiBox />
            </div>
          </div>
          <div className="ap-kpi-value">{metrics.total}</div>
          <p className="ap-kpi-subtext">All catalog items</p>
        </div>

        {/* Active Products */}
        <div className="ap-kpi-card">
          <div className="ap-kpi-top">
            <span className="ap-kpi-label">Active Products</span>
            <div className="ap-kpi-icon ap-kpi-icon--active">
              <FiCheckCircle />
            </div>
          </div>
          <div className="ap-kpi-value">{metrics.active}</div>
          <p className="ap-kpi-subtext">Available for purchase</p>
        </div>

        {/* Low Stock */}
        <div className="ap-kpi-card">
          <div className="ap-kpi-top">
            <span className="ap-kpi-label">Low Stock</span>
            <div className="ap-kpi-icon ap-kpi-icon--low">
              <FiAlertCircle />
            </div>
          </div>
          <div className="ap-kpi-value">{metrics.lowStock}</div>
          <p className="ap-kpi-subtext">5 or fewer units left</p>
        </div>

        {/* Out of Stock */}
        <div className="ap-kpi-card">
          <div className="ap-kpi-top">
            <span className="ap-kpi-label">Out of Stock</span>
            <div className="ap-kpi-icon ap-kpi-icon--out">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="ap-kpi-value">{metrics.outOfStock}</div>
          <p className="ap-kpi-subtext">Depleted inventory</p>
        </div>
      </section>

      {/* 3. Search & Multi-Filter Toolbar */}
      <section className="ap-toolbar">
        <div className="ap-toolbar-row">
          {/* Search Box */}
          <div className="ap-search-wrap">
            <FiSearch className="ap-search-icon" />
            <input
              type="text"
              placeholder="Search title, category, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ap-search-input"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ap-search-clear"
                title="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="ap-filters-group">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="ap-select"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="ap-select"
            >
              <option value="all">All Brands</option>
              {brandsList.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="ap-select"
            >
              <option value="all">All Stock Status</option>
              <option value="instock">In Stock (&gt;5)</option>
              <option value="lowstock">Low Stock (≤5)</option>
              <option value="outstock">Out of Stock</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ap-select"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
            </select>
          </div>
        </div>

        {/* Toolbar Footer (Count & Clear) */}
        {isFiltered && (
          <div className="ap-toolbar-footer">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <button onClick={clearFilters} className="ap-btn-clear">
              <FiX className="text-xs" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Product Table Surface */}
      <div className="ap-table-card">
        {loading ? (
          /* Loading Skeleton State */
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="ap-skeleton ap-skeleton-row" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="ap-empty-card">
            <div className="ap-empty-icon">
              <FiBox />
            </div>
            {products.length === 0 ? (
              <>
                <h3 className="ap-empty-title">No products found</h3>
                <p className="ap-empty-desc">
                  Your product catalog is currently empty. Add your first product to start selling.
                </p>
                <Link to="/admin/add-product" className="ap-btn-cta">
                  <FiPlus /> Add First Product
                </Link>
              </>
            ) : (
              <>
                <h3 className="ap-empty-title">No matching products</h3>
                <p className="ap-empty-desc">
                  There are no products matching your search or filter criteria.
                </p>
                <button onClick={clearFilters} className="ap-btn-clear">
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (≥1024px) */}
            <div className="hidden lg:block ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th className="ap-th">PRODUCT</th>
                    <th className="ap-th">CATEGORY</th>
                    <th className="ap-th">BRAND</th>
                    <th className="ap-th">PRICE</th>
                    <th className="ap-th">STOCK</th>
                    <th className="ap-th">STATUS</th>
                    <th className="ap-th text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isEditing = editRow === product._id;
                    const isDeleting = deleting === product._id;
                    const stockNum = Number(product.stock) || 0;

                    return (
                      <tr
                        key={product._id}
                        className={`ap-tr ${isEditing ? "ap-tr--editing" : ""}`}
                      >
                        {/* PRODUCT CELL */}
                        <td className="ap-td">
                          {isEditing ? (
                            <input
                              type="text"
                              className="ap-input-edit"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({ ...editForm, title: e.target.value })
                              }
                              placeholder="Product Title"
                            />
                          ) : (
                            <div className="ap-product-cell">
                              <img
                                src={product.image?.url || PLACEHOLDER}
                                alt={product.title}
                                className="ap-thumb"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = PLACEHOLDER;
                                }}
                              />
                              <div>
                                <div className="ap-product-title">
                                  {product.title}
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">
                                  ID: #{product._id.slice(-6).toUpperCase()}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* CATEGORY CELL */}
                        <td className="ap-td">
                          {isEditing ? (
                            <input
                              type="text"
                              className="ap-input-edit"
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm({ ...editForm, category: e.target.value })
                              }
                              placeholder="Category"
                            />
                          ) : (
                            <span className="ap-badge ap-badge--cat">
                              {product.category || "General"}
                            </span>
                          )}
                        </td>

                        {/* BRAND CELL */}
                        <td className="ap-td font-medium text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              className="ap-input-edit"
                              value={editForm.brand}
                              onChange={(e) =>
                                setEditForm({ ...editForm, brand: e.target.value })
                              }
                              placeholder="Brand"
                            />
                          ) : (
                            product.brand || "—"
                          )}
                        </td>

                        {/* PRICE CELL */}
                        <td className="ap-td font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              className="ap-input-edit"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: e.target.value })
                              }
                              placeholder="Price"
                              min="0"
                            />
                          ) : (
                            `₹${Number(product.price).toLocaleString("en-IN")}`
                          )}
                        </td>

                        {/* STOCK CELL */}
                        <td className="ap-td">
                          {isEditing ? (
                            <input
                              type="number"
                              className="ap-input-edit"
                              value={editForm.stock}
                              onChange={(e) =>
                                setEditForm({ ...editForm, stock: e.target.value })
                              }
                              placeholder="Stock"
                              min="0"
                            />
                          ) : (
                            getStockBadge(product.stock)
                          )}
                        </td>

                        {/* STATUS CELL */}
                        <td className="ap-td">
                          {stockNum > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
                            </span>
                          )}
                        </td>

                        {/* ACTIONS CELL */}
                        <td className="ap-td text-right">
                          <div className="ap-actions">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(product._id)}
                                  disabled={saving}
                                  className="ap-btn-save"
                                >
                                  <FiCheck /> {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditRow(null)}
                                  className="ap-btn-cancel"
                                >
                                  <FiX /> Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEdit(product)}
                                  className="ap-btn-edit"
                                  title="Quick edit product"
                                >
                                  <FiEdit2 /> Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(product._id, product.title)
                                  }
                                  disabled={isDeleting}
                                  className="ap-btn-delete"
                                  title="Delete product"
                                >
                                  <FiTrash2 /> {isDeleting ? "..." : "Delete"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Product Cards (<1024px) */}
            <div className="block lg:hidden ap-cards-mobile">
              {filteredProducts.map((product) => {
                const isEditing = editRow === product._id;
                const isDeleting = deleting === product._id;

                return (
                  <div key={product._id} className="ap-mobile-card">
                    <div className="ap-mc-head">
                      <img
                        src={product.image?.url || PLACEHOLDER}
                        alt={product.title}
                        className="ap-thumb"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            className="ap-input-edit mb-1"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({ ...editForm, title: e.target.value })
                            }
                          />
                        ) : (
                          <h4 className="ap-product-title truncate">
                            {product.title}
                          </h4>
                        )}
                        <span className="ap-badge ap-badge--cat mt-1">
                          {product.category || "General"}
                        </span>
                      </div>
                    </div>

                    <div className="ap-mc-body">
                      <div>
                        <div className="ap-mc-label">Price</div>
                        <div className="ap-mc-val">
                          {isEditing ? (
                            <input
                              type="number"
                              className="ap-input-edit"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: e.target.value })
                              }
                            />
                          ) : (
                            `₹${Number(product.price).toLocaleString("en-IN")}`
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="ap-mc-label">Stock Status</div>
                        <div className="mt-1">
                          {isEditing ? (
                            <input
                              type="number"
                              className="ap-input-edit"
                              value={editForm.stock}
                              onChange={(e) =>
                                setEditForm({ ...editForm, stock: e.target.value })
                              }
                            />
                          ) : (
                            getStockBadge(product.stock)
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ap-mc-foot">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(product._id)}
                            disabled={saving}
                            className="ap-btn-save text-xs"
                          >
                            <FiCheck /> {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditRow(null)}
                            className="ap-btn-cancel text-xs"
                          >
                            <FiX /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openEdit(product)}
                            className="ap-btn-edit text-xs"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product._id, product.title)
                            }
                            disabled={isDeleting}
                            className="ap-btn-delete text-xs"
                          >
                            <FiTrash2 /> {isDeleting ? "..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
