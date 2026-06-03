import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Ticket,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: Tag },
  { path: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/coupons", label: "Coupons", icon: Ticket },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    navigate("/signin");
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className={`flex items-center gap-3 px-6 py-6 border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center overflow-hidden">
          <img src="/logo2.jpeg" alt="Daily Basket" className="w-full h-full object-cover" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-lg font-bold text-white">Daily Basket</span>
            <p className="text-white/60 text-xs">Admin Panel</p>
          </motion.div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate(path);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/20 text-white shadow-lg backdrop-blur"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && (
                <span className="flex-1 text-left">{label}</span>
              )}
              {isActive && !isCollapsed && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-6 space-y-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all ${isCollapsed ? 'justify-center px-2' : ''}`}
        >
          <Menu className="w-5 h-5" />
          {!isCollapsed && <span>Collapse Menu</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all ${isCollapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return "Admin User";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F0] via-white to-[#FDF8F0]">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-gradient-to-b from-[#8B2C2C] to-[#6B1E1E] fixed left-0 top-0 bottom-0 z-30 shadow-2xl"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-[#8B2C2C] rounded-2xl flex items-center justify-center text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#8B2C2C] to-[#6B1E1E] z-50 flex flex-col shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Top Navbar - Simplified */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-end px-6 py-4">
            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-3"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500">{user?.email || "admin@dailybasket.com"}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[#8B2C2C] to-[#6B1E1E] rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                  {getUserInitials()}
                </div>
              </button>

              {/* Profile Dropdown Menu - Only Logout */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800">{getDisplayName()}</p>
                        <p className="text-xs text-gray-500">{user?.email || "admin@dailybasket.com"}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}