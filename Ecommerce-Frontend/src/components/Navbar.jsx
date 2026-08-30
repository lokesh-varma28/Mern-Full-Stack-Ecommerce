import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCart } from "../api/cartApi";
import { getWishlist } from "../api/wishlistApi";
import { useCompare } from "../context/CompareContext";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const CATEGORIES = [
    "All Departments","Mobiles","Laptops","Electronics",
    "Fashion","Home & Kitchen","Books","Sports","Beauty","Toys",
];

export default function Navbar() {
    const navigate  = useNavigate();
    const location  = useLocation();

    const [keyword,    setKeyword]    = useState("");
    const [category,   setCategory]   = useState("All Departments");
    const [cartCount,  setCartCount]  = useState(0);
    const [wishCount,  setWishCount]  = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { compareProducts } = useCompare();
    // ✅ Read from AuthContext — reactively updates on login/logout
    const { user, logout } = useAuth();
    const isAdmin  = user?.role === "admin";
    const cmpCount = (compareProducts || []).length;

    // close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    // lock body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [drawerOpen]);

    // badge counts
    useEffect(() => {
        if (!user) { setCartCount(0); setWishCount(0); return; }
        getCart()
            .then((r) => {
                const items = r.data?.cart?.items || r.data?.items || [];
                setCartCount(items.reduce((s, i) => s + (i.quantity || 1), 0));
            })
            .catch(() => {});
        getWishlist()
            .then((r) => {
                const items = r.data?.wishlist?.products || r.data?.products || [];
                setWishCount(items.length);
            })
            .catch(() => {});
    }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Do NOT render customer-facing Navbar inside Admin or Seller portals
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/seller")) {
        return null;
    }

    const handleSearch = (e) => {
        e?.preventDefault();
        const q = keyword.trim();
        if (!q) return;
        const cat = category !== "All Departments"
            ? `&category=${encodeURIComponent(category)}` : "";
        navigate(`/search?keyword=${encodeURIComponent(q)}${cat}`);
        setDrawerOpen(false);
    };

    const handleSignOut = () => {
        logout(); // ✅ clears AuthContext + localStorage in one call
        setDrawerOpen(false);
        navigate("/login");
    };

    return (
        <>
        <header className="nb-root">

            {/* ══ TOP BAR ══ */}
            <div className="nb-top">

                {/* Hamburger – mobile only */}
                <button
                    className="nb-hamburger-btn"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={drawerOpen}
                >
                    <span className="nb-ham-line" />
                    <span className="nb-ham-line" />
                    <span className="nb-ham-line" />
                </button>

                {/* Logo */}
                <Link to="/" className="nb-logo" aria-label="HomeStore homepage">
                    <span className="nb-logo-text">Home</span>
                    <span className="nb-logo-text2">Store</span>
                    <span className="nb-logo-dot">.in</span>
                </Link>

                {/* Deliver to – desktop only */}
                <div className="nb-deliver">
                    <span className="nb-deliver-top">Deliver to</span>
                    <span className="nb-deliver-bot">
                        <svg width="12" height="14" viewBox="0 0 24 28" fill="#fff">
                            <path d="M12 0C7.58 0 4 3.58 4 8c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/>
                        </svg>
                        India
                    </span>
                </div>

                {/* Search bar */}
                <form className="nb-search" onSubmit={handleSearch} role="search">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="nb-search-cat"
                        aria-label="Search category"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <input
                        type="search"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Search Home Store"
                        className="nb-search-input"
                        aria-label="Search products"
                        autoComplete="off"
                    />
                    <button type="submit" className="nb-search-btn" aria-label="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </form>

                {/* Right icons */}
                <nav className="nb-right" aria-label="Account and shopping">

                    {/* Account dropdown */}
                    <div className="nb-account-wrap">
                        <button className="nb-item nb-item--btn" aria-haspopup="true">
                            <span className="nb-item-top">
                                {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}
                            </span>
                            <span className="nb-item-bot">
                                Account &amp; Lists
                                <svg className="nb-caret" viewBox="0 0 10 6" fill="currentColor">
                                    <path d="M0 0l5 6 5-6z"/>
                                </svg>
                            </span>
                        </button>

                        <div className="nb-account-drop" role="menu">
                            {!user ? (
                                <div className="nb-drop-signin">
                                    <Link to="/login" className="nb-drop-signin-btn">Sign In</Link>
                                    <p className="nb-drop-new">
                                        New customer?&nbsp;
                                        <Link to="/register" className="nb-drop-new-link">Start here</Link>
                                    </p>
                                </div>
                            ) : null}
                            <div className="nb-drop-cols">
                                <div className="nb-drop-col">
                                    <p className="nb-drop-heading">Your Account</p>
                                    <Link to="/profile"  className="nb-drop-link">Your Profile</Link>
                                    <Link to="/orders"   className="nb-drop-link">Your Orders</Link>
                                    <Link to="/wishlist" className="nb-drop-link">Your Wish List</Link>
                                    <Link to="/address"  className="nb-drop-link">Manage Addresses</Link>
                                </div>
                                <div className="nb-drop-col">
                                    <p className="nb-drop-heading">Quick Links</p>
                                    <Link to="/cart"    className="nb-drop-link">Cart</Link>
                                    <Link to="/compare" className="nb-drop-link">Compare</Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="nb-drop-link">Admin Panel</Link>
                                    )}
                                </div>
                            </div>
                            {user && (
                                <div className="nb-drop-footer">
                                    <button onClick={handleSignOut} className="nb-drop-signout">
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Returns & Orders */}
                    <Link to="/orders" className="nb-item nb-item--desktop">
                        <span className="nb-item-top">Returns</span>
                        <span className="nb-item-bot">&amp; Orders</span>
                    </Link>

                    {/* Wishlist */}
                    <Link to="/wishlist" className="nb-item nb-icon-item" aria-label={`Wish List, ${wishCount} items`}>
                        <span className="nb-icon-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            {wishCount > 0 && (
                                <span className="nb-icon-badge">{wishCount > 99 ? "99+" : wishCount}</span>
                            )}
                        </span>
                        <span className="nb-icon-label">Wishlist</span>
                    </Link>

                    {/* Cart */}
                    <Link to="/cart" className="nb-item nb-icon-item nb-cart-item" aria-label={`Cart, ${cartCount} items`}>
                        <span className="nb-icon-wrap">
                            <svg className="nb-cart-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <path d="M16 10a4 4 0 01-8 0"/>
                            </svg>
                            {cartCount > 0 && (
                                <span className="nb-icon-badge nb-icon-badge--cart">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </span>
                        <span className="nb-icon-label">Cart</span>
                    </Link>
                </nav>
            </div>

            {/* ══ BOTTOM NAV BAR (desktop) ══ */}
            <nav className="nb-bot" aria-label="Department navigation">
                <Link to="/" className="nb-bot-item nb-bot-all">
                    <span className="nb-ham-icon">
                        <i/><i/><i/>
                    </span>
                    All
                </Link>
                <Link to="/"             className="nb-bot-item">Home</Link>
                <Link to="/orders"       className="nb-bot-item">Today's Deals</Link>
                <Link to="/wishlist"     className="nb-bot-item">Wish List</Link>
                <Link to="/orders"       className="nb-bot-item">Orders</Link>
                <Link to="/address"      className="nb-bot-item">Addresses</Link>
                <Link to="/compare"      className="nb-bot-item">
                    Compare
                    {cmpCount > 0 && <span className="nb-bot-badge">{cmpCount}</span>}
                </Link>
                <Link to="/profile"      className="nb-bot-item">Account</Link>
                {isAdmin && (
                    <>
                        <span className="nb-bot-sep" />
                        <Link to="/admin"          className="nb-bot-item nb-bot-admin">Dashboard</Link>
                        <Link to="/admin/products" className="nb-bot-item nb-bot-admin">Products</Link>
                        <Link to="/admin/orders"   className="nb-bot-item nb-bot-admin">Orders</Link>
                        <Link to="/admin/users"    className="nb-bot-item nb-bot-admin">Users</Link>
                    </>
                )}
            </nav>
        </header>

        {/* ══ MOBILE DRAWER ══ */}
        {drawerOpen && (
            <div className="nb-drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        )}
        <div className={`nb-drawer ${drawerOpen ? "nb-drawer--open" : ""}`} role="dialog" aria-label="Navigation menu">

            {/* Drawer header */}
            <div className="nb-drawer-head">
                <div className="nb-drawer-user">
                    <div className="nb-drawer-avatar">
                        {user ? user.name.charAt(0).toUpperCase() : "👤"}
                    </div>
                    <div>
                        <p className="nb-drawer-greeting">
                            {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}
                        </p>
                        {!user && (
                            <Link to="/login" className="nb-drawer-signin" onClick={() => setDrawerOpen(false)}>
                                Sign in / Register →
                            </Link>
                        )}
                    </div>
                </div>
                <button className="nb-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                    ✕
                </button>
            </div>

            {/* Mobile search */}
            <form className="nb-drawer-search" onSubmit={handleSearch}>
                <input
                    type="search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search Home Store"
                    className="nb-drawer-search-input"
                />
                <button type="submit" className="nb-drawer-search-btn" aria-label="Search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </form>

            {/* Drawer links */}
            <div className="nb-drawer-body">
                <p className="nb-drawer-section">Shop by Department</p>
                {CATEGORIES.slice(1).map((cat) => (
                    <Link
                        key={cat}
                        to={`/?category=${encodeURIComponent(cat)}`}
                        className="nb-drawer-link"
                        onClick={() => setDrawerOpen(false)}
                    >
                        {cat}
                        <span className="nb-drawer-arrow">›</span>
                    </Link>
                ))}

                <p className="nb-drawer-section">Your Account</p>
                <Link to="/profile"  className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Your Profile<span className="nb-drawer-arrow">›</span></Link>
                <Link to="/orders"   className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Your Orders<span className="nb-drawer-arrow">›</span></Link>
                <Link to="/wishlist" className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>
                    Your Wish List
                    {wishCount > 0 && <span className="nb-drawer-badge">{wishCount}</span>}
                    <span className="nb-drawer-arrow">›</span>
                </Link>
                <Link to="/cart"     className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>
                    Cart
                    {cartCount > 0 && <span className="nb-drawer-badge">{cartCount}</span>}
                    <span className="nb-drawer-arrow">›</span>
                </Link>
                <Link to="/address"  className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Manage Addresses<span className="nb-drawer-arrow">›</span></Link>
                <Link to="/compare"  className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>
                    Compare
                    {cmpCount > 0 && <span className="nb-drawer-badge">{cmpCount}</span>}
                    <span className="nb-drawer-arrow">›</span>
                </Link>

                {isAdmin && (
                    <>
                        <p className="nb-drawer-section nb-drawer-section--admin">Admin Panel</p>
                        <Link to="/admin"          className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Dashboard<span className="nb-drawer-arrow">›</span></Link>
                        <Link to="/admin/products" className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Products<span className="nb-drawer-arrow">›</span></Link>
                        <Link to="/admin/orders"   className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Orders<span className="nb-drawer-arrow">›</span></Link>
                        <Link to="/admin/users"    className="nb-drawer-link" onClick={() => setDrawerOpen(false)}>Users<span className="nb-drawer-arrow">›</span></Link>
                    </>
                )}

                {user && (
                    <button onClick={handleSignOut} className="nb-drawer-signout">
                        Sign Out
                    </button>
                )}
            </div>
        </div>

        {/* ══ MOBILE BOTTOM TAB BAR ══ */}
        <nav className="nb-tab-bar" aria-label="Mobile navigation">
            <Link to="/" className="nb-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span>Home</span>
            </Link>
            <Link to="/search" className="nb-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Search</span>
            </Link>
            <Link to="/cart" className="nb-tab nb-tab--cart">
                <span className="nb-tab-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    {cartCount > 0 && (
                        <span className="nb-tab-badge">{cartCount > 9 ? "9+" : cartCount}</span>
                    )}
                </span>
                <span>Cart</span>
            </Link>
            <Link to="/wishlist" className="nb-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span>Wishlist</span>
            </Link>
            <Link to="/profile" className="nb-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Account</span>
            </Link>
        </nav>
        </>
    );
}
