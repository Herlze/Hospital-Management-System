import { useEffect, useState } from "react";
import { GlassCard } from "../components/GlassCard";
import {
  Building2, Thermometer, Wind, Zap, Shield, Camera, Flame,
  Droplets, Server, Lock, Unlock, ChevronRight, AlertTriangle,
  CheckCircle, RefreshCw, Settings, Download, Eye, X,
  Plus, Bell, Power, Activity, FileText, FileSpreadsheet
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type RoomStatus = "clean" | "occupied" | "cleaning" | "maintenance" | "quarantine";

interface HVACZone {
  id: string;
  name: string;
  floor: string;
  setTemp: number;
  actualTemp: number;
  humidity: number;
  pressure: "negative" | "positive" | "neutral";
  status: "normal" | "warning" | "critical" | "offline";
  mode: "auto" | "manual" | "isolation";
}

interface Room {
  id: string;
  name: string;
  floor: string;
  dept: string;
  status: RoomStatus;
  lastCleaned: string;
  assignedStaff: string;
  nextCleaning: string;
  accessMode: "normal" | "restricted" | "locked";
}

interface SecurityZone {
  zone: string;
  access: "normal" | "restricted" | "locked";
  arm: boolean;
  motion: boolean;
  silent: boolean;
  last: string;
  color: string;
}

const HVAC_ZONES: HVACZone[] = [
  { id: "Z01", name: "ICU Wing A", floor: "3F", setTemp: 22, actualTemp: 22.3, humidity: 45, pressure: "negative", status: "normal", mode: "isolation" },
  { id: "Z02", name: "ICU Wing B", floor: "3F", setTemp: 22, actualTemp: 24.8, humidity: 52, pressure: "negative", status: "warning", mode: "auto" },
  { id: "Z03", name: "Emergency Bay", floor: "1F", setTemp: 21, actualTemp: 21.1, humidity: 48, pressure: "positive", status: "normal", mode: "auto" },
  { id: "Z04", name: "Operating Theatre 1", floor: "2F", setTemp: 18, actualTemp: 18.2, humidity: 40, pressure: "positive", status: "normal", mode: "manual" },
  { id: "Z05", name: "Operating Theatre 2", floor: "2F", setTemp: 18, actualTemp: 18.0, humidity: 39, pressure: "positive", status: "normal", mode: "manual" },
  { id: "Z06", name: "General Ward C", floor: "2F", setTemp: 23, actualTemp: 23.4, humidity: 50, pressure: "neutral", status: "normal", mode: "auto" },
  { id: "Z07", name: "Mortuary", floor: "B1", setTemp: 4, actualTemp: 3.8, humidity: 60, pressure: "negative", status: "normal", mode: "auto" },
  { id: "Z08", name: "Pharmacy Storage", floor: "1F", setTemp: 20, actualTemp: 25.1, humidity: 55, pressure: "neutral", status: "critical", mode: "offline" },
];

const ROOMS: Room[] = [
  { id: "R301", name: "ICU Bed 12", floor: "3F", dept: "ICU", status: "occupied", lastCleaned: "06:00", assignedStaff: "Ana R.", nextCleaning: "18:00", accessMode: "restricted" },
  { id: "R302", name: "ICU Bed 8", floor: "3F", dept: "ICU", status: "cleaning", lastCleaned: "Now", assignedStaff: "John D.", nextCleaning: "18:00", accessMode: "restricted" },
  { id: "R201", name: "Ward B Room 5", floor: "2F", dept: "General", status: "clean", lastCleaned: "08:30", assignedStaff: "Sam K.", nextCleaning: "20:00", accessMode: "normal" },
  { id: "R202", name: "Ward B Room 6", floor: "2F", dept: "General", status: "maintenance", lastCleaned: "Yesterday", assignedStaff: "—", nextCleaning: "TBD", accessMode: "locked" },
  { id: "R101", name: "Emergency Bay 1", floor: "1F", dept: "Emergency", status: "occupied", lastCleaned: "05:00", assignedStaff: "Ana R.", nextCleaning: "17:00", accessMode: "restricted" },
  { id: "R102", name: "Trauma Bay 2", floor: "1F", dept: "Emergency", status: "quarantine", lastCleaned: "04:00", assignedStaff: "Infection Control", nextCleaning: "Pending", accessMode: "locked" },
  { id: "RB01", name: "Mortuary Cold 1", floor: "B1", dept: "Mortuary", status: "occupied", lastCleaned: "07:00", assignedStaff: "—", nextCleaning: "19:00", accessMode: "restricted" },
  { id: "RB02", name: "Mortuary Cold 2", floor: "B1", dept: "Mortuary", status: "clean", lastCleaned: "07:00", assignedStaff: "—", nextCleaning: "19:00", accessMode: "restricted" },
];

const CCTV = [
  { cam: "CAM-01", location: "Main Entrance", status: "online", alert: false },
  { cam: "CAM-04", location: "ICU Wing Corridor", status: "online", alert: false },
  { cam: "CAM-07", location: "Emergency Bay", status: "online", alert: false },
  { cam: "CAM-11", location: "Pharmacy", status: "offline", alert: true },
  { cam: "CAM-15", location: "Car Park B", status: "online", alert: false },
  { cam: "CAM-22", location: "Stairwell 3", status: "online", alert: true },
];

const SENSORS = [
  { id: "S01", type: "Fire Alarm", location: "ICU Wing A", status: "normal", icon: Flame, color: "#ef4444" },
  { id: "S02", type: "Smoke Detector", location: "Server Room", status: "normal", icon: Wind, color: "#f59e0b" },
  { id: "S03", type: "Water Leak", location: "Basement", status: "warning", icon: Droplets, color: "#0ea5e9" },
  { id: "S04", type: "Fire Alarm", location: "Pharmacy", status: "offline", icon: Flame, color: "#ef4444" },
  { id: "S05", type: "Smoke Detector", location: "Mortuary", status: "normal", icon: Wind, color: "#f59e0b" },
  { id: "S06", type: "Water Leak", location: "Operating Theatre 1", status: "normal", icon: Droplets, color: "#0ea5e9" },
];

const energyData = [
  { time: "00:00", kwh: 42 }, { time: "04:00", kwh: 38 }, { time: "08:00", kwh: 65 },
  { time: "10:00", kwh: 82 }, { time: "12:00", kwh: 88 }, { time: "14:00", kwh: 91 },
  { time: "16:00", kwh: 85 }, { time: "18:00", kwh: 78 }, { time: "20:00", kwh: 70 },
];

const SECURITY_ZONES: SecurityZone[] = [
  { zone: "ICU Wing", access: "restricted", arm: true, motion: true, silent: false, last: "Dr. Reeves — 09:14", color: "#0ea5e9" },
  { zone: "Operating Theatre", access: "restricted", arm: true, motion: true, silent: false, last: "Dr. Wright — 10:02", color: "#0ea5e9" },
  { zone: "Pharmacy", access: "locked", arm: true, motion: true, silent: false, last: "Pharmacist Lee — 08:30", color: "#ef4444" },
  { zone: "Server Room", access: "locked", arm: true, motion: true, silent: true, last: "IT Admin — Yesterday", color: "#ef4444" },
  { zone: "Main Reception", access: "normal", arm: false, motion: false, silent: false, last: "Open access", color: "#10b981" },
  { zone: "Mortuary", access: "restricted", arm: false, motion: true, silent: true, last: "Mortuary Tech — 07:00", color: "#8b5cf6" },
];

const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  clean: "#10b981", occupied: "#0ea5e9", cleaning: "#f59e0b", maintenance: "#8b5cf6", quarantine: "#ef4444",
};

const TOOLTIP_STYLE = { backgroundColor: "rgba(15,23,42,0.97)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", color: "#e8eef7", fontSize: "11px" };

const TASK_TYPES = ["Standard Clean", "Deep Clean", "Terminal Clean", "Quarantine Protocol"];

export default function SmartFacility() {
  const [view, setView] = useState<"overview" | "hvac" | "housekeeping" | "security">("overview");
  const [hvacZones, setHvacZones] = useState(HVAC_ZONES);
  const [rooms, setRooms] = useState(ROOMS);
  const [securityZones, setSecurityZones] = useState(SECURITY_ZONES);
  const [genOn, setGenOn] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);

  // CCTV live view
  const [viewingCamera, setViewingCamera] = useState<(typeof CCTV)[number] | null>(null);
  const [clockTick, setClockTick] = useState(new Date());

  // HVAC zone settings page
  const [settingsZone, setSettingsZone] = useState<HVACZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ pressure: "neutral" as HVACZone["pressure"], mode: "auto" as HVACZone["mode"], setTemp: 22 });

  // Housekeeping: assign task + room detail page
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ roomId: ROOMS[0]?.id ?? "", taskType: TASK_TYPES[0], staff: "", scheduledTime: "" });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!viewingCamera) return;
    const interval = setInterval(() => setClockTick(new Date()), 1000);
    return () => clearInterval(interval);
  }, [viewingCamera]);

  const adjustTemp = (id: string, delta: number) => {
    setHvacZones(prev => prev.map(z => z.id === id ? { ...z, setTemp: Math.max(2, Math.min(30, z.setTemp + delta)) } : z));
    toast.success("Temperature setpoint updated");
  };

  const toggleAccess = (id: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next: Room["accessMode"] = r.accessMode === "normal" ? "restricted" : r.accessMode === "restricted" ? "locked" : "normal";
      toast.info(`${r.name} → ${next}`);
      return { ...r, accessMode: next };
    }));
  };

  const markClean = (id: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status: "clean" as RoomStatus, lastCleaned: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) } : r));
    toast.success("Room marked as clean");
  };

  // ---------- HVAC: open settings page for a zone ----------
  const openZoneSettings = (zone: HVACZone) => {
    setZoneForm({ pressure: zone.pressure, mode: zone.mode, setTemp: zone.setTemp });
    setSettingsZone(zone);
  };

  const saveZoneSettings = () => {
    if (!settingsZone) return;
    setHvacZones(prev => prev.map(z => z.id === settingsZone.id ? { ...z, pressure: zoneForm.pressure, mode: zoneForm.mode, setTemp: zoneForm.setTemp } : z));
    toast.success(`${settingsZone.name} settings updated`);
    setSettingsZone(null);
  };

  // ---------- Housekeeping: assign task ----------
  const openAssignTask = () => {
    setTaskForm({ roomId: rooms[0]?.id ?? "", taskType: TASK_TYPES[0], staff: "", scheduledTime: "" });
    setShowAssignTask(true);
  };

  const submitAssignTask = () => {
    if (!taskForm.roomId || !taskForm.staff.trim()) {
      toast.error("Please select a room and assign a staff member.");
      return;
    }
    const room = rooms.find(r => r.id === taskForm.roomId);
    setRooms(prev => prev.map(r => r.id === taskForm.roomId ? {
      ...r,
      status: "cleaning" as RoomStatus,
      assignedStaff: taskForm.staff,
      nextCleaning: taskForm.scheduledTime || r.nextCleaning,
    } : r));
    toast.success(`${taskForm.taskType} assigned to ${taskForm.staff} for ${room?.name ?? "room"}`);
    setShowAssignTask(false);
  };

  // ---------- Security: persist toggle state ----------
  const toggleSecurityOption = (zoneName: string, option: "arm" | "motion" | "silent") => {
    const labelMap = { arm: "Arm Mode", motion: "Motion Detect", silent: "Silent Mode" };
    setSecurityZones(prev => prev.map(z => z.zone === zoneName ? { ...z, [option]: !z[option] } : z));
    toast.success(`${labelMap[option]} toggled for ${zoneName}`);
  };

  // ---------- EXPORT: FULL FACILITY REPORT -> PDF ----------
  const exportFacilityReportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Smart Facility & Hardware Automation Report", 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(
        `HVAC Normal: ${hvacZones.filter((z) => z.status === "normal").length}/${hvacZones.length}  |  Sensor Alerts: ${SENSORS.filter((s) => s.status !== "normal").length}  |  Rooms Clean: ${rooms.filter((r) => r.status === "clean").length}/${rooms.length}  |  Energy Today: 2,847 kWh`,
        14,
        27
      );

      autoTable(doc, {
        startY: 33,
        head: [["Zone", "Name", "Floor", "Pressure", "Set °C", "Actual °C", "Humidity", "Mode", "Status"]],
        body: hvacZones.map((z) => [z.id, z.name, z.floor, z.pressure, `${z.setTemp}°`, `${z.actualTemp}°`, `${z.humidity}%`, z.mode, z.status]),
        styles: { fontSize: 6.5, cellPadding: 1.3 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 255] },
      });

      // @ts-ignore - lastAutoTable is attached by jspdf-autotable
      let y = doc.lastAutoTable.finalY + 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Housekeeping — Room Status", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Room", "Dept", "Floor", "Status", "Last Cleaned", "Staff", "Next Cleaning", "Access"]],
        body: rooms.map((r) => [r.name, r.dept, r.floor, r.status, r.lastCleaned, r.assignedStaff, r.nextCleaning, r.accessMode]),
        styles: { fontSize: 6.5, cellPadding: 1.3 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      });

      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text("CCTV Status", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Camera", "Location", "Status", "Alert"]],
        body: CCTV.map((c) => [c.cam, c.location, c.status, c.alert ? "Yes" : "No"]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      });

      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text("Environmental Sensors", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["ID", "Type", "Location", "Status"]],
        body: SENSORS.map((s) => [s.id, s.type, s.location, s.status]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      });

      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text("Security & Access Zones", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Zone", "Access", "Arm", "Motion", "Silent", "Last Access"]],
        body: securityZones.map((z) => [z.zone, z.access, z.arm ? "ON" : "OFF", z.motion ? "ON" : "OFF", z.silent ? "ON" : "OFF", z.last]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      });

      doc.save(`Facility-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF report.");
    }
  };

  // ---------- EXPORT: FULL FACILITY REPORT -> EXCEL (multi-sheet) ----------
  const exportFacilityReportToExcel = () => {
    try {
      const hvacData = hvacZones.map((z) => ({
        Zone: z.id,
        Name: z.name,
        Floor: z.floor,
        Pressure: z.pressure,
        "Set Temp (°C)": z.setTemp,
        "Actual Temp (°C)": z.actualTemp,
        "Humidity (%)": z.humidity,
        Mode: z.mode,
        Status: z.status,
      }));

      const roomsData = rooms.map((r) => ({
        Room: r.name,
        Department: r.dept,
        Floor: r.floor,
        Status: r.status,
        "Last Cleaned": r.lastCleaned,
        "Assigned Staff": r.assignedStaff,
        "Next Cleaning": r.nextCleaning,
        "Access Mode": r.accessMode,
      }));

      const cctvData = CCTV.map((c) => ({ Camera: c.cam, Location: c.location, Status: c.status, Alert: c.alert ? "Yes" : "No" }));

      const sensorsData = SENSORS.map((s) => ({ ID: s.id, Type: s.type, Location: s.location, Status: s.status }));

      const securityData = securityZones.map((z) => ({
        Zone: z.zone,
        Access: z.access,
        "Arm Mode": z.arm ? "ON" : "OFF",
        "Motion Detect": z.motion ? "ON" : "OFF",
        "Silent Mode": z.silent ? "ON" : "OFF",
        "Last Access": z.last,
      }));

      const energySheetData = energyData.map((e) => ({ Time: e.time, kWh: e.kwh }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hvacData), "HVAC Zones");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roomsData), "Housekeeping");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cctvData), "CCTV");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sensorsData), "Sensors");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(securityData), "Security Zones");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(energySheetData), "Energy Consumption");

      XLSX.writeFile(wb, `Facility-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel report.");
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span className="text-[#8b5cf6]">Smart Facility</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Facility & Real-Time Hardware Automation</h1>
          <p className="text-[#94a3b8] text-sm">Module 14 — HVAC, access control, housekeeping & energy management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setExportMenu(!exportMenu)} className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <AnimatePresence>
              {exportMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-40 py-1">
                  <button onClick={() => { setExportMenu(false); exportFacilityReportToPDF(); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                  <button onClick={() => { setExportMenu(false); exportFacilityReportToExcel(); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { setGenOn(!genOn); toast.info(`Generator ${!genOn ? "started" : "stopped"}`); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${genOn ? "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-[#10b981]" : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white"}`}>
            <Power className="w-4 h-4" /> Generator {genOn ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "HVAC Zones Normal", value: `${hvacZones.filter(z => z.status === "normal").length}/${hvacZones.length}`, color: "#0ea5e9", icon: Wind },
          { label: "Sensor Alerts", value: `${SENSORS.filter(s => s.status !== "normal").length} Active`, color: "#ef4444", icon: Flame },
          { label: "Rooms Clean", value: `${rooms.filter(r => r.status === "clean").length}/${rooms.length}`, color: "#10b981", icon: CheckCircle },
          { label: "Energy Today", value: "2,847 kWh", color: "#f59e0b", icon: Zap },
        ].map(k => (
          <GlassCard key={k.label} className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${k.color}22` }}>
              <k.icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{k.value}</div>
              <div className="text-xs text-[#94a3b8]">{k.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["overview", "hvac", "housekeeping", "security"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? "bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] border border-[rgba(139,92,246,0.3)]" : "text-[#94a3b8] hover:text-white"}`}>
            {v === "hvac" ? "HVAC Control" : v}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === "overview" && (
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-[#8b5cf6]" /> Environmental Sensors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {SENSORS.map(s => (
                <div key={s.id} onClick={() => s.status !== "normal" && toast.error(`${s.type} at ${s.location} needs inspection!`)}
                  className={`p-3 rounded-xl border text-center cursor-pointer hover:scale-105 transition-all ${s.status === "normal" ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)]" : s.status === "warning" ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.08)]" : "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)]"}`}>
                  <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.status === "normal" ? "#10b981" : s.status === "warning" ? "#f59e0b" : "#ef4444" }} />
                  <div className="text-xs font-medium text-white">{s.type}</div>
                  <div className="text-[10px] text-[#94a3b8] mt-0.5">{s.location}</div>
                  <div className={`text-[10px] mt-1 font-semibold capitalize ${s.status === "normal" ? "text-[#10b981]" : s.status === "warning" ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>{s.status}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2 p-5">
              <h3 className="font-semibold text-white mb-1">Energy Consumption Today</h3>
              <p className="text-xs text-[#94a3b8] mb-4">kWh load over 24h (total: 2,847 kWh)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={energyData}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
                  <XAxis dataKey="time" stroke="#475569" style={{ fontSize: "11px" }} />
                  <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="kwh" stroke="#8b5cf6" fill="url(#energyGrad)" strokeWidth={2} dot={false} name="kWh" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Camera className="w-4 h-4 text-[#06b6d4]" /> CCTV Status</h3>
              <div className="space-y-2.5">
                {CCTV.map(cam => (
                  <div key={cam.cam} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${cam.status === "online" ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{cam.cam}</p>
                      <p className="text-[#94a3b8] text-xs truncate">{cam.location}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {cam.alert && <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />}
                      <button onClick={() => setViewingCamera(cam)} className="text-[10px] px-1.5 py-0.5 bg-[rgba(6,182,212,0.1)] text-[#06b6d4] rounded hover:bg-[rgba(6,182,212,0.2)] transition-colors">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Emergency Generator", status: "standby", pct: 87, lastTest: "2026-06-20", icon: Zap, color: "#10b981" },
              { label: "UPS System", status: "online", pct: 100, lastTest: "2026-06-25", icon: Server, color: "#0ea5e9" },
            ].map(sys => (
              <GlassCard key={sys.label} className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl shrink-0" style={{ background: `${sys.color}22` }}>
                  <sys.icon className="w-6 h-6" style={{ color: sys.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{sys.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sys.status === "online" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : "bg-[rgba(14,165,233,0.2)] text-[#0ea5e9]"}`}>{sys.status}</span>
                  </div>
                  <div className="text-xs text-[#94a3b8] mb-1.5">Capacity: <span className="text-white">{sys.pct}%</span> · Last test: {sys.lastTest}</div>
                  <div className="h-1.5 bg-[rgba(148,163,184,0.1)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${sys.pct}%`, background: sys.color }} />
                  </div>
                </div>
                <button onClick={() => toast.success(`${sys.label} test initiated`)} className="shrink-0 px-3 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-xs hover:text-white transition-all">Test</button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* HVAC Control */}
      {view === "hvac" && (
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Wind className="w-4 h-4 text-[#0ea5e9]" /> HVAC Zone Control</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(148,163,184,0.1)]">
                  {["Zone", "Location", "Pressure", "Set °C", "Actual °C", "Humidity", "Mode", "Status", "Controls"].map(h => (
                    <th key={h} className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hvacZones.map(z => (
                  <tr key={z.id} onClick={() => openZoneSettings(z)} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)] cursor-pointer transition-colors">
                    <td className="py-3 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{z.id}</td>
                    <td className="py-3 px-2 text-white font-medium text-sm">{z.name} <span className="text-[#475569] text-xs">({z.floor})</span></td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${z.pressure === "negative" ? "bg-[rgba(239,68,68,0.15)] text-[#ef4444]" : z.pressure === "positive" ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]" : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"}`}>{z.pressure}</span>
                    </td>
                    <td className="py-3 px-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjustTemp(z.id, -0.5)} className="w-5 h-5 rounded bg-[rgba(148,163,184,0.1)] text-[#94a3b8] hover:bg-[rgba(14,165,233,0.2)] hover:text-[#0ea5e9] transition-all text-xs flex items-center justify-center">−</button>
                        <span className="text-white text-sm w-9 text-center" style={{ fontFamily: "monospace" }}>{z.setTemp}°</span>
                        <button onClick={() => adjustTemp(z.id, 0.5)} className="w-5 h-5 rounded bg-[rgba(148,163,184,0.1)] text-[#94a3b8] hover:bg-[rgba(14,165,233,0.2)] hover:text-[#0ea5e9] transition-all text-xs flex items-center justify-center">+</button>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold text-sm ${Math.abs(z.actualTemp - z.setTemp) > 2 ? "text-[#ef4444]" : Math.abs(z.actualTemp - z.setTemp) > 1 ? "text-[#f59e0b]" : "text-[#10b981]"}`} style={{ fontFamily: "monospace" }}>{z.actualTemp}°</span>
                    </td>
                    <td className="py-3 px-2 text-white text-sm" style={{ fontFamily: "monospace" }}>{z.humidity}%</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${z.mode === "isolation" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : z.mode === "manual" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9]"}`}>{z.mode}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`flex items-center gap-1 text-xs ${z.status === "normal" ? "text-[#10b981]" : z.status === "warning" ? "text-[#f59e0b]" : z.status === "critical" ? "text-[#ef4444]" : "text-[#475569]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${z.status === "normal" ? "bg-[#10b981]" : z.status === "warning" ? "bg-[#f59e0b]" : z.status === "critical" ? "bg-[#ef4444]" : "bg-[#475569]"}`} />
                        <span className="capitalize">{z.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => openZoneSettings(z)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all" title="Zone Settings"><Settings className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toast.success(`${z.name} alarm acknowledged`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(245,158,11,0.1)] hover:text-[#f59e0b] transition-all" title="Acknowledge Alarm"><Bell className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Housekeeping */}
      {view === "housekeeping" && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Housekeeping Schedule & Room Status</h3>
            <button onClick={openAssignTask} className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.2)] transition-all">
              <Plus className="w-4 h-4" /> Assign Task
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {(["clean", "occupied", "cleaning", "maintenance", "quarantine"] as RoomStatus[]).map(s => (
              <div key={s} className="text-center p-3 rounded-lg border" style={{ borderColor: `${ROOM_STATUS_COLOR[s]}33`, background: `${ROOM_STATUS_COLOR[s]}0a` }}>
                <div className="text-xl font-bold" style={{ color: ROOM_STATUS_COLOR[s], fontFamily: "monospace" }}>{rooms.filter(r => r.status === s).length}</div>
                <div className="text-xs text-[#94a3b8] capitalize mt-0.5">{s}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(148,163,184,0.1)]">
                  {["Room", "Dept", "Floor", "Status", "Last Cleaned", "Staff", "Next Cleaning", "Access", "Actions"].map(h => (
                    <th key={h} className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id} onClick={() => setSelectedRoom(r)} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.04)] cursor-pointer transition-colors">
                    <td className="py-2.5 px-2 text-white font-medium text-sm">{r.name}</td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs">{r.dept}</td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{r.floor}</td>
                    <td className="py-2.5 px-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: `${ROOM_STATUS_COLOR[r.status]}22`, color: ROOM_STATUS_COLOR[r.status] }}>{r.status}</span>
                    </td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{r.lastCleaned}</td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs">{r.assignedStaff}</td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>{r.nextCleaning}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${r.accessMode === "normal" ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]" : r.accessMode === "restricted" ? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b]" : "bg-[rgba(239,68,68,0.15)] text-[#ef4444]"}`}>{r.accessMode}</span>
                    </td>
                    <td className="py-2.5 px-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => markClean(r.id)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all" title="Mark Clean"><CheckCircle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleAccess(r.id)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all" title="Toggle Access">
                          {r.accessMode === "locked" ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Security / Access */}
      {view === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityZones.map(z => (
            <GlassCard key={z.zone} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{z.zone}</h4>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Last: {z.last}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${z.access === "normal" ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]" : z.access === "restricted" ? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b]" : "bg-[rgba(239,68,68,0.15)] text-[#ef4444]"}`}>{z.access}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "arm" as const, label: "Arm Mode", val: z.arm, col: "#0ea5e9" },
                  { key: "motion" as const, label: "Motion Detect", val: z.motion, col: "#10b981" },
                  { key: "silent" as const, label: "Silent Mode", val: z.silent, col: "#8b5cf6" },
                ].map(opt => (
                  <button key={opt.label} onClick={() => toggleSecurityOption(z.zone, opt.key)}
                    className="p-2.5 rounded-lg text-center transition-all border"
                    style={opt.val ? { color: opt.col, background: `${opt.col}18`, borderColor: `${opt.col}44` } : { color: "#475569", background: "rgba(148,163,184,0.05)", borderColor: "rgba(148,163,184,0.15)" }}>
                    <div className="text-xs font-medium">{opt.label}</div>
                    <div className="text-[10px] mt-0.5 font-semibold">{opt.val ? "ON" : "OFF"}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* CCTV Live View Modal */}
      <AnimatePresence>
        {viewingCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setViewingCamera(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-[rgba(148,163,184,0.15)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#06b6d4]" />
                  <div>
                    <h3 className="font-semibold text-white">{viewingCamera.cam}</h3>
                    <p className="text-xs text-[#94a3b8]">{viewingCamera.location}</p>
                  </div>
                </div>
                <button onClick={() => setViewingCamera(null)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>
              <div className="relative aspect-video bg-black overflow-hidden">
                {viewingCamera.status === "online" ? (
                  <>
                    <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(6,182,212,0.05) 0px, rgba(6,182,212,0.05) 1px, transparent 1px, transparent 3px)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-[rgba(148,163,184,0.12)]" />
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
                      <span className="text-[#ef4444] text-xs font-bold">REC</span>
                    </div>
                    <div className="absolute top-3 right-3 text-[#10b981] text-xs" style={{ fontFamily: "monospace" }}>{clockTick.toLocaleTimeString()}</div>
                    <div className="absolute bottom-3 left-3 text-white text-xs opacity-70" style={{ fontFamily: "monospace" }}>{viewingCamera.cam} · {viewingCamera.location}</div>
                    {viewingCamera.alert && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.4)] rounded text-[#f59e0b] text-xs">
                        <AlertTriangle className="w-3 h-3" /> Motion Alert
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#475569]">
                    <Camera className="w-12 h-12" />
                    <p className="text-sm font-medium">Feed Unavailable</p>
                    <p className="text-xs">Camera offline</p>
                  </div>
                )}
              </div>
              <div className="p-4 flex gap-3">
                <button onClick={() => toast.success(`Snapshot captured from ${viewingCamera.cam}`)} disabled={viewingCamera.status !== "online"}
                  className="flex-1 py-2.5 bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.3)] text-[#06b6d4] rounded-lg text-sm hover:bg-[rgba(6,182,212,0.2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Capture Snapshot</button>
                {viewingCamera.alert && (
                  <button onClick={() => { toast.success(`Alert acknowledged for ${viewingCamera.cam}`); setViewingCamera(null); }}
                    className="flex-1 py-2.5 bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] text-[#f59e0b] rounded-lg text-sm hover:bg-[rgba(245,158,11,0.25)] transition-colors">Acknowledge Alert</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HVAC Zone Settings Page */}
      <AnimatePresence>
        {settingsZone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsZone(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white text-lg">{settingsZone.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{settingsZone.id} · Floor {settingsZone.floor}</p>
                </div>
                <button onClick={() => setSettingsZone(null)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Operating Mode</label>
                  <select value={zoneForm.mode} onChange={e => setZoneForm(p => ({ ...p, mode: e.target.value as HVACZone["mode"] }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                    <option value="isolation">Isolation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Pressure Mode</label>
                  <select value={zoneForm.pressure} onChange={e => setZoneForm(p => ({ ...p, pressure: e.target.value as HVACZone["pressure"] }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    <option value="negative">Negative (Infectious Isolation)</option>
                    <option value="positive">Positive (Sterile/Protective)</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Temperature Setpoint</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoneForm(p => ({ ...p, setTemp: Math.max(2, p.setTemp - 0.5) }))}
                      className="w-8 h-8 rounded-lg bg-[rgba(148,163,184,0.1)] text-[#94a3b8] hover:bg-[rgba(14,165,233,0.2)] hover:text-[#0ea5e9] transition-all flex items-center justify-center">−</button>
                    <span className="flex-1 text-center text-white text-lg font-semibold" style={{ fontFamily: "monospace" }}>{zoneForm.setTemp}°C</span>
                    <button onClick={() => setZoneForm(p => ({ ...p, setTemp: Math.min(30, p.setTemp + 0.5) }))}
                      className="w-8 h-8 rounded-lg bg-[rgba(148,163,184,0.1)] text-[#94a3b8] hover:bg-[rgba(14,165,233,0.2)] hover:text-[#0ea5e9] transition-all flex items-center justify-center">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-[rgba(148,163,184,0.1)]">
                  <div className="p-2 bg-[rgba(148,163,184,0.05)] rounded-lg text-center">
                    <div className="text-[#94a3b8]">Actual</div>
                    <div className="text-white font-semibold" style={{ fontFamily: "monospace" }}>{settingsZone.actualTemp}°C</div>
                  </div>
                  <div className="p-2 bg-[rgba(148,163,184,0.05)] rounded-lg text-center">
                    <div className="text-[#94a3b8]">Humidity</div>
                    <div className="text-white font-semibold" style={{ fontFamily: "monospace" }}>{settingsZone.humidity}%</div>
                  </div>
                  <div className="p-2 bg-[rgba(148,163,184,0.05)] rounded-lg text-center">
                    <div className="text-[#94a3b8]">Status</div>
                    <div className="text-white font-semibold capitalize">{settingsZone.status}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setSettingsZone(null)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={saveZoneSettings} className="flex-1 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Save Settings</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Cleaning Task Modal */}
      <AnimatePresence>
        {showAssignTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignTask(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <h3 className="font-semibold text-white text-lg mb-4">Assign Cleaning Task</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Room</label>
                  <select value={taskForm.roomId} onChange={e => setTaskForm(p => ({ ...p, roomId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#10b981] appearance-none">
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} — {r.dept}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Task Type</label>
                  <select value={taskForm.taskType} onChange={e => setTaskForm(p => ({ ...p, taskType: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#10b981] appearance-none">
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Assign To</label>
                  <input value={taskForm.staff} onChange={e => setTaskForm(p => ({ ...p, staff: e.target.value }))} placeholder="e.g. Ana R."
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#10b981] transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Scheduled Time</label>
                  <input value={taskForm.scheduledTime} onChange={e => setTaskForm(p => ({ ...p, scheduledTime: e.target.value }))} placeholder="e.g. 16:00"
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#10b981] transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAssignTask(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={submitAssignTask} className="flex-1 py-2.5 bg-[#10b981] text-white rounded-lg text-sm font-bold hover:bg-[#059669] transition-colors">Assign Task</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Detail Page */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedRoom.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{selectedRoom.id} · {selectedRoom.dept} · Floor {selectedRoom.floor}</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Status", selectedRoom.status],
                  ["Last Cleaned", selectedRoom.lastCleaned],
                  ["Assigned Staff", selectedRoom.assignedStaff],
                  ["Next Cleaning", selectedRoom.nextCleaning],
                  ["Access Mode", selectedRoom.accessMode],
                ].map(([label, value]) => (
                  <div key={label} className="p-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg">
                    <div className="text-xs text-[#94a3b8]">{label}</div>
                    <div className="text-sm font-medium text-white capitalize">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { markClean(selectedRoom.id); setSelectedRoom(null); }}
                  className="flex-1 py-2.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.25)] transition-colors">Mark Clean</button>
                <button onClick={() => { toggleAccess(selectedRoom.id); setSelectedRoom(null); }}
                  className="flex-1 py-2.5 bg-[rgba(14,165,233,0.15)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-sm hover:bg-[rgba(14,165,233,0.25)] transition-colors">Toggle Access</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
