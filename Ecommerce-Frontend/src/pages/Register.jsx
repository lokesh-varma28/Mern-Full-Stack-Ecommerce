import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";
import SceneBackground from "../components/SceneBackground";
import GoogleSignInButton from "../components/GoogleSignInButton";
import "./Login.css";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name:     "",
        email:    "",
        password: "",
    });
    const [showPwd,  setShowPwd]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [toast,    setToast]    = useState({ msg: "", type: "" });

    const showToast = useCallback((msg, type = "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    }, []);

    const handleChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            showToast("Please enter your full name");
            return;
        }
        if (!form.email.trim()) {
            showToast("Please enter your email address");
            return;
        }
        if (form.password.length < 6) {
            showToast("Password must be at least 6 characters", "warn");
            return;
        }

        setLoading(true);
        try {
            await registerUser(form);
            showToast("OTP sent to your email! Redirecting…", "success");
            setTimeout(() => {
                navigate("/verify-otp", { state: { email: form.email } });
            }, 1500);
        } catch (err) {
            showToast(
                err.response?.data?.message || "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* Toast */}
            {toast.msg && (
                <div className={`login-toast login-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            {/* Scenic background */}
            <SceneBackground />

            {/* Card */}
            <form onSubmit={handleSubmit} className="login-card" noValidate>
                <div className="login-tab">Register</div>

                {/* Full Name */}
                <div className="login-field">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        className="login-input"
                        autoComplete="name"
                        disabled={loading}
                    />
                    <span className="login-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="8" r="4"
                                stroke="currentColor" strokeWidth="1.6"/>
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6"
                                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                    </span>
                </div>

                {/* Email */}
                <div className="login-field">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={handleChange}
                        className="login-input"
                        autoComplete="email"
                        disabled={loading}
                    />
                    <span className="login-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="5" width="18" height="14" rx="2"
                                stroke="currentColor" strokeWidth="1.6"/>
                            <path d="M3 7l9 6 9-6"
                                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                    </span>
                </div>

                {/* Password with show/hide */}
                <div className="login-field login-field--pwd">
                    <input
                        type={showPwd ? "text" : "password"}
                        name="password"
                        placeholder="Create password (min. 6 chars)"
                        value={form.password}
                        onChange={handleChange}
                        className="login-input"
                        autoComplete="new-password"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="login-pwd-eye"
                        onClick={() => setShowPwd((v) => !v)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        tabIndex={-1}
                    >
                        {showPwd ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Password strength hint */}
                {form.password.length > 0 && form.password.length < 6 && (
                    <p style={{ fontSize: "0.75rem", color: "#ffb347", margin: "-10px 2px 12px", lineHeight: 1.4 }}>
                        Password needs at least 6 characters
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="login-btn-inner">
                            <span className="login-btn-spinner" />
                            Creating account…
                        </span>
                    ) : (
                        "Create Account"
                    )}
                </button>

                {/* Google */}
                <GoogleSignInButton
                    onSuccess={() => {
                        navigate("/");
                    }}
                    onError={(msg) => showToast(msg)}
                />

                {/* Sign in link */}
                <div className="login-register-wrap">
                    Already have an account?{" "}
                    <Link to="/login" className="login-link-register">
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}
