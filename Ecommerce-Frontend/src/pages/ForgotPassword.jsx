import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import SceneBackground from "../components/SceneBackground";
import "./Login.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = useCallback((msg, type = "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            showToast("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            await forgotPassword({ email });
            showToast("OTP sent to your email! Redirecting…", "success");
            setTimeout(() => {
                navigate("/reset-password", { state: { email } });
            }, 1500);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to send OTP. Please try again.");
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

            <form onSubmit={submit} className="login-card" noValidate>
                <div className="login-tab">Forgot Password</div>

                <p style={{ fontSize: "0.875rem", color: "#565959", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                    Enter your email address and we'll send you a verification code to reset your password.
                </p>

                <div className="login-field">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? (
                        <span className="login-btn-inner">
                            <span className="login-btn-spinner" />
                            Sending OTP…
                        </span>
                    ) : (
                        "Send Verification Code"
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
