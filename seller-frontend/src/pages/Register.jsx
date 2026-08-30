import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerSeller, applySeller } from "../api/sellerApi";
import { useAuth } from "../context/AuthContext";
import {
  FiShoppingBag,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiBox,
  FiTrendingUp,
} from "react-icons/fi";

export default function Register() {
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { user, token } = useAuth();
  const navigate = useNavigate();

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Form Validations
    if (!storeName.trim()) {
      setError("Store Name is required.");
      return;
    }

    if (!token && !ownerName.trim()) {
      setError("Owner Name is required.");
      return;
    }

    if (!token && !email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!token && !EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!PHONE_REGEX.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!businessAddress.trim()) {
      setError("Business address is required.");
      return;
    }

    if (!token) {
      if (!password) {
        setError("Password is required.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setLoading(true);

      if (token && user) {
        // Authenticated customer applying to become a seller
        await applySeller({
          storeName: storeName.trim(),
          phone: phone.trim(),
          businessAddress: businessAddress.trim(),
        });
      } else {
        // Unauthenticated new seller registration
        await registerSeller({
          storeName: storeName.trim(),
          name: ownerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          businessAddress: businessAddress.trim(),
          password,
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Seller registration error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit seller application. Please check your information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-login-page">
      <div className="sp-login-container">
        {/* LEFT SIDE: Hero Panel */}
        <div className="sp-login-hero">
          <div className="sp-hero-grid-pattern"></div>

          <div className="sp-hero-header">
            <div className="sp-hero-logo-badge">
              <FiShoppingBag />
            </div>
            <div>
              <div className="sp-hero-brand-name">Seller Web Portal</div>
              <div className="sp-hero-brand-subtitle">Partner Application</div>
            </div>
          </div>

          <div className="sp-hero-body">
            <div className="sp-hero-tag">
              <FiShield /> Merchant Onboarding
            </div>
            <h1 className="sp-hero-headline">
              Start selling to millions.<br />
              Grow your e-commerce business.
            </h1>
            <p className="sp-hero-description">
              Join our multi-vendor platform to publish products, manage inventory, reach buyers nationwide, and track sales revenue.
            </p>

            <div className="sp-hero-benefits">
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiBox />
                </div>
                <span>Catalog management & zero upfront listing fees</span>
              </div>
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiShoppingBag />
                </div>
                <span>Streamlined order processing & customer delivery</span>
              </div>
              <div className="sp-benefit-item">
                <div className="sp-benefit-icon-wrapper">
                  <FiTrendingUp />
                </div>
                <span>Detailed seller analytics & revenue reporting</span>
              </div>
            </div>
          </div>

          <div className="sp-hero-footer">
            <span>&copy; {new Date().getFullYear()} Seller Web Portal. All rights reserved.</span>
          </div>
        </div>

        {/* RIGHT SIDE: Form / Success Card */}
        <div className="sp-login-form-wrapper">
          <div className="sp-login-card">
            <div className="sp-mobile-brand-header">
              <div className="sp-mobile-brand-icon">
                <FiShoppingBag />
              </div>
              <div className="sp-mobile-brand-title">Seller Web Portal</div>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  <FiCheckCircle />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                  Application submitted successfully.
                </h2>
                <p className="text-base text-slate-600 font-medium mb-6">
                  Your seller account is pending admin approval.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 mb-6 space-y-1">
                  <div>• Store Name: <strong className="text-slate-800">{storeName}</strong></div>
                  <div>• Email: <strong className="text-slate-800">{email || user?.email}</strong></div>
                  <div>• Status: <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Pending Review</span></div>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="sp-submit-btn w-full flex items-center justify-center gap-2"
                >
                  <span>Go to Seller Login</span>
                  <FiArrowRight />
                </button>
              </div>
            ) : (
              <>
                <div className="sp-card-header">
                  <span className="sp-card-badge">New Merchant</span>
                  <h2 className="sp-card-title">Apply as a Seller</h2>
                  <p className="sp-card-subtitle">
                    Fill out your store details to submit your merchant application.
                  </p>
                </div>

                {error && (
                  <div className="sp-alert sp-alert-error" role="alert">
                    <FiAlertCircle className="sp-alert-icon" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="sp-form">
                  <div className="sp-form-group">
                    <label htmlFor="storeName" className="sp-form-label">
                      Store Name
                    </label>
                    <div className="sp-input-wrapper">
                      <FiShoppingBag className="sp-input-prefix-icon" />
                      <input
                        id="storeName"
                        type="text"
                        placeholder="e.g. Apex Electronics Store"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        className="sp-form-input"
                      />
                    </div>
                  </div>

                  {!token && (
                    <>
                      <div className="sp-form-group">
                        <label htmlFor="ownerName" className="sp-form-label">
                          Owner Name
                        </label>
                        <div className="sp-input-wrapper">
                          <FiUser className="sp-input-prefix-icon" />
                          <input
                            id="ownerName"
                            type="text"
                            placeholder="John Doe"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            required
                            className="sp-form-input"
                          />
                        </div>
                      </div>

                      <div className="sp-form-group">
                        <label htmlFor="email" className="sp-form-label">
                          Email Address
                        </label>
                        <div className="sp-input-wrapper">
                          <FiMail className="sp-input-prefix-icon" />
                          <input
                            id="email"
                            type="email"
                            placeholder="seller@store.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="sp-form-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="sp-form-group">
                    <label htmlFor="phone" className="sp-form-label">
                      Phone Number
                    </label>
                    <div className="sp-input-wrapper">
                      <FiPhone className="sp-input-prefix-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 555-0199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="sp-form-input"
                      />
                    </div>
                  </div>

                  <div className="sp-form-group">
                    <label htmlFor="businessAddress" className="sp-form-label">
                      Business Address
                    </label>
                    <div className="sp-input-wrapper">
                      <FiMapPin className="sp-input-prefix-icon" />
                      <input
                        id="businessAddress"
                        type="text"
                        placeholder="123 Commerce St, Suite 400, New York, NY"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        required
                        className="sp-form-input"
                      />
                    </div>
                  </div>

                  {!token && (
                    <>
                      <div className="sp-form-group">
                        <label htmlFor="password" className="sp-form-label">
                          Password
                        </label>
                        <div className="sp-input-wrapper">
                          <FiLock className="sp-input-prefix-icon" />
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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

                      <div className="sp-form-group">
                        <label htmlFor="confirmPassword" className="sp-form-label">
                          Confirm Password
                        </label>
                        <div className="sp-input-wrapper">
                          <FiLock className="sp-input-prefix-icon" />
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="sp-form-input"
                          />
                          <button
                            type="button"
                            className="sp-password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="sp-submit-btn"
                  >
                    {loading ? (
                      <>
                        <div className="sp-btn-spinner"></div>
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <span>Apply as Seller</span>
                    )}
                  </button>
                </form>

                <div className="sp-card-footer">
                  <span className="sp-footer-text">
                    Already registered?{" "}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                      Sign in to your account
                    </Link>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
