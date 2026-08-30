import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginSeller } from "../api/sellerApi";
import { 
  FiLock, 
  FiMail, 
  FiAlertCircle, 
  FiShoppingBag, 
  FiEye, 
  FiEyeOff, 
  FiBox, 
  FiShoppingCart, 
  FiTrendingUp, 
  FiShield 
} from "react-icons/fi";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await loginSeller({ email: email.trim(), password });
      const { token, user } = res.data;

      login(user, token);

      if (user.role !== "seller") {
        setError("Account is authenticated, but you do not have seller permissions.");
        setLoading(false);
        return;
      }

      if (user.sellerStatus === "pending" || user.sellerStatus === "rejected") {
        navigate("/pending");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Seller login error:", err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-login-page">
      <div className="sp-login-container">
        {/* LEFT SIDE: Brand & Marketing Hero Panel */}
        <div className="sp-login-hero">
          <div className="sp-hero-grid-pattern"></div>
          
          <div className="sp-hero-header">
            <div className="sp-hero-logo-badge">
              <FiShoppingBag />
            </div>
            <div>
              <div className="sp-hero-brand-name">Seller Web Portal</div>
              <div className="sp-hero-brand-subtitle">Merchant Workspace</div>
            </div>
          </div>

          <div className="sp-hero-body">
            <div className="sp-hero-tag">
              <FiShield /> Verified Merchant Access
            </div>
            <h1 className="sp-hero-headline">
              Grow your store.<br />
              Manage everything in one place.
            </h1>
            <p className="sp-hero-description">
              Manage products, orders, sales and store performance seamlessly from your unified merchant workspace.
            </p>

            <div className="sp-hero-benefits">
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiBox />
                </div>
                <span>Manage your products & inventory</span>
              </div>
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiShoppingCart />
                </div>
                <span>Track & fulfill customer orders</span>
              </div>
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiTrendingUp />
                </div>
                <span>Monitor real-time store revenue</span>
              </div>
            </div>

            {/* Dashboard Visual Preview Widget */}
            <div className="sp-dashboard-preview" aria-hidden="true">
              <div className="sp-preview-header">
                <div className="sp-preview-title-wrap">
                  <div className="sp-preview-dot"></div>
                  <span className="sp-preview-title">Store Live Overview</span>
                </div>
                <span className="sp-preview-badge">Active</span>
              </div>
              <div className="sp-preview-stats">
                <div className="sp-mini-stat">
                  <div className="sp-mini-stat-label">Total Revenue</div>
                  <div className="sp-mini-stat-value">
                    $18,420
                    <div className="sp-mini-sparkline">
                      <div className="sp-spark-bar"></div>
                      <div className="sp-spark-bar"></div>
                      <div className="sp-spark-bar"></div>
                      <div className="sp-spark-bar"></div>
                      <div className="sp-spark-bar"></div>
                    </div>
                  </div>
                </div>
                <div className="sp-mini-stat">
                  <div className="sp-mini-stat-label">Total Orders</div>
                  <div className="sp-mini-stat-value">
                    428
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>+12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sp-hero-footer">
            <span>&copy; {new Date().getFullYear()} Seller Web Portal. All rights reserved.</span>
          </div>
        </div>

        {/* RIGHT SIDE: Login Card */}
        <div className="sp-login-form-wrapper">
          <div className="sp-login-card">
            {/* Mobile Header Banner */}
            <div className="sp-mobile-brand-header">
              <div className="sp-mobile-brand-icon">
                <FiShoppingBag />
              </div>
              <div className="sp-mobile-brand-title">Seller Web Portal</div>
            </div>

            <div className="sp-card-header">
              <span className="sp-card-badge">Merchant Access</span>
              <h2 className="sp-card-title">Welcome back</h2>
              <p className="sp-card-subtitle">
                Sign in to your seller account to manage your store.
              </p>
            </div>

            {isExpired && !error && (
              <div className="sp-alert sp-alert-warning" role="alert">
                <FiAlertCircle className="sp-alert-icon" />
                <span>Your session has expired. Please sign in again.</span>
              </div>
            )}

            {error && (
              <div className="sp-alert sp-alert-error" role="alert">
                <FiAlertCircle className="sp-alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="sp-form">
              <div className="sp-form-group">
                <label htmlFor="seller-email" className="sp-form-label">
                  Email Address
                </label>
                <div className="sp-input-wrapper">
                  <FiMail className="sp-input-prefix-icon" />
                  <input
                    id="seller-email"
                    type="email"
                    placeholder="seller@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="sp-form-input"
                  />
                </div>
              </div>

              <div className="sp-form-group">
                <label htmlFor="seller-password" className="sp-form-label">
                  Password
                </label>
                <div className="sp-input-wrapper">
                  <FiLock className="sp-input-prefix-icon" />
                  <input
                    id="seller-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="sp-form-input"
                  />
                  <button
                    type="button"
                    className="sp-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sp-submit-btn"
              >
                {loading ? (
                  <>
                    <div className="sp-btn-spinner"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Seller Portal</span>
                )}
              </button>
            </form>

            <div className="sp-card-footer flex flex-col gap-1 text-center">
              <span className="sp-footer-text">
                New merchant?{" "}
                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                  Apply to become a seller
                </Link>
              </span>
              <span className="sp-footer-text text-xs text-slate-400">
                Integrated with Multi-Vendor E-Commerce Platform
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
