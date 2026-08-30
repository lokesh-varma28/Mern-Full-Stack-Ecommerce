import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { addToCart } from "../api/cartApi";
import "./ProductCard.css";

// Inline SVG fallback — no external dependency, never causes an onError loop
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://back-end-ecommerce-1.onrender.com";

function getImageUrl(image) {
    if (!image?.url) return PLACEHOLDER;
    if (image.url.startsWith("http")) {
        // If the stored URL points to localhost, rewrite it to the configured API base.
        // This fixes images saved while running locally that now need to load from the
        // real server (or vice-versa).
        try {
            const parsed = new URL(image.url);
            if (parsed.hostname === "localhost") {
                return `${API_BASE}${parsed.pathname}`;
            }
        } catch {
            // not a valid URL — fall through
        }
        return image.url;
    }
    return `${API_BASE}${image.url}`;
}

function StarRating({ rating, reviewCount }) {
    const full = Math.round(rating || 0);
    return (
        <div className="pc-rating-row">
            <span className="pc-stars" aria-label={`${rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= full ? "star filled" : "star"}>
                        ★
                    </span>
                ))}
            </span>
            <span className="pc-rating-value">
                {Number(rating || 0).toFixed(1)}
            </span>
            {reviewCount > 0 && (
                <span className="pc-review-count">({reviewCount})</span>
            )}
        </div>
    );
}

// Cart button states
const BTN_IDLE    = "idle";
const BTN_LOADING = "loading";
const BTN_ADDED   = "added";
const BTN_ERROR   = "error";

export default function ProductCard({ product }) {
    const { addToCompare } = useCompare();
    const navigate = useNavigate();

    const [cartState, setCartState] = useState(BTN_IDLE);

    const imageUrl    = getImageUrl(product.image);
    const isOutOfStock = product.stock === 0;

    const discountPct =
        product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                  ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
              )
            : 0;

    // ── Add to Cart ────────────────────────────────────────────────────────
    const handleAddToCart = async (e) => {
        e.preventDefault(); // stop Link navigation
        e.stopPropagation();

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        setCartState(BTN_LOADING);
        try {
            await addToCart(product._id);
            setCartState(BTN_ADDED);
            // reset after 2.5 s
            setTimeout(() => setCartState(BTN_IDLE), 2500);
        } catch {
            setCartState(BTN_ERROR);
            setTimeout(() => setCartState(BTN_IDLE), 2500);
        }
    };

    // ── Button label / icon ────────────────────────────────────────────────
    const cartLabel = () => {
        if (isOutOfStock)       return "Out of Stock";
        if (cartState === BTN_LOADING) return <><span className="pc-spinner" /> Adding…</>;
        if (cartState === BTN_ADDED)   return <><span className="pc-check">✓</span> Added to Cart</>;
        if (cartState === BTN_ERROR)   return "Error – Retry";
        return <><span className="pc-cart-icon">🛒</span> Add to Cart</>;
    };

    return (
        <div className={`pc-card ${cartState === BTN_ADDED ? "pc-card--added" : ""}`}>

            {/* ── Discount badge ── */}
            {discountPct > 0 && !isOutOfStock && (
                <span className="pc-badge pc-badge--deal">-{discountPct}%</span>
            )}
            {isOutOfStock && (
                <span className="pc-badge pc-badge--oos">Out of Stock</span>
            )}

            {/* ── Image ── */}
            <Link to={`/product/${product._id}`} className="pc-image-link" tabIndex={-1}>
                <div className="pc-image-wrap">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="pc-image"
                        loading="lazy"
                        onError={(e) => {
                            if (e.currentTarget.dataset.errored) return;
                            e.currentTarget.dataset.errored = "1";
                            e.currentTarget.src = PLACEHOLDER;
                        }}
                    />
                </div>
            </Link>

            {/* ── Body ── */}
            <div className="pc-body">

                {/* Title */}
                <Link to={`/product/${product._id}`} className="pc-title-link">
                    <h2 className="pc-title">{product.title}</h2>
                </Link>

                {/* Stars */}
                <StarRating
                    rating={product.averageRating}
                    reviewCount={product.numReviews}
                />

                {/* Seller Storefront Link */}
                {product.seller && (
                    <div className="text-xs text-gray-500 mb-1">
                        <Link
                            to={`/seller/${typeof product.seller === "object" ? product.seller._id : product.seller}`}
                            className="text-amber-600 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Sold by {typeof product.seller === "object" && product.seller.storeName ? product.seller.storeName : "Merchant Store"}
                        </Link>
                    </div>
                )}

                {/* Price block */}
                <div className="pc-price-block">
                    <p className="pc-price">
                        <span className="pc-rupee">₹</span>
                        {Number(product.price).toLocaleString("en-IN")}
                    </p>
                    {discountPct > 0 && (
                        <p className="pc-original-price">
                            M.R.P:&nbsp;
                            <s>₹{Number(product.originalPrice).toLocaleString("en-IN")}</s>
                            <span className="pc-discount">&nbsp;({discountPct}% off)</span>
                        </p>
                    )}
                </div>

                {/* Low stock warning */}
                {product.stock > 0 && product.stock <= 5 && (
                    <p className="pc-low-stock">
                        Only {product.stock} left in stock – order soon.
                    </p>
                )}

                {/* Free delivery tag */}
                {product.price >= 499 && !isOutOfStock && (
                    <p className="pc-free-delivery">
                        <span className="pc-delivery-icon">🚚</span> FREE Delivery
                    </p>
                )}

                {/* ── Add to Cart button ── */}
                <button
                    onClick={handleAddToCart}
                    className={`pc-btn pc-btn--cart pc-btn--cart-${cartState}`}
                    disabled={isOutOfStock || cartState === BTN_LOADING}
                    aria-label={isOutOfStock ? "Out of stock" : `Add ${product.title} to cart`}
                    aria-live="polite"
                >
                    {cartLabel()}
                </button>

                {/* ── Compare link ── */}
                <button
                    onClick={() => addToCompare(product)}
                    className="pc-btn pc-btn--compare"
                    aria-label={`Add ${product.title} to compare`}
                >
                    Compare
                </button>
            </div>
        </div>
    );
}
