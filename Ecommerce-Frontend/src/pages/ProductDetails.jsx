import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { addToCart } from "../api/cartApi";
import { addToWishlist } from "../api/wishlistApi";
import { getReviews, deleteReview } from "../api/reviewApi";
import { getRecommendations } from "../api/recommendationApi";
import { getQuestions } from "../api/questionApi";
import ReviewForm from "../components/ReviewForm";
import ProductCard from "../components/ProductCard";
import QuestionForm from "../components/QuestionForm";
import "./ProductDetails.css";

// MongoDB ObjectId is exactly 24 hex characters
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

const PLACEHOLDER = "https://via.placeholder.com/500x500?text=No+Image";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://back-end-ecommerce-1.onrender.com";

function getImageUrl(image) {
    if (!image?.url) return PLACEHOLDER;
    return image.url.startsWith("http")
        ? image.url
        : `${API_BASE}${image.url}`;
}

function StockStatus({ stock }) {
    if (stock === 0) {
        return <p className="pd-stock pd-stock--out">Out of Stock</p>;
    }
    if (stock <= 5) {
        return (
            <p className="pd-stock pd-stock--low">
                Only {stock} item{stock > 1 ? "s" : ""} left in stock – order soon.
            </p>
        );
    }
    return <p className="pd-stock pd-stock--in">In Stock</p>;
}

function RatingBar({ star, count, total }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="pd-rating-row">
            <span className="pd-rating-label">{star} star</span>
            <div className="pd-rating-bar-track">
                <div
                    className="pd-rating-bar-fill"
                    style={{ width: `${pct}%` }}
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                />
            </div>
            <span className="pd-rating-count">{count}</span>
        </div>
    );
}

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // location.state is read but not used for driving UI – kept for
    // Checkout page to pick up buyNow flag when navigating from here
    const isBuyNow = location.state?.buyNow || false; // eslint-disable-line no-unused-vars

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [ratingStats, setRatingStats] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [editingReview, setEditingReview] = useState(null);
    const [toastMsg, setToastMsg] = useState("");

    const loggedUser = JSON.parse(localStorage.getItem("user"));

    // ── Toast helper (replaces alert() calls) ──────────────────────────────
    const showToast = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 3000);
    }, []);

    // ── Data loaders ───────────────────────────────────────────────────────
    const loadProduct = useCallback(async () => {
        if (!isValidObjectId(id)) {
            console.warn("Invalid product ID in URL:", id);
            return;
        }
        try {
            const res = await API.get(`/products/${id}`);
            const current = res.data.singleProduct;
            setProduct(current);

            // Recently viewed – keep last 8, deduplicated, only valid IDs
            const viewed = JSON.parse(localStorage.getItem("recentProducts")) || [];
            const filtered = viewed.filter(
                (item) => item._id !== current._id && isValidObjectId(item._id)
            );
            filtered.unshift(current);
            localStorage.setItem("recentProducts", JSON.stringify(filtered.slice(0, 8)));
        } catch (err) {
            console.error("Failed to load product:", err);
        }
    }, [id]);

    const loadReviews = useCallback(async () => {
        if (!isValidObjectId(id)) return;
        try {
            const res = await getReviews(id);
            setReviews(res.data.reviews);
            setRatingStats(res.data.ratingStats);
        } catch (err) {
            console.error("Failed to load reviews:", err);
        }
    }, [id]);

    const loadRelatedProducts = useCallback(async () => {
        if (!isValidObjectId(id)) return;
        try {
            const res = await API.get(`/products/related/${id}`);
            setRelatedProducts(res.data);
        } catch (err) {
            console.error("Failed to load related products:", err);
        }
    }, [id]);

    const loadRecommendations = useCallback(async () => {
        if (!isValidObjectId(id)) return;
        try {
            const res = await getRecommendations(id);
            setRecommendedProducts(res.data.products);
        } catch (err) {
            console.error("Failed to load recommendations:", err);
        }
    }, [id]);

    const loadQuestions = useCallback(async () => {
        if (!isValidObjectId(id)) return;
        try {
            const res = await getQuestions(id);
            setQuestions(res.data.questions);
        } catch (err) {
            console.error("Failed to load questions:", err);
        }
    }, [id]);

    useEffect(() => {
        // Reset state when product id changes
        setProduct(null);
        setReviews([]);
        setRatingStats({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setRelatedProducts([]);
        setRecommendedProducts([]);
        setQuestions([]);
        setEditingReview(null);

        loadProduct();
        loadReviews();
        loadRelatedProducts();
        loadRecommendations();
        loadQuestions();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Action handlers ────────────────────────────────────────────────────
    const handleAddToCart = async () => {
        try {
            await addToCart(product._id);
            showToast("Added to Cart");
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Please log in first");
        }
    };

    const handleWishlist = async () => {
        try {
            await addToWishlist(product._id);
            showToast("Added to Wishlist ❤️");
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Please log in first");
        }
    };

    const handleBuyNow = () => {
        navigate("/checkout", {
            state: { buyNow: true, productId: product._id },
        });
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            await deleteReview(reviewId);
            showToast("Review deleted");
            setEditingReview(null);
            loadReviews();
            loadProduct();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to delete review");
        }
    };

    // ── Derived values ─────────────────────────────────────────────────────
    const totalReviews = Object.values(ratingStats).reduce((a, b) => a + b, 0);

    // ── Loading guard ──────────────────────────────────────────────────────
    if (!isValidObjectId(id)) {
        return (
            <div className="pd-loading">
                <p style={{ color: "#cc0c39", fontWeight: 700 }}>Invalid product link.</p>
                <a href="/" style={{ color: "#007185", fontSize: "0.9rem" }}>← Back to Home</a>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="pd-loading" role="status" aria-live="polite">
                <div className="pd-spinner" />
                <p>Loading product details…</p>
            </div>
        );
    }

    const imageUrl = getImageUrl(product.image);
    const isOutOfStock = product.stock === 0;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="pd-page">

            {/* ── Toast notification ── */}
            {toastMsg && (
                <div className="pd-toast" role="alert" aria-live="assertive">
                    {toastMsg}
                </div>
            )}

            {/* ══════════════ TOP SECTION ══════════════ */}
            <div className="pd-top-grid">

                {/* Product Image */}
                <div className="pd-image-wrapper">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="pd-image"
                        loading="eager"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                </div>

                {/* Product Info */}
                <div className="pd-info">
                    <h1 className="pd-title">{product.title}</h1>

                    {/* Rating summary */}
                    <div className="pd-rating-summary">
                        <span className="pd-stars" aria-label={`${product.averageRating} out of 5`}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <span
                                    key={s}
                                    className={s <= Math.round(product.averageRating) ? "star filled" : "star"}
                                >
                                    ★
                                </span>
                            ))}
                        </span>
                        <a href="#reviews" className="pd-review-link">
                            {product.numReviews} rating{product.numReviews !== 1 ? "s" : ""}
                        </a>
                    </div>

                    <hr className="pd-divider" />

                    {/* Price */}
                    <div className="pd-price-block">
                        <span className="pd-price-label">Price:</span>
                        <span className="pd-price">
                            <sup className="pd-rupee">₹</sup>
                            {Number(product.price).toLocaleString("en-IN")}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="pd-savings">
                                M.R.P: <s>₹{Number(product.originalPrice).toLocaleString("en-IN")}</s>
                                &nbsp;(
                                {Math.round(
                                    ((product.originalPrice - product.price) /
                                        product.originalPrice) * 100
                                )}
                                % off)
                            </span>
                        )}
                    </div>

                    <hr className="pd-divider" />

                    {/* Description */}
                    <p className="pd-description">{product.description}</p>

                    <hr className="pd-divider" />

                    {/* Stock status */}
                    <StockStatus stock={product.stock} />

                    {/* Action buttons */}
                    <div className="pd-actions">
                        <button
                            onClick={handleAddToCart}
                            className="pd-btn pd-btn--cart"
                            disabled={isOutOfStock}
                            aria-label="Add to Cart"
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="pd-btn pd-btn--buy"
                            disabled={isOutOfStock}
                            aria-label="Buy Now"
                        >
                            Buy Now
                        </button>
                        <button
                            onClick={handleWishlist}
                            className="pd-btn pd-btn--wish"
                            aria-label="Add to Wishlist"
                        >
                            ❤️ Add to Wishlist
                        </button>
                    </div>

                    {/* Secure transaction note */}
                    <p className="pd-secure">🔒 Secure transaction</p>
                </div>

                {/* ── Rating breakdown sidebar ── */}
                <div className="pd-rating-breakdown">
                    <h3 className="pd-rb-title">Customer Reviews</h3>
                    <div className="pd-rb-avg">
                        <span className="pd-rb-avg-num">{Number(product.averageRating || 0).toFixed(1)}</span>
                        <span className="pd-rb-avg-label"> out of 5</span>
                    </div>
                    <p className="pd-rb-total">{totalReviews} global ratings</p>
                    {[5, 4, 3, 2, 1].map((star) => (
                        <RatingBar
                            key={star}
                            star={star}
                            count={ratingStats[star] || 0}
                            total={totalReviews}
                        />
                    ))}
                </div>
            </div>

            {/* ══════════════ FORMS ══════════════ */}
            <div className="pd-section">
                <ReviewForm
                    productId={id}
                    editingReview={editingReview}
                    clearEditing={() => setEditingReview(null)}
                    refresh={() => {
                        loadReviews();
                        loadProduct();
                    }}
                />
            </div>

            <div className="pd-section">
                <QuestionForm productId={id} refresh={loadQuestions} />
            </div>

            {/* ══════════════ CUSTOMER REVIEWS ══════════════ */}
            <div className="pd-section" id="reviews">
                <h2 className="pd-section-title">Customer Reviews</h2>

                {reviews.length === 0 ? (
                    <p className="pd-empty">No reviews yet. Be the first to review this product!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="pd-review-card">
                            <div className="pd-review-header">
                                <span className="pd-review-author">
                                    {review.user?.name || review.name}
                                </span>
                                {review.verifiedPurchase && (
                                    <span className="pd-verified">✅ Verified Purchase</span>
                                )}
                            </div>

                            <div className="pd-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className={s <= review.rating ? "star filled" : "star"}>
                                        ★
                                    </span>
                                ))}
                            </div>

                            <p className="pd-review-comment">{review.comment}</p>

                            {review.images?.length > 0 && (
                                <div className="pd-review-images">
                                    {review.images.map((img) => (
                                        <img
                                            key={img.public_id}
                                            src={img.url}
                                            alt="Review image"
                                            className="pd-review-img"
                                            loading="lazy"
                                        />
                                    ))}
                                </div>
                            )}

                            {loggedUser?._id === review.user?._id && (
                                <div className="pd-review-actions">
                                    <button
                                        onClick={() => setEditingReview(review)}
                                        className="pd-btn-sm pd-btn-sm--edit"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReview(review._id)}
                                        className="pd-btn-sm pd-btn-sm--delete"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ══════════════ CUSTOMER QUESTIONS ══════════════ */}
            <div className="pd-section" id="questions">
                <h2 className="pd-section-title">Customer Questions &amp; Answers</h2>

                {questions.length === 0 ? (
                    <p className="pd-empty">No questions yet.</p>
                ) : (
                    questions.map((question) => (
                        <div key={question._id} className="pd-question-card">
                            <p className="pd-question-text">
                                <strong>Q:</strong> {question.question}
                            </p>
                            <p className="pd-question-by">
                                Asked by {question.user?.name}
                            </p>
                            {question.isAnswered ? (
                                <div className="pd-answer-box">
                                    <p className="pd-answer-label">✔ Seller's Answer</p>
                                    <p className="pd-answer-text">{question.answer}</p>
                                </div>
                            ) : (
                                <p className="pd-waiting">Waiting for seller response…</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ══════════════ RELATED PRODUCTS ══════════════ */}
            {relatedProducts.length > 0 && (
                <div className="pd-section pd-section--lg">
                    <h2 className="pd-section-title">Customers Also Viewed</h2>
                    <div className="pd-product-grid">
                        {relatedProducts.map((item) => (
                            <ProductCard key={item._id} product={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════ AI RECOMMENDATIONS ══════════════ */}
            {recommendedProducts.length > 0 && (
                <div className="pd-section pd-section--lg">
                    <h2 className="pd-section-title">🤖 AI Recommended Products</h2>
                    <div className="pd-product-grid">
                        {recommendedProducts.map((rec) => (
                            <ProductCard key={rec._id} product={rec} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
