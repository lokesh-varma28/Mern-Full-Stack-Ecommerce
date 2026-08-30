import { Link, useLocation } from "react-router-dom";
import {
  FiLayout,
  FiBox,
  FiPlusCircle,
  FiShoppingCart,
  FiUsers,
  FiShoppingBag,
  FiTag,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";

export default function AdminSidebar() {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: FiLayout },
    { label: "Products", path: "/admin/products", icon: FiBox },
    { label: "Add Product", path: "/admin/add-product", icon: FiPlusCircle },
    { label: "Orders", path: "/admin/orders", icon: FiShoppingCart },
    { label: "Users", path: "/admin/users", icon: FiUsers },
    { label: "Sellers", path: "/admin/sellers", icon: FiShoppingBag },
    { label: "Coupons", path: "/admin/coupons", icon: FiTag },
    { label: "Sales Analytics", path: "/admin/sales", icon: FiTrendingUp },
  ];

  return (
    <aside className="w-[216px] bg-gray-900 border-r border-gray-800 text-gray-200 min-h-screen flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-gray-800 flex items-center mb-5 shrink-0">
        <Link
          to="/admin"
          className="flex items-center gap-3 text-base font-semibold text-white tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 text-base shrink-0">
            <FiShield />
          </div>
          <span className="truncate">HomeStore Admin</span>
        </Link>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 px-3 overflow-y-auto">
        <div className="px-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
          Management
        </div>

        <nav className="flex flex-col gap-[6px]">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/admin/add-product" && location.pathname === "/admin/products/add") ||
              (item.path === "/admin/sales" && location.pathname === "/admin/analytics");
            const IconComponent = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 px-3 h-[42px] min-h-[42px] rounded-lg text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                  isActive
                    ? "bg-yellow-400 text-gray-950 font-bold shadow-sm shadow-yellow-400/20"
                    : "text-gray-300 hover:bg-gray-800/80 hover:text-white"
                }`}
              >
                <div className="w-5 h-5 min-w-[20px] flex items-center justify-center shrink-0">
                  <IconComponent
                    className={`text-base transition-colors ${
                      isActive
                        ? "text-gray-950"
                        : "text-gray-400 group-hover:text-yellow-400"
                    }`}
                  />
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Admin User Profile Section */}
      <div className="p-3 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-gray-950 font-bold text-xs flex items-center justify-center shrink-0">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Admin User</p>
            <p className="text-[10px] text-gray-400 truncate">Store Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
