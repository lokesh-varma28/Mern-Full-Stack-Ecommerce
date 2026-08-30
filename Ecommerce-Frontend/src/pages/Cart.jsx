import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getCart,
    increaseQuantity,
    decreaseQuantity,
    removeCartItem
} from "../api/cartApi";
import "./Cart.css";

const PLACEHOLDER = "https://via.placeholder.com/140x140?text=No+Image";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://back-end-ecommerce-1.onrender.com";

function getImageUrl(image) {
    if (!image?.url) return PLACEHOLDER;
    return image.url.startsWith("http") ? image.url : `${API_BASE}${image.url}`;
}

export default function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3000);
    };

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const res = await getCart();
            setCart(res.data.cart);
        } catch (err) {
            console.error(err);
            showToast("Failed to load cart", "error");
        } finally {
            setLoading(false);
        }
    };

    const increase = async (productId) => {
        setUpdating((p) => ({ ...p, [productId]: "increase" }));
        try {
            await increaseQuantity(productId);
            loadCart();
        } catch (err) {
            console.error(err);
            showToast("Could not update quantity", "error");
        } finally {
            setUpdating((p) => ({ ...p, [productId]: null }));
        }
    };

    const decrease = async (productId) => {
        setUpdating((p) => ({ ...p, [productId]: "decrease" }));
        try {
            await decreaseQuantity(productId);
            loadCart();
        } catch (err) {
            console.error(err);
            showToast("Could not update quantity", "error");
        } finally {
            setUpdating((p) => ({ ...p, [productId]: null }));
        }
    };

    const removeItem = async (productId, title) => {
        if (!window.confirm(`Remove "${title}" from cart?`)) return;
        setUpdating((p) => ({ ...p, [productId]: "remove" }));
        try {
            await removeCartItem(productId);
            showToast(`"${title}" removed from cart`);
            loadCart();
        } catch (err) {
            console.error(err);
            showToast("Could not remove item", "error");
        } finally {
            setUpdating((p) => ({ ...p, [productId]: null }));
        }
    };

    // Guard: filter out items where the product was deleted from the DB
    const validItems = cart ? cart.items.filter((item) => item.product != null) : [];

    // Calculate totals
    const subtotal = validItems.reduce(
        (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
        0
    );
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const hasOutOfStock = validItems.some(
        (item) => item.product.stock === 0 || item.quantity > item.product.stock
    );

    // Loading state
    if (loading) {
        return (
            <div className="cart-page">
                <div className="cart-loading">
                    <div className="cart-spinner" />
                    <p>Loading your cart…</p>
                </div>
            </div>
        );
    }

    // Empty cart state
    if (!cart || validItems.length === 0) {
        return (
            <div className="cart-page">
                {toast.msg && (
                    <div className={`cart-toast cart-toast--${toast.type}`} role="alert">
                        {toast.msg}
                    </div>
                )}
                <div className="cart-empty">
                    <div className="cart-empty-icon">🛒</div>
                    <h1 className="cart-empty-title">Your shopping cart is empty</h1>
                    <p className="cart-empty-sub">
                        Browse our products and add items to your cart to get started.
                    </p>
                    <Link to="/" className="cart-empty-btn">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {toast.msg && (
                <div className={`cart-toast cart-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <div className="cart-inner">
                {/* Page header */}
                <div className="cart-header">
                    <h1 className="cart-title">Shopping Cart</h1>
                    <p className="cart-sub">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="cart-grid">
                    {/* Items list */}
                    <div className="cart-items">
                        {validItems.map((item) => {
                            const product = item.product;
                            const imgUrl = getImageUrl(product?.image);
                            const isUpdating = updating[product._id];
                            const outOfStock = product.stock === 0;
                            const exceedsStock = item.quantity > product.stock;

                            return (
                                <div key={product._id} className="cart-item">
                                    {/* Product image */}
                                    <div className="cart-item-img-wrap">
                                        <Link to={`/product/${product._id}`}>
                                            <img
                                                src={imgUrl}
                                                alt={product.title}
                                                className="cart-item-img"
                                                loading="lazy"
                                                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                                            />
                                        </Link>
                                    </div>

                                    {/* Product info */}
                                    <div className="cart-item-info">
                                        <Link to={`/product/${product._id}`} className="cart-item-title">
                                            {product.title}
                                        </Link>
                                        {product.brand && (
                                            <p className="cart-item-brand">Brand: {product.brand}</p>
                                        )}
                                        <p className="cart-item-price">
                                            ₹{Number(product.price).toLocaleString("en-IN")}
                                        </p>

                                        {/* Stock status */}
                                        {outOfStock ? (
                                            <p className="cart-stock-error">
                                                ⚠ Out of Stock
                                            </p>
                                        ) : exceedsStock ? (
                                            <p className="cart-stock-warning">
                                                Only {product.stock} left in stock
                                            </p>
                                        ) : (
                                            <p className="cart-stock-ok">In Stock</p>
                                        )}

                                        {/* Remove button - mobile */}
                                        <button
                                            onClick={() => removeItem(product._id, product.title)}
                                            disabled={isUpdating === "remove"}
                                            className="cart-remove-btn cart-remove-btn--mobile"
                                        >
                                            {isUpdating === "remove" ? "Removing…" : "Remove"}
                                        </button>
                                    </div>

                                    {/* Quantity controls */}
                                    <div className="cart-item-actions">
                                        <div className="cart-qty">
                                            <button
                                                onClick={() => decrease(product._id)}
                                                disabled={item.quantity <= 1 || isUpdating}
                                                className="cart-qty-btn"
                                                aria-label="Decrease quantity"
                                            >
                                                −
                                            </button>
                                            <span className="cart-qty-val">{item.quantity}</span>
                                            <button
                                                onClick={() => increase(product._id)}
                                                disabled={item.quantity >= product.stock || isUpdating}
                                                className="cart-qty-btn"
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <p className="cart-item-subtotal">
                                            ₹{Number(product.price * item.quantity).toLocaleString("en-IN")}
                                        </p>

                                        {/* Remove button - desktop */}
                                        <button
                                            onClick={() => removeItem(product._id, product.title)}
                                            disabled={isUpdating === "remove"}
                                            className="cart-remove-btn cart-remove-btn--desktop"
                                        >
                                            {isUpdating === "remove" ? "Removing…" : "Remove"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order summary */}
                    <div className="cart-summary-wrap">
                        <div className="cart-summary">
                            <h2 className="cart-summary-title">Order Summary</h2>

                            <div className="cart-summary-row">
                                <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""}):</span>
                                <span className="cart-summary-val">
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="cart-summary-row">
                                <span>Shipping:</span>
                                <span className="cart-summary-shipping">FREE</span>
                            </div>

                            <div className="cart-summary-divider" />

                            <div className="cart-summary-row cart-summary-total">
                                <span>Order Total:</span>
                                <span className="cart-summary-total-val">
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>

                            {hasOutOfStock ? (
                                <button
                                    disabled
                                    className="cart-checkout-btn cart-checkout-btn--disabled"
                                    title="Remove out-of-stock items to proceed"
                                >
                                    Fix Cart Before Checkout
                                </button>
                            ) : (
                                <Link to="/checkout" className="cart-checkout-btn">
                                    Proceed to Checkout
                                </Link>
                            )}

                            <p className="cart-summary-note">
                                Prices and availability may vary. Free shipping on eligible orders.
                            </p>
                        </div>

                        {/* Continue shopping */}
                        <Link to="/" className="cart-continue-btn">
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
