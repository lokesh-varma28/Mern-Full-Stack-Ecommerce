import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createSellerProduct } from "../../api/sellerApi";
import { FiArrowLeft, FiUploadCloud, FiCheck, FiXCircle } from "react-icons/fi";

export default function AddSellerProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    brand: "",
    discount: "0",
    featured: false,
    isActive: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!form.title.trim()) return setErrorMsg("Product title is required");
    if (!form.description.trim()) return setErrorMsg("Description is required");
    if (!form.price || Number(form.price) < 0) return setErrorMsg("Valid price is required");
    if (form.stock === "" || Number(form.stock) < 0) return setErrorMsg("Valid stock level is required");
    if (!form.category.trim()) return setErrorMsg("Category is required");
    if (!imageFile) return setErrorMsg("Product image is required");

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("category", form.category.trim());
      formData.append("brand", form.brand.trim());
      formData.append("discount", form.discount || "0");
      formData.append("featured", form.featured);
      formData.append("isActive", form.isActive);
      formData.append("image", imageFile);

      // Do NOT append seller ID. Authenticated token handles seller identity server-side.

      await createSellerProduct(formData);
      navigate("/seller/products");
    } catch (err) {
      console.error("Error creating product:", err);
      setErrorMsg(err.response?.data?.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-seller-product-page">
      <div className="seller-page-header">
        <div>
          <Link to="/seller/products" className="back-link">
            <FiArrowLeft size={16} /> Back to Products
          </Link>
          <h1 className="seller-page-title">Add New Product</h1>
          <p className="seller-page-subtitle">List a new product in your seller catalog.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="seller-error-banner" style={{ marginBottom: "20px" }}>
          <FiXCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="seller-form-card">
        <div className="form-section">
          <h3 className="section-title">Basic Information</h3>

          <div className="form-group">
            <label>Product Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Wireless Noise-Canceling Headphones"
              required
              value={form.title}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Detailed description of features, materials, and warranty..."
              required
              value={form.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                placeholder="e.g. Electronics, Clothing, Home"
                required
                value={form.category}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Sony, Nike, Custom"
                value={form.brand}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Pricing & Inventory</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                value={form.price}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                min="0"
                placeholder="0"
                required
                value={form.stock}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                name="discount"
                min="0"
                max="100"
                placeholder="0"
                value={form.discount}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Product Image *</h3>

          <div className="image-upload-wrapper">
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleImageChange}
              />
              <FiUploadCloud size={32} className="upload-icon" />
              <span>Click or drag image file here</span>
              <small>JPEG, PNG, WEBP up to 5MB</small>
            </label>

            {imagePreview && (
              <div className="image-preview-card">
                <img src={imagePreview} alt="Preview" />
                <span className="preview-label">Image Selected</span>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Visibility & Options</h3>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleInputChange}
              />
              <span>Active (Visible for customer purchases)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleInputChange}
              />
              <span>Featured Product</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/seller/products" className="seller-secondary-btn">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="seller-primary-btn"
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span> Creating...
              </>
            ) : (
              <>
                <FiCheck size={18} /> Publish Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
