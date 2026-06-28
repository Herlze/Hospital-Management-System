import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  AlertCircle,
  Activity,
  Clock,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const notifications = [
    { id: 1, type: "critical", title: "Critical Patient Alert", message: "Patient #4521 - ICU Bed 12", time: "2 min ago", icon: AlertCircle },
    { id: 2, type: "warning", title: "Equipment Maintenance", message: "Ventilator #23 requires inspection", time: "15 min ago", icon: Activity },
    { id: 3, type: "info", title: "Shift Change", message: "Night shift starts in 30 minutes", time: "1 hour ago", icon: Clock },
  ];

  return (
    <header className="h-16 backdrop-blur-xl bg-[rgba(15,23,42,0.8)] border-b border-[rgba(148,163,184,0.2)] flex items-center justify-between px-4 md:px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search patients, staff, devices, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[rgba(14,165,233,0.2)] transition-all"
          />
        </div>
      </div>

      {/* Mobile Logo */}
      <div className="flex md:hidden items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">MediCore</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-6">
        {/* Current Time */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 backdrop-blur-lg bg-[rgba(148,163,184,0.1)] rounded-lg border border-[rgba(148,163,184,0.2)]">
          <Clock className="w-4 h-4 text-[#0ea5e9]" />
          <span className="text-sm text-white">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg transition-all"
          >
            <Bell className="w-5 h-5 text-[#94a3b8]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 backdrop-blur-xl bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-50"
              >
                <div className="p-4 border-b border-[rgba(148,163,184,0.2)]">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <p className="text-xs text-[#94a3b8]">{notifications.length} new alerts</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 border-b border-[rgba(148,163,184,0.1)] hover:bg-[rgba(148,163,184,0.05)] transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${
                          notif.type === 'critical' ? 'bg-[rgba(239,68,68,0.2)]' :
                          notif.type === 'warning' ? 'bg-[rgba(245,158,11,0.2)]' :
                          'bg-[rgba(14,165,233,0.2)]'
                        }`}>
                          <notif.icon className={`w-4 h-4 ${
                            notif.type === 'critical' ? 'text-[#ef4444]' :
                            notif.type === 'warning' ? 'text-[#f59e0b]' :
                            'text-[#0ea5e9]'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{notif.title}</p>
                          <p className="text-xs text-[#94a3b8] mt-1">{notif.message}</p>
                          <p className="text-xs text-[#94a3b8] mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[rgba(148,163,184,0.2)]">
                  <button className="w-full text-sm text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-[#94a3b8]">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-50"
              >
                <div className="p-4 border-b border-[rgba(148,163,184,0.2)]">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-[#94a3b8]">{user?.email}</p>
                  <p className="text-xs text-[#0ea5e9] mt-1">{user?.role}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white rounded-lg transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/dashboard/settings");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white rounded-lg transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>
                <div className="p-2 border-t border-[rgba(148,163,184,0.2)]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};