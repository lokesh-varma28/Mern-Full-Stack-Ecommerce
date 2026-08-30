import { Link } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { addToCart } from "../api/cartApi";
import { useState } from "react";
import "./Compare.css";

const PLACEHOLDER = "https://via.placeholder.com/300x300?text=No+Image";

function getImageUrl(image) {
    if (!image?.url) return PLACEHOLDER;
    return image.url.startsWith("http")
        ? image.url
        : `http://localhost:3000${image.url}`;
}

function StarRating({ rating }) {
    const full = Math.round(rating || 0);
    return (
        <span className="cmp-stars">
            {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= full ? "cmp-star cmp-star--on" : "cmp-star"}>
                    ★
                </span>
            ))}
            <span className="cmp-star-val">{Number(rating || 0).toFixed(1)}</span>
        </span>
    );
}

// All spec rows shown in the comparison table
const SPECS = [
    {
        key:    "price",
        label:  "Price",
        render: (p) => (
            <span className="cmp-price">
                ₹{Number(p.price).toLocaleString("en-IN")}
            </span>
        ),
    },
    {
        key:    "rating",
        label:  "Customer Rating",
        render: (p) => <StarRating rating={p.averageRating} />,
    },
    {
        key:    "reviews",
        label:  "Reviews",
        render: (p) => p.numReviews
            ? `${p.numReviews} rating${p.numReviews !== 1 ? "s" : ""}`
            : "No reviews yet",
    },
    {
        key:    "category",
        label:  "Category",
        render: (p) => p.category
            ? <span className="cmp-badge cmp-badge--cat">{p.category}</span>
            : "—",
    },
    {
        key:    "brand",
        label:  "Brand",
        render: (p) => p.brand || "—",
    },
    {
        key:    "stock",
        label:  "Availability",
        render: (p) => p.stock === 0
            ? <span className="cmp-oos">Out of Stock</span>
            : p.stock <= 5
                ? <span className="cmp-low">Only {p.stock} left</span>
                : <span className="cmp-in">In Stock</span>,
    },
    {
        key:    "discount",
        label:  "Discount",
        render: (p) => {
            if (!p.originalPrice || p.originalPrice <= p.price) return "—";
            const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            return <span className="cmp-discount-badge">-{pct}%</span>;
        },
    },
    {
        key:    "description",
        label:  "Description",
        render: (p) => (
            <span className="cmp-desc">
                {p.description ? p.description.slice(0, 100) + (p.description.length > 100 ? "…" : "") : "—"}
            </span>
        ),
    },
];

export default function Compare() {
    const { compareProducts, compareToast, removeFromCompare, clearCompare } = useCompare();
    const [cartStates, setCartStates] = useState({});

    const handleAddToCart = async (productId, title) => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
        setCartStates((p) => ({ ...p, [productId]: "loading" }));
        try {
            await addToCart(productId);
            setCartStates((p) => ({ ...p, [productId]: "added" }));
            setTimeout(() => setCartStates((p) => ({ ...p, [productId]: "idle" })), 2500);
        } catch {
            setCartStates((p) => ({ ...p, [productId]: "error" }));
            setTimeout(() => setCartStates((p) => ({ ...p, [productId]: "idle" })), 2500);
        }
    };

    const cartLabel = (productId) => {
        const s = cartStates[productId] || "idle";
        if (s === "loading") return <><span className="cmp-btn-spin" /> Adding…</>;
        if (s === "added")   return <>✓ Added to Cart</>;
        if (s === "error")   return "Error – Retry";
        return <>🛒 Add to Cart</>;
    };

    // ── Empty state ──
    if (!compareProducts || compareProducts.length === 0) {
        return (
            <div className="cmp-page">
                <div className="cmp-inner">
                    <div className="cmp-empty">
                        <div className="cmp-empty-icon">⚖️</div>
                        <h1 className="cmp-empty-title">Your compare list is empty</h1>
                        <p className="cmp-empty-sub">
                            Browse products and click <strong>"Add to Compare"</strong> to compare up to 4 items side by side.
                        </p>
                        <Link to="/" className="cmp-empty-btn">Continue Shopping</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cmp-page">

            {/* Toast from context */}
            {compareToast && (
                <div className="cmp-toast" role="alert">{compareToast}</div>
            )}

            <div className="cmp-inner">

                {/* ── Page header ── */}
                <div className="cmp-header">
                    <div>
                        <h1 className="cmp-heading">Compare Products</h1>
                        <p className="cmp-sub">
                            Comparing {compareProducts.length} of 4 products
                        </p>
                    </div>
                    <div className="cmp-header-actions">
                        <Link to="/" className="cmp-add-more-btn">
                            + Add More
                        </Link>
                        <button onClick={clearCompare} className="cmp-clear-btn">
                            Clear All
                        </button>
                    </div>
                </div>

                {/* ── Comparison table (scrollable on mobile) ── */}
                <div className="cmp-scroll-wrap">
                    <table className="cmp-table">

                        {/* ── Product images + title row ── */}
                        <thead>
                            <tr>
                                {/* Label column */}
                                <th className="cmp-th cmp-th--label" />

                                {/* One column per product */}
                                {compareProducts.map((p) => (
                                    <th key={p._id} className="cmp-th cmp-th--product">
                                        <div className="cmp-product-head">

                                            {/* Remove button */}
                                            <button
                                                onClick={() => removeFromCompare(p._id)}
                                                className="cmp-remove-btn"
                                                aria-label={`Remove ${p.title}`}
                                                title="Remove"
                                            >
                                                ✕
                                            </button>

                                            {/* Product image */}
                                            <Link to={`/product/${p._id}`} className="cmp-img-link">
                                                <div className="cmp-img-wrap">
                                                    <img
                                                        src={getImageUrl(p.image)}
                                                        alt={p.title}
                                                        className="cmp-img"
                                                        loading="lazy"
                                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                                                    />
                                                </div>
                                            </Link>

                                            {/* Title */}
                                            <Link to={`/product/${p._id}`} className="cmp-product-title">
                                                {p.title}
                                            </Link>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* ── Spec rows ── */}
                        <tbody>
                            {SPECS.map(({ key, label, render }) => (
                                <tr key={key} className="cmp-row">
                                    <td className="cmp-td cmp-td--label">{label}</td>
                                    {compareProducts.map((p) => (
                                        <td key={p._id} className="cmp-td cmp-td--value">
                                            {render(p)}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* ── Add to Cart row ── */}
                            <tr className="cmp-row cmp-row--actions">
                                <td className="cmp-td cmp-td--label" />
                                {compareProducts.map((p) => (
                                    <td key={p._id} className="cmp-td cmp-td--value">
                                        <div className="cmp-action-col">
                                            <button
                                                onClick={() => handleAddToCart(p._id, p.title)}
                                                disabled={p.stock === 0 || cartStates[p._id] === "loading"}
                                                className={`cmp-cart-btn cmp-cart-btn--${cartStates[p._id] || "idle"}`}
                                            >
                                                {cartLabel(p._id)}
                                            </button>
                                            <Link
                                                to={`/product/${p._id}`}
                                                className="cmp-view-btn"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
