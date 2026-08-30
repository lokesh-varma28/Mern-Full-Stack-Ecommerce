import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createSellerProduct } from "../api/sellerApi";
import { FiArrowLeft, FiUpload, FiAlertCircle, FiCheck } from "react-icons/fi";

export default function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    brand: "",
    discount: "0",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.title || !formData.price || !formData.stock) {
      setError("Title, Price, and Stock are required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("price", formData.price);
      payload.append("stock", formData.stock);
      if (formData.category) payload.append("category", formData.category.trim());
      if (formData.brand) payload.append("brand", formData.brand.trim());
      if (formData.discount) payload.append("discount", formData.discount);
      if (imageFile) payload.append("image", imageFile);

      await createSellerProduct(payload);
      navigate("/products");
    } catch (err) {
      console.error("Error creating seller product:", err);
      setError(
        err.response?.data?.message || "Failed to create product listing."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <FiArrowLeft /> Back to Product Catalog
        </Link>
      </div>

      <div className="sp-card">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          Add New Product Listing
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Fill out product details to list a new item in your store inventory.
        </p>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2 mb-6">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="sp-input-group mb-0">
            <label className="sp-label">Product Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Wireless Ergonomic Mechanical Keyboard"
              value={formData.title}
              onChange={handleChange}
              required
              className="sp-input"
            />
          </div>

          {/* Description */}
          <div className="sp-input-group mb-0">
            <label className="sp-label">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detailed description of features, specs, and package contents..."
              value={formData.description}
              onChange={handleChange}
              className="sp-textarea"
            />
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sp-input-group mb-0">
              <label className="sp-label">Price (₹ INR) *</label>
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
              />
            </div>


            <div className="sp-input-group mb-0">
              <label className="sp-label">Initial Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                min="0"
                placeholder="50"
                value={formData.stock}
                onChange={handleChange}
                required
                className="sp-input"
              />
            </div>
          </div>

          {/* Category & Brand Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sp-input-group mb-0">
              <label className="sp-label">Category</label>
              <input
                type="text"
                name="category"
                placeholder="Electronics"
                value={formData.category}
                onChange={handleChange}
                className="sp-input"
              />
            </div>

            <div className="sp-input-group mb-0">
              <label className="sp-label">Brand</label>
              <input
                type="text"
                name="brand"
                placeholder="Logitech"
                value={formData.brand}
                onChange={handleChange}
                className="sp-input"
              />
            </div>

            <div className="sp-input-group mb-0">
              <label className="sp-label">Discount (%)</label>
              <input
                type="number"
                name="discount"
                min="0"
                max="100"
                placeholder="0"
                value={formData.discount}
                onChange={handleChange}
                className="sp-input"
              />
            </div>
          </div>

          {/* Product Image */}
          <div className="sp-input-group mb-0">
            <label className="sp-label">Product Image</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center transition-colors bg-slate-50">
              {imagePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-contain rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <FiUpload className="text-2xl text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    Click to upload product image
                  </span>
                  <span className="text-xs text-slate-400">
                    PNG, JPG, WEBP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to="/products" className="sp-btn sp-btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="sp-btn sp-btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>Publish Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
