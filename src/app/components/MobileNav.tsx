import { NavLink } from "react-router";
import { LayoutDashboard, Activity, Wifi, Ambulance, Building2 } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/dashboard/icu-central", icon: Activity, label: "ICU" },
  { to: "/dashboard/medical-iot", icon: Wifi, label: "IoT" },
  { to: "/dashboard/mass-casualty", icon: Ambulance, label: "Emergency" },
  { to: "/dashboard/smart-facility", icon: Building2, label: "Facility" },
];

export const MobileNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-[rgba(15,23,42,0.95)] border-t border-[rgba(148,163,184,0.2)] z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? "text-[#0ea5e9]"
                  : "text-[#94a3b8]"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
