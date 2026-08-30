import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiGrid,
  FiBox,
  FiPlusCircle,
  FiShoppingBag,
  FiArrowLeft,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser
} from "react-icons/fi";
import "./Seller.css";

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="seller-portal-container">
      {/* Mobile Header */}
      <header className="seller-mobile-header">
        <button className="seller-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <div className="seller-mobile-brand">
          <span className="seller-brand-badge">Seller Hub</span>
        </div>
        <Link to="/" className="seller-mobile-back" aria-label="Back to Store">
          <FiArrowLeft size={18} />
        </Link>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`seller-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="seller-sidebar-header">
          <div className="seller-logo">
            <span className="seller-logo-icon">📦</span>
            <div>
              <h2 className="seller-logo-title">Seller Hub</h2>
              <span className="seller-logo-sub">Merchant Portal</span>
            </div>
          </div>
          <button className="seller-sidebar-close" onClick={closeSidebar}>
            <FiX size={20} />
          </button>
        </div>

        <div className="seller-user-profile">
          <div className="seller-avatar">
            <FiUser size={20} />
          </div>
          <div className="seller-user-info">
            <span className="seller-user-name">{user?.name || "Merchant"}</span>
            <span className="seller-user-role">{user?.email || "Seller Account"}</span>
          </div>
        </div>

        <nav className="seller-nav flex-1">
          <NavLink
            to="/seller/dashboard"
            onClick={closeSidebar}
            className={({ isActive }) => `seller-nav-item ${isActive ? "active" : ""}`}
          >
            <FiGrid className="seller-nav-icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/seller/products"
            onClick={closeSidebar}
            className={({ isActive }) => `seller-nav-item ${isActive ? "active" : ""}`}
            end
          >
            <FiBox className="seller-nav-icon" />
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/seller/products/add"
            onClick={closeSidebar}
            className={({ isActive }) => `seller-nav-item ${isActive ? "active" : ""}`}
          >
            <FiPlusCircle className="seller-nav-icon" />
            <span>Add Product</span>
          </NavLink>

          <NavLink
            to="/seller/orders"
            onClick={closeSidebar}
            className={({ isActive }) => `seller-nav-item ${isActive ? "active" : ""}`}
          >
            <FiShoppingBag className="seller-nav-icon" />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/seller/profile"
            onClick={closeSidebar}
            className={({ isActive }) => `seller-nav-item ${isActive ? "active" : ""}`}
          >
            <FiUser className="seller-nav-icon" />
            <span>Profile / Store Settings</span>
          </NavLink>
        </nav>

        <div className="seller-sidebar-footer">
          <Link to="/" onClick={closeSidebar} className="seller-nav-item store-link">
            <FiArrowLeft className="seller-nav-icon" />
            <span>Back to Store</span>
          </Link>

          <button onClick={handleLogout} className="seller-logout-btn">
            <FiLogOut className="seller-nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && <div className="seller-backdrop" onClick={closeSidebar}></div>}

      {/* Main Content Area */}
      <main className="seller-main-content">
        <Outlet />
      </main>
    </div>
  );
}
