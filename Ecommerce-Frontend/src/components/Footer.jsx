import { Link, useLocation } from "react-router-dom";
import "./Footer.css";

const FOOTER_LINKS = [
    {
        heading: "Get to Know Us",
        links: [
            { label: "About Home Store", to: "/" },
            { label: "Careers",          to: "/" },
            { label: "Press Releases",   to: "/" },
            { label: "Home Store Science",to: "/" },
        ],
    },
    {
        heading: "Connect with Us",
        links: [
            { label: "Facebook",  to: "/" },
            { label: "Twitter",   to: "/" },
            { label: "Instagram", to: "/" },
        ],
    },
    {
        heading: "Make Money with Us",
        links: [
            { label: "Sell on Home Store", to: "/" },
            { label: "Become an Affiliate",to: "/" },
            { label: "Advertise Your Products", to: "/" },
        ],
    },
    {
        heading: "Let Us Help You",
        links: [
            { label: "Your Account",      to: "/profile" },
            { label: "Your Orders",       to: "/orders"  },
            { label: "Delivery Rates & Policies", to: "/" },
            { label: "Returns & Replacements",    to: "/" },
            { label: "Manage Your Content",       to: "/" },
            { label: "Help",              to: "/" },
        ],
    },
];

export default function Footer() {
    const location = useLocation();

    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/seller")) {
        return null;
    }

    return (
        <footer className="ft-root">

            {/* ── Back to top ── */}
            <button
                className="ft-back-top"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
            >
                Back to top
            </button>

            {/* ── Main link columns ── */}
            <div className="ft-main">
                <div className="ft-cols">
                    {FOOTER_LINKS.map((col) => (
                        <div key={col.heading} className="ft-col">
                            <h4 className="ft-col-heading">{col.heading}</h4>
                            <ul className="ft-col-list">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link to={link.to} className="ft-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Logo divider ── */}
            <div className="ft-logo-bar">
                <Link to="/" className="ft-logo">
                    <span className="ft-logo-text">Home</span>
                    <span className="ft-logo-text2">Store</span>
                    <span className="ft-logo-dot">.in</span>
                </Link>
            </div>

            {/* ── Legal links ── */}
            <div className="ft-legal">
                <div className="ft-legal-links">
                    <a href="/" className="ft-legal-link">Conditions of Use</a>
                    <a href="/" className="ft-legal-link">Privacy Notice</a>
                    <a href="/" className="ft-legal-link">Interest-Based Ads</a>
                </div>
                <p className="ft-copyright">
                    © 2024–2025, HomeStore.in or its affiliates
                </p>
            </div>

            {/* ── Mobile bottom bar ── */}
            <div className="ft-mobile-links">
                <Link to="/profile"  className="ft-ml">Account</Link>
                <Link to="/orders"   className="ft-ml">Orders</Link>
                <Link to="/wishlist" className="ft-ml">Wish List</Link>
                <Link to="/cart"     className="ft-ml">Cart</Link>
                <Link to="/compare"  className="ft-ml">Compare</Link>
                <Link to="/address"  className="ft-ml">Addresses</Link>
            </div>
        </footer>
    );
}
