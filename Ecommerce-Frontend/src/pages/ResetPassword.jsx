import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import SceneBackground from "../components/SceneBackground";
import "./Login.css";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        email: location.state?.email || "",
        otp: "",
        newPassword: ""
    });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = useCallback((msg, type = "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email.trim()) {
            showToast("Email is required");
            return;
        }
        if (!form.otp.trim()) {
            showToast("Please enter the OTP sent to your email");
            return;
        }
        if (form.newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "warn");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(form);
            showToast("Password reset successfully! Redirecting…", "success");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            showToast(err.response?.data?.message || "Reset failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {toast.msg && (
                <div className={`login-toast login-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <SceneBackground />

            <form onSubmit={handleSubmit} className="login-card" noValidate>
                <div className="login-tab">Reset Password</div>

                <p style={{ fontSize: "0.875rem", color: "#565959", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                    Enter the verification code sent to your email and create a new password.
                </p>

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

                {/* OTP */}
                <div className="login-field">
                    <input
                        type="text"
                        name="otp"
                        placeholder="Enter OTP"
                        value={form.otp}
                        onChange={handleChange}
                        className="login-input"
                        autoComplete="off"
                        disabled={loading}
                        maxLength={6}
                    />
                    <span className="login-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                    </span>
                </div>

                {/* New Password */}
                <div className="login-field login-field--pwd">
                    <input
                        type={showPwd ? "text" : "password"}
                        name="newPassword"
                        placeholder="New password (min. 6 chars)"
                        value={form.newPassword}
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
                {form.newPassword.length > 0 && form.newPassword.length < 6 && (
                    <p style={{ fontSize: "0.75rem", color: "#ffb347", margin: "-10px 2px 12px", lineHeight: 1.4 }}>
                        Password needs at least 6 characters
                    </p>
                )}

                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? (
                        <span className="login-btn-inner">
                            <span className="login-btn-spinner" />
                            Resetting password…
                        </span>
                    ) : (
                        "Reset Password"
                    )}
                </button>

                <div className="login-register-wrap">
                    Remember your password?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="login-link-register"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
}
