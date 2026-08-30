import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeWishlist } from "../api/wishlistApi";
import { addToCart } from "../api/cartApi";
import "./Wishlist.css";

const PLACEHOLDER = "https://via.placeholder.com/200x200?text=No+Image";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://back-end-ecommerce-1.onrender.com";

function getImageUrl(image) {
    if (!image?.url) return PLACEHOLDER;
    return image.url.startsWith("http") ? image.url : `${API_BASE}${image.url}`;
}

export default function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionStates, setActionStates] = useState({});
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3000);
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const res = await getWishlist();
            const items = res.data?.wishlist?.products || res.data?.products || [];
            setWishlist(items);
        } catch (err) {
            console.error(err);
            showToast("Failed to load wishlist", "error");
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (id, title) => {
        if (!window.confirm(`Remove "${title}" from wishlist?`)) return;
        setActionStates((p) => ({ ...p, [id]: "removing" }));
        try {
            await removeWishlist(id);
            showToast(`"${title}" removed from wishlist`);
            fetchWishlist();
        } catch (err) {
            console.error(err);
            showToast("Failed to remove item", "error");
        } finally {
            setActionStates((p) => ({ ...p, [id]: null }));
        }
    };

    const moveToCart = async (id, title) => {
        setActionStates((p) => ({ ...p, [id]: "moving" }));
        try {
            await addToCart(id);
            await removeWishlist(id);
            showToast(`"${title}" moved to cart`);
            fetchWishlist();
        } catch (err) {
            console.error(err);
            showToast("Failed to move item to cart", "error");
        } finally {
            setActionStates((p) => ({ ...p, [id]: null }));
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="wish-page">
                <div className="wish-loading">
                    <div className="wish-spinner" />
                    <p>Loading your wishlist…</p>
                </div>
            </div>
        );
    }

    // Empty wishlist
    if (wishlist.length === 0) {
        return (
            <div className="wish-page">
                {toast.msg && (
                    <div className={`wish-toast wish-toast--${toast.type}`} role="alert">
                        {toast.msg}
                    </div>
                )}
                <div className="wish-empty">
                    <div className="wish-empty-icon">❤️</div>
                    <h1 className="wish-empty-title">Your wishlist is empty</h1>
                    <p className="wish-empty-sub">
                        Browse products and add items to your wishlist to save them for later.
                    </p>
                    <Link to="/" className="wish-empty-btn">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="wish-page">
            {toast.msg && (
                <div className={`wish-toast wish-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <div className="wish-inner">
                {/* Header */}
                <div className="wish-header">
                    <div>
                        <h1 className="wish-title">
                            <span className="wish-heart">❤️</span> My Wishlist
                        </h1>
                        <p className="wish-sub">
                            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <Link to="/" className="wish-continue-btn">
                        Continue Shopping
                    </Link>
                </div>

                {/* Grid */}
                <div className="wish-grid">
                    {wishlist.map((product) => {
                        const imgUrl = getImageUrl(product.image);
                        const action = actionStates[product._id];
                        const outOfStock = product.stock === 0;

                        return (
                            <div key={product._id} className="wish-card">
                                {/* Remove button */}
                                <button
                                    onClick={() => removeItem(product._id, product.title)}
                                    disabled={action === "removing"}
                                    className="wish-remove-btn"
                                    title="Remove from wishlist"
                                >
                                    {action === "removing" ? "..." : "✕"}
                                </button>

                                {/* Stock badge */}
                                {outOfStock && (
                                    <div className="wish-oos-badge">Out of Stock</div>
                                )}

                                {/* Image */}
                                <Link to={`/product/${product._id}`} className="wish-img-link">
                                    <div className="wish-img-wrap">
                                        <img
                                            src={imgUrl}
                                            alt={product.title}
                                            className="wish-img"
                                            loading="lazy"
                                            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                                        />
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="wish-info">
                                    <Link to={`/product/${product._id}`} className="wish-product-title">
                                        {product.title}
                                    </Link>

                                    {product.brand && (
                                        <p className="wish-brand">{product.brand}</p>
                                    )}

                                    {/* Rating */}
                                    {product.averageRating > 0 && (
                                        <div className="wish-rating">
                                            <span className="wish-stars">
                                                {"★".repeat(Math.round(product.averageRating))}
                                                {"☆".repeat(5 - Math.round(product.averageRating))}
                                            </span>
                                            <span className="wish-rating-val">
                                                {product.averageRating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="wish-price-row">
                                        <span className="wish-price">
                                            ₹{Number(product.price).toLocaleString("en-IN")}
                                        </span>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <span className="wish-original-price">
                                                ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Discount */}
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="wish-discount">
                                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="wish-actions">
                                    <button
                                        onClick={() => moveToCart(product._id, product.title)}
                                        disabled={outOfStock || action === "moving"}
                                        className="wish-cart-btn"
                                    >
                                        {action === "moving" ? (
                                            <>
                                                <span className="wish-btn-spin" /> Moving…
                                            </>
                                        ) : (
                                            <>🛒 Move to Cart</>
                                        )}
                                    </button>
                                    <Link
                                        to={`/product/${product._id}`}
                                        className="wish-view-btn"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
