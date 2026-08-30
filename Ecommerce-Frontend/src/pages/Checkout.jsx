import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCart } from "../api/cartApi";
import { getAddresses } from "../api/addressApi";
import { placeCodOrder } from "../api/orderApi";
import { checkout, verifyPayment } from "../api/paymentApi";
import API from "../api/axios";
import "./Checkout.css";

export default function Checkout() {
    const location  = useLocation();
    const navigate  = useNavigate();

    // Buy Now state comes via navigate("/checkout", { state: { buyNow:true, productId:"..." } })
    const isBuyNow       = location.state?.buyNow || false;
    const buyNowProductId = location.state?.productId || null;

    const [cart,            setCart]            = useState(null);
    const [buyNowProduct,   setBuyNowProduct]   = useState(null);
    const [addresses,       setAddresses]       = useState([]);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [couponCode,      setCouponCode]      = useState("");
    const [discount,        setDiscount]        = useState(0);
    const [finalAmount,     setFinalAmount]     = useState(0);
    const [paymentMethod,   setPaymentMethod]   = useState("ONLINE");
    const [placing,         setPlacing]         = useState(false);
    const [toast,           setToast]           = useState({ msg: "", type: "" });

    /* ── toast helper ── */
    const showToast = (msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    };

    /* ── load data ── */
    useEffect(() => {
        const load = async () => {
            try {
                const addrRes = await getAddresses();
                const addrs   = addrRes.data?.addresses || addrRes.data || [];
                setAddresses(addrs);
                if (addrs.length > 0) setSelectedAddress(addrs[0]._id);

                if (isBuyNow && buyNowProductId) {
                    const res = await API.get(`/products/${buyNowProductId}`);
                    setBuyNowProduct(res.data.singleProduct);
                } else {
                    const cartRes = await getCart();
                    setCart(cartRes.data.cart || cartRes.data);
                }
            } catch (err) {
                console.error("Checkout load error:", err);
                showToast("Failed to load checkout details", "error");
            }
        };
        load();
    }, [isBuyNow, buyNowProductId]);

    /* ── totals ── */
    const subtotal = isBuyNow
        ? buyNowProduct?.price || 0
        : (cart?.items || []).reduce(
              (s, item) => s + (item.product?.price || 0) * (item.quantity || 1), 0
          );

    useEffect(() => {
        if (subtotal && !discount) setFinalAmount(subtotal);
    }, [subtotal]);

    /* ── coupon ── */
    const applyCoupon = async () => {
        if (!couponCode.trim()) return showToast("Enter a coupon code", "warn");
        try {
            const res = await API.post("/coupon/apply", {
                code: couponCode.trim(),
                cartTotal: subtotal,
            });
            setDiscount(res.data.discount);
            setFinalAmount(res.data.finalAmount);
            showToast(`Coupon applied! You saved ₹${res.data.discount}`, "success");
        } catch (err) {
            setDiscount(0);
            setFinalAmount(subtotal);
            showToast(err.response?.data?.message || "Invalid coupon code", "error");
        }
    };

    /* ── place order ── */
    const orderNow = async () => {
        if (!selectedAddress) return showToast("Please select a delivery address", "warn");
        if (placing) return;
        setPlacing(true);

        const payload = {
            shippingAddress: selectedAddress,
            couponCode: couponCode.trim() || undefined,
            discount,
            finalAmount: finalAmount || subtotal,
            buyNowProductId: isBuyNow ? buyNowProductId : undefined,
        };

        // ── COD ──
        if (paymentMethod === "COD") {
            try {
                await placeCodOrder(payload);
                showToast("Order placed successfully! 🎉", "success");
                setTimeout(() => navigate("/orders"), 1500);
            } catch (err) {
                showToast(err.response?.data?.message || "Failed to place order", "error");
            } finally {
                setPlacing(false);
            }
            return;
        }

        // ── ONLINE (Razorpay) ──
        if (typeof window.Razorpay === "undefined") {
            showToast("Razorpay SDK failed to load. Please check your internet connection or ad blockers.", "error");
            setPlacing(false);
            return;
        }

        try {
            const { data } = await checkout(
                isBuyNow ? { buyNowProductId } : {}
            );


            const options = {
                key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount:      data.order.amount,
                currency:    data.order.currency,
                name:        "Home Store",
                description: "Secure Order Payment",
                image:       "/favicon.svg",
                order_id:    data.order.id,
                prefill: {
                    name:    JSON.parse(localStorage.getItem("user") || "{}").name || "Customer",
                    email:   JSON.parse(localStorage.getItem("user") || "{}").email || "",
                    contact: "",
                },
                notes:  { shippingAddress: selectedAddress },
                theme:  { color: "#F0C14B" },
                modal: {
                    ondismiss: () => {
                        showToast("Payment cancelled", "warn");
                        setPlacing(false);
                    },
                },
                handler: async (response) => {
                    try {
                        await verifyPayment({
                            razorpay_order_id:   response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature:  response.razorpay_signature,
                            ...payload,
                        });
                        showToast("Payment successful! 🎉", "success");
                        setTimeout(() => navigate("/orders"), 1500);
                    } catch (err) {
                        showToast(err.response?.data?.message || "Payment verification failed", "error");
                    } finally {
                        setPlacing(false);
                    }
                },
            };

            const razor = new window.Razorpay(options);
            razor.on("payment.failed", (resp) => {
                showToast(resp.error?.description || "Payment failed. Please retry.", "error");
                setPlacing(false);
            });
            razor.open();
        } catch (err) {
            showToast(err.response?.data?.message || "Could not initiate payment", "error");
            setPlacing(false);
        }
    };

    /* ── render ── */
    const cartItems = isBuyNow
        ? buyNowProduct ? [{ product: buyNowProduct, quantity: 1 }] : []
        : (cart?.items || []).filter((item) => item.product != null);

    const isLoading = isBuyNow ? !buyNowProduct : !cart;

    return (
        <div className="co-page">
            {/* Toast */}
            {toast.msg && (
                <div className={`co-toast co-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <div className="co-inner">
                <h1 className="co-heading">Checkout</h1>

                {isLoading ? (
                    <div className="co-loading">
                        <div className="co-spinner" />
                        <p>Loading checkout…</p>
                    </div>
                ) : (
                    <div className="co-grid">

                        {/* ══ LEFT COLUMN ══ */}
                        <div className="co-left">

                            {/* Step 1 – Address */}
                            <section className="co-card">
                                <div className="co-step-label">
                                    <span className="co-step-num">1</span>
                                    Choose a delivery address
                                </div>

                                {addresses.length === 0 ? (
                                    <p className="co-empty-addr">
                                        No saved addresses.&nbsp;
                                        <a href="/address" className="co-link">Add one →</a>
                                    </p>
                                ) : (
                                    <div className="co-addr-list">
                                        {addresses.map((addr) => (
                                            <label
                                                key={addr._id}
                                                className={`co-addr-item ${selectedAddress === addr._id ? "co-addr-item--active" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    value={addr._id}
                                                    checked={selectedAddress === addr._id}
                                                    onChange={() => setSelectedAddress(addr._id)}
                                                    className="co-addr-radio"
                                                />
                                                <div className="co-addr-body">
                                                    <p className="co-addr-name">{addr.fullName}</p>
                                                    <p className="co-addr-line">{addr.house}, {addr.area}</p>
                                                    <p className="co-addr-line">{addr.city}, {addr.state} – {addr.pincode}</p>
                                                </div>
                                                {selectedAddress === addr._id && (
                                                    <span className="co-addr-check">✓ Deliver here</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Step 2 – Payment method */}
                            <section className="co-card">
                                <div className="co-step-label">
                                    <span className="co-step-num">2</span>
                                    Select a payment method
                                </div>
                                <div className="co-payment-opts">
                                    <label className={`co-pay-opt ${paymentMethod === "ONLINE" ? "co-pay-opt--active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="ONLINE"
                                            checked={paymentMethod === "ONLINE"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="co-pay-icon">💳</span>
                                        <div>
                                            <p className="co-pay-title">Online Payment</p>
                                            <p className="co-pay-sub">Credit / Debit / UPI / Net Banking via Razorpay</p>
                                        </div>
                                    </label>
                                    <label className={`co-pay-opt ${paymentMethod === "COD" ? "co-pay-opt--active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="COD"
                                            checked={paymentMethod === "COD"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="co-pay-icon">💵</span>
                                        <div>
                                            <p className="co-pay-title">Cash on Delivery</p>
                                            <p className="co-pay-sub">Pay when your order arrives</p>
                                        </div>
                                    </label>
                                </div>
                            </section>
                        </div>

                        {/* ══ RIGHT COLUMN – Order Summary ══ */}
                        <div className="co-right">
                            <section className="co-card co-summary">
                                <div className="co-step-label" style={{ marginBottom: 14 }}>
                                    <span className="co-step-num">3</span>
                                    Review items and place order
                                </div>

                                {/* Items */}
                                <div className="co-items">
                                    {cartItems.map((item) => (
                                        <div key={item.product._id} className="co-item-row">
                                            <div>
                                                <p className="co-item-title">{item.product.title}</p>
                                                <p className="co-item-qty">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="co-item-price">
                                                ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <hr className="co-divider" />

                                {/* Coupon */}
                                <div className="co-coupon">
                                    <p className="co-coupon-label">Apply coupon / promo code</p>
                                    <div className="co-coupon-row">
                                        <input
                                            type="text"
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="co-coupon-input"
                                        />
                                        <button onClick={applyCoupon} className="co-coupon-btn">
                                            Apply
                                        </button>
                                    </div>
                                </div>

                                <hr className="co-divider" />

                                {/* Totals */}
                                <div className="co-totals">
                                    <div className="co-total-row">
                                        <span>Items total:</span>
                                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="co-total-row co-total-row--green">
                                            <span>Coupon discount:</span>
                                            <span>−₹{discount.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    <div className="co-total-row co-total-row--free">
                                        <span>Delivery:</span>
                                        <span>FREE</span>
                                    </div>
                                    <hr className="co-divider" />
                                    <div className="co-total-row co-total-row--final">
                                        <span>Order total:</span>
                                        <span>₹{(finalAmount || subtotal).toLocaleString("en-IN")}</span>
                                    </div>
                                </div>

                                {/* Place Order */}
                                <button
                                    onClick={orderNow}
                                    disabled={placing}
                                    className="co-place-btn"
                                    aria-label="Place your order"
                                >
                                    {placing ? (
                                        <><span className="co-btn-spinner" /> Processing…</>
                                    ) : (
                                        "Place your order"
                                    )}
                                </button>

                                <p className="co-secure">
                                    🔒 By placing your order, you agree to our privacy and conditions of use.
                                </p>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
