import { useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import SceneBackground from "../components/SceneBackground";
import GoogleSignInButton from "../components/GoogleSignInButton";
import "./Login.css";

export default function Login() {
    const navigate       = useNavigate();
    const location       = useLocation();
    const { login }      = useAuth();

    // Where to send the user after login (defaults to "/")
    const from = location.state?.from?.pathname || null;

    const [form,     setForm]     = useState({ email: "", password: "" });
    const [showPwd,  setShowPwd]  = useState(false);
    const [remember, setRemember] = useState(false);
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
        if (!form.email.trim())    { showToast("Please enter your email");    return; }
        if (!form.password.trim()) { showToast("Please enter your password"); return; }

        setLoading(true);
        try {
            const res  = await loginUser(form);
            const { token, user } = res.data;

            // ✅ AuthContext — updates Navbar instantly, no page reload needed
            login(user, token);

            navigate(from || "/");
        } catch (err) {
            showToast(err.response?.data?.message || "Login failed. Please try again.");
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
                <div className="login-tab">Sign In</div>

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
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="login-input"
                        autoComplete="current-password"
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
                            /* eye-off */
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                            </svg>
                        ) : (
                            /* eye */
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Remember + forgot */}
                <div className="login-row">
                    <label className="login-remember">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        Keep me signed in
                    </label>
                    <Link to="/forgot-password" className="login-link-forgot">
                        Forgot password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="login-btn-inner">
                            <span className="login-btn-spinner" />
                            Signing in…
                        </span>
                    ) : (
                        "Sign In"
                    )}
                </button>

                {/* Google */}
                <GoogleSignInButton
                    onSuccess={() => {
                        navigate(from || "/");
                    }}
                    onError={(msg) => showToast(msg)}
                />

                {/* Register link */}
                <div className="login-register-wrap">
                    New to Home Store?{" "}
                    <Link to="/register" className="login-link-register">
                        Create your account
                    </Link>
                </div>
            </form>
        </div>
    );
}
