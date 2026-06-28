import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Activity, 
  Wifi, 
  Ambulance, 
  Building2, 
  Settings, 
  User,
  Heart,
  Shield,
  Stethoscope
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/icu-central", icon: Activity, label: "ICU Central" },
  { to: "/dashboard/medical-iot", icon: Wifi, label: "Medical IoT" },
  { to: "/dashboard/mass-casualty", icon: Ambulance, label: "MCI / Emergency" },
  { to: "/dashboard/smart-facility", icon: Building2, label: "Smart Facility" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 backdrop-blur-xl bg-[rgba(15,23,42,0.8)] border-r border-[rgba(148,163,184,0.2)] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-[rgba(148,163,184,0.2)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#0a0e1a]"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">MediCore</h1>
            <p className="text-xs text-[#94a3b8]">Hospital System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9] shadow-lg shadow-[rgba(14,165,233,0.2)]"
                  : "text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(148,163,184,0.2)]">
        <div className="backdrop-blur-lg bg-[rgba(14,165,233,0.1)] rounded-lg p-4 border border-[rgba(14,165,233,0.3)]">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#0ea5e9]" />
            <span className="text-sm font-medium text-white">System Status</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94a3b8]">All Systems</span>
              <span className="text-[#10b981] font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94a3b8]">Uptime</span>
              <span className="text-white">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
