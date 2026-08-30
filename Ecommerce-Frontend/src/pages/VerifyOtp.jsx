import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyOtp, resendOtp } from "../api/authApi";
import SceneBackground from "../components/SceneBackground";
import "./Login.css";
import "./VerifyOtp.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    // 6 individual digit slots
    const [digits,   setDigits]   = useState(Array(OTP_LENGTH).fill(""));
    const [loading,  setLoading]  = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [toast,    setToast]    = useState({ msg: "", type: "" });

    const inputRefs = useRef([]);

    // ── toast helper ──────────────────────────────────────────────────────
    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    }, []);

    // ── start resend countdown ────────────────────────────────────────────
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // ── focus first box on mount ──────────────────────────────────────────
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // ── handle digit input ────────────────────────────────────────────────
    const handleChange = (index, value) => {
        // allow only digits
        const digit = value.replace(/\D/g, "").slice(-1);
        const next  = [...digits];
        next[index] = digit;
        setDigits(next);
        // auto-advance to next box
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ── handle backspace ──────────────────────────────────────────────────
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (digits[index]) {
                // clear current
                const next = [...digits];
                next[index] = "";
                setDigits(next);
            } else if (index > 0) {
                // move to previous box
                inputRefs.current[index - 1]?.focus();
            }
        }
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ── handle paste (e.g. paste "123456" fills all boxes) ───────────────
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = [...digits];
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
        setDigits(next);
        // focus last filled box
        const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[lastIndex]?.focus();
    };

    // ── verify ────────────────────────────────────────────────────────────
    const handleVerify = async (e) => {
        e.preventDefault();
        const otp = digits.join("");
        if (otp.length < OTP_LENGTH) {
            showToast(`Please enter all ${OTP_LENGTH} digits`, "warn");
            return;
        }
        setLoading(true);
        try {
            await verifyOtp({ email, otp });
            showToast("Email verified successfully! 🎉", "success");
            setTimeout(() => navigate("/login"), 1600);
        } catch (err) {
            showToast(err.response?.data?.message || "Invalid OTP. Please try again.", "error");
            // clear all boxes and re-focus first on error
            setDigits(Array(OTP_LENGTH).fill(""));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    // ── resend ────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        try {
            await resendOtp({ email });
            showToast("A new OTP has been sent to your email", "success");
            setCooldown(RESEND_COOLDOWN);
            setDigits(Array(OTP_LENGTH).fill(""));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to resend OTP", "error");
        } finally {
            setResending(false);
        }
    };

    const allFilled = digits.every(Boolean);

    return (
        <div className="login-page">

            {/* ── Toast ── */}
            {toast.msg && (
                <div className={`otp-toast otp-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            {/* ── Scenic SVG background (same as Login / Register) ── */}
            <div className="login-scene">
                <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#e6eef2" />
                            <stop offset="45%"  stopColor="#c7d9e2" />
                            <stop offset="100%" stopColor="#9fb7c9" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="1600" height="900" fill="url(#sky)" />
                    <path d="M0,560 L60,500 130,545 210,470 300,530 380,455 470,520 560,460 650,540 740,470 830,545 920,480 1010,530 1100,460 1190,540 1280,475 1370,540 1460,485 1600,540 1600,900 0,900 Z" fill="#93aec2" opacity="0.75" />
                    <g fill="#5f7a90">
                        <ellipse cx="820" cy="330" rx="95" ry="75" />
                        <ellipse cx="900" cy="290" rx="120" ry="95" />
                        <ellipse cx="1000" cy="330" rx="105" ry="82" />
                        <ellipse cx="880" cy="380" rx="140" ry="90" />
                        <ellipse cx="1010" cy="390" rx="100" ry="75" />
                        <ellipse cx="750" cy="380" rx="90"  ry="70" />
                    </g>
                    <rect x="885" y="420" width="30" height="160" fill="#4a5f74" />
                    <path d="M0,660 L70,610 150,650 230,595 320,645 410,590 500,640 590,600 680,650 770,605 860,655 950,600 1040,650 1130,610 1220,655 1310,600 1400,650 1490,605 1600,650 1600,900 0,900 Z" fill="#42566a" />
                    <g fill="#39495b">
                        <g transform="translate(220,560)"><rect x="-4" y="0" width="8" height="55" /><ellipse cx="0" cy="-8" rx="55" ry="14" /></g>
                        <g transform="translate(1330,545)"><rect x="-4" y="0" width="8" height="60" /><ellipse cx="0" cy="-8" rx="60" ry="15" /></g>
                        <g transform="translate(1420,590)"><rect x="-3" y="0" width="6" height="40" /><ellipse cx="0" cy="-6" rx="42" ry="11" /></g>
                    </g>
                    <path d="M0,760 L90,715 190,750 280,700 380,745 480,695 590,740 690,700 800,745 900,700 1010,745 1110,700 1220,745 1330,700 1440,745 1540,705 1600,730 1600,900 0,900 Z" fill="#1f2c3a" />
                    <g fill="#131c26">
                        <g transform="translate(120,745)">
                            <ellipse cx="0"  cy="-20" rx="150" ry="16" />
                            <ellipse cx="-40" cy="-30" rx="70" ry="20" />
                            <ellipse cx="60"  cy="-32" rx="80" ry="22" />
                            <rect x="-6" y="-10" width="12" height="70" />
                        </g>
                    </g>
                    <g fill="#0f1720" opacity="0.95">
                        <g transform="translate(390,800) scale(1.15)">
                            <ellipse cx="0" cy="0" rx="46" ry="20" />
                            <path d="M-30,-8 Q-46,-40 -36,-52" stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M-30,10 L-40,45"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M-10,14 L-14,48"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M14,14  L18,48"   stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M32,10  L42,45"   stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M-36,-50 L-44,-64" stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                            <path d="M-36,-50 L-30,-66" stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                        </g>
                        <g transform="translate(1230,815) scale(1.3) rotate(-4)">
                            <ellipse cx="0" cy="0" rx="46" ry="20" />
                            <path d="M28,-8  Q46,-38 38,-52"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M-32,10 L-42,45"         stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M-10,14 L-14,48"         stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M12,14  L16,48"          stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M34,10  L44,45"          stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <path d="M38,-50 L30,-64"         stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                            <path d="M38,-50 L46,-66"         stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                        </g>
                    </g>
                    <g stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85">
                        <path d="M40,880  Q50,850  45,880"  /> <path d="M70,885 Q80,855 78,885" />
                        <path d="M1520,880 Q1530,850 1526,880" /> <path d="M1560,885 Q1570,855 1566,885" />
                        <path d="M600,890 Q610,865 606,890" /> <path d="M980,890 Q990,865 986,890" />
                    </g>
                </svg>
            </div>

            {/* ── Card ── */}
            <form onSubmit={handleVerify} className="login-card otp-card" noValidate>

                {/* floating tab */}
                <div className="login-tab">Verify Email</div>

                {/* shield icon */}
                <div className="otp-shield">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
                            stroke="currentColor" strokeWidth="1.6"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M9 12l2 2 4-4"
                            stroke="currentColor" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <p className="otp-heading">Verification Code</p>

                {/* masked email display */}
                <p className="otp-subtext">
                    We sent a {OTP_LENGTH}-digit code to
                </p>
                <p className="otp-email">{email || "your email address"}</p>

                {/* ── 6 digit boxes ── */}
                <div className="otp-boxes" onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className={`otp-box ${digit ? "otp-box--filled" : ""}`}
                            aria-label={`OTP digit ${i + 1}`}
                            autoComplete="one-time-code"
                        />
                    ))}
                </div>

                {/* ── Verify button ── */}
                <button
                    type="submit"
                    className="login-button otp-verify-btn"
                    disabled={loading || !allFilled}
                >
                    {loading ? (
                        <span className="otp-btn-inner">
                            <span className="otp-spinner" />
                            Verifying…
                        </span>
                    ) : (
                        "Verify & Continue"
                    )}
                </button>

                {/* ── Resend row ── */}
                <div className="otp-resend-row">
                    <span className="otp-resend-text">Didn't receive the code?</span>
                    {cooldown > 0 ? (
                        <span className="otp-cooldown">
                            Resend in {cooldown}s
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="otp-resend-btn"
                        >
                            {resending ? "Sending…" : "Resend OTP"}
                        </button>
                    )}
                </div>

                {/* ── Back to register ── */}
                <div className="login-register-wrap" style={{ marginTop: "10px" }}>
                    <Link to="/register" className="login-link-register">
                        ← Back to Register
                    </Link>
                </div>

            </form>
        </div>
    );
}
