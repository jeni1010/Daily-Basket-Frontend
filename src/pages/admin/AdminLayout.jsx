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

// Professional Slate + Blue Theme
const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  sidebarBg: '#1E293B',
  sidebarDark: '#0F172A',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  bgMain: '#F1F5F9',
  cardBg: '#FFFFFF',
  danger: '#EF4444',
};

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    navigate("/signin");
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
          <img src="/logo2.jpeg" alt="Daily Basket" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-lg font-bold text-white">Daily Basket</span>
          <p className="text-white/60 text-xs">Admin Panel</p>
        </div>
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
                  ? "bg-[#3B82F6] text-white shadow-lg"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          );
        })}
      </nav>
    </>
  );

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return "Admin User";
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Desktop sidebar - Slate Dark */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-[#1E293B] to-[#0F172A] fixed left-0 top-0 bottom-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button - Blue */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-[#3B82F6] rounded-2xl flex items-center justify-center text-white shadow-lg"
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#1E293B] to-[#0F172A] z-50 flex flex-col shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-72">
        {/* Top Navbar - Professional Blue */}
        <div className="sticky top-0 z-20 bg-white shadow-md border-b border-[#E2E8F0]">
          <div className="flex items-center justify-end px-6 py-4">
            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-3"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-[#1E293B]">{getDisplayName()}</p>
                  <p className="text-xs text-[#64748B]">{user?.email || "admin@dailybasket.com"}</p>
                </div>
                <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                  {getUserInitials()}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
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
                      className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-lg border border-[#E2E8F0] z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F1F5F9]">
                        <p className="text-sm font-semibold text-[#1E293B]">{getDisplayName()}</p>
                        <p className="text-xs text-[#64748B]">{user?.email || "admin@dailybasket.com"}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors"
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