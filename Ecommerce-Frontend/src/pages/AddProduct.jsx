import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addProduct } from "../api/adminApi";
import "./AddProduct.css";

const EMPTY = {
    title:         "",
    description:   "",
    price:         "",
    originalPrice: "",
    stock:         "",
    category:      "",
    brand:         "",
};

export default function AddProduct() {
    const navigate = useNavigate();
    const fileRef  = useRef(null);

    const [form,      setForm]      = useState(EMPTY);
    const [image,     setImage]     = useState(null);
    const [preview,   setPreview]   = useState(null);
    const [saving,    setSaving]    = useState(false);
    const [toast,     setToast]     = useState({ msg: "", type: "" });
    const [dragOver,  setDragOver]  = useState(false);
    const [errors,    setErrors]    = useState({});

    /* ── toast ── */
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    };

    /* ── field change ── */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    };

    /* ── image pick ── */
    const applyImage = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file (JPG, PNG, WEBP)", "warn");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be smaller than 5 MB", "warn");
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setErrors((p) => ({ ...p, image: "" }));
    };

    const handleFileInput = (e) => applyImage(e.target.files[0]);

    /* ── drag & drop ── */
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        applyImage(e.dataTransfer.files[0]);
    };

    /* ── remove image ── */
    const removeImage = () => {
        setImage(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    /* ── validate ── */
    const validate = () => {
        const e = {};
        if (!form.title.trim())       e.title       = "Product title is required";
        if (!form.description.trim()) e.description = "Description is required";
        if (!form.price || Number(form.price) <= 0)
                                      e.price       = "Enter a valid price";
        if (form.stock === "" || Number(form.stock) < 0)
                                      e.stock       = "Enter a valid stock quantity";
        if (!image)                   e.image       = "Product image is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ── submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            showToast("Please fix the errors before saving", "warn");
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title",       form.title.trim());
            fd.append("description", form.description.trim());
            fd.append("price",       form.price);
            fd.append("stock",       form.stock);
            fd.append("image",       image);
            // extra fields (backend ignores unknown fields gracefully)
            if (form.originalPrice) fd.append("originalPrice", form.originalPrice);
            if (form.category)      fd.append("category",      form.category.trim());
            if (form.brand)         fd.append("brand",         form.brand.trim());

            await addProduct(fd);
            showToast("Product added successfully! 🎉", "success");
            setTimeout(() => navigate("/admin/products"), 1400);
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to add product", "error");
        } finally {
            setSaving(false);
        }
    };

    const discountPct =
        form.originalPrice && form.price &&
        Number(form.originalPrice) > Number(form.price)
            ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
            : null;

    return (
        <div className="ap-page">

            {/* Toast */}
            {toast.msg && (
                <div className={`ap-toast ap-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <div className="ap-inner">

                {/* ── Breadcrumb ── */}
                <nav className="ap-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/admin"          className="ap-crumb">Dashboard</Link>
                    <span className="ap-crumb-sep">›</span>
                    <Link to="/admin/products" className="ap-crumb">Products</Link>
                    <span className="ap-crumb-sep">›</span>
                    <span className="ap-crumb ap-crumb--active">Add Product</span>
                </nav>

                {/* ── Page heading ── */}
                <div className="ap-page-header">
                    <div>
                        <h1 className="ap-page-title">Add a New Product</h1>
                        <p className="ap-page-sub">Fill in the details below. Fields marked <span className="ap-req">*</span> are required.</p>
                    </div>
                    <Link to="/admin/products" className="ap-back-btn">
                        ← Back to Products
                    </Link>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ap-layout">

                        {/* ══ LEFT ══ */}
                        <div className="ap-left">

                            {/* Product info card */}
                            <div className="ap-card">
                                <div className="ap-card-header">
                                    <span className="ap-card-icon">📝</span>
                                    <h2 className="ap-card-title">Product Information</h2>
                                </div>

                                {/* Title */}
                                <div className={`ap-field ${errors.title ? "ap-field--error" : ""}`}>
                                    <label className="ap-label" htmlFor="ap-title">
                                        Product Title <span className="ap-req">*</span>
                                    </label>
                                    <input
                                        id="ap-title"
                                        name="title"
                                        type="text"
                                        value={form.title}
                                        onChange={handleChange}
                                        className="ap-input"
                                        placeholder="e.g. Apple iPhone 15 Pro Max 256GB"
                                        maxLength={200}
                                    />
                                    {errors.title && <p className="ap-err-msg">{errors.title}</p>}
                                    <p className="ap-char-count">{form.title.length}/200</p>
                                </div>

                                {/* Description */}
                                <div className={`ap-field ${errors.description ? "ap-field--error" : ""}`}>
                                    <label className="ap-label" htmlFor="ap-desc">
                                        Description <span className="ap-req">*</span>
                                    </label>
                                    <textarea
                                        id="ap-desc"
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        className="ap-input ap-textarea"
                                        placeholder="Describe your product in detail…"
                                        maxLength={2000}
                                        rows={5}
                                    />
                                    {errors.description && <p className="ap-err-msg">{errors.description}</p>}
                                    <p className="ap-char-count">{form.description.length}/2000</p>
                                </div>

                                {/* Category + Brand */}
                                <div className="ap-row">
                                    <div className="ap-field">
                                        <label className="ap-label" htmlFor="ap-category">Category</label>
                                        <input
                                            id="ap-category"
                                            name="category"
                                            type="text"
                                            value={form.category}
                                            onChange={handleChange}
                                            className="ap-input"
                                            placeholder="e.g. Mobiles"
                                        />
                                    </div>
                                    <div className="ap-field">
                                        <label className="ap-label" htmlFor="ap-brand">Brand</label>
                                        <input
                                            id="ap-brand"
                                            name="brand"
                                            type="text"
                                            value={form.brand}
                                            onChange={handleChange}
                                            className="ap-input"
                                            placeholder="e.g. Apple"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing card */}
                            <div className="ap-card">
                                <div className="ap-card-header">
                                    <span className="ap-card-icon">💰</span>
                                    <h2 className="ap-card-title">Pricing &amp; Stock</h2>
                                </div>

                                <div className="ap-row">
                                    {/* Selling Price */}
                                    <div className={`ap-field ${errors.price ? "ap-field--error" : ""}`}>
                                        <label className="ap-label" htmlFor="ap-price">
                                            Selling Price (₹) <span className="ap-req">*</span>
                                        </label>
                                        <div className="ap-prefix-wrap">
                                            <span className="ap-prefix">₹</span>
                                            <input
                                                id="ap-price"
                                                name="price"
                                                type="number"
                                                value={form.price}
                                                onChange={handleChange}
                                                className="ap-input ap-input--prefixed"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        {errors.price && <p className="ap-err-msg">{errors.price}</p>}
                                    </div>

                                    {/* MRP */}
                                    <div className="ap-field">
                                        <label className="ap-label" htmlFor="ap-mrp">
                                            M.R.P. (₹)
                                            <span className="ap-label-hint"> – for discount badge</span>
                                        </label>
                                        <div className="ap-prefix-wrap">
                                            <span className="ap-prefix">₹</span>
                                            <input
                                                id="ap-mrp"
                                                name="originalPrice"
                                                type="number"
                                                value={form.originalPrice}
                                                onChange={handleChange}
                                                className="ap-input ap-input--prefixed"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        {discountPct && (
                                            <p className="ap-discount-badge">
                                                🏷 {discountPct}% off will be shown
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Stock */}
                                <div className={`ap-field ap-field--half ${errors.stock ? "ap-field--error" : ""}`}>
                                    <label className="ap-label" htmlFor="ap-stock">
                                        Stock Quantity <span className="ap-req">*</span>
                                    </label>
                                    <input
                                        id="ap-stock"
                                        name="stock"
                                        type="number"
                                        value={form.stock}
                                        onChange={handleChange}
                                        className="ap-input"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                    />
                                    {errors.stock && <p className="ap-err-msg">{errors.stock}</p>}
                                    {form.stock !== "" && Number(form.stock) === 0 && (
                                        <p className="ap-warn-msg">⚠ Product will appear as Out of Stock</p>
                                    )}
                                    {form.stock !== "" && Number(form.stock) > 0 && Number(form.stock) <= 5 && (
                                        <p className="ap-warn-msg">⚠ Low stock — customers will see urgency label</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ══ RIGHT ══ */}
                        <div className="ap-right">

                            {/* Image upload card */}
                            <div className="ap-card">
                                <div className="ap-card-header">
                                    <span className="ap-card-icon">🖼</span>
                                    <h2 className="ap-card-title">Product Image</h2>
                                </div>

                                {preview ? (
                                    /* Image preview */
                                    <div className="ap-preview-wrap">
                                        <img
                                            src={preview}
                                            alt="Product preview"
                                            className="ap-preview-img"
                                        />
                                        <div className="ap-preview-meta">
                                            <p className="ap-preview-name">{image?.name}</p>
                                            <p className="ap-preview-size">
                                                {(image?.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <div className="ap-preview-actions">
                                            <button
                                                type="button"
                                                onClick={() => fileRef.current?.click()}
                                                className="ap-img-change-btn"
                                            >
                                                Change Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="ap-img-remove-btn"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Drop zone */
                                    <div
                                        className={`ap-dropzone ${dragOver ? "ap-dropzone--active" : ""} ${errors.image ? "ap-dropzone--error" : ""}`}
                                        onClick={() => fileRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                                        aria-label="Upload product image"
                                    >
                                        <div className="ap-drop-icon">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                                <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 8v4M10 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <p className="ap-drop-title">
                                            {dragOver ? "Drop it here!" : "Drag & drop your image"}
                                        </p>
                                        <p className="ap-drop-sub">or click to browse</p>
                                        <p className="ap-drop-hint">JPG, PNG, WEBP · Max 5 MB</p>
                                    </div>
                                )}

                                {errors.image && (
                                    <p className="ap-err-msg ap-err-msg--mt">{errors.image}</p>
                                )}

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="ap-file-hidden"
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Live preview card */}
                            <div className="ap-card ap-card--preview">
                                <div className="ap-card-header">
                                    <span className="ap-card-icon">👁</span>
                                    <h2 className="ap-card-title">Listing Preview</h2>
                                </div>
                                <div className="ap-listing-preview">
                                    <div className="ap-lp-img-wrap">
                                        {preview
                                            ? <img src={preview} alt="preview" className="ap-lp-img" />
                                            : <div className="ap-lp-img-placeholder">No image</div>
                                        }
                                    </div>
                                    <div className="ap-lp-body">
                                        <p className="ap-lp-title">{form.title || "Product title"}</p>
                                        {form.brand && <p className="ap-lp-brand">by {form.brand}</p>}
                                        <div className="ap-lp-price-row">
                                            {form.price && (
                                                <span className="ap-lp-price">
                                                    ₹{Number(form.price).toLocaleString("en-IN")}
                                                </span>
                                            )}
                                            {discountPct && (
                                                <span className="ap-lp-discount">-{discountPct}%</span>
                                            )}
                                        </div>
                                        {form.stock !== "" && (
                                            <p className={`ap-lp-stock ${Number(form.stock) === 0 ? "ap-lp-stock--out" : "ap-lp-stock--in"}`}>
                                                {Number(form.stock) === 0 ? "Out of Stock" : `In Stock (${form.stock})`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit card */}
                            <div className="ap-card ap-card--submit">
                                <button
                                    type="submit"
                                    className="ap-submit-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <><span className="ap-btn-spinner" /> Publishing Product…</>
                                    ) : (
                                        "Publish Product"
                                    )}
                                </button>
                                <Link to="/admin/products" className="ap-discard-btn">
                                    Discard Changes
                                </Link>
                                <p className="ap-submit-note">
                                    🔒 Product will be immediately visible to customers after publishing.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
