import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import {
  Users, Activity, Ambulance, Wifi, Building2, AlertTriangle,
  Calendar, ArrowRight, Bed, Heart, Thermometer, Clock,
  Shield, Zap, ChevronRight, Download, Plus, RefreshCw,
  CheckCircle, Stethoscope, FileText, Package, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const patientFlowData = [
  { day: "Mon", admitted: 24, discharged: 18, emergency: 6 },
  { day: "Tue", admitted: 28, discharged: 22, emergency: 9 },
  { day: "Wed", admitted: 32, discharged: 25, emergency: 11 },
  { day: "Thu", admitted: 27, discharged: 20, emergency: 7 },
  { day: "Fri", admitted: 30, discharged: 24, emergency: 8 },
  { day: "Sat", admitted: 22, discharged: 19, emergency: 5 },
  { day: "Sun", admitted: 20, discharged: 16, emergency: 4 },
];

const vitalsOverview = [
  { time: "06:00", hr: 72, bp: 120, spo2: 98 },
  { time: "08:00", hr: 75, bp: 122, spo2: 97 },
  { time: "10:00", hr: 80, bp: 128, spo2: 98 },
  { time: "12:00", hr: 82, bp: 125, spo2: 97 },
  { time: "14:00", hr: 78, bp: 121, spo2: 98 },
  { time: "16:00", hr: 76, bp: 119, spo2: 99 },
  { time: "18:00", hr: 74, bp: 118, spo2: 98 },
];

const departmentOccupancy = [
  { name: "ICU", value: 85, color: "#0ea5e9", beds: "42/50" },
  { name: "Emergency", value: 92, color: "#ef4444", beds: "23/25" },
  { name: "General", value: 67, color: "#10b981", beds: "134/200" },
  { name: "Surgery", value: 78, color: "#f59e0b", beds: "31/40" },
  { name: "Maternity", value: 55, color: "#8b5cf6", beds: "22/40" },
];

const recentActivities = [
  { id: 1, patient: "John Anderson", action: "Admitted to ICU — Acute MI", time: "3 min ago", severity: "critical", dept: "ICU" },
  { id: 2, patient: "Sarah Mitchell", action: "BP critical — 185/110 mmHg", time: "7 min ago", severity: "critical", dept: "ICU" },
  { id: 3, patient: "Robert Chen", action: "Discharged from Surgery Ward", time: "22 min ago", severity: "low", dept: "Surgery" },
  { id: 4, patient: "Mary Johnson", action: "Emergency admission — Trauma", time: "35 min ago", severity: "high", dept: "Emergency" },
  { id: 5, patient: "James Park", action: "SpO₂ drop detected — 89%", time: "44 min ago", severity: "high", dept: "ICU" },
  { id: 6, patient: "Linda Martinez", action: "Post-op monitoring started", time: "1 hr ago", severity: "medium", dept: "Surgery" },
];

const staffOnDuty = [
  { role: "Doctors", count: 24, total: 32, color: "#0ea5e9" },
  { role: "Nurses", count: 68, total: 80, color: "#10b981" },
  { role: "ICU Staff", count: 12, total: 15, color: "#8b5cf6" },
  { role: "Emergency", count: 8, total: 10, color: "#ef4444" },
];

const systemAlerts = [
  { id: 1, icon: Heart, title: "Critical Vitals — ICU Bed 12", sub: "Patient #P001 · HR: 115 bpm · BP: 145/95", time: "2 min ago", type: "critical" },
  { id: 2, icon: Thermometer, title: "HVAC Temp Warning", sub: "ICU Wing B · 24.8°C (threshold: 24°C)", time: "18 min ago", type: "warning" },
  { id: 3, icon: Wifi, title: "Rogue Device Detected", sub: "MAC: 3C:A9:F4:12:88:B2 · Floor 3", time: "1 hr ago", type: "info" },
  { id: 4, icon: Package, title: "Low Medical Supplies", sub: "Epinephrine stock below 20% threshold", time: "2 hr ago", type: "warning" },
];

const ambStatuses = [
  { id: "AMB-01", status: "en_route", patient: "Trauma Patient", eta: "4 min", location: "Highway 9 Exit" },
  { id: "AMB-03", status: "available", patient: "—", eta: "—", location: "Station 2" },
  { id: "AMB-07", status: "en_route", patient: "Cardiac Arrest", eta: "8 min", location: "Downtown" },
  { id: "AMB-11", status: "at_hospital", patient: "P. Gonzalez", eta: "Arrived", location: "Bay 3" },
];

const quickNotes = [
  { id: 1, text: "ICU bed 12 patient family notified — Dr. Reeves", time: "10 min ago", color: "#ef4444" },
  { id: 2, text: "Night shift handover at 21:00 — all clear", time: "1 hr ago", color: "#10b981" },
  { id: 3, text: "Scheduled maintenance: MRI Suite #2 tomorrow 08:00", time: "3 hr ago", color: "#f59e0b" },
];

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15,23,42,0.97)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "8px",
  color: "#e8eef7",
  fontSize: "12px",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartTab, setChartTab] = useState<"flow" | "vitals">("flow");
  const [alertModal, setAlertModal] = useState<typeof systemAlerts[0] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-5 pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
            <span>Home</span><ChevronRight className="w-3 h-3" /><span className="text-[#0ea5e9]">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Hospital Command Center</h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">
            Welcome back, <span className="text-[#0ea5e9]">{user?.name}</span> · {user?.role}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-lg">
            <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
            <span className="text-[#10b981] text-xs font-medium">All Systems Operational</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-[#0ea5e9]" />
            <span className="text-white text-xs">{currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] rounded-lg">
            <Clock className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-white text-xs" style={{ fontFamily: "var(--font-mono, monospace)" }}>{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
          <button onClick={() => toast.success("Dashboard refreshed")} className="p-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] rounded-lg hover:bg-[rgba(14,165,233,0.1)] transition-all">
            <RefreshCw className="w-4 h-4 text-[#94a3b8]" />
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Patients Today", value: "324", sub: "+12% from yesterday", color: "#0ea5e9", icon: Users, route: null as string | null },
          { label: "ICU Occupancy", value: "85%", sub: "42 / 50 beds occupied", color: "#8b5cf6", icon: Bed, route: "/dashboard/icu-central" },
          { label: "Active Ambulances", value: "12", sub: "8 en route · 4 available", color: "#ef4444", icon: Ambulance, route: "/dashboard/mass-casualty" },
          { label: "IoT Devices Online", value: "1,247", sub: "3 require attention", color: "#10b981", icon: Wifi, route: "/dashboard/medical-iot" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} onClick={() => kpi.route && navigate(kpi.route)} className={kpi.route ? "cursor-pointer" : ""}>
            <GlassCard className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 pointer-events-none" style={{ background: kpi.color, filter: "blur(20px)", transform: "translate(30%,-30%)" }} />
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl" style={{ background: `${kpi.color}22` }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "monospace" }}>{kpi.value}</div>
              <div className="text-xs text-[#94a3b8] leading-tight">{kpi.label}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: kpi.color }}>{kpi.sub}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Emergency Cases", value: "15", sub: "3 critical", color: "#ef4444", icon: AlertTriangle },
          { label: "Surgeries Today", value: "8", sub: "2 ongoing", color: "#f59e0b", icon: Stethoscope },
          { label: "Facility Alerts", value: "4", sub: "1 sensor offline", color: "#8b5cf6", icon: Building2 },
          { label: "Security Events", value: "2", sub: "1 unauthorized", color: "#06b6d4", icon: Shield },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${s.color}22` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>{s.value}</div>
              <div className="text-xs text-[#94a3b8]">{s.label}</div>
              <div className="text-xs font-medium" style={{ color: s.color }}>{s.sub}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Module Quick Access */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ICU Central Command", sub: "Patient telemetry & alarms", icon: Activity, color: "#0ea5e9", route: "/dashboard/icu-central", stat: "8 critical patients" },
          { label: "Medical IoT Guardian", sub: "Device inventory & security", icon: Wifi, color: "#10b981", route: "/dashboard/medical-iot", stat: "2 rogue devices" },
          { label: "Emergency / MCI", sub: "Triage & ambulance fleet", icon: Ambulance, color: "#ef4444", route: "/dashboard/mass-casualty", stat: "15 emergency cases" },
          { label: "Smart Facility", sub: "HVAC, access & housekeeping", icon: Building2, color: "#8b5cf6", route: "/dashboard/smart-facility", stat: "HVAC: Optimal" },
        ].map((mod) => (
          <motion.div key={mod.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GlassCard hover className="p-5 cursor-pointer h-full" onClick={() => navigate(mod.route)}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-xl" style={{ background: `${mod.color}22`, border: `1px solid ${mod.color}33` }}>
                  <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                </div>
                <ArrowRight className="w-4 h-4 text-[#475569]" />
              </div>
              <div className="font-semibold text-white text-sm mb-1">{mod.label}</div>
              <div className="text-xs text-[#94a3b8] mb-3">{mod.sub}</div>
              <div className="text-xs font-medium px-2 py-1 rounded-md inline-block" style={{ background: `${mod.color}18`, color: mod.color }}>{mod.stat}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">{chartTab === "flow" ? "Patient Flow — 7 Days" : "Vital Signs Overview"}</h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">{chartTab === "flow" ? "Admissions, discharges & emergencies" : "Average HR, BP, SpO₂ across ICU"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-[rgba(148,163,184,0.1)] rounded-lg p-1">
                {(["flow", "vitals"] as const).map((tab) => (
                  <button key={tab} onClick={() => setChartTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartTab === tab ? "bg-[#0ea5e9] text-white" : "text-[#94a3b8] hover:text-white"}`}>
                    {tab === "flow" ? "Patient Flow" : "Vital Signs"}
                  </button>
                ))}
              </div>
              <button onClick={() => toast.success("Chart exported")} className="p-1.5 hover:bg-[rgba(148,163,184,0.1)] rounded-lg transition-all">
                <Download className="w-4 h-4 text-[#94a3b8]" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {chartTab === "flow" ? (
              <BarChart data={patientFlowData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="day" stroke="#475569" style={{ fontSize: "11px" }} />
                <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Bar dataKey="admitted" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Admitted" />
                <Bar dataKey="discharged" fill="#10b981" radius={[4, 4, 0, 0]} name="Discharged" />
                <Bar dataKey="emergency" fill="#ef4444" radius={[4, 4, 0, 0]} name="Emergency" />
              </BarChart>
            ) : (
              <LineChart data={vitalsOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="time" stroke="#475569" style={{ fontSize: "11px" }} />
                <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={false} name="Heart Rate" />
                <Line type="monotone" dataKey="bp" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Blood Pressure" />
                <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} dot={false} name="SpO₂" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-1">Department Occupancy</h3>
          <p className="text-xs text-[#94a3b8] mb-4">Current bed utilization</p>
          <div className="space-y-3">
            {departmentOccupancy.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#94a3b8]">{dept.name}</span>
                  <span className="text-xs text-white" style={{ fontFamily: "monospace" }}>{dept.beds}</span>
                </div>
                <div className="h-2 bg-[rgba(148,163,184,0.1)] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${dept.value}%` }} transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full" style={{ background: dept.color }} />
                </div>
                <div className="text-right text-xs mt-0.5 font-medium" style={{ color: dept.color }}>{dept.value}%</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Activities, Alerts, Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activities</h3>
            <button onClick={() => toast.info("Opening full activity log...")} className="text-xs text-[#0ea5e9] hover:text-[#38bdf8] transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(148,163,184,0.05)] transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full shrink-0 ${act.severity === "critical" ? "bg-[#ef4444]" : act.severity === "high" ? "bg-[#f59e0b]" : act.severity === "medium" ? "bg-[#0ea5e9]" : "bg-[#10b981]"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{act.patient}</p>
                  <p className="text-[#94a3b8] text-xs truncate">{act.action}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)] text-[#94a3b8]">{act.dept}</span>
                  <p className="text-xs text-[#475569] mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            <h3 className="font-semibold text-white">System Alerts</h3>
            <span className="ml-auto text-xs px-2 py-0.5 bg-[rgba(239,68,68,0.2)] text-[#ef4444] rounded-full">
              {systemAlerts.filter(a => a.type === "critical").length} Critical
            </span>
          </div>
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div key={alert.id} onClick={() => setAlertModal(alert)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${alert.type === "critical" ? "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.3)]" : alert.type === "warning" ? "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.3)]" : "bg-[rgba(14,165,233,0.08)] border-[rgba(14,165,233,0.3)]"}`}>
                <div className="flex items-start gap-2">
                  <alert.icon className={`w-4 h-4 mt-0.5 shrink-0 ${alert.type === "critical" ? "text-[#ef4444]" : alert.type === "warning" ? "text-[#f59e0b]" : "text-[#0ea5e9]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium leading-tight">{alert.title}</p>
                    <p className="text-[#94a3b8] text-xs mt-0.5 leading-tight">{alert.sub}</p>
                    <p className={`text-xs mt-1 ${alert.type === "critical" ? "text-[#ef4444]" : alert.type === "warning" ? "text-[#f59e0b]" : "text-[#0ea5e9]"}`}>{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Ambulances, Staff, Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-[#ef4444]" /> Ambulance Fleet
            </h3>
            <button onClick={() => navigate("/dashboard/mass-casualty")} className="text-xs text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">Fleet Map</button>
          </div>
          <div className="space-y-2">
            {ambStatuses.map((amb) => (
              <div key={amb.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.08)] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${amb.status === "en_route" ? "bg-[#f59e0b] animate-pulse" : amb.status === "available" ? "bg-[#10b981]" : "bg-[#0ea5e9]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-semibold" style={{ fontFamily: "monospace" }}>{amb.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${amb.status === "en_route" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : amb.status === "available" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : "bg-[rgba(14,165,233,0.2)] text-[#0ea5e9]"}`}>
                      {amb.status === "en_route" ? "En Route" : amb.status === "available" ? "Available" : "At Hospital"}
                    </span>
                  </div>
                  <p className="text-[#94a3b8] text-xs truncate mt-0.5">{amb.location}</p>
                </div>
                {amb.eta !== "—" && <span className="text-xs text-white shrink-0" style={{ fontFamily: "monospace" }}>ETA {amb.eta}</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0ea5e9]" /> Staff On Duty
          </h3>
          <div className="space-y-3">
            {staffOnDuty.map((s) => (
              <div key={s.role}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#94a3b8]">{s.role}</span>
                  <span className="text-xs text-white" style={{ fontFamily: "monospace" }}>{s.count}/{s.total}</span>
                </div>
                <div className="h-1.5 bg-[rgba(148,163,184,0.1)] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / s.total) * 100}%` }} transition={{ duration: 0.8 }}
                    className="h-full rounded-full" style={{ background: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)] flex justify-between text-xs">
            <span className="text-[#94a3b8]">Total on duty</span>
            <span className="text-white font-semibold" style={{ fontFamily: "monospace" }}>112 / 137</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#06b6d4]" /> Quick Notes
            </h3>
            <button onClick={() => toast.success("New note created")} className="p-1 hover:bg-[rgba(14,165,233,0.1)] rounded-md transition-all">
              <Plus className="w-4 h-4 text-[#0ea5e9]" />
            </button>
          </div>
          <div className="space-y-2">
            {quickNotes.map((note) => (
              <div key={note.id} className="p-3 rounded-lg bg-[rgba(148,163,184,0.05)] border-l-2" style={{ borderColor: note.color }}>
                <p className="text-white text-xs leading-relaxed">{note.text}</p>
                <p className="text-[#475569] text-xs mt-1">{note.time}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setAlertModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${alertModal.type === "critical" ? "bg-[rgba(239,68,68,0.2)]" : alertModal.type === "warning" ? "bg-[rgba(245,158,11,0.2)]" : "bg-[rgba(14,165,233,0.2)]"}`}>
                  <alertModal.icon className={`w-6 h-6 ${alertModal.type === "critical" ? "text-[#ef4444]" : alertModal.type === "warning" ? "text-[#f59e0b]" : "text-[#0ea5e9]"}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{alertModal.title}</h3>
                  <p className="text-xs text-[#94a3b8]">{alertModal.time}</p>
                </div>
              </div>
              <p className="text-[#94a3b8] text-sm mb-6">{alertModal.sub}</p>
              <div className="flex gap-3">
                <button onClick={() => { toast.success("Alert acknowledged"); setAlertModal(null); }}
                  className="flex-1 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Acknowledge</button>
                <button onClick={() => { toast.info("Escalation sent"); setAlertModal(null); }}
                  className="flex-1 py-2.5 bg-[rgba(239,68,68,0.2)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(239,68,68,0.3)] transition-colors">Escalate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
