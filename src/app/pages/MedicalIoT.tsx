import { useState, useMemo } from "react";
import { GlassCard } from "../components/GlassCard";
import {
  Wifi, Shield, CheckCircle, Download, Search, RefreshCw,
  Lock, Unlock, Settings, ChevronRight, Plus, Eye, X,
  Cpu, UploadCloud, ChevronDown, ChevronUp, AlertTriangle, Network, Zap,
  ShieldAlert, Ban, Activity
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type DeviceStatus = "online" | "offline" | "quarantined" | "maintenance";
type DeviceRisk = "normal" | "rogue" | "suspicious";

interface Device {
  id: string;
  name: string;
  type: string;
  mac: string;
  ip: string;
  vlan: string;
  location: string;
  floor: string;
  dept: string;
  status: DeviceStatus;
  risk: DeviceRisk;
  firmware: string;
  lastSeen: string;
  manufacturer: string;
  model: string;
  uptime: string;
  trafficMbps: number;
  // --- Cybersecurity / auto-quarantine metadata ---
  detectedAt?: string;
  quarantineVlan?: string;
  autoQuarantined?: boolean;
  blocked?: boolean;
}

// Daftar prefix MAC (OUI) yang dianggap "vendor resmi / terdaftar"
// Dalam implementasi nyata, ini idealnya ditarik dari database aset RS.
const TRUSTED_OUI_PREFIXES = [
  "00:1A:2B", "00:2B:3C", "00:3C:4D", "00:4D:5E",
  "00:5E:6F", "00:6F:7A", "00:7A:8B", "00:8B:9C",
];

const isTrustedMac = (mac: string) => {
  const prefix = mac.toUpperCase().slice(0, 8);
  return TRUSTED_OUI_PREFIXES.some(p => prefix.startsWith(p));
};

const DEVICES: Device[] = [
  { id: "D001", name: "Patient Monitor #12", type: "Patient Monitor", mac: "00:1A:2B:3C:4D:5E", ip: "192.168.10.12", vlan: "VLAN-10", location: "ICU Bed 12", floor: "3F", dept: "ICU", status: "online", risk: "normal", firmware: "v3.4.2", lastSeen: "Just now", manufacturer: "Philips", model: "IntelliVue MX700", uptime: "14d 6h", trafficMbps: 1.2 },
  { id: "D002", name: "Infusion Pump #7", type: "Infusion Pump", mac: "00:2B:3C:4D:5E:6F", ip: "192.168.10.21", vlan: "VLAN-10", location: "ICU Bed 7", floor: "3F", dept: "ICU", status: "online", risk: "normal", firmware: "v2.1.0", lastSeen: "30s ago", manufacturer: "BD", model: "Alaris 8015", uptime: "7d 2h", trafficMbps: 0.3 },
  { id: "D003", name: "ROGUE DEVICE", type: "Unknown", mac: "3C:A9:F4:12:88:B2", ip: "192.168.40.201", vlan: "VLAN-40", location: "Floor 3 Hallway", floor: "3F", dept: "Unknown", status: "quarantined", risk: "rogue", firmware: "Unknown", lastSeen: "58 min ago", manufacturer: "Unknown", model: "Unknown", uptime: "1h 2m", trafficMbps: 4.8, detectedAt: "14:02", quarantineVlan: "VLAN-40", autoQuarantined: true },
  { id: "D004", name: "Ventilator #3", type: "Ventilator", mac: "00:3C:4D:5E:6F:7A", ip: "192.168.10.33", vlan: "VLAN-10", location: "ICU Bed 3", floor: "3F", dept: "ICU", status: "online", risk: "normal", firmware: "v5.0.1", lastSeen: "Just now", manufacturer: "Dräger", model: "Evita Infinity", uptime: "3d 14h", trafficMbps: 0.8 },
  { id: "D005", name: "ECG Machine #2", type: "ECG Machine", mac: "00:4D:5E:6F:7A:8B", ip: "192.168.20.14", vlan: "VLAN-20", location: "Cardiac Unit", floor: "2F", dept: "Cardiology", status: "online", risk: "normal", firmware: "v4.2.1", lastSeen: "2 min ago", manufacturer: "GE Healthcare", model: "MAC 5500 HD", uptime: "21d 10h", trafficMbps: 0.5 },
  { id: "D006", name: "SUSPICIOUS TABLET", type: "Tablet", mac: "A4:C3:F0:88:12:44", ip: "192.168.40.187", vlan: "VLAN-40", location: "Floor 2 Stairwell", floor: "2F", dept: "Unknown", status: "quarantined", risk: "suspicious", firmware: "Unknown", lastSeen: "2 hr ago", manufacturer: "Unknown", model: "Android Tablet", uptime: "3h 15m", trafficMbps: 2.1, detectedAt: "12:47", quarantineVlan: "VLAN-40", autoQuarantined: true },
  { id: "D007", name: "Ultrasound #1", type: "Ultrasound", mac: "00:5E:6F:7A:8B:9C", ip: "192.168.20.28", vlan: "VLAN-20", location: "Radiology", floor: "1F", dept: "Radiology", status: "maintenance", risk: "normal", firmware: "v6.1.0", lastSeen: "1 day ago", manufacturer: "Siemens", model: "ACUSON S3000", uptime: "0d 0h", trafficMbps: 0.0 },
  { id: "D008", name: "Nurse Station #5", type: "Workstation", mac: "00:6F:7A:8B:9C:AD", ip: "192.168.30.45", vlan: "VLAN-30", location: "Ward C Nurse Station", floor: "2F", dept: "General Ward", status: "online", risk: "normal", firmware: "v1.8.4", lastSeen: "5 min ago", manufacturer: "Dell", model: "OptiPlex 7090", uptime: "28d 4h", trafficMbps: 3.5 },
  { id: "D009", name: "Defibrillator #4", type: "Defibrillator", mac: "00:7A:8B:9C:AD:BE", ip: "192.168.10.44", vlan: "VLAN-10", location: "Emergency Bay 4", floor: "1F", dept: "Emergency", status: "online", risk: "normal", firmware: "v2.3.5", lastSeen: "Just now", manufacturer: "Zoll", model: "R Series", uptime: "8d 22h", trafficMbps: 0.1 },
  { id: "D010", name: "HVAC Controller", type: "HVAC Controller", mac: "00:8B:9C:AD:BE:CF", ip: "192.168.50.10", vlan: "VLAN-50", location: "Server Room", floor: "B1", dept: "Facilities", status: "offline", risk: "normal", firmware: "v1.2.0", lastSeen: "2 hr ago", manufacturer: "Honeywell", model: "TC500", uptime: "0d 0h", trafficMbps: 0.0 },
];

const trafficData = [
  { time: "00:00", normal: 12, suspicious: 0 },
  { time: "04:00", normal: 8, suspicious: 0 },
  { time: "08:00", normal: 24, suspicious: 2 },
  { time: "10:00", normal: 32, suspicious: 5 },
  { time: "12:00", normal: 28, suspicious: 8 },
  { time: "14:00", normal: 35, suspicious: 12 },
  { time: "16:00", normal: 40, suspicious: 4 },
];

const typeData = [
  { name: "Monitors", value: 42, color: "#0ea5e9" },
  { name: "Pumps", value: 31, color: "#10b981" },
  { name: "Ventilators", value: 18, color: "#8b5cf6" },
  { name: "Workstations", value: 28, color: "#06b6d4" },
  { name: "Other", value: 24, color: "#f59e0b" },
];

const TOOLTIP_STYLE = { backgroundColor: "rgba(15,23,42,0.97)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", color: "#e8eef7", fontSize: "11px" };
const STATUS_COLOR: Record<DeviceStatus, string> = { online: "#10b981", offline: "#475569", quarantined: "#ef4444", maintenance: "#f59e0b" };
const RISK_COLOR: Record<DeviceRisk, string> = { normal: "#10b981", rogue: "#ef4444", suspicious: "#f59e0b" };

// === SECURITY EVENT LOG ===
// Live, append-only feed of security-relevant actions (detection, quarantine,
// notification, isolation, blocking, approval). Seeded with the timeline for
// the rogue device already present in the inventory; new actions append below.
type EventLevel = "info" | "warning" | "critical" | "success";
interface SecurityEvent {
  id: string;
  time: string;
  message: string;
  level: EventLevel;
}
const INITIAL_EVENTS: SecurityEvent[] = [
  { id: "e1", time: "14:02", message: "Unknown device detected — MAC 3C:A9:F4:12:88:B2", level: "warning" },
  { id: "e2", time: "14:02", message: "Device automatically quarantined to VLAN-40", level: "critical" },
  { id: "e3", time: "14:03", message: "Security administrator notified", level: "info" },
  { id: "e4", time: "14:05", message: "Device isolated from network", level: "success" },
];

// Definisi VLAN untuk peta topologi mikrosegmentasi
const VLAN_SEGMENTS = [
  { vlan: "VLAN-10", label: "ICU / Critical Care", color: "#0ea5e9" },
  { vlan: "VLAN-20", label: "Diagnostic Imaging", color: "#10b981" },
  { vlan: "VLAN-30", label: "Clinical Workstations", color: "#8b5cf6" },
  { vlan: "VLAN-40", label: "Guest / Unclassified", color: "#ef4444" },
  { vlan: "VLAN-50", label: "Facilities / BMS", color: "#f59e0b" },
];

export default function MedicalIoT() {
  const [devices, setDevices] = useState(DEVICES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof Device>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exportMenu, setExportMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [showTopology, setShowTopology] = useState(true);
  const [newDevice, setNewDevice] = useState({ name: "", mac: "", ip: "", location: "", type: "Patient Monitor", vlan: "VLAN-10" });
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const PER_PAGE = 8;

  const rogues = devices.filter(d => d.risk !== "normal");

  const filtered = devices.filter(d => {
    const s = search.toLowerCase();
    const match = d.name.toLowerCase().includes(s) || d.mac.toLowerCase().includes(s) || d.ip.includes(s) || d.type.toLowerCase().includes(s) || d.dept.toLowerCase().includes(s);
    const ms = filterStatus === "all" || d.status === filterStatus;
    const mr = filterRisk === "all" || d.risk === filterRisk;
    return match && ms && mr;
  }).sort((a, b) => {
    const av = String(a[sortField] ?? ""), bv = String(b[sortField] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Append a new line to the live security event log
  const logEvent = (message: string, level: EventLevel = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setEvents(prev => [...prev, { id: `e${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time, message, level }]);
  };

  const quarantine = (id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "quarantined" as DeviceStatus } : d));
    toast.success("Device quarantined and isolated from network");
    logEvent(`${device?.name ?? id} isolated from network`, "success");
  };
  const release = (id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "online" as DeviceStatus } : d));
    toast.success("Device released from quarantine");
    logEvent(`${device?.name ?? id} released from quarantine`, "info");
  };

  // === ONE-CLICK ISOLATION ACTIONS (rogue / suspicious devices) ===
  const blockMac = (id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "offline" as DeviceStatus, blocked: true } : d));
    toast.success(`MAC address ${device?.mac} blocked permanently`);
    logEvent(`MAC address ${device?.mac} blocked and denied network access`, "critical");
  };
  const approveDevice = (id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices(prev => prev.map(d => d.id === id ? {
      ...d,
      status: "online" as DeviceStatus,
      risk: "normal" as DeviceRisk,
      autoQuarantined: false,
      blocked: false,
      dept: d.dept === "Unknown" ? "Pending Assignment" : d.dept,
    } : d));
    toast.success(`${device?.name} reviewed and approved by security administrator`);
    logEvent(`${device?.name} (${device?.mac}) approved by security administrator`, "success");
  };

  const toggleSort = (field: keyof Device) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const toggleSel = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // === REGISTRASI ALAT BARU + AUTO-KARANTINA ===
  const registerDevice = () => {
    if (!newDevice.name || !newDevice.mac || !newDevice.ip) {
      toast.error("Lengkapi nama, MAC address, dan IP address");
      return;
    }
    const trusted = isTrustedMac(newDevice.mac);
    const id = `D${String(devices.length + 1).padStart(3, "0")}`;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const device: Device = {
      id,
      name: newDevice.name,
      type: newDevice.type,
      mac: newDevice.mac.toUpperCase(),
      ip: newDevice.ip,
      vlan: trusted ? newDevice.vlan : "VLAN-40",
      location: newDevice.location || "Unassigned",
      floor: "-",
      dept: trusted ? "Pending Assignment" : "Unknown",
      status: trusted ? "online" : "quarantined",
      risk: trusted ? "normal" : "suspicious",
      firmware: "Unknown",
      lastSeen: "Just now",
      manufacturer: "Unverified",
      model: "Unverified",
      uptime: "0d 0h",
      trafficMbps: 0,
      detectedAt: trusted ? undefined : now,
      quarantineVlan: trusted ? undefined : "VLAN-40",
      autoQuarantined: !trusted,
    };
    setDevices(prev => [device, ...prev]);
    setShowAddModal(false);
    setNewDevice({ name: "", mac: "", ip: "", location: "", type: "Patient Monitor", vlan: "VLAN-10" });
    if (!trusted) {
      toast.error(`MAC address tidak terdaftar di OUI vendor terpercaya — ${device.name} otomatis dikarantina ke VLAN-40`);
      logEvent(`Unknown device detected — MAC ${device.mac}`, "warning");
      logEvent(`Device automatically quarantined to VLAN-40`, "critical");
      logEvent(`Security administrator notified`, "info");
    } else {
      toast.success(`${device.name} berhasil didaftarkan dan online`);
      logEvent(`${device.name} registered — MAC verified against trusted OUI`, "success");
    }
  };

  // === EXPORT XLSX ===
  const exportXLSX = () => {
    const rows = devices.map(d => ({
      "Device ID": d.id,
      "Nama Alat": d.name,
      "Tipe": d.type,
      "MAC Address": d.mac,
      "IP Address": d.ip,
      "VLAN": d.vlan,
      "Lokasi": d.location,
      "Lantai": d.floor,
      "Departemen": d.dept,
      "Status": d.status,
      "Risiko": d.risk,
      "Firmware": d.firmware,
      "Manufaktur": d.manufacturer,
      "Model": d.model,
      "Uptime": d.uptime,
      "Traffic (Mbps)": d.trafficMbps,
      "Terakhir Terlihat": d.lastSeen,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Device Inventory");

    // Sheet ringkasan rogue device
    const rogueRows = rogues.map(d => ({
      "Device ID": d.id, "Nama": d.name, "MAC Address": d.mac, "IP": d.ip,
      "Lokasi": d.location, "VLAN": d.vlan, "Risiko": d.risk, "Status": d.status,
    }));
    if (rogueRows.length) {
      const wsRogue = XLSX.utils.json_to_sheet(rogueRows);
      XLSX.utils.book_append_sheet(wb, wsRogue, "Rogue Devices");
    }

    XLSX.writeFile(wb, `Medical-IoT-Inventory-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("File XLSX berhasil diunduh");
    setExportMenu(false);
  };

  // === EXPORT PDF ===
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Medical IoT & Rogue Device Guardian — Device Inventory Report", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Dibuat: ${new Date().toLocaleString("id-ID")}`, 14, 21);
    doc.text(`Total Device: ${devices.length}  |  Online: ${devices.filter(d => d.status === "online").length}  |  Quarantined: ${devices.filter(d => d.status === "quarantined").length}  |  Rogue/Suspicious: ${rogues.length}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [["ID", "Nama", "Tipe", "MAC", "IP", "VLAN", "Lokasi", "Status", "Risiko", "Firmware"]],
      body: devices.map(d => [d.id, d.name, d.type, d.mac, d.ip, d.vlan, d.location, d.status, d.risk, d.firmware]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [14, 165, 233] },
      didParseCell: (data) => {
        const rowDevice = devices[data.row.index];
        if (rowDevice && rowDevice.risk !== "normal" && data.section === "body") {
          data.cell.styles.textColor = [239, 68, 68];
        }
      },
    });

    if (rogues.length) {
      const finalY = (doc as any).lastAutoTable.finalY || 32;
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text("Daftar Perangkat Mencurigakan / Rogue", 14, finalY + 10);
      autoTable(doc, {
        startY: finalY + 14,
        head: [["MAC", "IP", "Lokasi", "VLAN", "Risiko", "Status"]],
        body: rogues.map(d => [d.mac, d.ip, d.location, d.vlan, d.risk, d.status]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    doc.save(`Medical-IoT-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("File PDF berhasil diunduh");
    setExportMenu(false);
  };

  const SortIcon = ({ f }: { f: keyof Device }) => sortField === f ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  // Posisi node untuk peta topologi (disusun per VLAN, layout radial sederhana)
  const topologyNodes = useMemo(() => {
    return VLAN_SEGMENTS.map((seg, segIdx) => {
      const segDevices = devices.filter(d => d.vlan === seg.vlan);
      const cx = 110 + segIdx * 150;
      return {
        ...seg,
        cx,
        cy: 70,
        devices: segDevices.map((d, i) => {
          const angle = (i / Math.max(segDevices.length, 1)) * 2 * Math.PI;
          return {
            ...d,
            x: cx + Math.cos(angle) * 55,
            y: 70 + Math.sin(angle) * 55 + (i % 2 === 0 ? 0 : 10),
          };
        }),
      };
    });
  }, [devices]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span className="text-[#10b981]">Medical IoT</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Medical IoT & Rogue Device Guardian</h1>
          <p className="text-[#94a3b8] text-sm">Mikrosegmentasi jaringan, deteksi rogue MAC, karantina otomatis & isolasi 1-klik</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => toast.success("Network scan initiated...")} className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.2)] transition-all">
            <RefreshCw className="w-4 h-4" /> Scan Network
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm hover:bg-[#0284c7] transition-all">
            <Plus className="w-4 h-4" /> Register Device
          </button>
          <div className="relative">
            <button onClick={() => setExportMenu(!exportMenu)} className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <AnimatePresence>
              {exportMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-40 py-1">
                  <button onClick={exportPDF} className="w-full text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">Export PDF</button>
                  <button onClick={exportXLSX} className="w-full text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">Export Excel (.xlsx)</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Rogue Banner — one-click isolation: Isolate Device / Block MAC / Approve Device,
          plus auto-quarantine details (detection time, quarantine status, assigned VLAN) */}
      {rogues.length > 0 && (
        <div className="p-3 bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.35)] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
            <span className="text-[#ef4444] text-xs font-semibold uppercase tracking-wide">{rogues.length} Unauthorized Device{rogues.length > 1 ? "s" : ""} Detected</span>
          </div>
          <div className="flex flex-col gap-2">
            {rogues.map(d => (
              <div key={d.id} className="rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.autoQuarantined && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444] text-white tracking-wide">
                        <ShieldAlert className="w-3 h-3" /> AUTO QUARANTINED
                      </span>
                    )}
                    <span className="text-white text-xs font-semibold" style={{ fontFamily: "monospace" }}>{d.mac}</span>
                    <span className="text-[#94a3b8] text-xs">{d.location}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.risk === "rogue" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]"}`}>{d.risk}</span>
                    {d.blocked && <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[rgba(71,85,105,0.4)] text-[#cbd5e1]">MAC Blocked</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!d.blocked && d.status !== "quarantined" && (
                      <button onClick={() => quarantine(d.id)} className="flex items-center gap-1 text-xs bg-[#ef4444] text-white px-2 py-1 rounded hover:bg-[#dc2626] transition-colors">
                        <Zap className="w-3 h-3" /> Isolate Device
                      </button>
                    )}
                    {!d.blocked && d.status === "quarantined" && (
                      <span className="text-xs text-[#10b981] flex items-center gap-1 px-1"><Lock className="w-3 h-3" /> Isolated</span>
                    )}
                    {!d.blocked && (
                      <button onClick={() => blockMac(d.id)} className="flex items-center gap-1 text-xs bg-[rgba(71,85,105,0.7)] text-white px-2 py-1 rounded hover:bg-[rgba(71,85,105,0.9)] transition-colors">
                        <Ban className="w-3 h-3" /> Block MAC
                      </button>
                    )}
                    <button onClick={() => approveDevice(d.id)} className="flex items-center gap-1 text-xs bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.4)] text-[#10b981] px-2 py-1 rounded hover:bg-[rgba(16,185,129,0.25)] transition-colors">
                      <CheckCircle className="w-3 h-3" /> Approve Device
                    </button>
                  </div>
                </div>
                {d.autoQuarantined && (
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[11px] text-[#94a3b8]">Detection Time: <span className="text-white">{d.detectedAt ?? d.lastSeen}</span></span>
                    <span className="text-[11px] text-[#94a3b8]">Quarantine Status: <span className={`font-medium capitalize ${d.blocked ? "text-[#94a3b8]" : "text-[#ef4444]"}`}>{d.blocked ? "Blocked" : d.status === "quarantined" ? "Active" : "Pending"}</span></span>
                    <span className="text-[11px] text-[#94a3b8]">Assigned VLAN: <span className="text-white" style={{ fontFamily: "monospace" }}>{d.quarantineVlan ?? "VLAN-40"}</span></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Detection Panel */}
      {rogues.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
            <h3 className="font-semibold text-white">Threat Detection Panel</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rogues.map(d => {
              const currentAction = d.blocked ? "MAC Blocked" : d.status === "quarantined" ? "Quarantined" : "Monitoring";
              const recommendation = d.risk === "rogue"
                ? "Block the MAC address and escalate to the security team immediately."
                : "Verify device ownership with the department before restoring access.";
              return (
                <div key={d.id} className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.05)] p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wide">Unknown MAC Address</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${d.risk === "rogue" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]"}`}>{d.risk}</span>
                  </div>
                  <div className="text-white text-sm mb-2" style={{ fontFamily: "monospace" }}>{d.mac}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <div className="text-[10px] text-[#94a3b8]">Vendor</div>
                      <div className="text-xs text-white">Unknown</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94a3b8]">Risk Level</div>
                      <div className="text-xs text-white capitalize">{d.risk}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-[#94a3b8]">Current Action</div>
                      <div className="text-xs text-[#ef4444] font-medium">{currentAction}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-[#94a3b8]">Recommendation</div>
                      <div className="text-xs text-[#cbd5e1] leading-snug">{recommendation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Devices", value: devices.length, color: "#0ea5e9", icon: Wifi },
          { label: "Online", value: devices.filter(d => d.status === "online").length, color: "#10b981", icon: CheckCircle },
          { label: "Quarantined", value: devices.filter(d => d.status === "quarantined").length, color: "#ef4444", icon: Lock },
          { label: "Maintenance", value: devices.filter(d => d.status === "maintenance").length, color: "#f59e0b", icon: Settings },
        ].map(k => (
          <GlassCard key={k.label} className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${k.color}22` }}>
              <k.icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: "monospace" }}>{k.value}</div>
              <div className="text-xs text-[#94a3b8]">{k.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* PETA TOPOLOGI MIKROSEGMENTASI + FULL NETWORK MAP */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#0ea5e9]" />
            <h3 className="font-semibold text-white">Peta Topografi Mikrosegmentasi Jaringan</h3>
          </div>
          <button onClick={() => setShowTopology(s => !s)} className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1">
            {showTopology ? "Sembunyikan" : "Tampilkan"} {showTopology ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        <AnimatePresence>
          {showTopology && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* --- PETA SEGMENTASI VLAN (per zona) --- */}
                <div>
                  <p className="text-xs text-[#94a3b8] mb-3">Setiap segmen VLAN merepresentasikan zona mikrosegmentasi. Node merah/oranye menandakan perangkat rogue/suspicious yang melanggar batas segmen.</p>
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 820 220" className="w-full" style={{ minWidth: 700 }}>
                      <line x1="60" y1="20" x2="800" y2="20" stroke="rgba(148,163,184,0.25)" strokeWidth="2" />
                      <text x="0" y="24" fill="#94a3b8" fontSize="9">CORE SWITCH</text>

                      {topologyNodes.map((seg) => (
                        <g key={seg.vlan}>
                          <rect x={seg.cx - 65} y="35" width="130" height="160" rx="12"
                            fill={`${seg.color}0d`} stroke={seg.color} strokeOpacity="0.4" strokeDasharray="4 3" />
                          <line x1={seg.cx} y1="20" x2={seg.cx} y2="40" stroke={seg.color} strokeWidth="2" />
                          <circle cx={seg.cx} cy="20" r="4" fill={seg.color} />
                          <text x={seg.cx} y="48" textAnchor="middle" fill={seg.color} fontSize="9" fontWeight="600">{seg.vlan}</text>
                          <text x={seg.cx} y="59" textAnchor="middle" fill="#94a3b8" fontSize="7">{seg.label}</text>

                          {seg.devices.map(d => (
                            <g key={d.id}>
                              <line x1={seg.cx} y1="65" x2={d.x} y2={d.y} stroke={d.risk !== "normal" ? "#ef4444" : "rgba(148,163,184,0.3)"} strokeWidth={d.risk !== "normal" ? 1.5 : 0.8} />
                              <circle cx={d.x} cy={d.y} r={d.risk !== "normal" ? 7 : 5}
                                fill={d.risk === "rogue" ? "#ef4444" : d.risk === "suspicious" ? "#f59e0b" : seg.color}
                                opacity={d.risk !== "normal" ? 1 : 0.85}>
                                {d.risk !== "normal" && (
                                  <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                                )}
                              </circle>
                              {d.risk !== "normal" && (
                                <text x={d.x} y={d.y - 10} textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="700">ROGUE</text>
                              )}
                            </g>
                          ))}
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {VLAN_SEGMENTS.map(s => (
                      <div key={s.vlan} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs text-[#94a3b8]">{s.vlan} — {s.label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                      <span className="text-xs text-[#ef4444]">Rogue / Suspicious</span>
                    </div>
                  </div>
                </div>

                {/* --- FULL NETWORK MAP (fisik: gateway -> firewall -> core -> lantai -> VLAN) --- */}
                <div className="xl:border-l xl:border-[rgba(148,163,184,0.1)] xl:pl-5">
                  <p className="text-xs text-[#94a3b8] mb-3">Peta jaringan penuh dari gateway internet hingga setiap lantai dan zona VLAN, lengkap dengan firewall dan core switch rumah sakit.</p>
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 700 460" className="w-full" style={{ minWidth: 560 }}>
                      {/* Internet / Gateway */}
                      <rect x="290" y="6" width="120" height="34" rx="8" fill="rgba(148,163,184,0.08)" stroke="#475569" />
                      <text x="350" y="27" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">INTERNET</text>

                      <line x1="350" y1="40" x2="350" y2="62" stroke="#475569" strokeWidth="2" />

                      {/* Firewall */}
                      <rect x="280" y="62" width="140" height="34" rx="8" fill="rgba(239,68,68,0.07)" stroke="#ef4444" strokeOpacity="0.5" />
                      <text x="350" y="83" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="600">FIREWALL / IDS</text>

                      <line x1="350" y1="96" x2="350" y2="118" stroke="#475569" strokeWidth="2" />

                      {/* Core Switch */}
                      <rect x="270" y="118" width="160" height="34" rx="8" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" />
                      <text x="350" y="139" textAnchor="middle" fill="#0ea5e9" fontSize="10" fontWeight="600">CORE SWITCH (RS)</text>

                      <line x1="350" y1="152" x2="350" y2="170" stroke="#475569" strokeWidth="2" />
                      <line x1="60" y1="170" x2="640" y2="170" stroke="rgba(148,163,184,0.25)" strokeWidth="2" />

                      {/* Floor switches */}
                      {[
                        { floor: "Lantai 3", x: 100, vlan: "VLAN-10", color: "#0ea5e9", dept: "ICU / Critical Care" },
                        { floor: "Lantai 2", x: 270, vlan: "VLAN-20", color: "#10b981", dept: "Diagnostic Imaging" },
                        { floor: "Lantai 2", x: 410, vlan: "VLAN-30", color: "#8b5cf6", dept: "Clinical Workstation" },
                        { floor: "Area Umum", x: 550, vlan: "VLAN-40", color: "#ef4444", dept: "Guest / Unclassified" },
                        { floor: "Basement", x: 640, vlan: "VLAN-50", color: "#f59e0b", dept: "Facilities / BMS" },
                      ].map((f, i) => {
                        const segDevices = devices.filter(d => d.vlan === f.vlan).slice(0, 3);
                        return (
                          <g key={i}>
                            <line x1={f.x} y1="170" x2={f.x} y2="190" stroke={f.color} strokeWidth="2" />
                            <rect x={f.x - 55} y="190" width="110" height="30" rx="6" fill={`${f.color}15`} stroke={f.color} />
                            <text x={f.x} y="208" textAnchor="middle" fill={f.color} fontSize="9" fontWeight="600">{f.floor} Switch</text>
                            <line x1={f.x} y1="220" x2={f.x} y2="238" stroke={f.color} strokeOpacity="0.5" strokeWidth="1.5" />
                            <rect x={f.x - 60} y="238" width="120" height="190" rx="10" fill={`${f.color}0a`} stroke={f.color} strokeOpacity="0.35" strokeDasharray="4 3" />
                            <text x={f.x} y="254" textAnchor="middle" fill={f.color} fontSize="8" fontWeight="700">{f.vlan}</text>
                            <text x={f.x} y="265" textAnchor="middle" fill="#94a3b8" fontSize="6.5">{f.dept}</text>
                            {segDevices.map((d, di) => {
                              const dy = 280 + di * 38;
                              return (
                                <g key={d.id}>
                                  <line x1={f.x} y1="220" x2={f.x} y2={dy} stroke={d.risk !== "normal" ? "#ef4444" : "rgba(148,163,184,0.25)"} strokeWidth={d.risk !== "normal" ? 1.5 : 0.8} />
                                  <circle cx={f.x} cy={dy} r={d.risk !== "normal" ? 6.5 : 5}
                                    fill={d.risk === "rogue" ? "#ef4444" : d.risk === "suspicious" ? "#f59e0b" : f.color}>
                                    {d.risk !== "normal" && <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />}
                                  </circle>
                                  <text x={f.x + 12} y={dy + 3} fill={d.risk !== "normal" ? "#ef4444" : "#94a3b8"} fontSize="6.5">{d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name}</text>
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#475569]" /><span className="text-xs text-[#94a3b8]">Gateway / Firewall</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /><span className="text-xs text-[#94a3b8]">Core & Floor Switch</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" /><span className="text-xs text-[#ef4444]">Rogue / Suspicious</span></div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Security Event Log — live, append-only feed of detection / quarantine / isolation actions */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0ea5e9]" />
            <h3 className="font-semibold text-white">Security Event Log</h3>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-[#10b981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Live
          </span>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {events.map(e => (
            <div key={e.id} className="flex items-start gap-2.5 text-xs">
              <span className="text-[#475569] shrink-0 w-10" style={{ fontFamily: "monospace" }}>{e.time}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                e.level === "critical" ? "bg-[#ef4444]" : e.level === "warning" ? "bg-[#f59e0b]" : e.level === "success" ? "bg-[#10b981]" : "bg-[#0ea5e9]"
              }`} />
              <span className="text-[#cbd5e1]">{e.message}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-white mb-1">Network Traffic Analysis</h3>
          <p className="text-xs text-[#94a3b8] mb-4">Normal vs suspicious traffic (Mbps)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trafficData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
              <XAxis dataKey="time" stroke="#475569" style={{ fontSize: "11px" }} />
              <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              <Bar dataKey="normal" fill="#10b981" radius={[3, 3, 0, 0]} name="Normal" />
              <Bar dataKey="suspicious" fill="#ef4444" radius={[3, 3, 0, 0]} name="Suspicious" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-1">Device Types</h3>
          <p className="text-xs text-[#94a3b8] mb-3">Distribution across network</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {typeData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-xs text-[#94a3b8]">{d.name}</span></div>
                <span className="text-xs text-white" style={{ fontFamily: "monospace" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Device Table */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-white">Device Inventory</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search devices..."
                className="pl-9 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm w-48 focus:outline-none focus:border-[#0ea5e9] transition-all" />
            </div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="quarantined">Quarantined</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
              <option value="all">All Risk</option>
              <option value="normal">Normal</option>
              <option value="suspicious">Suspicious</option>
              <option value="rogue">Rogue</option>
            </select>
            {selected.size > 0 && (
              <button onClick={() => { selected.forEach(id => quarantine(id)); setSelected(new Set()); }}
                className="px-3 py-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.2)] transition-all">
                Quarantine {selected.size}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(148,163,184,0.1)]">
                <th className="pb-3 px-2 text-left w-8">
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(paged.map(d => d.id)) : new Set())} checked={selected.size === paged.length && paged.length > 0} className="rounded" />
                </th>
                {([["name", "Device Name"], ["type", "Type"], ["mac", "MAC Address"], ["ip", "IP"], ["location", "Location"], ["status", "Status"], ["risk", "Risk"], ["firmware", "Firmware"]] as [keyof Device, string][]).map(([f, label]) => (
                  <th key={f} onClick={() => toggleSort(f)} className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center gap-1">{label}<SortIcon f={f} /></div>
                  </th>
                ))}
                <th className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(d => (
                <tr key={d.id} className={`border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)] transition-colors ${selected.has(d.id) ? "bg-[rgba(14,165,233,0.04)]" : ""}`}>
                  <td className="py-3 px-2"><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSel(d.id)} className="rounded" /></td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[rgba(148,163,184,0.08)]"><Cpu className="w-3.5 h-3.5 text-[#94a3b8]" /></div>
                      <span className={`font-medium text-sm ${d.risk !== "normal" ? "text-[#ef4444]" : "text-white"}`}>{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-[#94a3b8] text-xs">{d.type}</td>
                  <td className="py-3 px-2"><span className={`text-xs px-1.5 py-0.5 rounded ${d.risk !== "normal" ? "bg-[rgba(239,68,68,0.1)] text-[#ef4444]" : "bg-[rgba(148,163,184,0.08)] text-[#94a3b8]"}`} style={{ fontFamily: "monospace" }}>{d.mac}</span></td>
                  <td className="py-3 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{d.ip}</td>
                  <td className="py-3 px-2 text-[#94a3b8] text-xs">{d.location}</td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[d.status] }} />
                      <span style={{ color: STATUS_COLOR[d.status] }} className="capitalize">{d.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${d.risk === "rogue" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : d.risk === "suspicious" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : "bg-[rgba(16,185,129,0.15)] text-[#10b981]"}`}>{d.risk}</span>
                  </td>
                  <td className="py-3 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{d.firmware}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedDevice(d); setShowDrawer(true); }} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all"><Eye className="w-3.5 h-3.5" /></button>
                      {d.risk !== "normal" ? (
                        <>
                          {!d.blocked && d.status !== "quarantined" && (
                            <button onClick={() => quarantine(d.id)} title="Isolate Device" className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all"><Lock className="w-3.5 h-3.5" /></button>
                          )}
                          {!d.blocked && d.status === "quarantined" && (
                            <button onClick={() => release(d.id)} title="Release" className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all"><Unlock className="w-3.5 h-3.5" /></button>
                          )}
                          {!d.blocked && (
                            <button onClick={() => blockMac(d.id)} title="Block MAC" className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(71,85,105,0.3)] hover:text-white transition-all"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => approveDevice(d.id)} title="Approve Device" className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all"><CheckCircle className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        d.status !== "quarantined" ? (
                          <button onClick={() => quarantine(d.id)} title="Isolasi 1-klik" className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all"><Lock className="w-3.5 h-3.5" /></button>
                        ) : (
                          <button onClick={() => release(d.id)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all"><Unlock className="w-3.5 h-3.5" /></button>
                        )
                      )}
                      <button onClick={() => toast.success(`Firmware update queued for ${d.name}`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(245,158,11,0.1)] hover:text-[#f59e0b] transition-all"><UploadCloud className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)]">
          <span className="text-xs text-[#94a3b8]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} devices</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-xs disabled:opacity-40 hover:text-white transition-all">Previous</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1.5 rounded-lg text-xs transition-all ${page === i + 1 ? "bg-[#0ea5e9] text-white" : "bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white"}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-xs disabled:opacity-40 hover:text-white transition-all">Next</button>
          </div>
        </div>
      </GlassCard>

      {/* Device Detail Drawer */}
      <AnimatePresence>
        {showDrawer && selectedDevice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDrawer(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm h-full max-h-[90vh] backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl overflow-y-auto">
              <div className="p-5 border-b border-[rgba(148,163,184,0.15)] flex items-center justify-between sticky top-0 bg-[rgba(15,23,42,0.97)]">
                <h3 className="font-semibold text-white">Device Details</h3>
                <button onClick={() => setShowDrawer(false)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className={`p-4 rounded-xl border ${selectedDevice.risk === "rogue" ? "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)]" : selectedDevice.risk === "suspicious" ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.08)]" : "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)]"}`}>
                  {selectedDevice.autoQuarantined && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444] text-white tracking-wide mb-2">
                      <ShieldAlert className="w-3 h-3" /> AUTO QUARANTINED
                    </span>
                  )}
                  <h2 className="text-base font-bold text-white">{selectedDevice.name}</h2>
                  <p className="text-[#94a3b8] text-sm">{selectedDevice.type} · {selectedDevice.manufacturer} {selectedDevice.model}</p>
                </div>
                {([
                  ["Device ID", selectedDevice.id], ["MAC Address", selectedDevice.mac], ["IP Address", selectedDevice.ip], ["VLAN", selectedDevice.vlan], ["Location", selectedDevice.location], ["Department", selectedDevice.dept], ["Status", selectedDevice.status], ["Risk Level", selectedDevice.risk], ["Firmware", selectedDevice.firmware], ["Uptime", selectedDevice.uptime], ["Last Seen", selectedDevice.lastSeen], ["Traffic", `${selectedDevice.trafficMbps} Mbps`],
                  ...(selectedDevice.autoQuarantined ? [["Detection Time", selectedDevice.detectedAt ?? selectedDevice.lastSeen], ["Quarantine VLAN", selectedDevice.quarantineVlan ?? "VLAN-40"]] : []),
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(148,163,184,0.08)]">
                    <span className="text-xs text-[#94a3b8]">{label}</span>
                    <span className="text-sm text-white font-medium capitalize" style={{ fontFamily: ["MAC Address", "IP Address", "Firmware"].includes(label) ? "monospace" : "inherit" }}>{value}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2 flex-wrap">
                  {selectedDevice.risk !== "normal" ? (
                    <>
                      {!selectedDevice.blocked && selectedDevice.status !== "quarantined" && (
                        <button onClick={() => { quarantine(selectedDevice.id); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.25)] transition-colors">Isolate Device</button>
                      )}
                      {!selectedDevice.blocked && (
                        <button onClick={() => { blockMac(selectedDevice.id); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(71,85,105,0.4)] border border-[rgba(71,85,105,0.6)] text-white rounded-lg text-sm hover:bg-[rgba(71,85,105,0.6)] transition-colors">Block MAC</button>
                      )}
                      <button onClick={() => { approveDevice(selectedDevice.id); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.25)] transition-colors">Approve Device</button>
                    </>
                  ) : (
                    selectedDevice.status !== "quarantined" ? (
                      <button onClick={() => { quarantine(selectedDevice.id); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.25)] transition-colors">Quarantine</button>
                    ) : (
                      <button onClick={() => { release(selectedDevice.id); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.25)] transition-colors">Release</button>
                    )
                  )}
                  <button onClick={() => { toast.success(`Firmware update queued`); setShowDrawer(false); }} className="flex-1 py-2.5 bg-[rgba(14,165,233,0.15)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-sm hover:bg-[rgba(14,165,233,0.25)] transition-colors">Update FW</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <h3 className="font-semibold text-white text-lg mb-1">Register New Device</h3>
              <p className="text-xs text-[#94a3b8] mb-4 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-[#f59e0b]" /> MAC address yang tidak cocok dengan OUI vendor terdaftar akan otomatis dikarantina.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Device Name</label>
                  <input value={newDevice.name} onChange={e => setNewDevice(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Patient Monitor #15"
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">MAC Address</label>
                  <input value={newDevice.mac} onChange={e => setNewDevice(s => ({ ...s, mac: e.target.value }))} placeholder="e.g. 00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" style={{ fontFamily: "monospace" }} />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">IP Address</label>
                  <input value={newDevice.ip} onChange={e => setNewDevice(s => ({ ...s, ip: e.target.value }))} placeholder="e.g. 192.168.10.50"
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" style={{ fontFamily: "monospace" }} />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Location</label>
                  <input value={newDevice.location} onChange={e => setNewDevice(s => ({ ...s, location: e.target.value }))} placeholder="e.g. ICU Bed 15"
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Device Type</label>
                  <select value={newDevice.type} onChange={e => setNewDevice(s => ({ ...s, type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    {["Patient Monitor", "Infusion Pump", "Ventilator", "ECG Machine", "Workstation", "Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">VLAN Tujuan (jika MAC terverifikasi)</label>
                  <select value={newDevice.vlan} onChange={e => setNewDevice(s => ({ ...s, vlan: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    {VLAN_SEGMENTS.map(v => <option key={v.vlan} value={v.vlan}>{v.vlan} — {v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={registerDevice} className="flex-1 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Register</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
