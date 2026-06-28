import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { GlassCard } from "../components/GlassCard";
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Clock,
  Activity, Save, Camera, Lock, Bell, Globe, Monitor,
  ChevronRight, Eye, EyeOff, LogOut, Smartphone, Laptop,
  CheckCircle, X, Edit, Key, Download, AlertTriangle,
  Wifi, RefreshCw, Trash2, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const LOGIN_HISTORY = [
  { id: 1, device: "Chrome — Windows 11", ip: "192.168.1.50", location: "New York, US", time: "Today 09:00", status: "success" },
  { id: 2, device: "Safari — iPhone 15", ip: "192.168.1.72", location: "New York, US", time: "Yesterday 18:44", status: "success" },
  { id: 3, device: "Firefox — MacBook Pro", ip: "192.168.1.88", location: "New York, US", time: "Yesterday 08:12", status: "success" },
  { id: 4, device: "Unknown Browser", ip: "198.51.100.12", location: "Moscow, RU", time: "2 days ago", status: "failed" },
  { id: 5, device: "Chrome — Windows 10", ip: "192.168.1.50", location: "New York, US", time: "3 days ago", status: "success" },
];

const RECENT_ACTIVITIES = [
  { action: "Patient P001 vitals updated", module: "ICU Central", time: "09:14" },
  { action: "ICU report exported as PDF", module: "ICU Central", time: "08:47" },
  { action: "Alarm acknowledged — ICU Bed 12", module: "ICU Central", time: "08:33" },
  { action: "Patient note added — John Anderson", module: "ICU Central", time: "08:15" },
  { action: "Logged in from Chrome / Windows", module: "Authentication", time: "08:00" },
  { action: "Patient P002 triage updated", module: "Emergency", time: "Yesterday 22:10" },
];

const ACTIVE_SESSIONS = [
  { id: "S001", device: "Chrome — Windows 11", icon: Monitor, ip: "192.168.1.50", location: "New York, US", started: "Today 09:00", current: true },
  { id: "S002", device: "Safari — iPhone 15", icon: Smartphone, ip: "192.168.1.72", location: "New York, US", started: "Yesterday 18:44", current: false },
  { id: "S003", device: "Firefox — MacBook Pro", icon: Laptop, ip: "192.168.1.88", location: "New York, US", started: "Yesterday 08:12", current: false },
];

const CONNECTED_DEVICES = [
  { name: "Hospital Workstation #14", type: "Workstation", mac: "00:1A:2B:3C:4D:5E", lastActive: "Today 09:00", trusted: true },
  { name: "iPhone 15 Pro", type: "Mobile", mac: "A4:C3:F0:11:22:33", lastActive: "Yesterday", trusted: true },
  { name: "MacBook Pro 2024", type: "Laptop", mac: "F0:18:98:AA:BB:CC", lastActive: "Yesterday", trusted: true },
];

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("info");
  const [editing, setEditing] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState("en");
  const [notifPrefs, setNotifPrefs] = useState({
    criticalAlerts: true, patientUpdates: true, shiftReminders: true, systemUpdates: false, emailDigest: true,
  });
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "", email: user?.email ?? "", phone: "+1 (555) 200-4521",
    dept: user?.department ?? "", role: user?.role ?? "", empId: "EMP-2024-0142",
    address: "123 Medical Center Dr, New York", bio: "Experienced ICU specialist with 12 years in critical care medicine.",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const SECTIONS = [
    { id: "info", label: "Profile Information", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "twofa", label: "Two-Factor Auth", icon: Shield },
    { id: "sessions", label: "Active Sessions", icon: Monitor },
    { id: "history", label: "Login History", icon: Clock },
    { id: "activity", label: "Recent Activities", icon: Activity },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "devices", label: "Connected Devices", icon: Wifi },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  return (
    <div className="flex gap-4 pb-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 space-y-1 hidden md:flex flex-col">
        {/* Avatar */}
        <div className="p-4 mb-2">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center text-white text-2xl font-bold">
              {user?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <button onClick={() => toast.info("Upload photo — feature coming soon")}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0ea5e9] rounded-full flex items-center justify-center hover:bg-[#0284c7] transition-all">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">{user?.name}</p>
            <p className="text-[#0ea5e9] text-xs">{user?.role}</p>
            <p className="text-[#94a3b8] text-xs">{user?.department}</p>
          </div>
        </div>

        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${section === s.id ? "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9] border border-[rgba(14,165,233,0.3)]" : "text-[#94a3b8] hover:bg-[rgba(148,163,184,0.08)] hover:text-white"}`}>
            <s.icon className="w-4 h-4 shrink-0" />{s.label}
          </button>
        ))}

        <div className="pt-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile section picker */}
      <div className="md:hidden w-full mb-3">
        <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
          {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Profile Info */}
        {section === "info" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
              <button onClick={() => setEditing(!editing)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${editing ? "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444]" : "bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9]"}`}>
                {editing ? <><X className="w-4 h-4" />Cancel</> : <><Edit className="w-4 h-4" />Edit Profile</>}
              </button>
            </div>

            {/* Avatar Section */}
            <GlassCard className="p-5 flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                  {user?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10b981] rounded-full border-2 border-[#0a0e1a]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                <p className="text-[#0ea5e9] font-medium">{user?.role}</p>
                <p className="text-[#94a3b8] text-sm">{user?.department} · {user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.2)] text-[#10b981]">Active</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(14,165,233,0.15)] text-[#0ea5e9]">EMP-2024-0142</span>
                </div>
              </div>
              {editing && (
                <button onClick={() => toast.info("Photo upload UI coming soon")} className="ml-auto shrink-0 flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all">
                  <Camera className="w-4 h-4" /> Change Photo
                </button>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", icon: User },
                  { label: "Email Address", key: "email", icon: Mail },
                  { label: "Phone Number", key: "phone", icon: Phone },
                  { label: "Department", key: "dept", icon: Building2 },
                  { label: "Role", key: "role", icon: Shield },
                  { label: "Employee ID", key: "empId", icon: Key },
                  { label: "Office Address", key: "address", icon: MapPin },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-[#94a3b8] mb-1">{f.label}</label>
                    {editing ? (
                      <input value={(profileForm as any)[f.key]} onChange={e => setProfileForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg">
                        <f.icon className="w-4 h-4 text-[#475569] shrink-0" />
                        <span className="text-white text-sm">{(profileForm as any)[f.key]}</span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#94a3b8] mb-1">Bio</label>
                  {editing ? (
                    <textarea value={profileForm.bio} onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] transition-all resize-none h-20" />
                  ) : (
                    <div className="px-3 py-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg">
                      <span className="text-white text-sm">{profileForm.bio}</span>
                    </div>
                  )}
                </div>
              </div>
              {editing && (
                <button onClick={() => { setEditing(false); toast.success("Profile saved successfully"); }}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              )}
            </GlassCard>
          </>
        )}

        {/* Change Password */}
        {section === "password" && (
          <>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
            <GlassCard className="p-5 max-w-lg">
              <div className="space-y-4">
                {[{ label: "Current Password", show: showOldPwd, toggle: () => setShowOldPwd(!showOldPwd) }, { label: "New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) }, { label: "Confirm New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) }].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs text-[#94a3b8] mb-1">{f.label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input type={f.show ? "text" : "password"} placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors">
                        {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[rgba(14,165,233,0.08)] border border-[rgba(14,165,233,0.2)] rounded-lg">
                <p className="text-xs text-[#94a3b8]">Password must be at least 12 characters and include uppercase letters, numbers, and symbols.</p>
              </div>
              <button onClick={() => toast.success("Password updated successfully")}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all">
                <Save className="w-4 h-4" /> Update Password
              </button>
            </GlassCard>
          </>
        )}

        {/* 2FA */}
        {section === "twofa" && (
          <>
            <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${twoFA ? "bg-[rgba(16,185,129,0.2)]" : "bg-[rgba(148,163,184,0.1)]"}`}>
                    <Shield className={`w-6 h-6 ${twoFA ? "text-[#10b981]" : "text-[#94a3b8]"}`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Two-Factor Authentication</p>
                    <p className="text-xs text-[#94a3b8]">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button onClick={() => { setTwoFA(!twoFA); toast.success(`2FA ${!twoFA ? "enabled" : "disabled"}`); }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${twoFA ? "bg-[#10b981]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${twoFA ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {twoFA && (
                <div className="space-y-4">
                  <div className="p-4 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.3)] rounded-xl">
                    <p className="text-[#10b981] text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 2FA is active on your account</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[rgba(148,163,184,0.05)] rounded-xl border border-[rgba(148,163,184,0.1)]">
                      <h4 className="font-semibold text-white mb-2">Authenticator App</h4>
                      <p className="text-xs text-[#94a3b8] mb-3">Use Google Authenticator or Authy</p>
                      <button onClick={() => toast.success("Setup code generated")} className="w-full py-2 bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-sm hover:bg-[rgba(14,165,233,0.2)] transition-colors">Setup Authenticator</button>
                    </div>
                    <div className="p-4 bg-[rgba(148,163,184,0.05)] rounded-xl border border-[rgba(148,163,184,0.1)]">
                      <h4 className="font-semibold text-white mb-2">SMS Verification</h4>
                      <p className="text-xs text-[#94a3b8] mb-3">Receive codes via text message</p>
                      <button onClick={() => toast.success("SMS verification enabled")} className="w-full py-2 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.2)] transition-colors">Enable SMS</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Backup Codes</h4>
                    <p className="text-xs text-[#94a3b8] mb-3">Use these one-time codes if you lose access to your authenticator app.</p>
                    <button onClick={() => toast.success("Backup codes downloaded")} className="flex items-center gap-2 px-4 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all">
                      <Download className="w-4 h-4" /> Download Backup Codes
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {/* Active Sessions */}
        {section === "sessions" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Active Sessions</h2>
              <button onClick={() => toast.success("All other sessions terminated")} className="flex items-center gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.2)] transition-all">
                <X className="w-4 h-4" /> Terminate All Others
              </button>
            </div>
            <div className="space-y-3">
              {ACTIVE_SESSIONS.map(s => (
                <GlassCard key={s.id} className={`p-4 ${s.current ? "border-[rgba(14,165,233,0.3)]" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${s.current ? "bg-[rgba(14,165,233,0.2)]" : "bg-[rgba(148,163,184,0.1)]"}`}>
                      <s.icon className={`w-5 h-5 ${s.current ? "text-[#0ea5e9]" : "text-[#94a3b8]"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{s.device}</p>
                        {s.current && <span className="text-xs px-2 py-0.5 bg-[rgba(14,165,233,0.2)] text-[#0ea5e9] rounded-full">Current</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#94a3b8]">
                        <span style={{ fontFamily: "monospace" }}>{s.ip}</span>
                        <span>·</span>
                        <span>{s.location}</span>
                        <span>·</span>
                        <span>{s.started}</span>
                      </div>
                    </div>
                    {!s.current && (
                      <button onClick={() => toast.success(`Session ${s.id} terminated`)} className="shrink-0 px-3 py-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-xs hover:bg-[rgba(239,68,68,0.2)] transition-colors">Terminate</button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {/* Login History */}
        {section === "history" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Login History</h2>
              <button onClick={() => toast.success("Login history exported")} className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all"><Download className="w-4 h-4" /> Export</button>
            </div>
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[rgba(148,163,184,0.1)]">{["Device", "IP Address", "Location", "Time", "Status"].map(h => <th key={h} className="py-3 px-4 text-left text-xs text-[#94a3b8] font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {LOGIN_HISTORY.map(l => (
                    <tr key={l.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)]">
                      <td className="py-3 px-4 text-white text-sm">{l.device}</td>
                      <td className="py-3 px-4 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{l.ip}</td>
                      <td className="py-3 px-4 text-[#94a3b8] text-xs">{l.location}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs">{l.time}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${l.status === "success" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : "bg-[rgba(239,68,68,0.2)] text-[#ef4444]"}`}>
                          {l.status === "success" ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}{l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </>
        )}

        {/* Recent Activities */}
        {section === "activity" && (
          <>
            <h2 className="text-xl font-bold text-white">Recent Activities</h2>
            <GlassCard className="p-5">
              <div className="space-y-3">
                {RECENT_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-[rgba(148,163,184,0.08)] last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(14,165,233,0.15)] flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-[#0ea5e9]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{a.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(14,165,233,0.1)] text-[#0ea5e9]">{a.module}</span>
                        <span className="text-xs text-[#475569]">{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Notification Preferences */}
        {section === "notifications" && (
          <>
            <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
            <GlassCard className="p-5">
              <div className="space-y-3">
                {(Object.entries(notifPrefs) as [keyof typeof notifPrefs, boolean][]).map(([key, val]) => {
                  const labels: Record<string, string> = { criticalAlerts: "Critical Patient Alerts", patientUpdates: "Patient Status Updates", shiftReminders: "Shift Change Reminders", systemUpdates: "System Update Notices", emailDigest: "Daily Email Digest" };
                  const subs: Record<string, string> = { criticalAlerts: "Immediate push & sound alert", patientUpdates: "Notify on changes to assigned patients", shiftReminders: "30-minute advance warning", systemUpdates: "Non-critical system announcements", emailDigest: "Daily summary of hospital activities" };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-[rgba(148,163,184,0.08)]">
                      <div>
                        <p className="text-white text-sm font-medium">{labels[key]}</p>
                        <p className="text-xs text-[#94a3b8]">{subs[key]}</p>
                      </div>
                      <button onClick={() => { setNotifPrefs(p => ({ ...p, [key]: !p[key] })); toast.success("Preference updated"); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${val ? "bg-[#0ea5e9]" : "bg-[rgba(148,163,184,0.2)]"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${val ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => toast.success("Notification preferences saved")} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </GlassCard>
          </>
        )}

        {/* Connected Devices */}
        {section === "devices" && (
          <>
            <h2 className="text-xl font-bold text-white">Connected Devices</h2>
            <div className="space-y-3">
              {CONNECTED_DEVICES.map((d, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[rgba(14,165,233,0.15)] shrink-0">
                      {d.type === "Mobile" ? <Smartphone className="w-5 h-5 text-[#0ea5e9]" /> : d.type === "Laptop" ? <Laptop className="w-5 h-5 text-[#0ea5e9]" /> : <Monitor className="w-5 h-5 text-[#0ea5e9]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{d.name}</p>
                        {d.trusted && <span className="text-xs px-1.5 py-0.5 bg-[rgba(16,185,129,0.15)] text-[#10b981] rounded">Trusted</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#94a3b8]">
                        <span style={{ fontFamily: "monospace" }}>{d.mac}</span>
                        <span>·</span>
                        <span>Last active: {d.lastActive}</span>
                      </div>
                    </div>
                    <button onClick={() => toast.success(`${d.name} removed from trusted devices`)} className="shrink-0 px-3 py-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-xs hover:bg-[rgba(239,68,68,0.2)] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </GlassCard>
              ))}
              <button onClick={() => toast.info("QR code generated for device pairing")}
                className="w-full p-4 border border-dashed border-[rgba(148,163,184,0.2)] rounded-xl text-[#94a3b8] hover:text-white hover:border-[rgba(14,165,233,0.3)] transition-all text-sm flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4" /> Connect New Device
              </button>
            </div>
          </>
        )}

        {/* Preferences */}
        {section === "preferences" && (
          <>
            <h2 className="text-xl font-bold text-white">Preferences</h2>
            <GlassCard className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-3">Theme</label>
                <div className="flex gap-3">
                  {(["dark", "light"] as const).map(t => (
                    <button key={t} onClick={() => { setTheme(t); toast.success(`${t} theme selected`); }}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${theme === t ? "bg-[rgba(14,165,233,0.15)] border-[rgba(14,165,233,0.4)] text-[#0ea5e9]" : "bg-[rgba(148,163,184,0.05)] border-[rgba(148,163,184,0.15)] text-[#94a3b8] hover:text-white"}`}>
                      {t === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-3">Language</label>
                <select value={language} onChange={e => { setLanguage(e.target.value); toast.success("Language updated"); }}
                  className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                  <option value="en">🇺🇸 English (United States)</option>
                  <option value="es">🇪🇸 Spanish (Español)</option>
                  <option value="fr">🇫🇷 French (Français)</option>
                  <option value="de">🇩🇪 German (Deutsch)</option>
                  <option value="ar">🇸🇦 Arabic (العربية)</option>
                  <option value="zh">🇨🇳 Chinese (中文)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-3">Accessibility</label>
                <div className="space-y-2">
                  {[{ label: "High Contrast Mode", sub: "Increase color contrast for visibility" }, { label: "Reduce Motion", sub: "Minimize animations and transitions" }, { label: "Large Text", sub: "Increase font sizes throughout the app" }].map((opt, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-[rgba(148,163,184,0.08)]">
                      <div><p className="text-white text-sm">{opt.label}</p><p className="text-xs text-[#94a3b8]">{opt.sub}</p></div>
                      <button onClick={() => toast.success(`${opt.label} toggled`)} className="relative inline-flex h-6 w-11 items-center rounded-full bg-[rgba(148,163,184,0.2)] transition-colors">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success("Preferences saved")} className="flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-all">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}

