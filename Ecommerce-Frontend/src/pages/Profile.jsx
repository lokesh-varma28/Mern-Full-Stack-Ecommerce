import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api/authApi";
import "./Profile.css";

const QUICK_LINKS = [
    { icon: "📦", label: "Your Orders",     to: "/orders"   },
    { icon: "💳", label: "Payment Methods", to: "/checkout" },
    { icon: "📍", label: "Your Addresses",  to: "/address"  },
    { icon: "❤️", label: "Wish List",       to: "/wishlist" },
    { icon: "⚖️", label: "Compare",         to: "/compare"  },
    { icon: "🔄", label: "Returns",         to: "/returns"  },
];

function Avatar({ name }) {
    const initials = (name || "U")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return <div className="pf-avatar">{initials}</div>;
}

function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`pf-toast pf-toast--${type}`} role="alert">
            {msg}
        </div>
    );
}

export default function Profile() {
    const navigate = useNavigate();

    const [user,        setUser]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [editOpen,    setEditOpen]    = useState(false);
    const [pwdOpen,     setPwdOpen]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [toast,       setToast]       = useState({ msg: "", type: "success" });

    const [editForm,    setEditForm]    = useState({ name: "", email: "", mobile: "" });
    const [pwdForm,     setPwdForm]     = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [showPwd,     setShowPwd]     = useState({ current: false, newp: false, confirm: false });

    /* ── toast ── */
    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "success" }), 3200);
    }, []);

    /* ── load profile ── */
    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getProfile();
            const data = res.data?.user || res.data;
            setUser(data);
            setEditForm({
                name:   data.name   || "",
                email:  data.email  || "",
                mobile: data.mobile || "",
            });
        } catch (err) {
            console.error(err);
            showToast("Could not load profile", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    /* ── save name / email / mobile ── */
    const handleSaveInfo = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) { showToast("Name cannot be empty", "warn"); return; }
        setSaving(true);
        try {
            const res = await updateProfile({
                name:   editForm.name.trim(),
                email:  editForm.email.trim(),
                mobile: editForm.mobile.trim(),
            });
            const updated = res.data?.user || res.data;
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            setEditOpen(false);
            showToast("Profile updated successfully");
        } catch (err) {
            showToast(err.response?.data?.message || "Update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ── change password ── */
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwdForm.newPassword.length < 6) {
            showToast("New password must be at least 6 characters", "warn"); return;
        }
        if (pwdForm.newPassword !== pwdForm.confirm) {
            showToast("Passwords do not match", "warn"); return;
        }
        setSaving(true);
        try {
            await updateProfile({
                currentPassword: pwdForm.currentPassword,
                newPassword:     pwdForm.newPassword,
            });
            setPwdOpen(false);
            setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
            showToast("Password changed successfully");
        } catch (err) {
            showToast(err.response?.data?.message || "Password change failed", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ── sign out ── */
    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    /* ── close modal on backdrop click ── */
    const closeEdit = () => { setEditOpen(false); };
    const closePwd  = () => { setPwdOpen(false); };

    /* ── loading ── */
    if (loading) {
        return (
            <div className="pf-page">
                <div className="pf-loading">
                    <div className="pf-spinner" />
                    <p>Loading your account…</p>
                </div>
            </div>
        );
    }

    const joinDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
        : null;

    return (
        <div className="pf-page">
            <Toast msg={toast.msg} type={toast.type} />

            <div className="pf-inner">

                {/* ══ HERO BANNER ══ */}
                <div className="pf-hero">
                    <div className="pf-hero-bg" />
                    <div className="pf-hero-content">
                        <Avatar name={user?.name} />
                        <div className="pf-hero-info">
                            <h1 className="pf-hero-name">{user?.name || "Customer"}</h1>
                            <p className="pf-hero-email">{user?.email}</p>
                            {joinDate && (
                                <p className="pf-hero-since">Member since {joinDate}</p>
                            )}
                        </div>
                        <button onClick={handleSignOut} className="pf-signout-btn">
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ══ MAIN GRID ══ */}
                <div className="pf-grid">

                    {/* ── LEFT COLUMN ── */}
                    <div className="pf-left">

                        {/* Account info card */}
                        <div className="pf-card">
                            <div className="pf-card-header">
                                <h2 className="pf-card-title">Account Information</h2>
                                <button
                                    onClick={() => setEditOpen(true)}
                                    className="pf-edit-btn"
                                >
                                    Edit
                                </button>
                            </div>

                            <div className="pf-info-grid">
                                <div className="pf-info-item">
                                    <span className="pf-info-label">Full Name</span>
                                    <span className="pf-info-value">{user?.name || "—"}</span>
                                </div>
                                <div className="pf-info-item">
                                    <span className="pf-info-label">Email Address</span>
                                    <span className="pf-info-value">{user?.email || "—"}</span>
                                </div>
                                <div className="pf-info-item">
                                    <span className="pf-info-label">Mobile Number</span>
                                    <span className="pf-info-value">
                                        {user?.mobile ? `+91 ${user.mobile}` : "Not added"}
                                    </span>
                                </div>
                                <div className="pf-info-item">
                                    <span className="pf-info-label">Account Type</span>
                                    <span className="pf-info-value pf-role-badge">
                                        {user?.role === "admin" ? "🛡 Admin" : "👤 Customer"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Security card */}
                        <div className="pf-card">
                            <div className="pf-card-header">
                                <h2 className="pf-card-title">Login &amp; Security</h2>
                            </div>
                            <div className="pf-security-row">
                                <div>
                                    <p className="pf-sec-label">Password</p>
                                    <p className="pf-sec-sub">Last changed: unknown</p>
                                </div>
                                <button
                                    onClick={() => setPwdOpen(true)}
                                    className="pf-edit-btn"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="pf-right">

                        {/* Quick links */}
                        <div className="pf-card">
                            <div className="pf-card-header">
                                <h2 className="pf-card-title">Your Account</h2>
                            </div>
                            <div className="pf-quick-grid">
                                {QUICK_LINKS.map(({ icon, label, to }) => (
                                    <Link key={to} to={to} className="pf-quick-item">
                                        <span className="pf-quick-icon">{icon}</span>
                                        <span className="pf-quick-label">{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recent orders placeholder */}
                        <div className="pf-card">
                            <div className="pf-card-header">
                                <h2 className="pf-card-title">Recent Orders</h2>
                                <Link to="/orders" className="pf-see-all">See all orders</Link>
                            </div>
                            <p className="pf-orders-cta">
                                View and track your recent orders.
                            </p>
                            <Link to="/orders" className="pf-orders-btn">
                                Go to Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ EDIT INFO MODAL ══ */}
            {editOpen && (
                <div className="pf-backdrop" onClick={closeEdit}>
                    <div
                        className="pf-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Edit profile information"
                    >
                        <div className="pf-modal-header">
                            <h3 className="pf-modal-title">Edit Profile</h3>
                            <button onClick={closeEdit} className="pf-modal-close" aria-label="Close">✕</button>
                        </div>

                        <form onSubmit={handleSaveInfo} className="pf-modal-form">
                            <div className="pf-field">
                                <label className="pf-label" htmlFor="pf-name">Full Name <span className="pf-req">*</span></label>
                                <input
                                    id="pf-name"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="pf-input"
                                    placeholder="Full name"
                                    autoComplete="name"
                                />
                            </div>
                            <div className="pf-field">
                                <label className="pf-label" htmlFor="pf-email">Email Address <span className="pf-req">*</span></label>
                                <input
                                    id="pf-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="pf-input"
                                    placeholder="Email address"
                                    autoComplete="email"
                                />
                            </div>
                            <div className="pf-field">
                                <label className="pf-label" htmlFor="pf-mobile">Mobile Number</label>
                                <div className="pf-phone-wrap">
                                    <span className="pf-phone-prefix">+91</span>
                                    <input
                                        id="pf-mobile"
                                        type="text"
                                        value={editForm.mobile}
                                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                                        className="pf-input pf-input--phone"
                                        placeholder="10-digit mobile"
                                        maxLength={10}
                                        inputMode="numeric"
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>
                            <div className="pf-modal-actions">
                                <button type="submit" className="pf-save-btn" disabled={saving}>
                                    {saving ? <><span className="pf-btn-spin" /> Saving…</> : "Save Changes"}
                                </button>
                                <button type="button" onClick={closeEdit} className="pf-cancel-btn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ CHANGE PASSWORD MODAL ══ */}
            {pwdOpen && (
                <div className="pf-backdrop" onClick={closePwd}>
                    <div
                        className="pf-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Change password"
                    >
                        <div className="pf-modal-header">
                            <h3 className="pf-modal-title">Change Password</h3>
                            <button onClick={closePwd} className="pf-modal-close" aria-label="Close">✕</button>
                        </div>

                        <form onSubmit={handleChangePassword} className="pf-modal-form">
                            {[
                                { id: "current", label: "Current Password",  key: "currentPassword", ac: "current-password" },
                                { id: "newp",    label: "New Password",       key: "newPassword",     ac: "new-password" },
                                { id: "confirm", label: "Confirm New Password", key: "confirm",       ac: "new-password" },
                            ].map(({ id, label, key, ac }) => (
                                <div className="pf-field" key={id}>
                                    <label className="pf-label" htmlFor={`pf-pwd-${id}`}>{label} <span className="pf-req">*</span></label>
                                    <div className="pf-pwd-wrap">
                                        <input
                                            id={`pf-pwd-${id}`}
                                            type={showPwd[id] ? "text" : "password"}
                                            value={pwdForm[key]}
                                            onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                                            className="pf-input pf-input--pwd"
                                            placeholder={label}
                                            autoComplete={ac}
                                        />
                                        <button
                                            type="button"
                                            className="pf-pwd-eye"
                                            onClick={() => setShowPwd((s) => ({ ...s, [id]: !s[id] }))}
                                            aria-label={showPwd[id] ? "Hide password" : "Show password"}
                                        >
                                            {showPwd[id] ? "🙈" : "👁"}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <p className="pf-pwd-hint">
                                Password must be at least 6 characters.
                            </p>

                            <div className="pf-modal-actions">
                                <button type="submit" className="pf-save-btn" disabled={saving}>
                                    {saving ? <><span className="pf-btn-spin" /> Saving…</> : "Update Password"}
                                </button>
                                <button type="button" onClick={closePwd} className="pf-cancel-btn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
