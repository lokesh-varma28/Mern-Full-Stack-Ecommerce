import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid,
  FiBox,
  FiPlusSquare,
  FiShoppingBag,
  FiUsers,
  FiBarChart2,
  FiUser,
  FiExternalLink,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

export default function SellerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sellerId = user?._id || user?.id;
  const storeUrl = `http://localhost:5173/seller/${sellerId}`;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: FiGrid },
    { label: "Products", path: "/products", icon: FiBox },
    { label: "Add Product", path: "/add-product", icon: FiPlusSquare },
    { label: "Orders", path: "/orders", icon: FiShoppingBag },
    { label: "Customers", path: "/customers", icon: FiUsers },
    { label: "Analytics", path: "/analytics", icon: FiBarChart2 },
    { label: "Store Profile", path: "/profile", icon: FiUser },
  ];


  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "S"
    );
  };

  return (
    <div className="seller-layout">
      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            zIndex: 35,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`seller-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="seller-sidebar-header">
          <div className="seller-logo-icon">S</div>
          <div>
            <div className="seller-brand-name">Merchant Hub</div>
            <div className="seller-brand-tag">Seller Portal</div>
          </div>
        </div>

        <div className="seller-store-badge-wrap">
          <div className="seller-store-name">
            {user?.storeName || user?.name || "Merchant Store"}
          </div>
          <div className="seller-status-pill seller-status-approved">
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399' }} />
            Approved Partner
          </div>
        </div>

        <nav className="seller-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `seller-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon className="seller-nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* View Public Storefront */}
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="seller-nav-item"
            style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.875rem" }}
          >
            <FiExternalLink className="seller-nav-icon" />
            <span>View Public Store</span>
          </a>
        </nav>

        <div className="seller-sidebar-footer">
          <button onClick={handleLogout} className="seller-btn-logout">
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="seller-main-wrapper">
        {/* Top Navbar */}
        <header className="seller-topbar">
          <div className="seller-topbar-left">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="seller-menu-btn"
              title="Toggle Menu"
            >
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
            <h2 className="seller-page-title">
              {user?.storeName ? `${user.storeName} Dashboard` : "Merchant Control Center"}
            </h2>
          </div>

          <div className="seller-topbar-right">
            <div className="seller-user-info">
              <div className="seller-user-avatar">
                {getInitials(user?.name || user?.storeName)}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.2 }}>
                  {user?.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="seller-content">{children}</main>
      </div>
    </div>
  );
}
