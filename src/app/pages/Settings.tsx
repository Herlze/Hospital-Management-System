import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import {
  Users, Shield, Building2, Bell, Mail, Database, FileText,
  Server, Lock, Key, Download, Upload, RefreshCw, ChevronRight,
  Plus, Edit, Trash2, Save, Search, X, Activity, Settings as SettingsIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { id: "users", label: "User Management", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "hospital", label: "Hospital Profile", icon: Building2 },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "email", label: "Email Config", icon: Mail },
  { id: "database", label: "Database", icon: Database },
  { id: "backup", label: "Backup & Restore", icon: Download },
  { id: "audit", label: "Audit Trail", icon: FileText },
  { id: "api", label: "API Config", icon: Server },
  { id: "security", label: "Security", icon: Lock },
  { id: "system", label: "System & About", icon: SettingsIcon },
];

const USERS = [
  { id: "U001", name: "Dr. Sarah Reeves", email: "s.reeves@medicore.com", role: "Doctor", dept: "ICU", status: "active", lastLogin: "Today 08:15" },
  { id: "U002", name: "Kim Li", email: "k.li@medicore.com", role: "Nurse", dept: "ICU", status: "active", lastLogin: "Today 06:00" },
  { id: "U003", name: "Admin Root", email: "admin@medicore.com", role: "Super Admin", dept: "IT", status: "active", lastLogin: "Today 09:00" },
  { id: "U004", name: "James Wright", email: "j.wright@medicore.com", role: "Doctor", dept: "Surgery", status: "active", lastLogin: "Yesterday" },
  { id: "U005", name: "Tom Brady", email: "t.brady@medicore.com", role: "Nurse", dept: "General", status: "inactive", lastLogin: "3 days ago" },
  { id: "U006", name: "Mark Torres", email: "m.torres@medicore.com", role: "Doctor", dept: "Emergency", status: "active", lastLogin: "Today 07:45" },
];

const ROLES_DATA = [
  { role: "Super Admin", permissions: 48, users: 2, color: "#ef4444" },
  { role: "Hospital Administrator", permissions: 36, users: 3, color: "#f59e0b" },
  { role: "Doctor", permissions: 28, users: 24, color: "#0ea5e9" },
  { role: "Nurse", permissions: 20, users: 68, color: "#10b981" },
  { role: "ICU Staff", permissions: 22, users: 12, color: "#8b5cf6" },
  { role: "Emergency Staff", permissions: 22, users: 8, color: "#ef4444" },
  { role: "IoT Engineer", permissions: 18, users: 4, color: "#06b6d4" },
  { role: "Security Officer", permissions: 14, users: 6, color: "#475569" },
];

const AUDIT_LOG = [
  { id: "A001", action: "User Login", user: "admin@medicore.com", module: "Auth", detail: "Login from 192.168.1.50", time: "09:00", sev: "info" },
  { id: "A002", action: "Patient Record Updated", user: "s.reeves@medicore.com", module: "ICU", detail: "Patient P001 — vitals updated", time: "08:47", sev: "info" },
  { id: "A003", action: "Device Quarantined", user: "iot@medicore.com", module: "IoT", detail: "MAC 3C:A9:F4:12:88:B2 isolated", time: "08:02", sev: "warning" },
  { id: "A004", action: "Failed Login Attempt", user: "unknown@external.com", module: "Auth", detail: "3 attempts from 198.51.100.12", time: "07:33", sev: "critical" },
  { id: "A005", action: "Report Exported", user: "k.li@medicore.com", module: "ICU", detail: "ICU report — PDF exported", time: "07:15", sev: "info" },
  { id: "A006", action: "HVAC Override", user: "facility@medicore.com", module: "Facility", detail: "ICU Wing B — manual override", time: "06:58", sev: "warning" },
];

const DEPTS = [
  { id: "D01", name: "ICU", head: "Dr. Sarah Reeves", beds: 50, staff: 22, ext: "3100" },
  { id: "D02", name: "Emergency", head: "Dr. Mark Torres", beds: 25, staff: 18, ext: "3200" },
  { id: "D03", name: "Surgery", head: "Dr. James Wright", beds: 40, staff: 15, ext: "3300" },
  { id: "D04", name: "General Ward", head: "Dr. Alice Chen", beds: 200, staff: 45, ext: "3400" },
  { id: "D05", name: "Cardiology", head: "Dr. Robert Lee", beds: 30, staff: 12, ext: "3500" },
  { id: "D06", name: "Radiology", head: "Dr. Priya Nair", beds: 0, staff: 8, ext: "3600" },
];

export default function Settings() {
  const { user } = useAuth();
  const [section, setSection] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    criticalPatient: true, rogueDevice: true, ambulance: true, hvacFailure: true,
    tempWarning: true, securityAlert: true, maintenance: false, systemUpdate: true,
  });
  const [smtpTLS, setSmtpTLS] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const filteredUsers = USERS.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex gap-4 pb-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar Nav */}
      <aside className="w-52 shrink-0 space-y-1 hidden md:block">
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-[#94a3b8] mb-1">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span className="text-[#0ea5e9]">Settings</span>
          </div>
          <h1 className="text-lg font-bold text-white">Administration</h1>
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${section === item.id ? "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9] border border-[rgba(14,165,233,0.3)]" : "text-[#94a3b8] hover:bg-[rgba(148,163,184,0.08)] hover:text-white"}`}>
            <item.icon className="w-4 h-4 shrink-0" /><span>{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Mobile picker */}
      <div className="md:hidden w-full mb-3">
        <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
          {NAV.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* User Management */}
        {section === "users" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..."
                    className="pl-9 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                </div>
                <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-3 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm hover:bg-[#0284c7] transition-all">
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
            </div>
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(148,163,184,0.1)]">
                    {["Name", "Email", "Role", "Dept", "Status", "Last Login", "Actions"].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                          <span className="text-white font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#94a3b8] text-xs">{u.email}</td>
                      <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(14,165,233,0.15)] text-[#0ea5e9]">{u.role}</span></td>
                      <td className="py-3 px-4 text-[#94a3b8] text-xs">{u.dept}</td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1 text-xs ${u.status === "active" ? "text-[#10b981]" : "text-[#475569]"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-[#10b981]" : "bg-[#475569]"}`} />{u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#475569] text-xs">{u.lastLogin}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => toast.success(`Editing ${u.name}`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toast.info(`Password reset sent to ${u.email}`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(245,158,11,0.1)] hover:text-[#f59e0b] transition-all"><Key className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toast.success(`${u.name} status toggled`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </>
        )}

        {/* Roles */}
        {section === "roles" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Roles & Permission Management</h2>
              <button onClick={() => toast.success("New role created")} className="flex items-center gap-2 px-3 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm hover:bg-[#0284c7] transition-all"><Plus className="w-4 h-4" /> Create Role</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES_DATA.map(r => (
                <GlassCard key={r.role} className="p-4 cursor-pointer hover:border-[rgba(14,165,233,0.3)] transition-all" onClick={() => toast.info(`Opening permissions for ${r.role}`)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: r.color }} /><span className="font-semibold text-white">{r.role}</span></div>
                    <button onClick={e => { e.stopPropagation(); toast.success(`Editing ${r.role}`); }} className="p-1 hover:bg-[rgba(148,163,184,0.1)] rounded-md transition-all"><Edit className="w-3.5 h-3.5 text-[#94a3b8]" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg text-center">
                      <div className="text-xl font-bold" style={{ color: r.color, fontFamily: "monospace" }}>{r.permissions}</div>
                      <div className="text-xs text-[#94a3b8]">Permissions</div>
                    </div>
                    <div className="p-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg text-center">
                      <div className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>{r.users}</div>
                      <div className="text-xs text-[#94a3b8]">Users</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {/* Hospital Profile */}
        {section === "hospital" && (
          <>
            <h2 className="text-xl font-bold text-white">Hospital Profile</h2>
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[["Hospital Name", "MediCore General Hospital"], ["Hospital ID", "HID-2024-MCGH-001"], ["License Number", "LIC-HC-2024-004521"], ["Accreditation", "JCI Accredited — Gold Seal"], ["Address", "123 Healthcare Blvd, Medical District"], ["City / Country", "New York, United States"], ["Phone", "+1 (555) 200-CARE"], ["Emergency Line", "+1 (555) 911-EMRG"], ["Total Beds", "485"], ["Established", "1987"]].map(([label, val]) => (
                  <div key={label}>
                    <label className="block text-xs text-[#94a3b8] mb-1">{label}</label>
                    <input defaultValue={val} className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                  </div>
                ))}
              </div>
              <button onClick={() => toast.success("Hospital profile saved")} className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all"><Save className="w-4 h-4" /> Save Changes</button>
            </GlassCard>
          </>
        )}

        {/* Departments */}
        {section === "departments" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Department Management</h2>
              <button onClick={() => toast.success("New department created")} className="flex items-center gap-2 px-3 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm hover:bg-[#0284c7] transition-all"><Plus className="w-4 h-4" /> Add Department</button>
            </div>
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[rgba(148,163,184,0.1)]">{["ID", "Department", "Head", "Beds", "Staff", "Ext.", "Actions"].map(h => <th key={h} className="py-3 px-4 text-left text-xs text-[#94a3b8] font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {DEPTS.map(d => (
                    <tr key={d.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)]">
                      <td className="py-3 px-4 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{d.id}</td>
                      <td className="py-3 px-4 text-white font-medium">{d.name}</td>
                      <td className="py-3 px-4 text-[#94a3b8] text-xs">{d.head}</td>
                      <td className="py-3 px-4 text-white" style={{ fontFamily: "monospace" }}>{d.beds}</td>
                      <td className="py-3 px-4 text-white" style={{ fontFamily: "monospace" }}>{d.staff}</td>
                      <td className="py-3 px-4 text-[#06b6d4]" style={{ fontFamily: "monospace" }}>{d.ext}</td>
                      <td className="py-3 px-4"><div className="flex gap-1">
                        <button onClick={() => toast.success(`Editing ${d.name}`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toast.error("Delete department?")} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </>
        )}

        {/* Notifications */}
        {section === "notifications" && (
          <>
            <h2 className="text-xl font-bold text-white">Notification Settings</h2>
            <GlassCard className="p-5">
              <div className="space-y-3">
                {(Object.entries(notifPrefs) as [keyof typeof notifPrefs, boolean][]).map(([key, val]) => {
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                  const colors: Record<string, string> = { criticalPatient: "#ef4444", rogueDevice: "#f59e0b", ambulance: "#0ea5e9", hvacFailure: "#8b5cf6", tempWarning: "#f59e0b", securityAlert: "#ef4444", maintenance: "#10b981", systemUpdate: "#06b6d4" };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-[rgba(148,163,184,0.08)]">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[key] }} />
                        <p className="text-white text-sm font-medium">{label}</p>
                      </div>
                      <button onClick={() => { setNotifPrefs(p => ({ ...p, [key]: !p[key] })); toast.success("Updated"); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${val ? "bg-[#0ea5e9]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${val ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => toast.success("Notification settings saved")} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all"><Save className="w-4 h-4" /> Save</button>
            </GlassCard>
          </>
        )}

        {/* Email */}
        {section === "email" && (
          <>
            <h2 className="text-xl font-bold text-white">Email Configuration</h2>
            <GlassCard className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[["SMTP Server", "smtp.medicore.com"], ["Port", "587"], ["From Address", "noreply@medicore.com"]].map(([label, val]) => (
                  <div key={label}>
                    <label className="block text-xs text-[#94a3b8] mb-1">{label}</label>
                    <input defaultValue={val} className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <div><p className="text-white text-sm font-medium">TLS Encryption</p><p className="text-xs text-[#94a3b8]">Encrypt email in transit</p></div>
                  <button onClick={() => setSmtpTLS(!smtpTLS)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smtpTLS ? "bg-[#0ea5e9]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smtpTLS ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => toast.success("Test email sent")} className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-sm hover:bg-[rgba(14,165,233,0.2)] transition-all"><Mail className="w-4 h-4" /> Send Test</button>
                <button onClick={() => toast.success("Email config saved")} className="flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all"><Save className="w-4 h-4" /> Save</button>
              </div>
            </GlassCard>
          </>
        )}

        {/* Database */}
        {section === "database" && (
          <>
            <h2 className="text-xl font-bold text-white">Database Monitoring</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[["Active Connections", "48", "#0ea5e9"], ["DB Size", "284 GB", "#10b981"], ["Query Latency", "12 ms", "#f59e0b"], ["Replication Lag", "0.3 s", "#8b5cf6"]].map(([label, val, color]) => (
                <GlassCard key={label} className="p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color, fontFamily: "monospace" }}>{val}</div>
                  <div className="text-xs text-[#94a3b8] mt-1">{label}</div>
                </GlassCard>
              ))}
            </div>
            <GlassCard className="p-5">
              <h3 className="font-semibold text-white mb-3">Database Nodes</h3>
              <div className="space-y-2">
                {[["Primary DB (PostgreSQL)", "db-primary.medicore.internal", "180 GB"], ["Replica DB", "db-replica.medicore.internal", "180 GB"], ["Redis Cache", "cache.medicore.internal", "2 GB"], ["TimescaleDB (Vitals)", "tsdb.medicore.internal", "102 GB"]].map(([db, host, size]) => (
                  <div key={db} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.08)] transition-colors">
                    <div><p className="text-white text-sm font-medium">{db}</p><p className="text-[#475569] text-xs" style={{ fontFamily: "monospace" }}>{host}</p></div>
                    <div className="text-right"><span className="text-xs text-[#10b981] flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />Online</span><p className="text-xs text-[#94a3b8] mt-0.5" style={{ fontFamily: "monospace" }}>{size}</p></div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Backup */}
        {section === "backup" && (
          <>
            <h2 className="text-xl font-bold text-white">Backup & Restore</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5">
                <h3 className="font-semibold text-white mb-4">Create Backup</h3>
                <div className="space-y-2">
                  {["Full System Backup", "Database Only", "Configuration Only", "Patient Records"].map(t => (
                    <button key={t} onClick={() => toast.success(`${t} started...`)} className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.15)] rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(148,163,184,0.08)] transition-all text-left text-sm">
                      <Download className="w-4 h-4" />{t}
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <h3 className="font-semibold text-white mb-4">Recent Backups</h3>
                <div className="space-y-2">
                  {[["Full Backup", "2026-06-26 02:00", "284 GB"], ["Full Backup", "2026-06-25 02:00", "281 GB"], ["DB Backup", "2026-06-26 06:00", "180 GB"], ["Config Backup", "2026-06-24 18:00", "12 MB"]].map(([name, date, size], i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(148,163,184,0.05)]">
                      <div><p className="text-white text-sm">{name}</p><p className="text-[#475569] text-xs">{date}</p></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-[#94a3b8]" style={{ fontFamily: "monospace" }}>{size}</span><button onClick={() => toast.success("Restore initiated")} className="text-xs px-2 py-1 bg-[rgba(14,165,233,0.1)] text-[#0ea5e9] rounded hover:bg-[rgba(14,165,233,0.2)] transition-colors">Restore</button></div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </>
        )}

        {/* Audit Trail */}
        {section === "audit" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Audit Trail</h2>
              <button onClick={() => toast.success("Audit log exported")} className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all"><Download className="w-4 h-4" /> Export</button>
            </div>
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[rgba(148,163,184,0.1)]">{["ID", "Action", "User", "Module", "Detail", "Time", "Severity"].map(h => <th key={h} className="py-3 px-4 text-left text-xs text-[#94a3b8] font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {AUDIT_LOG.map(a => (
                    <tr key={a.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)]">
                      <td className="py-2.5 px-4 text-[#475569] text-xs" style={{ fontFamily: "monospace" }}>{a.id}</td>
                      <td className="py-2.5 px-4 text-white font-medium text-sm">{a.action}</td>
                      <td className="py-2.5 px-4 text-[#94a3b8] text-xs">{a.user}</td>
                      <td className="py-2.5 px-4"><span className="text-xs px-2 py-0.5 rounded bg-[rgba(14,165,233,0.1)] text-[#0ea5e9]">{a.module}</span></td>
                      <td className="py-2.5 px-4 text-[#94a3b8] text-xs max-w-[160px] truncate">{a.detail}</td>
                      <td className="py-2.5 px-4 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{a.time}</td>
                      <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${a.sev === "critical" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : a.sev === "warning" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : "bg-[rgba(16,185,129,0.15)] text-[#10b981]"}`}>{a.sev}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </>
        )}

        {/* API Config */}
        {section === "api" && (
          <>
            <h2 className="text-xl font-bold text-white">API Configuration</h2>
            <GlassCard className="p-5 space-y-3">
              {[{ name: "HL7 FHIR R4 API", key: "fhir-live-7x9k2m...", status: "active", calls: "12,450/day", endpoint: "https://api.medicore.com/fhir/r4" }, { name: "DICOM Web API", key: "dcm-6y8n3p...", status: "active", calls: "3,200/day", endpoint: "https://api.medicore.com/dicom" }, { name: "IoT Device API", key: "iot-3t5v8r...", status: "active", calls: "48,200/day", endpoint: "https://api.medicore.com/iot" }, { name: "External Lab API", key: "lab-1w4k9s...", status: "inactive", calls: "0/day", endpoint: "https://lab.external.com/api/v2" }].map(api => (
                <div key={api.name} className="flex items-start justify-between p-4 bg-[rgba(148,163,184,0.05)] rounded-xl border border-[rgba(148,163,184,0.1)]">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-white font-semibold text-sm">{api.name}</span><span className={`text-xs px-2 py-0.5 rounded-full ${api.status === "active" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : "bg-[rgba(148,163,184,0.1)] text-[#475569]"}`}>{api.status}</span></div>
                    <p className="text-xs text-[#94a3b8]" style={{ fontFamily: "monospace" }}>{api.endpoint}</p>
                    <p className="text-xs text-[#475569] mt-1">Key: {api.key} · {api.calls}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toast.success("API key rotated")} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toast.success("API settings saved")} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all"><Edit className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </GlassCard>
          </>
        )}

        {/* Security */}
        {section === "security" && (
          <>
            <h2 className="text-xl font-bold text-white">Security Settings</h2>
            <GlassCard className="p-5 space-y-2">
              {[{ label: "Two-Factor Authentication", sub: "Require 2FA for all admin accounts", on: true }, { label: "Session Timeout (30 min)", sub: "Auto-logout after inactivity", on: true }, { label: "IP Allowlist", sub: "Restrict admin access to trusted IPs", on: false }, { label: "Audit Log Retention (12 months)", sub: "Keep audit logs for compliance", on: true }, { label: "Password Complexity", sub: "Require uppercase, number, and symbol", on: true }, { label: "Failed Login Lockout", sub: "Lock after 5 failed attempts", on: true }].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[rgba(148,163,184,0.08)]">
                  <div><p className="text-white text-sm font-medium">{s.label}</p><p className="text-xs text-[#94a3b8]">{s.sub}</p></div>
                  <button onClick={() => toast.success(`${s.label} toggled`)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.on ? "bg-[#0ea5e9]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.on ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </GlassCard>
          </>
        )}

        {/* System & About */}
        {section === "system" && (
          <>
            <h2 className="text-xl font-bold text-white">System & About</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5">
                <h3 className="font-semibold text-white mb-4">System Information</h3>
                {[["Product", "MediCore HMS v4.2.1"], ["Build", "2026.06.26-stable"], ["License", "Enterprise — 500 Users"], ["Expires", "2027-01-01"], ["Support", "Tier 3 — 24/7 SLA"], ["Uptime", "99.97% (30 days)"]].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-[rgba(148,163,184,0.08)]">
                    <span className="text-xs text-[#94a3b8]">{label}</span>
                    <span className="text-sm text-white font-medium">{val}</span>
                  </div>
                ))}
              </GlassCard>
              <GlassCard className="p-5 space-y-3">
                <h3 className="font-semibold text-white mb-1">Maintenance</h3>
                <div className="flex items-center justify-between py-3 border-b border-[rgba(148,163,184,0.08)]">
                  <div><p className="text-white text-sm font-medium">Maintenance Mode</p><p className="text-xs text-[#94a3b8]">Restrict access for system updates</p></div>
                  <button onClick={() => { setMaintenanceMode(!maintenanceMode); toast.info(`Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}`); }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? "bg-[#f59e0b]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {[{ label: "Check for Updates", icon: RefreshCw, color: "#0ea5e9" }, { label: "Clear System Cache", icon: Trash2, color: "#f59e0b" }, { label: "Download System Logs", icon: Download, color: "#10b981" }, { label: "Restart Services", icon: Activity, color: "#8b5cf6" }].map(a => (
                  <button key={a.label} onClick={() => toast.success(`${a.label} initiated`)} className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.1)] rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(148,163,184,0.08)] transition-all text-sm">
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />{a.label}
                  </button>
                ))}
              </GlassCard>
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUser(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <h3 className="font-bold text-white text-lg mb-5">Add New User</h3>
              <div className="grid grid-cols-2 gap-3">
                {[["Full Name", "Dr. Jane Smith"], ["Email Address", "j.smith@medicore.com"], ["Employee ID", "EMP-2026-001"], ["Phone", "+1 555 000 0000"]].map(([label, ph]) => (
                  <div key={label}><label className="block text-xs text-[#94a3b8] mb-1">{label}</label><input placeholder={ph} className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" /></div>
                ))}
                <div><label className="block text-xs text-[#94a3b8] mb-1">Role</label><select className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">{["Doctor", "Nurse", "ICU Staff", "Emergency Staff", "Administrator", "IoT Engineer", "Security Officer"].map(r => <option key={r}>{r}</option>)}</select></div>
                <div><label className="block text-xs text-[#94a3b8] mb-1">Department</label><select className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">{["ICU", "Emergency", "Surgery", "General Ward", "IT", "Administration"].map(d => <option key={d}>{d}</option>)}</select></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddUser(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={() => { toast.success("User created. Welcome email sent."); setShowAddUser(false); }} className="flex-1 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Create User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
