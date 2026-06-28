import { useState, useEffect, useRef } from "react";
import { GlassCard } from "../components/GlassCard";
import {
  Activity, Heart, Thermometer, Wind, Droplets, AlertTriangle,
  Download, Search, X, ChevronRight, Clock, TrendingUp, TrendingDown,
  Minus, Bell, BellOff, CheckCircle, Eye, Ambulance, FileText, FileSpreadsheet,
  Filter, ArrowUpCircle, Radio, Wifi
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bed: string;
  admission: string;
  diagnosis: string;
  severity: "critical" | "serious" | "stable";
  trend: "up" | "down" | "stable";
  doctor: string;
  nurse: string;
  vitals: { hr: number; bp: string; spo2: number; temp: number; rr: number };
  alarmSilenced: boolean;
}

const PATIENTS: Patient[] = [
  { id: "P001", name: "John Anderson", age: 67, gender: "M", bed: "ICU-12", admission: "2026-06-23", diagnosis: "Acute Myocardial Infarction", severity: "critical", trend: "down", doctor: "Dr. Sarah Reeves", nurse: "Nurse Kim Li", vitals: { hr: 115, bp: "145/95", spo2: 92, temp: 37.8, rr: 22 }, alarmSilenced: false },
  { id: "P002", name: "Sarah Mitchell", age: 52, gender: "F", bed: "ICU-08", admission: "2026-06-24", diagnosis: "Severe Pneumonia", severity: "serious", trend: "stable", doctor: "Dr. Mark Torres", nurse: "Nurse Priya Nair", vitals: { hr: 98, bp: "130/85", spo2: 94, temp: 38.2, rr: 20 }, alarmSilenced: false },
  { id: "P003", name: "Robert Chen", age: 45, gender: "M", bed: "ICU-15", admission: "2026-06-22", diagnosis: "Post-op Monitoring", severity: "stable", trend: "up", doctor: "Dr. James Wright", nurse: "Nurse Anna K.", vitals: { hr: 78, bp: "120/80", spo2: 98, temp: 36.8, rr: 16 }, alarmSilenced: false },
  { id: "P004", name: "Maria Gonzalez", age: 71, gender: "F", bed: "ICU-03", admission: "2026-06-25", diagnosis: "Septic Shock", severity: "critical", trend: "down", doctor: "Dr. Sarah Reeves", nurse: "Nurse Kim Li", vitals: { hr: 128, bp: "88/54", spo2: 91, temp: 39.1, rr: 26 }, alarmSilenced: false },
  { id: "P005", name: "David Park", age: 58, gender: "M", bed: "ICU-07", admission: "2026-06-24", diagnosis: "ARDS", severity: "serious", trend: "stable", doctor: "Dr. Mark Torres", nurse: "Nurse Priya Nair", vitals: { hr: 104, bp: "112/72", spo2: 93, temp: 37.5, rr: 24 }, alarmSilenced: true },
  { id: "P006", name: "Linda Watson", age: 44, gender: "F", bed: "ICU-20", admission: "2026-06-26", diagnosis: "Traumatic Brain Injury", severity: "serious", trend: "up", doctor: "Dr. Alice Chen", nurse: "Nurse Tom B.", vitals: { hr: 88, bp: "140/90", spo2: 96, temp: 37.0, rr: 18 }, alarmSilenced: false },
];

const ALARMS_INITIAL = [
  { id: 1, patient: "John Anderson", bed: "ICU-12", type: "HR High", value: "115 bpm", threshold: "> 100", priority: "critical", time: "2 min ago", ack: false },
  { id: 2, patient: "Maria Gonzalez", bed: "ICU-03", type: "BP Low", value: "88/54 mmHg", threshold: "< 90/60", priority: "critical", time: "5 min ago", ack: false },
  { id: 3, patient: "Sarah Mitchell", bed: "ICU-08", type: "Temp High", value: "38.2°C", threshold: "> 38°C", priority: "warning", time: "12 min ago", ack: false },
  { id: 4, patient: "David Park", bed: "ICU-07", type: "SpO₂ Low", value: "93%", threshold: "< 94%", priority: "warning", time: "18 min ago", ack: true },
];

const AMB_TELEMETRY = [
  { id: "AMB-01", patient: "Unknown Male ~40", eta: "4 min", chief: "Chest Pain · HR 130 · BP 160/100", ecg: "ST elevation", lat: 1.302, lng: 103.832 },
  { id: "AMB-07", patient: "Jane Doe ~65", eta: "9 min", chief: "Respiratory Distress · SpO₂ 88%", ecg: "Sinus tachycardia", lat: 1.295, lng: 103.826 },
];

// Hospital location
const HOSPITAL = { lat: 1.3077, lng: 103.8375 };

const BED_GRID = Array.from({ length: 20 }, (_, i) => {
  const num = `ICU-${String(i + 1).padStart(2, "0")}`;
  const patient = PATIENTS.find(p => p.bed === num) || null;
  return { num, patient };
});

type TimeRange = "1H" | "6H" | "12H" | "24H" | "7D";

const TIME_RANGE_POINTS: Record<TimeRange, number> = { "1H": 12, "6H": 24, "12H": 30, "24H": 40, "7D": 56 };
const TIME_RANGE_LABEL: Record<TimeRange, string> = { "1H": "5min", "6H": "15min", "12H": "30min", "24H": "1hr", "7D": "3hr" };

function genHistory(base: number, variance: number, count = 20) {
  let v = base;
  return Array.from({ length: count }, (_, i) => {
    v = Math.max(base - variance * 1.5, Math.min(base + variance * 1.5, v + (Math.random() - 0.5) * variance * 0.8));
    const totalMin = count * 5;
    const minAgo = (count - 1 - i) * Math.round(totalMin / count);
    const label = minAgo >= 60
      ? `-${Math.round(minAgo / 60)}h`
      : minAgo === 0 ? "now" : `-${minAgo}m`;
    return { t: label, v };
  });
}

const TOOLTIP_STYLE = { backgroundColor: "rgba(15,23,42,0.97)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "6px", color: "#e8eef7", fontSize: "11px", padding: "6px 10px" };

// ── FIX 1: Per-patient timeline events keyed by patient ID ────────────────────
// Previously all tabs showed John Anderson's hardcoded events regardless of
// which patient was selected. Each patient now has their own timeline.
const PATIENT_TIMELINES: Record<string, Array<{ time: string; event: string; by: string; type: string }>> = {
  P001: [
    { time: "08:30", event: "Attending physician review completed", by: "Dr. Sarah Reeves", type: "review" },
    { time: "07:15", event: "Norepinephrine 0.1 mcg/kg/min administered", by: "Nurse Kim Li", type: "medication" },
    { time: "06:00", event: "Vitals recorded — HR: 118, BP: 148/98, SpO₂: 91%", by: "System", type: "vitals" },
    { time: "02:45", event: "SpO₂ alarm triggered — 89%", by: "ICU Monitor", type: "alarm" },
    { time: "02:43", event: "O₂ flow increased to 8L/min via NRB mask", by: "Nurse Kim Li", type: "intervention" },
    { time: "00:00", event: "Night shift handover completed — status unchanged", by: "Charge Nurse", type: "handover" },
  ],
  P002: [
    { time: "09:00", event: "Chest X-ray reviewed — bilateral infiltrates present", by: "Dr. Mark Torres", type: "review" },
    { time: "07:30", event: "IV Piperacillin-Tazobactam 4.5g administered", by: "Nurse Priya Nair", type: "medication" },
    { time: "06:15", event: "Vitals recorded — HR: 100, Temp: 38.4°C, SpO₂: 93%", by: "System", type: "vitals" },
    { time: "04:10", event: "Temp High alarm — 38.5°C", by: "ICU Monitor", type: "alarm" },
    { time: "04:08", event: "Cooling measures initiated, paracetamol 1g IV given", by: "Nurse Priya Nair", type: "intervention" },
    { time: "00:00", event: "Night shift handover — respiratory status reviewed", by: "Charge Nurse", type: "handover" },
  ],
  P003: [
    { time: "10:00", event: "Post-op day 4 surgical review — wound healing well", by: "Dr. James Wright", type: "review" },
    { time: "08:00", event: "Oral analgesics stepped down from IV morphine", by: "Nurse Anna K.", type: "medication" },
    { time: "07:00", event: "Vitals recorded — HR: 76, BP: 118/78, SpO₂: 99%", by: "System", type: "vitals" },
    { time: "06:30", event: "Patient mobilised to chair with physiotherapy", by: "Nurse Anna K.", type: "intervention" },
    { time: "02:00", event: "Uneventful overnight — no alarms triggered", by: "ICU Monitor", type: "vitals" },
    { time: "00:00", event: "Night shift handover — stable, discharge planning initiated", by: "Charge Nurse", type: "handover" },
  ],
  P004: [
    { time: "08:45", event: "Sepsis bundle reassessed — source control confirmed", by: "Dr. Sarah Reeves", type: "review" },
    { time: "07:00", event: "Vasopressin 0.03 units/min added to regimen", by: "Nurse Kim Li", type: "medication" },
    { time: "06:00", event: "Vitals recorded — HR: 132, BP: 84/52, Temp: 39.3°C", by: "System", type: "vitals" },
    { time: "03:20", event: "BP Low critical alarm — MAP < 65 mmHg", by: "ICU Monitor", type: "alarm" },
    { time: "03:18", event: "Fluid bolus 500ml NS administered, vasopressor uptitrated", by: "Nurse Kim Li", type: "intervention" },
    { time: "00:00", event: "Night shift handover — critical status, family updated", by: "Charge Nurse", type: "handover" },
  ],
  P005: [
    { time: "09:30", event: "Ventilator settings reviewed — FiO₂ weaned to 60%", by: "Dr. Mark Torres", type: "review" },
    { time: "08:00", event: "Prone positioning session started (16h cycle)", by: "Nurse Priya Nair", type: "intervention" },
    { time: "06:00", event: "Vitals recorded — HR: 106, SpO₂: 92%, RR: 25/min", by: "System", type: "vitals" },
    { time: "04:50", event: "SpO₂ Low alarm — 91% (alarm silenced by staff)", by: "ICU Monitor", type: "alarm" },
    { time: "04:48", event: "PEEP increased from 10 to 12 cmH₂O", by: "Nurse Priya Nair", type: "intervention" },
    { time: "00:00", event: "Night shift handover — ARDS protocol ongoing", by: "Charge Nurse", type: "handover" },
  ],
  P006: [
    { time: "09:15", event: "CT brain reviewed — no new haemorrhage", by: "Dr. Alice Chen", type: "review" },
    { time: "07:45", event: "Mannitol 100g IV administered for ICP management", by: "Nurse Tom B.", type: "medication" },
    { time: "06:00", event: "Vitals recorded — HR: 90, BP: 142/92, GCS: 10", by: "System", type: "vitals" },
    { time: "05:10", event: "BP High alarm — systolic 158 mmHg", by: "ICU Monitor", type: "alarm" },
    { time: "05:08", event: "Labetalol 10mg IV given, MAP target 70–90 maintained", by: "Nurse Tom B.", type: "intervention" },
    { time: "00:00", event: "Night shift handover — neuro obs every 2 hours", by: "Charge Nurse", type: "handover" },
  ],
};

// ── Mini GPS Map (SVG-based) ──────────────────────────────────────────────────
function AmbulanceMiniMap() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const latMin = 1.290, latMax = 1.315, lngMin = 103.820, lngMax = 103.845;
  const W = 340, H = 160;
  const toX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * W;
  const toY = (lat: number) => (1 - (lat - latMin) / (latMax - latMin)) * H;

  const progress = (tick % 20) / 20;
  const amb1 = {
    x: toX(AMB_TELEMETRY[0].lng + (HOSPITAL.lng - AMB_TELEMETRY[0].lng) * progress * 0.35),
    y: toY(AMB_TELEMETRY[0].lat + (HOSPITAL.lat - AMB_TELEMETRY[0].lat) * progress * 0.35),
  };
  const amb2 = {
    x: toX(AMB_TELEMETRY[1].lng + (HOSPITAL.lng - AMB_TELEMETRY[1].lng) * progress * 0.2),
    y: toY(AMB_TELEMETRY[1].lat + (HOSPITAL.lat - AMB_TELEMETRY[1].lat) * progress * 0.2),
  };
  const hospX = toX(HOSPITAL.lng);
  const hospY = toY(HOSPITAL.lat);

  const road1MidX = (amb1.x + hospX) / 2 + 15;
  const road1MidY = (amb1.y + hospY) / 2 - 12;
  const road2MidX = (amb2.x + hospX) / 2 - 10;
  const road2MidY = (amb2.y + hospY) / 2 + 8;

  const pulse = tick % 2 === 0;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[rgba(245,158,11,0.2)] relative" style={{ background: "rgba(10,18,35,0.85)" }}>
      <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "bg-[#f59e0b]" : "bg-[rgba(245,158,11,0.4)]"} transition-all`} />
        <span className="text-[10px] text-[#f59e0b] font-semibold tracking-wide uppercase">Live GPS Tracking</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow-amber">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="rgba(8,15,30,0.0)" />
        <rect width={W} height={H} fill="url(#grid)" />
        <line x1="0" y1="80" x2={W} y2="80" stroke="rgba(148,163,184,0.08)" strokeWidth="6" />
        <line x1="0" y1="110" x2={W} y2="110" stroke="rgba(148,163,184,0.06)" strokeWidth="4" />
        <line x1="100" y1="0" x2="100" y2={H} stroke="rgba(148,163,184,0.07)" strokeWidth="5" />
        <line x1="220" y1="0" x2="220" y2={H} stroke="rgba(148,163,184,0.06)" strokeWidth="4" />
        <path d={`M ${amb1.x} ${amb1.y} Q ${road1MidX} ${road1MidY} ${hospX} ${hospY}`} fill="none" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={`M ${amb2.x} ${amb2.y} Q ${road2MidX} ${road2MidY} ${hospX} ${hospY}`} fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx={hospX} cy={hospY} r={pulse ? 14 : 12} fill="rgba(14,165,233,0.07)" stroke="rgba(14,165,233,0.3)" strokeWidth="1" style={{ transition: "r 0.4s" }} />
        <circle cx={hospX} cy={hospY} r="6" fill="rgba(14,165,233,0.25)" stroke="#0ea5e9" strokeWidth="1.5" />
        <text x={hospX} y={hospY + 0.5} textAnchor="middle" dominantBaseline="middle" fill="#0ea5e9" fontSize="7" fontWeight="bold">H</text>
        <text x={hospX} y={hospY + 14} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7">City ICU</text>
        <circle cx={amb1.x} cy={amb1.y} r={pulse ? 9 : 7} fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="1" style={{ transition: "r 0.4s" }} filter="url(#glow-red)" />
        <circle cx={amb1.x} cy={amb1.y} r="4" fill="#ef4444" />
        <text x={amb1.x} y={amb1.y - 10} textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold">AMB-01</text>
        <text x={amb1.x} y={amb1.y - 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5">🚑</text>
        <rect x={amb1.x - 14} y={amb1.y + 5} width="28" height="10" rx="3" fill="rgba(239,68,68,0.25)" stroke="rgba(239,68,68,0.5)" strokeWidth="0.5" />
        <text x={amb1.x} y={amb1.y + 11} textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontWeight="600">ETA 4 min</text>
        <circle cx={amb2.x} cy={amb2.y} r={pulse ? 9 : 7} fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" style={{ transition: "r 0.4s" }} filter="url(#glow-amber)" />
        <circle cx={amb2.x} cy={amb2.y} r="4" fill="#f59e0b" />
        <text x={amb2.x} y={amb2.y - 10} textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontWeight="bold">AMB-07</text>
        <text x={amb2.x} y={amb2.y - 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5">🚑</text>
        <rect x={amb2.x - 14} y={amb2.y + 5} width="28" height="10" rx="3" fill="rgba(245,158,11,0.25)" stroke="rgba(245,158,11,0.5)" strokeWidth="0.5" />
        <text x={amb2.x} y={amb2.y + 11} textAnchor="middle" fill="#fde68a" fontSize="6.5" fontWeight="600">ETA 9 min</text>
      </svg>
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-[rgba(245,158,11,0.1)]">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span className="text-[10px] text-[#94a3b8]">AMB-01 · Critical</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /><span className="text-[10px] text-[#94a3b8]">AMB-07 · Urgent</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /><span className="text-[10px] text-[#94a3b8]">City ICU</span></div>
      </div>
    </div>
  );
}

export default function ICUCentral() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>(PATIENTS[0]);
  const [search, setSearch] = useState("");
  const [filterSev, setFilterSev] = useState("all");
  const [alarms, setAlarms] = useState(ALARMS_INITIAL);
  const [showAlarmPanel, setShowAlarmPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"vitals" | "timeline" | "notes">("vitals");
  const [patients, setPatients] = useState(PATIENTS);
  const [exportMenu, setExportMenu] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("1H");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setLastUpdate(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  const unacked = alarms.filter(a => !a.ack);
  const criticalAlarms = alarms.filter(a => a.priority === "critical" && !a.ack);
  const warningAlarms = alarms.filter(a => a.priority === "warning" && !a.ack);

  const filtered = patients.filter(p => {
    const s = search.toLowerCase();
    const matchS = p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || p.bed.toLowerCase().includes(s);
    const matchF = filterSev === "all" || p.severity === filterSev;
    return matchS && matchF;
  });

  const displayedAlarms = showCriticalOnly ? alarms.filter(a => a.priority === "critical") : alarms;

  const ackAlarm = (id: number) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
    toast.success("Alarm acknowledged");
  };

  const silenceAlarm = (patientId: string) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, alarmSilenced: !p.alarmSilenced } : p));
    const p = patients.find(x => x.id === patientId);
    toast.info(`Alarms ${p?.alarmSilenced ? "resumed" : "silenced"} for ${p?.name}`);
  };

  const handleSilence30s = () => {
    if (silenceTimer.current) clearInterval(silenceTimer.current);
    setSilenceCountdown(30);
    toast.info("All alarms silenced for 30 seconds");
    silenceTimer.current = setInterval(() => {
      setSilenceCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(silenceTimer.current!);
          toast.info("Alarm silence expired — alarms resumed");
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSnooze5min = () => {
    toast.success("Alarms snoozed for 5 minutes");
    setAlarms(prev => prev.map(a => ({ ...a, ack: true })));
    setTimeout(() => {
      setAlarms(ALARMS_INITIAL);
      toast.warning("Snooze expired — alarms restored");
    }, 5 * 60 * 1000);
  };

  const handleEscalateNurse = () => {
    toast.success("Charge nurse paged — response expected in 2 min", { duration: 5000 });
  };

  const handleAIFilter = () => {
    setAlarms(prev => prev.map(a => a.priority === "warning" ? { ...a, ack: true } : a));
    toast.success("AI Filter applied — warning alarms suppressed, critical retained");
  };

  const points = TIME_RANGE_POINTS[timeRange];

  // ── FIX 3: SpO₂ refHigh removed — a reference line at 100% is meaningless
  // and clips at the chart ceiling. Only the clinically significant low
  // threshold (94%) is drawn. All other charts are unchanged.
  const vitalCharts = [
    { label: "Heart Rate",   data: genHistory(selectedPatient.vitals.hr,   15,  points), color: "#ef4444", unit: "bpm", refLow: 60,   refHigh: 100  },
    { label: "SpO₂",        data: genHistory(selectedPatient.vitals.spo2,  3,   points), color: "#06b6d4", unit: "%",   refLow: 94,   refHigh: null },  // refHigh removed
    { label: "Resp. Rate",  data: genHistory(selectedPatient.vitals.rr,    4,   points), color: "#8b5cf6", unit: "/min",refLow: 12,   refHigh: 20   },
    { label: "Temperature", data: genHistory(selectedPatient.vitals.temp,  0.5, points), color: "#f59e0b", unit: "°C", refLow: 36.1, refHigh: 37.2 },
  ];

  // ── Export functions (unchanged) ──────────────────────────────────────────
  const exportAllPatientsToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("ICU Central Command & Telemetry Report", 14, 16);
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Patients: ${patients.length}  |  Active Alarms: ${unacked.length}`, 14, 27);
      autoTable(doc, {
        startY: 33,
        head: [["ID", "Name", "Bed", "Age/Gender", "Diagnosis", "Severity", "Trend", "HR", "BP", "SpO2", "Temp", "RR", "Doctor", "Nurse"]],
        body: patients.map((p) => [p.id, p.name, p.bed, `${p.age}${p.gender}`, p.diagnosis, p.severity.toUpperCase(), p.trend, `${p.vitals.hr}`, p.vitals.bp, `${p.vitals.spo2}%`, `${p.vitals.temp}°C`, `${p.vitals.rr}`, p.doctor, p.nurse]),
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 255] },
      });
      // @ts-ignore
      let y = doc.lastAutoTable.finalY + 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setTextColor(0);
      doc.text("Active Alarms", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Patient", "Bed", "Type", "Value", "Threshold", "Priority", "Time", "Ack"]],
        body: alarms.map((a) => [a.patient, a.bed, a.type, a.value, a.threshold, a.priority.toUpperCase(), a.time, a.ack ? "Yes" : "No"]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Pre-Hospital Ambulance Telemetry", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Unit", "Patient", "ETA", "Chief Complaint", "ECG"]],
        body: AMB_TELEMETRY.map((a) => [a.id, a.patient, a.eta, a.chief, a.ecg]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      });
      doc.save(`ICU-Central-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report exported successfully!");
    } catch (err) { console.error(err); toast.error("Failed to export PDF report."); }
  };

  const exportAllPatientsToExcel = () => {
    try {
      const patientsData = patients.map((p) => ({ ID: p.id, Name: p.name, Bed: p.bed, Age: p.age, Gender: p.gender, "Admission Date": p.admission, Diagnosis: p.diagnosis, Severity: p.severity, Trend: p.trend, "Heart Rate (bpm)": p.vitals.hr, "Blood Pressure (mmHg)": p.vitals.bp, "SpO2 (%)": p.vitals.spo2, "Temperature (°C)": p.vitals.temp, "Resp Rate (/min)": p.vitals.rr, Doctor: p.doctor, Nurse: p.nurse, "Alarm Silenced": p.alarmSilenced ? "Yes" : "No" }));
      const alarmsData = alarms.map((a) => ({ Patient: a.patient, Bed: a.bed, Type: a.type, Value: a.value, Threshold: a.threshold, Priority: a.priority, Time: a.time, Acknowledged: a.ack ? "Yes" : "No" }));
      const ambData = AMB_TELEMETRY.map((a) => ({ Unit: a.id, Patient: a.patient, ETA: a.eta, "Chief Complaint": a.chief, ECG: a.ecg }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientsData), "Patients");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alarmsData), "Alarms");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ambData), "Ambulance Telemetry");
      XLSX.writeFile(wb, `ICU-Central-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch (err) { console.error(err); toast.error("Failed to export Excel report."); }
  };

  const exportAllPatientsToCSV = () => {
    try {
      const patientsData = patients.map((p) => ({ ID: p.id, Name: p.name, Bed: p.bed, Age: p.age, Gender: p.gender, Diagnosis: p.diagnosis, Severity: p.severity, Trend: p.trend, "Heart Rate": p.vitals.hr, "Blood Pressure": p.vitals.bp, SpO2: p.vitals.spo2, Temperature: p.vitals.temp, "Resp Rate": p.vitals.rr, Doctor: p.doctor, Nurse: p.nurse }));
      const ws = XLSX.utils.json_to_sheet(patientsData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `ICU-Patients-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully!");
    } catch (err) { console.error(err); toast.error("Failed to export CSV."); }
  };

  const exportSelectedPatientToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text(`Patient Report: ${selectedPatient.name}`, 14, 16);
      doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      autoTable(doc, { startY: 28, theme: "plain", styles: { fontSize: 9, cellPadding: 1.5 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } }, body: [["Patient ID", selectedPatient.id], ["Bed", selectedPatient.bed], ["Age / Gender", `${selectedPatient.age}y / ${selectedPatient.gender === "M" ? "Male" : "Female"}`], ["Admission Date", new Date(selectedPatient.admission).toLocaleDateString()], ["Diagnosis", selectedPatient.diagnosis], ["Severity", selectedPatient.severity.toUpperCase()], ["Trend", selectedPatient.trend], ["Doctor", selectedPatient.doctor], ["Nurse", selectedPatient.nurse], ["Alarm Status", selectedPatient.alarmSilenced ? "Silenced" : "Active"]] });
      // @ts-ignore
      let y = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(12); doc.setTextColor(0); doc.text("Current Vital Signs", 14, y); y += 4;
      autoTable(doc, { startY: y, head: [["Heart Rate", "Blood Pressure", "SpO2", "Temperature", "Resp. Rate"]], body: [[`${selectedPatient.vitals.hr} bpm`, `${selectedPatient.vitals.bp} mmHg`, `${selectedPatient.vitals.spo2}%`, `${selectedPatient.vitals.temp}°C`, `${selectedPatient.vitals.rr}/min`]], headStyles: { fillColor: [14, 165, 233], textColor: 255 }, styles: { fontSize: 9, halign: "center" } });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 10;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.text("Vital Trend History", 14, y); y += 4;
      const rows = vitalCharts[0].data.map((_, i) => [vitalCharts[0].data[i].t, vitalCharts[0].data[i].v.toFixed(1), vitalCharts[1].data[i].v.toFixed(1), vitalCharts[2].data[i].v.toFixed(1), vitalCharts[3].data[i].v.toFixed(1)]);
      autoTable(doc, { startY: y, head: [["Time", "Heart Rate (bpm)", "SpO2 (%)", "Resp Rate (/min)", "Temp (°C)"]], body: rows, styles: { fontSize: 7, cellPadding: 1.5 }, headStyles: { fillColor: [16, 185, 129], textColor: 255 }, alternateRowStyles: { fillColor: [240, 248, 255] } });
      doc.save(`ICU-${selectedPatient.id}-${selectedPatient.name.replace(/\s+/g, "-")}.pdf`);
      toast.success(`PDF report for ${selectedPatient.name} exported!`);
    } catch (err) { console.error(err); toast.error("Failed to export patient PDF report."); }
  };

  const exportSelectedPatientToExcel = () => {
    try {
      const infoSheet = XLSX.utils.json_to_sheet([{ "Patient ID": selectedPatient.id, Name: selectedPatient.name, Bed: selectedPatient.bed, Age: selectedPatient.age, Gender: selectedPatient.gender, "Admission Date": selectedPatient.admission, Diagnosis: selectedPatient.diagnosis, Severity: selectedPatient.severity, Trend: selectedPatient.trend, Doctor: selectedPatient.doctor, Nurse: selectedPatient.nurse, "Heart Rate (bpm)": selectedPatient.vitals.hr, "Blood Pressure (mmHg)": selectedPatient.vitals.bp, "SpO2 (%)": selectedPatient.vitals.spo2, "Temperature (°C)": selectedPatient.vitals.temp, "Resp Rate (/min)": selectedPatient.vitals.rr, "Alarm Silenced": selectedPatient.alarmSilenced ? "Yes" : "No" }]);
      const historySheet = XLSX.utils.json_to_sheet(vitalCharts[0].data.map((_, i) => ({ Time: vitalCharts[0].data[i].t, "Heart Rate (bpm)": Number(vitalCharts[0].data[i].v.toFixed(1)), "SpO2 (%)": Number(vitalCharts[1].data[i].v.toFixed(1)), "Resp Rate (/min)": Number(vitalCharts[2].data[i].v.toFixed(1)), "Temperature (°C)": Number(vitalCharts[3].data[i].v.toFixed(1)) })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, infoSheet, "Patient Info");
      XLSX.utils.book_append_sheet(wb, historySheet, "Vital History");
      XLSX.writeFile(wb, `ICU-${selectedPatient.id}-${selectedPatient.name.replace(/\s+/g, "-")}.xlsx`);
      toast.success(`Excel report for ${selectedPatient.name} exported!`);
    } catch (err) { console.error(err); toast.error("Failed to export patient Excel report."); }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span className="text-[#0ea5e9]">ICU Central</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ICU Central Command & Telemetry</h1>
          <p className="text-[#94a3b8] text-sm">Module 1 — Real-time patient monitoring & alarm management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#10b981] text-xs font-bold tracking-wide">LIVE</span>
                <span className="text-[#94a3b8] text-xs">· Streaming Vital Signs</span>
              </div>
              <div className="text-[10px] text-[#475569]">
                Last update: {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>

          <button onClick={() => setShowAlarmPanel(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${unacked.length > 0 ? "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-[#ef4444]" : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8]"}`}>
            <Bell className="w-4 h-4" />{unacked.length} Active Alarms
          </button>
          <div className="relative">
            <button onClick={() => setExportMenu(!exportMenu)} className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] rounded-lg text-[#94a3b8] text-sm hover:text-white transition-all">
              <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
            </button>
            <AnimatePresence>
              {exportMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-40 py-1">
                  {[
                    { label: "PDF Report", action: exportAllPatientsToPDF },
                    { label: "Excel (.xlsx)", action: exportAllPatientsToExcel },
                    { label: "CSV", action: exportAllPatientsToCSV },
                    { label: "Print", action: () => window.print() },
                  ].map((item) => (
                    <button key={item.label} onClick={() => { setExportMenu(false); item.action(); }}
                      className="w-full text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">{item.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Alarm Fatigue Mitigation panel ── */}
      <div className="p-3 bg-[rgba(14,165,233,0.05)] border border-[rgba(14,165,233,0.2)] rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span className="text-[#0ea5e9] text-xs font-semibold uppercase tracking-wide">Alarm Management</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] rounded-full text-[#ef4444] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                {criticalAlarms.length} Critical
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] rounded-full text-[#f59e0b] text-xs font-semibold">
                {warningAlarms.length} Warning
              </span>
              {silenceCountdown !== null && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(148,163,184,0.1)] border border-[rgba(148,163,184,0.2)] rounded-full text-[#94a3b8] text-xs font-mono">
                  Silenced {silenceCountdown}s
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={handleSilence30s}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white hover:border-[rgba(148,163,184,0.4)] rounded-lg text-xs transition-all">
              <BellOff className="w-3 h-3" /> Silence 30s
            </button>
            <button onClick={handleSnooze5min}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white hover:border-[rgba(148,163,184,0.4)] rounded-lg text-xs transition-all">
              <Clock className="w-3 h-3" /> Snooze 5 min
            </button>
            <button onClick={handleEscalateNurse}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] hover:bg-[rgba(14,165,233,0.2)] rounded-lg text-xs transition-all">
              <ArrowUpCircle className="w-3 h-3" /> Escalate Nurse
            </button>
            <button onClick={handleAIFilter}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.2)] rounded-lg text-xs transition-all">
              <Radio className="w-3 h-3" /> AI Filter
            </button>
            <button onClick={() => setShowCriticalOnly(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${showCriticalOnly ? "bg-[rgba(239,68,68,0.15)] border-[rgba(239,68,68,0.4)] text-[#ef4444]" : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white"}`}>
              <Filter className="w-3 h-3" /> {showCriticalOnly ? "All Alarms" : "Critical Only"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Ambulance Telemetry ── */}
      <div className="p-3 bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.3)] rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse" />
          <span className="text-[#f59e0b] text-xs font-semibold uppercase tracking-wide">Pre-Hospital Ambulance Telemetry</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AMB_TELEMETRY.map(amb => (
            <div key={amb.id} className="flex items-center gap-3 p-2.5 bg-[rgba(245,158,11,0.06)] rounded-lg">
              <div className="text-center shrink-0">
                <div className="text-[#f59e0b] font-bold text-sm" style={{ fontFamily: "monospace" }}>{amb.id}</div>
                <div className="text-white font-semibold text-xs">ETA {amb.eta}</div>
              </div>
              <div className="w-px h-8 bg-[rgba(245,158,11,0.3)]" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium">{amb.patient}</p>
                <p className="text-[#94a3b8] text-xs">{amb.chief}</p>
                <p className="text-[#f59e0b] text-xs">ECG: {amb.ecg}</p>
              </div>
              <button onClick={() => toast.success(`Preparing ICU bay for ${amb.id} — ECG: ${amb.ecg}`)}
                className="shrink-0 px-3 py-1.5 bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.4)] text-[#f59e0b] rounded-lg text-xs font-medium hover:bg-[rgba(245,158,11,0.3)] transition-colors">
                Prepare Bay
              </button>
            </div>
          ))}
        </div>
        <AmbulanceMiniMap />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Patient List */}
        <div className="xl:col-span-1 space-y-3">
          <GlassCard className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, bed, ID..."
                className="w-full pl-9 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "critical", "serious", "stable"].map(sev => (
                <button key={sev} onClick={() => setFilterSev(sev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filterSev === sev ? (sev === "critical" ? "bg-[#ef4444] text-white" : sev === "serious" ? "bg-[#f59e0b] text-black" : sev === "stable" ? "bg-[#10b981] text-white" : "bg-[#0ea5e9] text-white") : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8] hover:text-white"}`}>{sev}</button>
              ))}
            </div>
          </GlassCard>
          <div className="space-y-2">
            {filtered.map(p => (
              <motion.div key={p.id} whileHover={{ x: 2 }} onClick={() => setSelectedPatient(p)}
                className={`cursor-pointer p-3 rounded-xl border transition-all ${selectedPatient.id === p.id ? "bg-[rgba(14,165,233,0.1)] border-[rgba(14,165,233,0.4)]" : "bg-[rgba(15,23,42,0.4)] border-[rgba(148,163,184,0.15)] hover:border-[rgba(148,163,184,0.3)]"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.severity === "critical" ? "bg-[#ef4444] animate-pulse" : p.severity === "serious" ? "bg-[#f59e0b]" : "bg-[#10b981]"}`} />
                      <span className="text-white text-sm font-semibold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-4 text-xs text-[#94a3b8]">
                      <span>{p.bed}</span><span className="text-[#475569]">·</span><span>{p.age}y {p.gender}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.trend === "down" && <TrendingDown className="w-4 h-4 text-[#ef4444]" />}
                    {p.trend === "up" && <TrendingUp className="w-4 h-4 text-[#10b981]" />}
                    {p.trend === "stable" && <Minus className="w-4 h-4 text-[#f59e0b]" />}
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${p.severity === "critical" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : p.severity === "serious" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : "bg-[rgba(16,185,129,0.2)] text-[#10b981]"}`}>{p.severity}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 ml-4">
                  {[
                    { l: "HR", v: `${p.vitals.hr}`, alert: p.vitals.hr > 100 || p.vitals.hr < 50 },
                    { l: "BP", v: p.vitals.bp, alert: false },
                    { l: "SpO₂", v: `${p.vitals.spo2}%`, alert: p.vitals.spo2 < 94 },
                    { l: "°C", v: `${p.vitals.temp}`, alert: p.vitals.temp > 38 },
                  ].map(v => (
                    <div key={v.l} className="text-center">
                      <div className={`text-xs font-semibold ${v.alert ? "text-[#ef4444]" : "text-white"}`} style={{ fontFamily: "monospace" }}>{v.v}</div>
                      <div className="text-[10px] text-[#475569]">{v.l}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Patient Detail */}
        <div className="xl:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 ${selectedPatient.severity === "critical" ? "bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.4)]" : selectedPatient.severity === "serious" ? "bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.4)]" : "bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.4)]"}`}>
                  {selectedPatient.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white">{selectedPatient.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${selectedPatient.severity === "critical" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444] border-[rgba(239,68,68,0.3)]" : selectedPatient.severity === "serious" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]" : "bg-[rgba(16,185,129,0.2)] text-[#10b981] border-[rgba(16,185,129,0.3)]"}`}>{selectedPatient.severity}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94a3b8] flex-wrap">
                    <span>{selectedPatient.id}</span><span className="text-[#475569]">·</span>
                    <span>{selectedPatient.bed}</span><span className="text-[#475569]">·</span>
                    <span>{selectedPatient.age}y · {selectedPatient.gender === "M" ? "Male" : "Female"}</span>
                  </div>
                  <p className="text-white text-sm font-medium mt-0.5">{selectedPatient.diagnosis}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{selectedPatient.doctor} · {selectedPatient.nurse}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => silenceAlarm(selectedPatient.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${selectedPatient.alarmSilenced ? "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-[#f59e0b]" : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white"}`}>
                  {selectedPatient.alarmSilenced ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                  {selectedPatient.alarmSilenced ? "Silenced" : "Silence"}
                </button>
                <button onClick={exportSelectedPatientToPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg text-[#ef4444] text-xs hover:bg-[rgba(239,68,68,0.2)] transition-all">
                  <FileText className="w-3.5 h-3.5" />PDF
                </button>
                <button onClick={exportSelectedPatientToExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-lg text-[#10b981] text-xs hover:bg-[rgba(16,185,129,0.2)] transition-all">
                  <FileSpreadsheet className="w-3.5 h-3.5" />Excel
                </button>
              </div>
            </div>
            {/* Vitals Strip */}
            <div className="grid grid-cols-5 gap-2 pt-4 border-t border-[rgba(148,163,184,0.1)]">
              {[
                { label: "Heart Rate", value: selectedPatient.vitals.hr, unit: "bpm", icon: Heart, color: "#ef4444", alert: selectedPatient.vitals.hr > 100 },
                { label: "Blood Pressure", value: selectedPatient.vitals.bp, unit: "mmHg", icon: Activity, color: "#0ea5e9", alert: false },
                { label: "SpO₂", value: selectedPatient.vitals.spo2, unit: "%", icon: Droplets, color: "#06b6d4", alert: selectedPatient.vitals.spo2 < 94 },
                { label: "Temp", value: selectedPatient.vitals.temp, unit: "°C", icon: Thermometer, color: "#f59e0b", alert: selectedPatient.vitals.temp > 38 },
                { label: "Resp. Rate", value: selectedPatient.vitals.rr, unit: "/min", icon: Wind, color: "#8b5cf6", alert: selectedPatient.vitals.rr > 20 },
              ].map(v => (
                <div key={v.label} className={`text-center p-3 rounded-xl ${v.alert ? "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]" : "bg-[rgba(148,163,184,0.05)]"}`}>
                  <v.icon className="w-4 h-4 mx-auto mb-1" style={{ color: v.alert ? "#ef4444" : v.color }} />
                  <div className={`text-lg font-bold ${v.alert ? "text-[#ef4444]" : "text-white"}`} style={{ fontFamily: "monospace" }}>{v.value}</div>
                  <div className="text-[10px] text-[#475569]">{v.unit}</div>
                  <div className="text-[10px] text-[#94a3b8]">{v.label}</div>
                  {v.alert && <div className="text-[10px] text-[#ef4444] mt-0.5 font-semibold">ALERT</div>}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tabs */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-1 mb-4">
              {(["vitals", "timeline", "notes"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9] border border-[rgba(14,165,233,0.3)]" : "text-[#94a3b8] hover:text-white"}`}>{tab}</button>
              ))}
            </div>

            {activeTab === "vitals" && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-[#475569] mr-1">Range:</span>
                  <div className="flex items-center gap-1 p-1 bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.12)] rounded-lg">
                    {(["1H", "6H", "12H", "24H", "7D"] as TimeRange[]).map(range => (
                      <button key={range} onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === range ? "bg-[#0ea5e9] text-white shadow-lg shadow-[rgba(14,165,233,0.2)]" : "text-[#94a3b8] hover:text-white hover:bg-[rgba(148,163,184,0.08)]"}`}>
                        {range}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#475569] ml-1">· {TIME_RANGE_LABEL[timeRange]} intervals · {points} points</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vitalCharts.map(chart => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[#94a3b8]">{chart.label}</span>
                        <span className="text-xs font-semibold" style={{ fontFamily: "monospace", color: chart.color }}>{chart.data[chart.data.length - 1]?.v.toFixed(1)} {chart.unit}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={95}>
                        <AreaChart data={chart.data}>
                          <defs>
                            <linearGradient id={`g${chart.label}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 2" stroke="rgba(148,163,184,0.06)" />
                          <XAxis dataKey="t" stroke="#334155" style={{ fontSize: "9px" }} tick={false} />
                          <YAxis stroke="#334155" style={{ fontSize: "9px" }} width={26} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          {/* FIX 3: Only render refHigh when it is non-null.
                              SpO₂ no longer draws a useless line at 100%. */}
                          {chart.refHigh !== null && (
                            <ReferenceLine y={chart.refHigh} stroke={chart.color} strokeDasharray="3 3" strokeOpacity={0.4} />
                          )}
                          <ReferenceLine y={chart.refLow} stroke={chart.color} strokeDasharray="3 3" strokeOpacity={0.4} />
                          <Area type="monotone" dataKey="v" stroke={chart.color} fill={`url(#g${chart.label})`} strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-3">
                {/* FIX 1: Timeline now reads from PATIENT_TIMELINES keyed by
                    selectedPatient.id. Falls back to P001 entries if a patient
                    somehow has no entry (defensive). Previously all patients
                    showed John Anderson's hardcoded events. */}
                {(PATIENT_TIMELINES[selectedPatient.id] ?? PATIENT_TIMELINES["P001"]).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-[#94a3b8] w-12 shrink-0 pt-0.5" style={{ fontFamily: "monospace" }}>{entry.time}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${entry.type === "alarm" ? "bg-[#ef4444]" : entry.type === "medication" ? "bg-[#f59e0b]" : entry.type === "intervention" ? "bg-[#0ea5e9]" : "bg-[#475569]"}`} />
                    <div>
                      <p className="text-white text-sm">{entry.event}</p>
                      <p className="text-[#475569] text-xs">{entry.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                <textarea placeholder="Add clinical note..."
                  className="w-full bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg p-3 text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all resize-none h-20" />
                <button onClick={() => toast.success("Note saved")}
                  className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Save Note</button>
                <div className="space-y-2">
                  {[{ author: "Dr. Sarah Reeves", time: "08:30", note: "Patient showing signs of hemodynamic instability. Increased vasopressor support. Echocardiogram ordered." }, { author: "Nurse Kim Li", time: "06:15", note: "Patient restless overnight. Sedation adjusted per protocol. Family notified of current status." }].map((n, i) => (
                    <div key={i} className="p-3 bg-[rgba(148,163,184,0.05)] rounded-lg border border-[rgba(148,163,184,0.1)]">
                      <div className="flex justify-between mb-1"><span className="text-[#0ea5e9] text-xs font-medium">{n.author}</span><span className="text-[#475569] text-xs">{n.time}</span></div>
                      <p className="text-[#94a3b8] text-sm">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Bed Grid */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-[#0ea5e9]" /> ICU Bed Status</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {BED_GRID.map(bed => (
                <button key={bed.num} onClick={() => bed.patient && setSelectedPatient(bed.patient)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all border ${!bed.patient ? "bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)]" : bed.patient.severity === "critical" ? "bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.4)] cursor-pointer hover:bg-[rgba(239,68,68,0.2)]" : bed.patient.severity === "serious" ? "bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.4)] cursor-pointer hover:bg-[rgba(245,158,11,0.2)]" : "bg-[rgba(14,165,233,0.08)] border-[rgba(14,165,233,0.3)] cursor-pointer hover:bg-[rgba(14,165,233,0.15)]"} ${selectedPatient.bed === bed.num ? "ring-2 ring-[#0ea5e9]" : ""}`}>
                  <span className="text-[10px] text-[#94a3b8]" style={{ fontFamily: "monospace" }}>{bed.num.split("-")[1]}</span>
                  <span className={`text-[8px] mt-0.5 ${!bed.patient ? "text-[#10b981]" : bed.patient.severity === "critical" ? "text-[#ef4444]" : bed.patient.severity === "serious" ? "text-[#f59e0b]" : "text-[#0ea5e9]"}`}>
                    {!bed.patient ? "Free" : bed.patient.severity === "critical" ? "●" : bed.patient.severity === "serious" ? "◉" : "○"}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs">
              {[["Critical", "#ef4444"], ["Serious", "#f59e0b"], ["Stable", "#0ea5e9"], ["Available", "#10b981"]].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: `${c}30`, border: `1px solid ${c}60` }} /><span className="text-[#94a3b8]">{l}</span></div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Alarm Panel Drawer ── */}
      <AnimatePresence>
        {showAlarmPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAlarmPanel(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm h-full max-h-[90vh] backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[rgba(148,163,184,0.15)] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Alarm Management</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#94a3b8]">{unacked.length} unacknowledged</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[rgba(239,68,68,0.15)] text-[#ef4444] rounded">{criticalAlarms.length} critical</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[rgba(245,158,11,0.15)] text-[#f59e0b] rounded">{warningAlarms.length} warning</span>
                  </div>
                </div>
                <button onClick={() => setShowAlarmPanel(false)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>

              <div className="px-4 pt-3 pb-0">
                <button onClick={() => setShowCriticalOnly(v => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${showCriticalOnly ? "bg-[rgba(239,68,68,0.15)] border-[rgba(239,68,68,0.4)] text-[#ef4444]" : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8]"}`}>
                  <Filter className="w-3 h-3" /> {showCriticalOnly ? "Show All" : "Critical Only"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayedAlarms.map(alarm => (
                  <div key={alarm.id} className={`p-3 rounded-xl border ${alarm.ack ? "opacity-50 border-[rgba(148,163,184,0.1)] bg-[rgba(148,163,184,0.04)]" : alarm.priority === "critical" ? "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.3)]" : "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.3)]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${alarm.priority === "critical" ? "bg-[rgba(239,68,68,0.2)] text-[#ef4444]" : "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]"}`}>{alarm.priority.toUpperCase()}</span>
                          <span className="text-white text-sm font-semibold">{alarm.type}</span>
                        </div>
                        <p className="text-[#94a3b8] text-xs">{alarm.patient} · {alarm.bed}</p>
                        <p className="text-xs mt-1" style={{ fontFamily: "monospace" }}>
                          <span className="text-white">Value: </span>
                          <span className={alarm.priority === "critical" ? "text-[#ef4444]" : "text-[#f59e0b]"}>{alarm.value}</span>
                          <span className="text-[#475569]"> (threshold {alarm.threshold})</span>
                        </p>
                        <p className="text-[#475569] text-xs mt-0.5">{alarm.time}</p>
                      </div>
                      {/* FIX 2: Per-alarm action buttons. Critical unacknowledged alarms
                          now expose both ACK and an individual Escalate action.
                          Warning alarms retain ACK only (escalation not warranted). */}
                      {!alarm.ack && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => ackAlarm(alarm.id)}
                            className="px-3 py-1.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-xs font-medium hover:bg-[rgba(16,185,129,0.25)] transition-colors">
                            ACK
                          </button>
                          {alarm.priority === "critical" && (
                            <button
                              onClick={() => toast.success(`Nurse paged for ${alarm.patient} — ${alarm.type}`, { duration: 5000 })}
                              className="px-3 py-1.5 bg-[rgba(14,165,233,0.12)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-xs font-medium hover:bg-[rgba(14,165,233,0.22)] transition-colors">
                              Page
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[rgba(148,163,184,0.15)]">
                <button onClick={() => { setAlarms(prev => prev.map(a => ({ ...a, ack: true }))); toast.success("All alarms acknowledged"); }}
                  className="w-full py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">Acknowledge All</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
