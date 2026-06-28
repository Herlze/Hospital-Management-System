import { useState, useEffect, useRef } from "react";
import { GlassCard } from "../components/GlassCard";
import {
  Ambulance, AlertTriangle, Users, Phone, Radio,
  ChevronRight, Plus, Search, Download, X, Bed, Package,
  CheckCircle, RefreshCw, FileText, FileSpreadsheet, PhoneOff,
  Mic, MicOff, Volume2, ArrowRightLeft, Building2, Save,
  WifiOff, Wifi, CloudOff, RotateCcw, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type TriageLevel = "black" | "red" | "yellow" | "green";

interface TriagePatient {
  id: string;
  name: string;
  age: string;
  gender: string;
  triage: TriageLevel;
  chief: string;
  gcs: number;
  hr: number;
  rr: number;
  arrivalTime: string;
  assignedBay: string;
  assignedDoctor: string;
  status: "waiting" | "being_treated" | "stabilized" | "deceased" | "transferred";
  isJohnDoe: boolean;
}

interface AmbulanceUnit {
  id: string;
  team: string;
  status: "arrived" | "en_route" | "available";
  patient: string;
  eta: string;
  location: string;
  phone: string;
}

// ====================== OFFLINE SYNC TYPES ======================
type SyncStatus = "pending" | "syncing" | "synced" | "failed";

interface SyncRecord {
  id: string;
  patientId: string;
  patientName: string;
  changeType: string;
  status: SyncStatus;
  timestamp: string;
}

const INITIAL_PATIENTS: TriagePatient[] = [
  { id: "MCI-001", name: "John Doe #1", age: "~35", gender: "M", triage: "red", chief: "Severe head trauma, unresponsive", gcs: 6, hr: 130, rr: 28, arrivalTime: "14:32", assignedBay: "Trauma Bay 1", assignedDoctor: "Dr. Sarah Reeves", status: "being_treated", isJohnDoe: true },
  { id: "MCI-002", name: "Ahmed Al-Rashid", age: "42", gender: "M", triage: "red", chief: "Penetrating chest wound, tension pneumothorax", gcs: 10, hr: 145, rr: 32, arrivalTime: "14:35", assignedBay: "Trauma Bay 2", assignedDoctor: "Dr. James Wright", status: "being_treated", isJohnDoe: false },
  { id: "MCI-003", name: "Jane Doe #1", age: "~28", gender: "F", triage: "yellow", chief: "Open femur fracture, stable vitals", gcs: 15, hr: 95, rr: 18, arrivalTime: "14:37", assignedBay: "Bay 4", assignedDoctor: "Dr. Mark Torres", status: "waiting", isJohnDoe: true },
  { id: "MCI-004", name: "Peter Walsh", age: "55", gender: "M", triage: "green", chief: "Lacerations, minor burns", gcs: 15, hr: 82, rr: 16, arrivalTime: "14:38", assignedBay: "Treatment Area C", assignedDoctor: "Dr. Alice Chen", status: "being_treated", isJohnDoe: false },
  { id: "MCI-005", name: "Maria Santos", age: "61", gender: "F", triage: "black", chief: "Cardiac arrest — no signs of life", gcs: 3, hr: 0, rr: 0, arrivalTime: "14:30", assignedBay: "—", assignedDoctor: "—", status: "deceased", isJohnDoe: false },
  { id: "MCI-006", name: "John Doe #2", age: "~50", gender: "M", triage: "red", chief: "Abdominal evisceration, BP 70/40", gcs: 8, hr: 160, rr: 26, arrivalTime: "14:40", assignedBay: "Trauma Bay 3", assignedDoctor: "Dr. Sarah Reeves", status: "waiting", isJohnDoe: true },
  { id: "MCI-007", name: "Fatima Malik", age: "34", gender: "F", triage: "yellow", chief: "Spinal precautions, back pain", gcs: 15, hr: 88, rr: 17, arrivalTime: "14:42", assignedBay: "Bay 6", assignedDoctor: "Dr. Mark Torres", status: "waiting", isJohnDoe: false },
  { id: "MCI-008", name: "Tom Bradley", age: "25", gender: "M", triage: "green", chief: "Anxiety, minor contusions", gcs: 15, hr: 76, rr: 15, arrivalTime: "14:44", assignedBay: "Waiting Area", assignedDoctor: "Nurse Kim Li", status: "stabilized", isJohnDoe: false },
];

const AMBULANCES: AmbulanceUnit[] = [
  { id: "AMB-01", team: "Paramedic Team Alpha", status: "arrived", patient: "MCI-001 type — Trauma", eta: "Arrived", location: "Trauma Bay 1", phone: "+62 811-0001-001" },
  { id: "AMB-03", team: "Paramedic Team Bravo", status: "en_route", patient: "2 patients — Burns + Fracture", eta: "6 min", location: "Highway 45 S", phone: "+62 811-0001-003" },
  { id: "AMB-07", team: "Paramedic Team Charlie", status: "en_route", patient: "Cardiac — CPR ongoing", eta: "11 min", location: "Downtown Grid", phone: "+62 811-0001-007" },
  { id: "AMB-11", team: "Paramedic Team Delta", status: "available", patient: "—", eta: "—", location: "Station 2", phone: "+62 811-0001-011" },
  { id: "AMB-14", team: "Paramedic Team Echo", status: "available", patient: "—", eta: "—", location: "Station 4", phone: "+62 811-0001-014" },
];

const RESOURCES = [
  { item: "O-negative Blood Units", available: 12, total: 30, critical: true },
  { item: "Trauma Kits", available: 8, total: 20, critical: false },
  { item: "Ventilators Available", available: 4, total: 12, critical: false },
  { item: "Trauma Bays", available: 1, total: 4, critical: true },
  { item: "Surgeons On Call", available: 3, total: 5, critical: false },
  { item: "Epinephrine (1mg doses)", available: 45, total: 100, critical: false },
];

const HOSPITAL_CAPACITY = [
  { dept: "Emergency Bays", used: 3, total: 4 },
  { dept: "Trauma Bays", used: 3, total: 4 },
  { dept: "ICU Beds", used: 42, total: 50 },
  { dept: "Operating Theatres", used: 2, total: 4 },
  { dept: "General Ward", used: 134, total: 200 },
];

const TRANSFER_DESTINATIONS = [
  "ICU — Internal", "Operating Theatre — Internal", "General Ward — Internal",
  "RS Rujukan Pusat (Level 1 Trauma Center)", "RS Mitra Terdekat", "Mortuary",
];

const TRIAGE_CFG: Record<TriageLevel, { label: string; dotColor: string; bg: string; border: string; cardBg: string }> = {
  black: { label: "Expectant / Deceased", dotColor: "#555", bg: "rgba(80,80,80,0.08)", border: "rgba(80,80,80,0.3)", cardBg: "rgba(80,80,80,0.1)" },
  red: { label: "Immediate", dotColor: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.35)", cardBg: "rgba(239,68,68,0.1)" },
  yellow: { label: "Delayed", dotColor: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", cardBg: "rgba(245,158,11,0.1)" },
  green: { label: "Minor", dotColor: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", cardBg: "rgba(16,185,129,0.1)" },
};

// ====================== HELPERS ======================
const nowTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const makeSyncRecord = (
  patientId: string,
  patientName: string,
  changeType: string
): SyncRecord => ({
  id: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  patientId,
  patientName,
  changeType,
  status: "pending",
  timestamp: nowTime(),
});

export default function MassCasualty() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [view, setView] = useState<"triage" | "list" | "resources">("triage");
  const [search, setSearch] = useState("");
  const [showJohnDoeModal, setShowJohnDoeModal] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState<TriagePatient | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [johnDoeForm, setJohnDoeForm] = useState({ approxAge: "", gender: "M", triage: "red" as TriageLevel, chief: "", location: "" });
  const [exportMenu, setExportMenu] = useState(false);

  // Call state
  const [callTarget, setCallTarget] = useState<AmbulanceUnit | null>(null);
  const [callStatus, setCallStatus] = useState<"dialing" | "connected" | "ended">("dialing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const callTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Record edit state
  const [showEditRecord, setShowEditRecord] = useState(false);
  const [editForm, setEditForm] = useState<TriagePatient | null>(null);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ destination: TRANSFER_DESTINATIONS[0], note: "", escort: "Yes" });

  // ====================== OFFLINE-FIRST STATE ======================
  const [syncQueue, setSyncQueue] = useState<SyncRecord[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>(nowTime());
  const [showSyncNotif, setShowSyncNotif] = useState(false);
  const syncNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push a record into the sync queue when offline
  const queueSync = (patientId: string, patientName: string, changeType: string) => {
    if (!offlineMode) return;
    setSyncQueue(prev => [makeSyncRecord(patientId, patientName, changeType), ...prev]);
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (!offlineMode && syncQueue.some(r => r.status !== "synced")) {
      runFullSync();
    }
  }, [offlineMode]);

  const runFullSync = () => {
    const toSync = syncQueue.filter(r => r.status === "pending" || r.status === "failed");
    if (!toSync.length) return;

    // Mark all as syncing
    setSyncQueue(prev => prev.map(r =>
      r.status === "pending" || r.status === "failed"
        ? { ...r, status: "syncing" }
        : r
    ));

    // Stagger resolution
    toSync.forEach((rec, i) => {
      setTimeout(() => {
        setSyncQueue(prev => prev.map(r =>
          r.id === rec.id ? { ...r, status: "synced" } : r
        ));
        if (i === toSync.length - 1) {
          setLastSyncTime(nowTime());
          setShowSyncNotif(true);
          if (syncNotifTimer.current) clearTimeout(syncNotifTimer.current);
          syncNotifTimer.current = setTimeout(() => setShowSyncNotif(false), 5000);
        }
      }, i * 400 + 600);
    });
  };

  const retrySingle = (syncId: string) => {
    setSyncQueue(prev => prev.map(r =>
      r.id === syncId ? { ...r, status: "syncing" } : r
    ));
    setTimeout(() => {
      const ok = Math.random() > 0.2;
      setSyncQueue(prev => prev.map(r =>
        r.id === syncId ? { ...r, status: ok ? "synced" : "failed" } : r
      ));
      if (ok) {
        const allSynced = syncQueue.every(r => r.id === syncId || r.status === "synced");
        if (allSynced) {
          setLastSyncTime(nowTime());
          setShowSyncNotif(true);
          if (syncNotifTimer.current) clearTimeout(syncNotifTimer.current);
          syncNotifTimer.current = setTimeout(() => setShowSyncNotif(false), 5000);
        }
        toast.success("Record synced successfully");
      } else {
        toast.error("Sync failed — tap retry to try again");
      }
    }, 1200 + Math.random() * 600);
  };

  const retryAllFailed = () => {
    const toRetry = syncQueue.filter(r => r.status === "failed" || r.status === "pending");
    if (!toRetry.length) return;
    setSyncQueue(prev => prev.map(r =>
      r.status === "failed" || r.status === "pending" ? { ...r, status: "syncing" } : r
    ));
    toRetry.forEach((rec, i) => {
      setTimeout(() => {
        setSyncQueue(prev => prev.map(r =>
          r.id === rec.id ? { ...r, status: "synced" } : r
        ));
        if (i === toRetry.length - 1) {
          setLastSyncTime(nowTime());
          setShowSyncNotif(true);
          if (syncNotifTimer.current) clearTimeout(syncNotifTimer.current);
          syncNotifTimer.current = setTimeout(() => setShowSyncNotif(false), 5000);
        }
      }, i * 380 + 400);
    });
  };

  const pendingCount = syncQueue.filter(r => r.status === "pending" || r.status === "failed" || r.status === "syncing").length;

  const counts = {
    red: patients.filter(p => p.triage === "red").length,
    yellow: patients.filter(p => p.triage === "yellow").length,
    green: patients.filter(p => p.triage === "green").length,
    black: patients.filter(p => p.triage === "black").length,
  };

  // ====================== PATIENT ACTIONS ======================
  const registerJohnDoe = () => {
    const num = patients.filter(p => p.isJohnDoe).length + 1;
    const id = `MCI-${String(patients.length + 1).padStart(3, "0")}`;
    const newPat: TriagePatient = {
      id, name: `John Doe #${num}`, age: johnDoeForm.approxAge || "Unknown", gender: johnDoeForm.gender,
      triage: johnDoeForm.triage, chief: johnDoeForm.chief || "Unknown complaint",
      gcs: 15, hr: 90, rr: 18,
      arrivalTime: nowTime(),
      assignedBay: "Intake", assignedDoctor: "Triage Nurse", status: "waiting", isJohnDoe: true,
    };
    setPatients(prev => [newPat, ...prev]);
    queueSync(id, newPat.name, "New registration");
    toast.success(`${newPat.name} registered (${id})`);
    setShowJohnDoeModal(false);
    setJohnDoeForm({ approxAge: "", gender: "M", triage: "red", chief: "", location: "" });
  };

  const updateTriage = (id: string, level: TriageLevel) => {
    const patient = patients.find(p => p.id === id);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, triage: level } : p));
    if (patient) queueSync(id, patient.name, `Triage update — ${patient.triage} → ${level}`);
    toast.success("Triage level updated");
  };

  // ====================== CALL ======================
  const startCall = (amb: AmbulanceUnit) => {
    setCallTarget(amb);
    setCallStatus("dialing");
    setCallSeconds(0);
    setMuted(false);
    setSpeaker(true);
    setTimeout(() => setCallStatus("connected"), 1800);
  };

  useEffect(() => {
    if (callStatus === "connected") {
      callTimer.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    } else if (callTimer.current) {
      clearInterval(callTimer.current);
    }
    return () => { if (callTimer.current) clearInterval(callTimer.current); };
  }, [callStatus]);

  const endCall = () => {
    setCallStatus("ended");
    if (callTimer.current) clearInterval(callTimer.current);
    toast.success(`Call with ${callTarget?.id} ended (${formatCallTime(callSeconds)})`);
    setTimeout(() => setCallTarget(null), 700);
  };

  const formatCallTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ====================== EDIT RECORD ======================
  const openEditRecord = (p: TriagePatient) => {
    setEditForm({ ...p });
    setShowEditRecord(true);
  };

  const saveEditRecord = () => {
    if (!editForm) return;
    setPatients(prev => prev.map(p => p.id === editForm.id ? editForm : p));
    if (showPatientDetail?.id === editForm.id) setShowPatientDetail(editForm);
    queueSync(editForm.id, editForm.name, "Record update — vitals & info");
    toast.success(`Medical record for ${editForm.name} updated`);
    setShowEditRecord(false);
  };

  // ====================== TRANSFER ======================
  const openTransfer = () => {
    setTransferForm({ destination: TRANSFER_DESTINATIONS[0], note: "", escort: "Yes" });
    setShowTransfer(true);
  };

  const confirmTransfer = () => {
    if (!showPatientDetail) return;
    const updated: TriagePatient = {
      ...showPatientDetail,
      status: "transferred",
      assignedBay: transferForm.destination,
    };
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    queueSync(updated.id, updated.name, `Transfer → ${transferForm.destination}`);
    toast.success(`${updated.name} transferred to ${transferForm.destination}${transferForm.escort === "Yes" ? " with medical escort" : ""}`);
    setShowTransfer(false);
    setShowPatientDetail(null);
  };

  // ====================== EXPORTS ======================
  const exportMCIReportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Mass Casualty Incident Report", 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(
        `Total Casualties: ${patients.length}  |  Red: ${counts.red}  Yellow: ${counts.yellow}  Green: ${counts.green}  Black: ${counts.black}`,
        14, 27
      );
      autoTable(doc, {
        startY: 33,
        head: [["ID", "Name", "Age/Gender", "Triage", "Chief Complaint", "GCS", "HR", "RR", "Arrival", "Bay", "Doctor", "Status"]],
        body: patients.map((p) => [
          p.id, p.name, `${p.age} ${p.gender}`, p.triage.toUpperCase(), p.chief, `${p.gcs}`,
          p.hr ? `${p.hr}` : "-", p.rr ? `${p.rr}` : "-", p.arrivalTime, p.assignedBay, p.assignedDoctor,
          p.status.replace("_", " "),
        ]),
        styles: { fontSize: 6, cellPadding: 1.3 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        alternateRowStyles: { fillColor: [250, 240, 240] },
      });
      // @ts-ignore
      let y = doc.lastAutoTable.finalY + 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setTextColor(0);
      doc.text("Ambulance Fleet — Live Tracking", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Unit", "Team", "Status", "Patient Info", "Location", "ETA"]],
        body: AMBULANCES.map((a) => [a.id, a.team, a.status.replace("_", " "), a.patient, a.location, a.eta]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Resource Availability", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Resource", "Available", "Total", "Critical"]],
        body: RESOURCES.map((r) => [r.item, `${r.available}`, `${r.total}`, r.critical ? "YES" : "No"]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Hospital Capacity During MCI", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Department", "Used", "Total"]],
        body: HOSPITAL_CAPACITY.map((d) => [d.dept, `${d.used}`, `${d.total}`]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      });
      doc.save(`MCI-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF report.");
    }
  };

  const exportMCIReportToExcel = () => {
    try {
      const patientsData = patients.map((p) => ({
        ID: p.id, Name: p.name, Age: p.age, Gender: p.gender, Triage: p.triage,
        "Chief Complaint": p.chief, GCS: p.gcs, "Heart Rate": p.hr, "Resp Rate": p.rr,
        "Arrival Time": p.arrivalTime, "Assigned Bay": p.assignedBay, Doctor: p.assignedDoctor,
        Status: p.status, "Unidentified (John/Jane Doe)": p.isJohnDoe ? "Yes" : "No",
      }));
      const ambulancesData = AMBULANCES.map((a) => ({
        Unit: a.id, Team: a.team, Status: a.status, "Patient Info": a.patient, Location: a.location, ETA: a.eta,
      }));
      const resourcesData = RESOURCES.map((r) => ({
        Resource: r.item, Available: r.available, Total: r.total, Critical: r.critical ? "Yes" : "No",
      }));
      const capacityData = HOSPITAL_CAPACITY.map((d) => ({
        Department: d.dept, Used: d.used, Total: d.total, "Occupancy (%)": Math.round((d.used / d.total) * 100),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientsData), "Patients");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ambulancesData), "Ambulance Fleet");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resourcesData), "Resources");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(capacityData), "Hospital Capacity");
      XLSX.writeFile(wb, `MCI-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel report.");
    }
  };

  const exportPatientToPDF = (patient: TriagePatient) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`MCI Patient Report: ${patient.name}`, 14, 16);
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      autoTable(doc, {
        startY: 28, theme: "plain",
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
        body: [
          ["Patient ID", patient.id],
          ["Age / Gender", `${patient.age} / ${patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Unknown"}`],
          ["Triage Level", patient.triage.toUpperCase()],
          ["GCS Score", `${patient.gcs}`],
          ["Heart Rate", patient.hr ? `${patient.hr} bpm` : "-"],
          ["Resp. Rate", patient.rr ? `${patient.rr}/min` : "-"],
          ["Arrival Time", patient.arrivalTime],
          ["Assigned Bay", patient.assignedBay],
          ["Doctor", patient.assignedDoctor],
          ["Status", patient.status.replace("_", " ")],
          ["Unidentified Patient", patient.isJohnDoe ? "Yes" : "No"],
          ["Chief Complaint", patient.chief],
        ],
      });
      doc.save(`MCI-${patient.id}-${patient.name.replace(/\s+/g, "-")}.pdf`);
      toast.success(`PDF report for ${patient.name} exported!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export patient PDF report.");
    }
  };

  const exportPatientToExcel = (patient: TriagePatient) => {
    try {
      const ws = XLSX.utils.json_to_sheet([{
        "Patient ID": patient.id, Name: patient.name, Age: patient.age, Gender: patient.gender,
        Triage: patient.triage, "Chief Complaint": patient.chief, GCS: patient.gcs,
        "Heart Rate": patient.hr, "Resp Rate": patient.rr, "Arrival Time": patient.arrivalTime,
        "Assigned Bay": patient.assignedBay, Doctor: patient.assignedDoctor, Status: patient.status,
        "Unidentified (John/Jane Doe)": patient.isJohnDoe ? "Yes" : "No",
      }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Patient Info");
      XLSX.writeFile(wb, `MCI-${patient.id}-${patient.name.replace(/\s+/g, "-")}.xlsx`);
      toast.success(`Excel report for ${patient.name} exported!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export patient Excel report.");
    }
  };

  // ====================== SYNC STATUS HELPERS ======================
  const SyncStatusBadge = ({ status }: { status: SyncStatus }) => {
    const cfg = {
      pending: { label: "Pending", cls: "bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]" },
      syncing: { label: "Syncing…", cls: "bg-[rgba(14,165,233,0.15)] text-[#0ea5e9] border border-[rgba(14,165,233,0.3)]" },
      synced:  { label: "Synced",  cls: "bg-[rgba(16,185,129,0.15)] text-[#10b981] border border-[rgba(16,185,129,0.3)]" },
      failed:  { label: "Failed",  cls: "bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)]" },
    }[status];
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${cfg.cls}`}>
        {status === "syncing" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse mr-1" />}
        {cfg.label}
      </span>
    );
  };

  // ====================== RENDER ======================
  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span className="text-[#ef4444]">MCI / Emergency</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Mass Casualty Incident — Emergency Department</h1>
          <p className="text-[#94a3b8] text-sm">Module 6 — START triage, ambulance fleet & resource management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.4)] rounded-lg">
            <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
            <span className="text-[#ef4444] text-sm font-semibold">MCI ACTIVE</span>
          </div>
          {/* Offline Mode Toggle */}
          <button
            onClick={() => {
              setOfflineMode(!offlineMode);
              toast.info(`${!offlineMode ? "Offline" : "Online"} mode activated`);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
              offlineMode
                ? "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-[#f59e0b]"
                : "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.2)] text-[#94a3b8] hover:text-white"
            }`}
          >
            {offlineMode ? <WifiOff className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
            {offlineMode ? "Offline" : "Online"}
            {offlineMode && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[rgba(245,158,11,0.25)] text-[#f59e0b] text-[10px] rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowJohnDoeModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.2)] transition-all">
            <Plus className="w-4 h-4" /> John Doe
          </button>
          <div className="relative">
            <button onClick={() => setExportMenu(!exportMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <AnimatePresence>
              {exportMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-lg shadow-2xl z-40 py-1">
                  <button onClick={() => { setExportMenu(false); exportMCIReportToPDF(); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                  <button onClick={() => { setExportMenu(false); exportMCIReportToExcel(); }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Casualties", value: patients.length, color: "#e8eef7" },
          { label: "Immediate (Red)", value: counts.red, color: "#ef4444" },
          { label: "Delayed (Yellow)", value: counts.yellow, color: "#f59e0b" },
          { label: "Minor (Green)", value: counts.green, color: "#10b981" },
          { label: "Expectant (Black)", value: counts.black, color: "#666" },
        ].map(k => (
          <GlassCard key={k.label} className="p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: k.color, fontFamily: "monospace" }}>{k.value}</div>
            <div className="text-xs text-[#94a3b8] mt-1 leading-tight">{k.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ====================== OFFLINE-FIRST BANNER & SYNC QUEUE ====================== */}
      <AnimatePresence>
        {offlineMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Offline Status Card */}
            <div className="rounded-xl border border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.06)] p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[rgba(245,158,11,0.15)]">
                    <CloudOff className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wide">Offline-First Mode</h3>
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                    </div>
                    <p className="text-[#92400e] text-xs mt-0.5">Connection lost — all changes cached locally</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                  <div className="text-right">
                    <div className="text-[#f59e0b] font-bold text-lg" style={{ fontFamily: "monospace" }}>{pendingCount}</div>
                    <div>Pending sync</div>
                  </div>
                  <div className="w-px h-8 bg-[rgba(148,163,184,0.2)]" />
                  <div className="text-right">
                    <div className="text-white font-medium" style={{ fontFamily: "monospace" }}>{lastSyncTime}</div>
                    <div>Last sync</div>
                  </div>
                </div>
              </div>

              {/* Feature availability grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Patient Registration", icon: Plus, available: true },
                  { label: "START Triage", icon: AlertTriangle, available: true },
                  { label: "Medical Records", icon: FileText, available: true, note: "Cached" },
                  { label: "Ambulance Queue", icon: Ambulance, available: true, note: "Cached" },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white leading-tight">{f.label}</div>
                      <div className="text-[10px] text-[#10b981]">{f.note ?? "Available"}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)]">
                <RefreshCw className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <div>
                  <span className="text-xs font-medium text-[#f59e0b]">Auto Sync</span>
                  <span className="text-[10px] text-[#94a3b8] ml-2">Waiting for network — will sync automatically when connection is restored</span>
                </div>
              </div>
            </div>

            {/* Sync Queue */}
            {syncQueue.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#94a3b8]" />
                    <h3 className="font-semibold text-white text-sm">Sync Queue</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(148,163,184,0.1)] text-[#94a3b8] border border-[rgba(148,163,184,0.2)]">
                      {syncQueue.length} records
                    </span>
                  </div>
                  {syncQueue.some(r => r.status === "failed" || r.status === "pending") && (
                    <button
                      onClick={retryAllFailed}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] hover:bg-[rgba(14,165,233,0.2)] transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry all
                    </button>
                  )}
                </div>

                {/* Queue tabs summary */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[rgba(148,163,184,0.1)]">
                  {(["pending", "synced", "failed", "syncing"] as SyncStatus[]).map(s => {
                    const n = syncQueue.filter(r => r.status === s).length;
                    if (!n) return null;
                    const colors = {
                      pending: "text-[#f59e0b]",
                      syncing: "text-[#0ea5e9]",
                      synced: "text-[#10b981]",
                      failed: "text-[#ef4444]",
                    };
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={`text-lg font-bold ${colors[s]}`} style={{ fontFamily: "monospace" }}>{n}</span>
                        <span className="text-xs text-[#94a3b8] capitalize">{s}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {syncQueue.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[rgba(148,163,184,0.03)] group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          rec.status === "synced" ? "bg-[#10b981]" :
                          rec.status === "failed" ? "bg-[#ef4444]" :
                          rec.status === "syncing" ? "bg-[#0ea5e9] animate-pulse" :
                          "bg-[#f59e0b]"
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{rec.patientName}</span>
                            <span className="text-[10px] text-[#475569]" style={{ fontFamily: "monospace" }}>{rec.patientId}</span>
                          </div>
                          <div className="text-[10px] text-[#94a3b8] truncate">{rec.changeType}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-[#475569]" style={{ fontFamily: "monospace" }}>{rec.timestamp}</span>
                        <SyncStatusBadge status={rec.status} />
                        {(rec.status === "failed" || rec.status === "pending") && (
                          <button
                            onClick={() => retrySingle(rec.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(14,165,233,0.1)] text-[#0ea5e9] transition-all"
                            title="Retry"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== AUTO SYNC NOTIFICATION ====================== */}
      <AnimatePresence>
        {showSyncNotif && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.08)]"
          >
            <div className="p-2 rounded-full bg-[rgba(16,185,129,0.2)] shrink-0">
              <CheckCircle className="w-5 h-5 text-[#10b981]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#10b981]">Synchronization completed</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">All patient records uploaded successfully. Last sync: {lastSyncTime}</p>
            </div>
            <button
              onClick={() => setShowSyncNotif(false)}
              className="p-1.5 rounded-lg hover:bg-[rgba(148,163,184,0.1)] text-[#94a3b8] shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Nav */}
      <div className="flex items-center gap-2">
        {(["triage", "list", "resources"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? "bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)]" : "text-[#94a3b8] hover:text-white"}`}>
            {v === "triage" ? "START Triage Board" : v === "list" ? "Patient List" : "Resources"}
          </button>
        ))}
      </div>

      {/* ====================== TRIAGE BOARD ====================== */}
      {view === "triage" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {(["red", "yellow", "green", "black"] as TriageLevel[]).map(level => {
              const cfg = TRIAGE_CFG[level];
              const lvlPats = patients.filter(p => p.triage === level);
              return (
                <div key={level} className="rounded-xl border p-4 space-y-3" style={{ background: cfg.bg, borderColor: cfg.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: cfg.dotColor }} />
                      <span className="font-semibold text-white text-sm uppercase">{level}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: cfg.dotColor, fontFamily: "monospace" }}>{lvlPats.length}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">{cfg.label}</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {lvlPats.map(p => (
                      <div key={p.id} onClick={() => setShowPatientDetail(p)}
                        className="p-2.5 rounded-lg cursor-pointer transition-all hover:brightness-110"
                        style={{ background: cfg.cardBg, border: `1px solid ${cfg.border}` }}>
                        <div className="flex items-start justify-between">
                          <p className="text-white text-xs font-semibold">{p.name}</p>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {p.isJohnDoe && <span className="text-[10px] bg-[rgba(245,158,11,0.25)] text-[#f59e0b] px-1.5 py-0.5 rounded font-medium">UNK</span>}
                            {offlineMode && syncQueue.some(s => s.patientId === p.id && s.status !== "synced") && (
                              <span className="text-[10px] bg-[rgba(245,158,11,0.2)] text-[#f59e0b] px-1 py-0.5 rounded" title="Pending sync">⏳</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[#94a3b8] text-xs mt-0.5 leading-tight">{p.chief.slice(0, 45)}{p.chief.length > 45 ? "…" : ""}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.status === "being_treated" ? "bg-[rgba(14,165,233,0.2)] text-[#0ea5e9]" : p.status === "stabilized" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : p.status === "deceased" ? "bg-[rgba(100,100,100,0.2)] text-[#888]" : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"}`}>
                            {p.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-[#475569] truncate">{p.assignedBay}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ambulance Table */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-[#ef4444]" /> Ambulance Fleet — Live Tracking
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(148,163,184,0.1)]">
                    {["Unit", "Team", "Status", "Patient Info", "Location", "ETA", "Actions"].map(h => (
                      <th key={h} className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AMBULANCES.map(amb => (
                    <tr key={amb.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.03)]">
                      <td className="py-3 px-2 font-bold text-white" style={{ fontFamily: "monospace" }}>{amb.id}</td>
                      <td className="py-3 px-2 text-[#94a3b8] text-xs">{amb.team}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${amb.status === "arrived" ? "bg-[#0ea5e9]" : amb.status === "en_route" ? "bg-[#f59e0b] animate-pulse" : "bg-[#10b981]"}`} />
                          <span className={`text-xs font-medium ${amb.status === "arrived" ? "text-[#0ea5e9]" : amb.status === "en_route" ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
                            {amb.status === "arrived" ? "Arrived" : amb.status === "en_route" ? "En Route" : "Available"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#94a3b8] text-xs max-w-[140px] truncate">{amb.patient}</td>
                      <td className="py-3 px-2 text-white text-xs">{amb.location}</td>
                      <td className="py-3 px-2 font-bold text-white" style={{ fontFamily: "monospace" }}>{amb.eta}</td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button onClick={() => startCall(amb)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(14,165,233,0.1)] hover:text-[#0ea5e9] transition-all" title="Contact"><Phone className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toast.success(`Bay assigned for ${amb.id}`)} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] transition-all" title="Assign Bay"><Bed className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ====================== PATIENT LIST ====================== */}
      {view === "list" && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-semibold text-white">All MCI Patients ({patients.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
                className="pl-9 pr-4 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#0ea5e9] transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(148,163,184,0.1)]">
                  {["ID", "Name", "Age", "Triage", "Chief Complaint", "GCS", "HR", "Bay", "Status", "Reassign"].map(h => (
                    <th key={h} className="pb-3 px-2 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)).map(p => (
                  <tr key={p.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.03)] cursor-pointer" onClick={() => setShowPatientDetail(p)}>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs" style={{ fontFamily: "monospace" }}>
                      <div className="flex items-center gap-1">
                        {p.id}
                        {offlineMode && syncQueue.some(s => s.patientId === p.id && s.status !== "synced") && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" title="Pending sync" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium text-sm">{p.name}</span>
                        {p.isJohnDoe && <span className="text-[10px] bg-[rgba(245,158,11,0.2)] text-[#f59e0b] px-1 py-0.5 rounded">UNK</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs">{p.age} {p.gender}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${p.triage === "red" ? "bg-[rgba(239,68,68,0.25)] text-[#ef4444]" : p.triage === "yellow" ? "bg-[rgba(245,158,11,0.25)] text-[#f59e0b]" : p.triage === "green" ? "bg-[rgba(16,185,129,0.25)] text-[#10b981]" : "bg-[rgba(100,100,100,0.25)] text-[#888]"}`}>{p.triage}</span>
                    </td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs max-w-[140px] truncate">{p.chief}</td>
                    <td className="py-2.5 px-2 text-white text-xs" style={{ fontFamily: "monospace" }}>{p.gcs}</td>
                    <td className="py-2.5 px-2 text-white text-xs" style={{ fontFamily: "monospace" }}>{p.hr || "—"}</td>
                    <td className="py-2.5 px-2 text-[#94a3b8] text-xs">{p.assignedBay}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${p.status === "being_treated" ? "bg-[rgba(14,165,233,0.2)] text-[#0ea5e9]" : p.status === "stabilized" ? "bg-[rgba(16,185,129,0.2)] text-[#10b981]" : p.status === "deceased" ? "bg-[rgba(100,100,100,0.2)] text-[#888]" : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"}`}>{p.status.replace("_", " ")}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {(["red", "yellow", "green", "black"] as TriageLevel[]).map(l => (
                          <button key={l} onClick={() => updateTriage(p.id, l)}
                            className={`w-4 h-4 rounded-full transition-all hover:scale-125 ${p.triage === l ? "ring-2 ring-white ring-offset-1 ring-offset-[#0a0e1a]" : "opacity-50 hover:opacity-100"}`}
                            style={{ background: l === "black" ? "#555" : l === "red" ? "#ef4444" : l === "yellow" ? "#f59e0b" : "#10b981" }}
                            title={`Set ${l}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ====================== RESOURCES ====================== */}
      {view === "resources" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-[#0ea5e9]" /> Resource Availability</h3>
            <div className="space-y-4">
              {RESOURCES.map(r => {
                const pct = (r.available / r.total) * 100;
                const color = pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#10b981";
                return (
                  <div key={r.item}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{r.item}</span>
                        {r.critical && <span className="text-[10px] px-1.5 py-0.5 bg-[rgba(239,68,68,0.2)] text-[#ef4444] rounded border border-[rgba(239,68,68,0.3)]">CRITICAL</span>}
                      </div>
                      <span className="text-sm text-white" style={{ fontFamily: "monospace" }}>{r.available}/{r.total}</span>
                    </div>
                    <div className="h-2 bg-[rgba(148,163,184,0.1)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                        className="h-full rounded-full" style={{ background: color }} />
                    </div>
                    <div className="text-right text-xs mt-0.5 font-medium" style={{ color }}>{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => toast.success("Emergency resupply request sent to logistics")}
              className="mt-4 w-full py-2.5 bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] text-[#0ea5e9] rounded-lg text-sm hover:bg-[rgba(14,165,233,0.2)] transition-colors">
              Request Emergency Resupply
            </button>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="font-semibold text-white mb-4">Hospital Capacity During MCI</h3>
            <div className="space-y-3">
              {HOSPITAL_CAPACITY.map(d => {
                const pct = (d.used / d.total) * 100;
                const color = pct >= 90 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#10b981";
                return (
                  <div key={d.dept}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-[#94a3b8]">{d.dept}</span>
                      <span className="text-white" style={{ fontFamily: "monospace" }}>{d.used}/{d.total}</span>
                    </div>
                    <div className="h-2 bg-[rgba(148,163,184,0.1)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-lg">
              <p className="text-[#ef4444] text-xs font-medium">Surge Capacity Mode Active</p>
              <p className="text-[#94a3b8] text-xs mt-1">28 additional beds activated in conference halls B & C</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ====================== JOHN DOE MODAL ====================== */}
      <AnimatePresence>
        {showJohnDoeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowJohnDoeModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(239,68,68,0.3)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[rgba(239,68,68,0.15)]"><AlertTriangle className="w-5 h-5 text-[#ef4444]" /></div>
                <div>
                  <h3 className="font-bold text-white">Rapid John Doe Registration</h3>
                  <p className="text-xs text-[#94a3b8]">Unidentified patient — {offlineMode ? "offline mode · will sync when connected" : "synced"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-[#94a3b8] mb-1">Approximate Age</label><input value={johnDoeForm.approxAge} onChange={e => setJohnDoeForm(p => ({ ...p, approxAge: e.target.value }))} placeholder="e.g. ~35" className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#ef4444] transition-all" /></div>
                <div><label className="block text-xs text-[#94a3b8] mb-1">Gender</label><select value={johnDoeForm.gender} onChange={e => setJohnDoeForm(p => ({ ...p, gender: e.target.value }))} className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#ef4444] appearance-none"><option value="M">Male</option><option value="F">Female</option><option value="Unknown">Unknown</option></select></div>
                <div><label className="block text-xs text-[#94a3b8] mb-1">Triage Level</label><select value={johnDoeForm.triage} onChange={e => setJohnDoeForm(p => ({ ...p, triage: e.target.value as TriageLevel }))} className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#ef4444] appearance-none"><option value="red">Red — Immediate</option><option value="yellow">Yellow — Delayed</option><option value="green">Green — Minor</option><option value="black">Black — Expectant</option></select></div>
                <div><label className="block text-xs text-[#94a3b8] mb-1">Location Found</label><input value={johnDoeForm.location} onChange={e => setJohnDoeForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Sector B" className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#ef4444] transition-all" /></div>
                <div className="col-span-2"><label className="block text-xs text-[#94a3b8] mb-1">Chief Complaint / Visible Injuries</label><textarea value={johnDoeForm.chief} onChange={e => setJohnDoeForm(p => ({ ...p, chief: e.target.value }))} placeholder="Describe visible injuries and chief complaint..." className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#ef4444] transition-all resize-none h-16" /></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowJohnDoeModal(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={registerJohnDoe} className="flex-1 py-2.5 bg-[#ef4444] text-white rounded-lg text-sm font-bold hover:bg-[#dc2626] transition-colors">Register Patient</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== PATIENT DETAIL MODAL ====================== */}
      <AnimatePresence>
        {showPatientDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPatientDetail(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{showPatientDetail.name}</h3>
                  {offlineMode && syncQueue.some(s => s.patientId === showPatientDetail.id && s.status !== "synced") && (
                    <p className="text-[10px] text-[#f59e0b] mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                      Changes pending sync
                    </p>
                  )}
                </div>
                <button onClick={() => setShowPatientDetail(null)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Patient ID", value: showPatientDetail.id },
                  { label: "Age / Gender", value: `${showPatientDetail.age} · ${showPatientDetail.gender === "M" ? "Male" : showPatientDetail.gender === "F" ? "Female" : "Unknown"}` },
                  { label: "Triage Level", value: showPatientDetail.triage.toUpperCase() },
                  { label: "GCS Score", value: String(showPatientDetail.gcs) },
                  { label: "Heart Rate", value: showPatientDetail.hr ? `${showPatientDetail.hr} bpm` : "—" },
                  { label: "Resp. Rate", value: showPatientDetail.rr ? `${showPatientDetail.rr}/min` : "—" },
                  { label: "Arrival Time", value: showPatientDetail.arrivalTime },
                  { label: "Assigned Bay", value: showPatientDetail.assignedBay },
                  { label: "Doctor", value: showPatientDetail.assignedDoctor },
                  { label: "Status", value: showPatientDetail.status.replace("_", " ") },
                ].map(r => (
                  <div key={r.label} className="p-2.5 bg-[rgba(148,163,184,0.05)] rounded-lg">
                    <div className="text-xs text-[#94a3b8]">{r.label}</div>
                    <div className="text-sm font-medium text-white capitalize">{r.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-[rgba(148,163,184,0.05)] rounded-lg">
                <div className="text-xs text-[#94a3b8] mb-1">Chief Complaint</div>
                <p className="text-sm text-white">{showPatientDetail.chief}</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => openEditRecord(showPatientDetail)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0284c7] transition-colors">
                  <FileText className="w-4 h-4" /> Update Record
                </button>
                <button onClick={openTransfer} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.25)] transition-colors">
                  <ArrowRightLeft className="w-4 h-4" /> Transfer
                </button>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => exportPatientToPDF(showPatientDetail)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.25)] transition-colors">
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
                <button onClick={() => exportPatientToExcel(showPatientDetail)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] rounded-lg text-sm hover:bg-[rgba(16,185,129,0.25)] transition-colors">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== CALL MODAL ====================== */}
      <AnimatePresence>
        {callTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden border border-[rgba(148,163,184,0.2)] bg-gradient-to-b from-[#0f172a] to-[#0a0e1a] shadow-2xl">
              <div className="p-8 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${callStatus === "connected" ? "bg-[rgba(16,185,129,0.15)]" : "bg-[rgba(14,165,233,0.15)]"}`}>
                  <Ambulance className={`w-9 h-9 ${callStatus === "connected" ? "text-[#10b981]" : "text-[#0ea5e9]"}`} />
                </div>
                <h3 className="text-white text-lg font-bold">{callTarget.id} · {callTarget.team}</h3>
                <p className="text-[#94a3b8] text-sm mt-1" style={{ fontFamily: "monospace" }}>{callTarget.phone}</p>
                <p className={`text-sm mt-3 font-medium ${callStatus === "dialing" ? "text-[#f59e0b] animate-pulse" : callStatus === "connected" ? "text-[#10b981]" : "text-[#94a3b8]"}`}>
                  {callStatus === "dialing" ? "Connecting…" : callStatus === "connected" ? `Connected · ${formatCallTime(callSeconds)}` : "Call ended"}
                </p>
                {callStatus === "connected" && (
                  <div className="flex items-center gap-4 mt-6">
                    <button onClick={() => setMuted(m => !m)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? "bg-[#ef4444] text-white" : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"}`}>
                      {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setSpeaker(s => !s)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${speaker ? "bg-[rgba(14,165,233,0.2)] text-[#0ea5e9]" : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"}`}>
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <button onClick={endCall} disabled={callStatus === "ended"}
                  className="mt-7 w-16 h-16 rounded-full bg-[#ef4444] text-white flex items-center justify-center hover:bg-[#dc2626] transition-all disabled:opacity-50">
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== EDIT RECORD MODAL ====================== */}
      <AnimatePresence>
        {showEditRecord && editForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditRecord(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(14,165,233,0.3)] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white text-lg">Update Medical Record — {editForm.name}</h3>
                  {offlineMode && <p className="text-[10px] text-[#f59e0b] mt-0.5">Offline — changes will sync when connected</p>}
                </div>
                <button onClick={() => setShowEditRecord(false)} className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg"><X className="w-4 h-4 text-[#94a3b8]" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[#94a3b8] mb-1">Patient Name</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => f && { ...f, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Age</label>
                  <input value={editForm.age} onChange={e => setEditForm(f => f && { ...f, age: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => f && { ...f, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    <option value="M">Male</option><option value="F">Female</option><option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Triage Level</label>
                  <select value={editForm.triage} onChange={e => setEditForm(f => f && { ...f, triage: e.target.value as TriageLevel })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    <option value="red">Red — Immediate</option><option value="yellow">Yellow — Delayed</option>
                    <option value="green">Green — Minor</option><option value="black">Black — Expectant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => f && { ...f, status: e.target.value as TriagePatient["status"] })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] appearance-none">
                    <option value="waiting">Waiting</option><option value="being_treated">Being Treated</option>
                    <option value="stabilized">Stabilized</option><option value="deceased">Deceased</option><option value="transferred">Transferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">GCS Score</label>
                  <input type="number" min={3} max={15} value={editForm.gcs} onChange={e => setEditForm(f => f && { ...f, gcs: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Heart Rate (bpm)</label>
                  <input type="number" value={editForm.hr} onChange={e => setEditForm(f => f && { ...f, hr: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Resp. Rate (/min)</label>
                  <input type="number" value={editForm.rr} onChange={e => setEditForm(f => f && { ...f, rr: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Assigned Bay</label>
                  <input value={editForm.assignedBay} onChange={e => setEditForm(f => f && { ...f, assignedBay: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Doctor</label>
                  <input value={editForm.assignedDoctor} onChange={e => setEditForm(f => f && { ...f, assignedDoctor: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[#94a3b8] mb-1">Chief Complaint</label>
                  <textarea value={editForm.chief} onChange={e => setEditForm(f => f && { ...f, chief: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#0ea5e9] resize-none h-16" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEditRecord(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={saveEditRecord} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-bold hover:bg-[#0284c7] transition-colors">
                  <Save className="w-4 h-4" /> Save Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== TRANSFER MODAL ====================== */}
      <AnimatePresence>
        {showTransfer && showPatientDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransfer(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-[rgba(15,23,42,0.97)] border border-[rgba(16,185,129,0.3)] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[rgba(16,185,129,0.15)]"><Building2 className="w-5 h-5 text-[#10b981]" /></div>
                <div>
                  <h3 className="font-bold text-white">Transfer Patient</h3>
                  <p className="text-xs text-[#94a3b8]">{showPatientDetail.name} · {showPatientDetail.id}</p>
                  {offlineMode && <p className="text-[10px] text-[#f59e0b] mt-0.5">Offline — transfer will be queued for sync</p>}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Transfer Destination</label>
                  <select value={transferForm.destination} onChange={e => setTransferForm(f => ({ ...f, destination: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#10b981] appearance-none">
                    {TRANSFER_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Medical Escort Required?</label>
                  <select value={transferForm.escort} onChange={e => setTransferForm(f => ({ ...f, escort: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white text-sm focus:outline-none focus:border-[#10b981] appearance-none">
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Transfer Notes</label>
                  <textarea value={transferForm.note} onChange={e => setTransferForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Reason for transfer, condition at time of transfer, etc."
                    className="w-full px-3 py-2.5 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#10b981] resize-none h-20" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowTransfer(false)} className="flex-1 py-2.5 bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={confirmTransfer} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#10b981] text-white rounded-lg text-sm font-bold hover:bg-[#059669] transition-colors">
                  <ArrowRightLeft className="w-4 h-4" /> Confirm Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
