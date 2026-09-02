import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSellerProductById, updateSellerProduct } from "../api/sellerApi";
import {
  FiArrowLeft,
  FiUpload,
  FiAlertCircle,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    brand: "",
    discount: "0",
  });

  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      if (!id || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setFetching(true);
        setError("");

        // Single direct API call to GET /seller/products/:id
        const res = await getSellerProductById(id);
        const p = res.data?.product || res.product;

        if (!isMounted) return;

        if (!p) {
          setError("Product not found or access denied.");
          return;
        }

        setFormData({
          title: p.title || "",
          description: p.description || "",
          price: p.price !== undefined ? String(p.price) : "",
          stock: p.stock !== undefined ? String(p.stock) : "",
          category: p.category || "",
          brand: p.brand || "",
          discount: p.discount !== undefined ? String(p.discount) : "0",
        });

        const imgUrl = typeof p.image === "string" ? p.image : p.image?.url;
        setExistingImage(imgUrl || null);
        setIsDirty(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching product details for edit:", err);

        const status = err.response?.status;
        const apiMsg = err.response?.data?.message;

        if (status === 404) {
          setError("Product not found.");
        } else if (status === 403) {
          setError("Access denied. You do not have permission to edit this product.");
        } else if (status === 400) {
          setError("Invalid product ID format.");
        } else {
          setError(apiMsg || "Failed to load product details. Please try again.");
        }
      } finally {
        if (isMounted) {
          setFetching(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPEG, PNG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file size must be less than 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsDirty(true);
      setError("");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard and return to product list?")) {
        return;
      }
    }
    navigate("/products");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price || formData.stock === "") {
      setError("Title, Price, and Stock are required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");

      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("price", formData.price);
      payload.append("stock", formData.stock);
      if (formData.category) payload.append("category", formData.category.trim());
      if (formData.brand) payload.append("brand", formData.brand.trim());
      if (formData.discount !== undefined) payload.append("discount", formData.discount);
      if (imageFile) payload.append("image", imageFile);

      const res = await updateSellerProduct(id, payload);
      setSuccessMsg(res.data?.message || "Product updated successfully!");
      setIsDirty(false);

      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error("Error updating seller product:", err);
      setError(
        err.response?.data?.message || "Failed to update product listing."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "840px", margin: "0 auto", paddingBottom: "2rem" }}>
      {/* Navigation Header */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#475569",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <FiArrowLeft /> Back to Product Catalog
        </button>
      </div>

      <div className="sp-card">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Edit Product Listing
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
            Update product information, pricing, inventory stock, and media images.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              fontSize: "0.875rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}
          >
            <FiCheckCircle style={{ fontSize: "1.25rem", color: "#059669", flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#9f1239",
              fontSize: "0.875rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}
          >
            <FiAlertCircle style={{ fontSize: "1.25rem", color: "#e11d48", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {fetching ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "#64748b" }}>
            <FiRefreshCw className="animate-spin" style={{ fontSize: "1.75rem", margin: "0 auto 0.75rem auto", color: "#2563eb" }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Loading product details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Title */}
            <div className="sp-input-group" style={{ marginBottom: 0 }}>
              <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                Product Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Wireless Ergonomic Mechanical Keyboard"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={150}
                className="sp-input"
                style={{ minHeight: "44px" }}
              />
            </div>

            {/* Description */}
            <div className="sp-input-group" style={{ marginBottom: 0 }}>
              <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Detailed description of features, specifications, and package contents..."
                value={formData.description}
                onChange={handleChange}
                className="sp-textarea"
                style={{ paddingTop: "0.75rem" }}
              />
            </div>

            {/* Price & Stock Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Price (₹ INR) *
                </label>
                <input
                  type="number"
                  name="price"
                  step="1"
                  min="0"
                  placeholder="999"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="sp-input"
                  style={{ minHeight: "44px" }}
                />
              </div>

              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  placeholder="50"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  className="sp-input"
                  style={{ minHeight: "44px" }}
                />
              </div>
            </div>

            {/* Category, Brand, Discount Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder="Electronics"
                  value={formData.category}
                  onChange={handleChange}
                  className="sp-input"
                  style={{ minHeight: "44px" }}
                />
              </div>

              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  placeholder="Logitech"
                  value={formData.brand}
                  onChange={handleChange}
                  className="sp-input"
                  style={{ minHeight: "44px" }}
                />
              </div>

              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.discount}
                  onChange={handleChange}
                  className="sp-input"
                  style={{ minHeight: "44px" }}
                />
              </div>
            </div>

            {/* Compact Product Image Management Section */}
            <div className="sp-input-group" style={{ marginBottom: 0 }}>
              <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                Product Image
              </label>

              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
                {imagePreview ? (
                  /* New Image Selected Preview Card */
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                    <div className="sp-image-preview-wrapper" style={{ width: "96px", height: "96px", borderRadius: "0.5rem", border: "2px solid #2563eb", backgroundColor: "#ffffff" }}>
                      <img
                        src={imagePreview}
                        alt="New Image Preview"
                        className="sp-image-preview-img"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                        New Replacement Image Selected
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                        {imageFile?.name} ({(imageFile?.size / 1024).toFixed(0)} KB)
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="sp-btn sp-btn-danger"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", minHeight: "34px" }}
                      >
                        Cancel New Selection (Keep Current)
                      </button>
                    </div>
                  </div>
                ) : existingImage ? (
                  /* Existing Product Image Card */
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                    <div className="sp-image-preview-wrapper" style={{ width: "96px", height: "96px", borderRadius: "0.5rem", backgroundColor: "#ffffff" }}>
                      <img
                        src={existingImage}
                        alt="Current Product"
                        className="sp-image-preview-img"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                        Current Product Image
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                        Upload a new image file to replace the existing product media on storefront.
                      </p>
                      <label className="sp-btn sp-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", padding: "0.35rem 0.875rem", minHeight: "34px", cursor: "pointer" }}>
                        <FiUpload style={{ fontSize: "0.875rem" }} /> Choose Replacement Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* No Image Dropzone */
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "0.5rem", backgroundColor: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                      <FiUpload />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", display: "block" }}>
                        Upload Product Image
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        PNG, JPG, WEBP up to 5MB
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Form Submit & Cancel Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="sp-btn sp-btn-secondary"
                style={{ minHeight: "44px", padding: "0 1.25rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="sp-btn sp-btn-primary"
                style={{ minHeight: "44px", padding: "0 1.5rem" }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <FiSave style={{ fontSize: "1rem" }} />
                    <span>Save Product Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
