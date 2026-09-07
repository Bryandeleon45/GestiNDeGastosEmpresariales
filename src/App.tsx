import { useState, useEffect, useRef } from "react";
import muniLogo from "@/imports/image-14.png";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────
const G  = "#1E5E2F";
const GL = "#E8F5ED";
const GB = "#C6E0CC";

const ACCENT_PALETTE = [
  { name:"Forest Green", hex:"#1E5E2F" },
  { name:"Ocean Blue",   hex:"#1D4ED8" },
  { name:"Purple",       hex:"#7C3AED" },
  { name:"Orange",       hex:"#B45309" },
  { name:"Teal",         hex:"#0F766E" },
  { name:"Crimson",      hex:"#BE123C" },
];

// ─── Municipal Seal ───────────────────────────────────────────────────────────
function MunicipalSeal({ size = 40, onClick }: { size?: number; onClick?: () => void }) {
  const img = (
    <img
      src={muniLogo}
      alt="Escudo Municipalidad de Panajachel"
      width={size}
      height={size}
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
    />
  );
  if (!onClick) return img;
  return (
    <button
      onClick={onClick}
      className="shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none rounded-full"
      aria-label="Ir al Dashboard"
      style={{ width: size, height: size, padding: 0, background: "none", border: "none" }}
    >
      {img}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Dependencias: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Solicitudes:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Proveedores:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Proformas:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Facturacion:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M9 14l6-6m-5.5.5h.01m5.49 5h.01M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  Bodega:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  Reportes:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Config:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Logout:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Bell:         () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  HelpCircle:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Search:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus:         () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X:            () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Eye:          () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ChevDown:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>,
  ChevUp:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="18 15 12 9 6 15"/></svg>,
  ChevLeft:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>,
  ChevRight:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>,
  Info:         () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>,
  ShieldCheck:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Warning:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  MapPin:       () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  CirclePlus:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  PlusSmall:    () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  CheckCircle:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  CheckMark:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>,
  Wallet:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>,
  PiggyBank:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M19 11V9a7 7 0 00-14 0v2"/><path d="M5 11h14a2 2 0 012 2v4a2 2 0 01-2 2h-1.5l-1 2h-5l-1-2H5a2 2 0 01-2-2v-4a2 2 0 012-2z"/><circle cx="9" cy="14" r="1" fill="currentColor"/></svg>,
  PDF:          () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
  Money:        () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Download:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Activity:     () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  CheckBadge:   () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Zap:          () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Refresh:      () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  Pencil:       () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  PackagePlus:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M16 16h6m-3-3v6"/><path d="M21 10V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l2-1.14"/><path d="M7.5 4.27l9 5.15M3.29 7L12 12l8.71-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>,
  Boxes:        () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M2.97 12.92A2 2 0 002 14.63v3.24a2 2 0 00.97 1.71l3 1.8a2 2 0 002.06 0L12 19v-5.5l-5-3-4.03 2.42z"/><path d="M7 16.5l-4.74-2.85M7 16.5l5-3m-5 3v5.17M12 13.5V19l3.97 2.38a2 2 0 002.06 0l3-1.8a2 2 0 00.97-1.71v-3.24a2 2 0 00-.97-1.71L17 10.5l-5 3z"/><path d="M17 16.5l-5-3m0 0l-5 3m5-3V8"/><path d="M12 8L7.03 5.58a2 2 0 00-2.06 0L2.97 7.29A2 2 0 002 9v1l5 3 5-3V9a2 2 0 00-.97-1.71L8.94 5.5"/><path d="M22 9v1l-5 3-5-3V9a2 2 0 01.97-1.71l3-1.8a2 2 0 012.06 0l3 1.8A2 2 0 0122 9z"/></svg>,
  TrendDown:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  HistoryClock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M3 12a9 9 0 105.196-8.196"/><polyline points="3 4 3 10 9 10"/><path d="M12 7v5l3 3"/></svg>,
  Doc:          () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Headset:      () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>,
  ArrowRight:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Send:         () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Tag:          () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  User:         () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  FileText:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_MAIN = [
  { key: "dashboard",    label: "Dashboard",    Icon: Icons.Dashboard },
  { key: "dependencias", label: "Dependencias", Icon: Icons.Dependencias },
  { key: "proveedores",  label: "Proveedores",  Icon: Icons.Proveedores },
  { key: "proformas",    label: "Proformas",    Icon: Icons.Proformas },
  { key: "facturacion",  label: "Facturación",  Icon: Icons.Facturacion },
  { key: "bodega",       label: "Bodega",       Icon: Icons.Bodega },
  { key: "reportes",     label: "Reportes",     Icon: Icons.Reportes },
  { key: "configuracion", label: "Configuración", Icon: Icons.Config },
];

const CHART_DATA = [
  { dept: "DAFIM",      gasto: 85000 },
  { dept: "SECRETARÍA", gasto: 42000 },
  { dept: "OF. AGUA",   gasto: 97000 },
  { dept: "SERVICIOS",  gasto: 61000 },
  { dept: "OBRAS",      gasto: 130000 },
  { dept: "CULTURA",    gasto: 28000 },
];

type ActStatus = "Entregado" | "Parcial" | "Pendiente";
const ACTIVITY: { sol: string; dep: string; monto: string; status: ActStatus }[] = [
  { sol: "SOL-2023-458", dep: "DAFIM",              monto: "Q 12,450.00", status: "Entregado" },
  { sol: "SOL-2023-459", dep: "Secretaría General", monto: "Q 3,200.00",  status: "Parcial" },
  { sol: "SOL-2023-460", dep: "Oficina de Agua",    monto: "Q 45,900.00", status: "Pendiente" },
  { sol: "SOL-2023-461", dep: "Policía Municipal",  monto: "Q 1,150.00",  status: "Entregado" },
  { sol: "SOL-2023-462", dep: "Obras Públicas",     monto: "Q 78,200.00", status: "Parcial" },
];
const STATUS_BADGE: Record<ActStatus, string> = {
  Entregado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Parcial:   "bg-amber-50 text-amber-700 border border-amber-200",
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
};
interface StockItem {
  id: string; name: string; pct: number; level: "CRÍTICO" | "BAJO";
  disp: number; min: number; unit: string;
  lastRestock: string; location: string; proveedor: string; costo: string;
}
const STOCK: StockItem[] = [
  { id:"s1", name:"Papel Bond A4 (Resmas)", pct:12, level:"CRÍTICO", disp:12,  min:100, unit:"Resmas",  lastRestock:"15/03/2026", location:"Bodega Central B-02", proveedor:"Papelería El Sol",    costo:"Q 45.00 / resma" },
  { id:"s2", name:"Tóner HP LaserJet 85A",  pct:33, level:"BAJO",    disp:5,   min:15,  unit:"Unidades", lastRestock:"01/04/2026", location:"Bodega Central B-05", proveedor:"TecnoSupplies GT",   costo:"Q 285.00 / unidad" },
  { id:"s3", name:"Folder Manila Oficio",   pct:50, level:"BAJO",    disp:250, min:500, unit:"Piezas",   lastRestock:"20/04/2026", location:"Bodega Central B-01", proveedor:"Distribuidora DAFIM", costo:"Q 1.50 / pieza" },
];

// ─── Audit log data ───────────────────────────────────────────────────────────
interface AuditEntry {
  fecha: string; usuario: string;
  actividad: string; actividadColor: "green" | "gray";
  descripcion: string;
  estado: string; estadoStyle: string; EstadoIcon: () => JSX.Element;
}
const PAGE_SIZE = 5;
const ALL_AUDIT: AuditEntry[] = [
  { fecha:"11/06/2026 22:40:43", usuario:"A. Reyes",  actividad:"SC-2024-045 (Oficina)", actividadColor:"green", descripcion:"Orden de compra procesada y enviada a proveedor.", estado:"Procesado",    estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.CheckBadge },
  { fecha:"11/06/2026 22:40:43", usuario:"(System)",  actividad:"SC-2024-044 (Agua)",    actividadColor:"green", descripcion:"Solicitud aprobada automáticamente por sistema.",  estado:"Auto-Aprobado",estadoStyle:"bg-green-50 text-green-700 border border-green-200",     EstadoIcon:Icons.Zap },
  { fecha:"10/06/2026 16:01",    usuario:"A. Reyes",  actividad:"(General)",             actividadColor:"gray",  descripcion:"Presupuesto anual actualizado al 64%.",            estado:"Actualizado",  estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.Refresh },
  { fecha:"10/06/2026 09:44",    usuario:"J. Pérez",  actividad:"SC-2024-042 (Cloro)",   actividadColor:"green", descripcion:"Solicitud creada por Oficina de Agua.",            estado:"Creado",       estadoStyle:"bg-amber-50 text-amber-700 border border-amber-200",     EstadoIcon:Icons.Pencil },
  { fecha:"09/06/2026 11:20",    usuario:"(System)",  actividad:"SC-2024-040 (Papelería)",actividadColor:"green",descripcion:"Solicitud guardada como borrador.",                estado:"Guardado",     estadoStyle:"bg-gray-100 text-gray-600 border border-gray-200",        EstadoIcon:Icons.Doc },
  { fecha:"09/06/2026 08:15",    usuario:"M. López",  actividad:"SC-2024-039 (Limpieza)",actividadColor:"green", descripcion:"Proveedor asignado a orden de limpieza.",          estado:"Procesado",    estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.CheckBadge },
  { fecha:"08/06/2026 17:30",    usuario:"A. Reyes",  actividad:"SC-2024-038 (Oficina)", actividadColor:"green", descripcion:"Factura #F-2024-128 aprobada y registrada.",       estado:"Procesado",    estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.CheckBadge },
  { fecha:"08/06/2026 14:22",    usuario:"(System)",  actividad:"(General)",             actividadColor:"gray",  descripcion:"Alerta de stock bajo generada automáticamente.",   estado:"Auto-Aprobado",estadoStyle:"bg-green-50 text-green-700 border border-green-200",     EstadoIcon:Icons.Zap },
  { fecha:"07/06/2026 11:05",    usuario:"J. Pérez",  actividad:"SC-2024-036 (Agua)",    actividadColor:"green", descripcion:"Solicitud de mantenimiento enviada a bodega.",     estado:"Creado",       estadoStyle:"bg-amber-50 text-amber-700 border border-amber-200",     EstadoIcon:Icons.Pencil },
  { fecha:"07/06/2026 09:00",    usuario:"R. Castro", actividad:"SC-2024-035 (Cultura)", actividadColor:"green", descripcion:"Presupuesto aprobado por Director Financiero.",    estado:"Actualizado",  estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.Refresh },
  { fecha:"06/06/2026 16:45",    usuario:"M. López",  actividad:"SC-2024-034 (Obras)",   actividadColor:"green", descripcion:"Orden de compra enviada a proveedor externo.",     estado:"Procesado",    estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.CheckBadge },
  { fecha:"06/06/2026 13:10",    usuario:"A. Reyes",  actividad:"SC-2024-033 (Oficina)", actividadColor:"green", descripcion:"Informe mensual de gastos generado.",               estado:"Actualizado",  estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.Refresh },
  { fecha:"05/06/2026 10:30",    usuario:"(System)",  actividad:"SC-2024-032 (DAFIM)",   actividadColor:"green", descripcion:"Cierre automático de solicitud vencida.",           estado:"Guardado",     estadoStyle:"bg-gray-100 text-gray-600 border border-gray-200",        EstadoIcon:Icons.Doc },
  { fecha:"05/06/2026 08:55",    usuario:"J. Pérez",  actividad:"SC-2024-031 (Agua)",    actividadColor:"green", descripcion:"Nueva solicitud registrada por Oficina de Agua.",  estado:"Creado",       estadoStyle:"bg-amber-50 text-amber-700 border border-amber-200",     EstadoIcon:Icons.Pencil },
  { fecha:"04/06/2026 15:20",    usuario:"R. Castro", actividad:"(General)",             actividadColor:"gray",  descripcion:"Configuración del sistema actualizada.",            estado:"Actualizado",  estadoStyle:"bg-emerald-50 text-emerald-700 border border-emerald-200", EstadoIcon:Icons.Refresh },
];
const TIPO_OPTIONS = ["Todas las actividades","Orden de Compra","Aprobación","Actualización","Creación","Borrador"];

// ─── Search Bar ───────────────────────────────────────────────────────────────
type SearchResultType = "solicitud" | "proveedor" | "stock";
interface SearchResult {
  id: string; type: SearchResultType;
  title: string; meta: string; badge: string; badgeStyle: string;
}

const ALL_SEARCH_RESULTS: SearchResult[] = [
  { id:"r1",  type:"solicitud", title:"SOL-2023-458 — DAFIM",                        meta:"Compra de materiales de oficina",       badge:"Entregado", badgeStyle:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id:"r2",  type:"solicitud", title:"SOL-2023-459 — Secretaría General",            meta:"Servicio técnico de mantenimiento",     badge:"Parcial",   badgeStyle:"bg-amber-50 text-amber-700 border-amber-200" },
  { id:"r3",  type:"solicitud", title:"SOL-2023-460 — Oficina de Agua",               meta:"Compra de suministros de cloro",        badge:"Pendiente", badgeStyle:"bg-gray-100 text-gray-600 border-gray-200" },
  { id:"r4",  type:"solicitud", title:"SOL-2023-461 — Policía Municipal",             meta:"Equipamiento de protección",           badge:"Entregado", badgeStyle:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id:"r5",  type:"solicitud", title:"SOL-2023-462 — Obras Públicas",               meta:"Materiales de construcción",           badge:"Parcial",   badgeStyle:"bg-amber-50 text-amber-700 border-amber-200" },
  { id:"r6",  type:"proveedor", title:"Librería y Papelería Sololá",                  meta:"Categoría: Insumos de Oficina",         badge:"Activo",    badgeStyle:"bg-blue-50 text-blue-700 border-blue-200" },
  { id:"r7",  type:"proveedor", title:"TecnoSupplies Guatemala",                      meta:"Categoría: Equipos Tecnológicos",       badge:"Activo",    badgeStyle:"bg-blue-50 text-blue-700 border-blue-200" },
  { id:"r8",  type:"proveedor", title:"Distribuidora DAFIM",                          meta:"Categoría: Materiales Varios",          badge:"Activo",    badgeStyle:"bg-blue-50 text-blue-700 border-blue-200" },
  { id:"r9",  type:"stock",     title:"Tóner HP LaserJet 85A",                        meta:"5 disponibles · Bodega Central B-05",  badge:"Stock Bajo",badgeStyle:"bg-orange-50 text-orange-600 border-orange-200" },
  { id:"r10", type:"stock",     title:"Papel Bond A4 (Resmas)",                       meta:"12 disponibles · Bodega Central B-02", badge:"CRÍTICO",   badgeStyle:"bg-red-50 text-red-600 border-red-200" },
  { id:"r11", type:"stock",     title:"Folder Manila Oficio",                         meta:"250 disponibles · Bodega Central B-01",badge:"Stock Bajo",badgeStyle:"bg-orange-50 text-orange-600 border-orange-200" },
  { id:"r12", type:"solicitud", title:"SOL-2024-047 — Cultura",                       meta:"Insumos culturales y recreativos",     badge:"Pendiente", badgeStyle:"bg-gray-100 text-gray-600 border-gray-200" },
];

const RESULT_ICON: Record<SearchResultType, JSX.Element> = {
  solicitud: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  proveedor: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  stock:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
};

const RESULT_TYPE_LABEL: Record<SearchResultType, string> = {
  solicitud: "Solicitudes",
  proveedor: "Proveedores",
  stock:     "Inventario",
};

function SearchBar() {
  const [query,    setQuery]    = useState("");
  const [focused,  setFocused]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed.length === 0
    ? ALL_SEARCH_RESULTS.slice(0, 5)  // show recent when empty
    : ALL_SEARCH_RESULTS.filter(r =>
        r.title.toLowerCase().includes(trimmed) ||
        r.meta.toLowerCase().includes(trimmed) ||
        r.badge.toLowerCase().includes(trimmed)
      );

  // Group by type for section headers
  const groups: Record<SearchResultType, SearchResult[]> = { solicitud: [], proveedor: [], stock: [] };
  filtered.forEach(r => groups[r.type].push(r));
  const orderedTypes: SearchResultType[] = ["solicitud", "proveedor", "stock"];
  const showDropdown = focused && (trimmed.length > 0 || true); // always show on focus

  // Active state styling
  const isActive  = focused;
  const isHovered = hovered && !focused;

  let borderColor = "#E2E8F0";
  if (isActive)  borderColor = G;
  else if (isHovered) borderColor = "#CBD5E1";

  let bgColor = "#F8FAFC";
  if (isActive) bgColor = "#FFFFFF";

  let boxShadow = "none";
  if (isActive)  boxShadow = `0 0 0 3px ${G}22, 0 1px 3px rgba(0,0,0,0.06)`;
  else if (isHovered) boxShadow = "0 1px 4px rgba(0,0,0,0.08)";

  const iconColor = isActive ? G : "#94A3B8";

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">

      {/* Input pill */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2.5 px-4"
        style={{
          height: 42, borderRadius: 24,
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
          boxShadow,
          transition: "all 0.15s cubic-bezier(0.16,1,0.3,1)",
        }}>

        {/* Search icon */}
        <svg className="w-4 h-4 shrink-0 transition-colors duration-150" fill="none" stroke={iconColor} viewBox="0 0 24 24" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar solicitud o proveedor..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          style={{
            color: "#1E293B",
            caretColor: G,
            fontSize: 14,
          } as React.CSSProperties}
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 transition-colors hover:bg-gray-200 text-gray-400 hover:text-gray-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        {/* Keyboard shortcut hint (default state only) */}
        {!focused && !query && (
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 shrink-0">
            <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">⌘</span>
            <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">K</span>
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden z-[500]"
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            animation: "dropIn 0.16s cubic-bezier(.16,1,.3,1)",
            maxHeight: 400,
            overflowY: "auto",
          }}>

          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {trimmed ? `Resultados para "${query}"` : "Búsquedas Recientes"}
            </p>
            {filtered.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {filtered.length}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-gray-400">Sin resultados para "{query}"</p>
              <p className="text-xs text-gray-300 mt-1">Intenta con número de solicitud, proveedor o artículo</p>
            </div>
          ) : (
            orderedTypes.map(type => {
              const items = groups[type];
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  {/* Type section label */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/60 border-t border-gray-50">
                    <span className="text-gray-400">{RESULT_ICON[type]}</span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{RESULT_TYPE_LABEL[type]}</p>
                  </div>

                  {/* Items */}
                  {items.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelected(r.id); setQuery(r.title); setFocused(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all group border-b border-gray-50 last:border-0"
                      style={{ backgroundColor: selected === r.id ? GL : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F8FFFE")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = selected === r.id ? GL : "")}>

                      {/* Type icon tinted */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: selected === r.id ? GB : "#F1F5F9", color: selected === r.id ? G : "#64748B" }}>
                        {RESULT_ICON[r.type]}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-none truncate"
                          dangerouslySetInnerHTML={{
                            __html: trimmed
                              ? r.title.replace(new RegExp(`(${trimmed})`, "gi"), `<mark style="background:${GL};color:${G};border-radius:2px;padding:0 1px">$1</mark>`)
                              : r.title,
                          }}
                        />
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{r.meta}</p>
                      </div>

                      {/* Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${r.badgeStyle}`}>
                        {r.badge}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setFocused(false)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ color: G }}>
                <span>Ver todos los resultados ({ALL_SEARCH_RESULTS.length}) →</span>
                <kbd className="text-[10px] font-semibold text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">↵</kbd>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────
interface NotifItem { id: string; icon: string; title: string; body: string; time: string; unread: boolean; color: string; }
const NOTIFS_DEFAULT: NotifItem[] = [
  { id:"n1", icon:"🧾", title:"Nueva solicitud recibida",            body:"SOL-2024-047 de Oficina de Agua pendiente de aprobación.", time:"Hace 5 min",  unread:true,  color:"#1E5E2F" },
  { id:"n2", icon:"⚠️", title:"Stock crítico de Papel Bond",         body:"Quedan solo 12 resmas. Por debajo del mínimo de 100.",     time:"Hace 18 min", unread:true,  color:"#DC2626" },
  { id:"n3", icon:"📄", title:"Factura pendiente de aprobación",     body:"Factura #F-2024-129 de TecnoSupplies GT requiere firma.",   time:"Hace 1 h",   unread:true,  color:"#D97706" },
  { id:"n4", icon:"✅", title:"Orden de compra procesada",            body:"OC-2024-088 enviada correctamente al proveedor.",          time:"Hace 2 h",   unread:false, color:"#059669" },
  { id:"n5", icon:"📊", title:"Reporte mensual disponible",          body:"Informe de gastos de mayo 2026 listo para descarga.",      time:"Ayer",       unread:false, color:"#6366F1" },
];

function NotificationBell({ onOpenAudit }: { onOpenAudit: () => void }) {
  const [open,     setOpen]     = useState(false);
  const [notifs,   setNotifs]   = useState<NotifItem[]>(NOTIFS_DEFAULT);
  const [hovered,  setHovered]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, unread: false })));
  const markOneRead = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n));

  const iconColor = hovered || open ? G : "#4A5568";
  const iconBg    = hovered || open ? "#F0FDF4" : "transparent";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-full transition-all duration-150"
        style={{ width: 40, height: 40, backgroundColor: iconBg, color: iconColor }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute flex items-center justify-center text-white font-extrabold rounded-full border-2 border-white transition-all"
            style={{ top: 6, right: 6, width: unreadCount > 9 ? 16 : 12, height: 12, fontSize: 8, backgroundColor: "#E53E3E", lineHeight: 1 }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[400] overflow-hidden"
          style={{ width: 340, animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#E53E3E" }}>{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-semibold transition-colors hover:opacity-70" style={{ color: G }}>
                  Marcar como leídas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <Icons.X />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-72 overflow-y-auto">
            {notifs.map((n, i) => (
              <button key={n.id} onClick={() => markOneRead(n.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 group"
                style={{ backgroundColor: n.unread ? "#FAFFFE" : "white" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
                  style={{ backgroundColor: `${n.color}15` }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs leading-snug ${n.unread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: "#E53E3E" }}/>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] font-semibold mt-1" style={{ color: n.unread ? G : "#9CA3AF" }}>{n.time}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3">
            <button onClick={() => { setOpen(false); onOpenAudit(); }}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: G }}>
              Ver todas las actividades
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Help Button ──────────────────────────────────────────────────────────────
const FAQ_LINKS = [
  { q: "¿Cómo crear una solicitud?",          href: "#solicitudes" },
  { q: "Guía de Bodega y Stock",               href: "#bodega" },
  { q: "Generar reporte de gastos",            href: "#reportes" },
  { q: "Gestión de proveedores",               href: "#proveedores" },
];

function HelpButton({ onOpenTicket }: { onOpenTicket: () => void }) {
  const [open,    setOpen]    = useState(false);
  const [hovered, setHovered] = useState(false);
  const [query,   setQuery]   = useState("");
  const [focusSearch, setFocusSearch] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = FAQ_LINKS.filter(f => !query || f.q.toLowerCase().includes(query.toLowerCase()));
  const iconColor = hovered || open ? G : "#4A5568";
  const iconBg    = hovered || open ? "#F0FDF4" : "transparent";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center justify-center rounded-full transition-all duration-150"
        style={{ width: 40, height: 40, backgroundColor: iconBg, color: iconColor }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[400] overflow-hidden"
          style={{ width: 300, animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Centro de Ayuda</h3>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <Icons.X />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Icons.Search /></span>
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocusSearch(true)} onBlur={() => setFocusSearch(false)}
                placeholder="Buscar en la documentación..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border rounded-xl outline-none transition-all placeholder-gray-400"
                style={{ borderColor: focusSearch ? G : "#E5E7EB", boxShadow: focusSearch ? `0 0 0 3px ${G}22` : "none" }}
              />
            </div>
          </div>

          {/* FAQ links */}
          <div className="px-4 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Accesos Rápidos</p>
            <div className="space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">Sin resultados para "{query}"</p>
              ) : filtered.map(f => (
                <button key={f.q} onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all group hover:bg-gray-50">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: GL }}>
                    <svg className="w-3 h-3" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={2.5}><path d="M9 5l7 7-7 7"/></svg>
                  </span>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{f.q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-4 my-2"/>

          {/* Soporte DAFIM CTA */}
          <div className="px-4 pb-4">
            <div className="rounded-xl border p-3.5 flex items-center gap-3 mb-3" style={{ backgroundColor: GL, borderColor: GB }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
                <Icons.Headset />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 leading-none">Soporte DAFIM</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Tiempo de respuesta ≤ 4 h hábiles</p>
              </div>
            </div>
            <button onClick={() => { setOpen(false); onOpenTicket(); }}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: G }}>
              Abrir Ticket de Soporte →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stock Item Detail Popover ────────────────────────────────────────────────
function StockDetailPopover({ item, onClose, onRestock }: { item: StockItem; onClose: () => void; onRestock: (name: string) => void }) {
  const isCrit = item.level === "CRÍTICO";
  const barColor = isCrit ? "#EF4444" : "#F59E0B";
  const badgeStyle = isCrit
    ? { color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA" }
    : { color: "#D97706", background: "#FFFBEB", border: "1px solid #FDE68A" };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(1px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(.16,1,.3,1)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header band */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={badgeStyle}>{item.level}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.location}</p>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all shrink-0">
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Progress ring + numbers */}
          <div className="flex items-center gap-4">
            {/* Circular progress */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="6"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke={barColor} strokeWidth="6"
                  strokeDasharray={`${2*Math.PI*26}`}
                  strokeDashoffset={`${2*Math.PI*26*(1-item.pct/100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.16,1,.3,1)" }}/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold" style={{ color: barColor }}>{item.pct}%</span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Disponible</span>
                <span className="text-sm font-bold text-gray-900">{item.disp.toLocaleString()} {item.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Mínimo</span>
                <span className="text-sm font-bold text-gray-900">{item.min.toLocaleString()} {item.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Déficit</span>
                <span className="text-sm font-bold text-red-600">−{(item.min - item.disp).toLocaleString()} {item.unit}</span>
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-1 gap-2.5 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            {[
              { icon: <Icons.HistoryClock />, label: "Último reabastecimiento", val: item.lastRestock },
              { icon: <Icons.Proveedores />,  label: "Proveedor",               val: item.proveedor },
              { icon: <Icons.Wallet />,        label: "Costo unitario",          val: item.costo },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2.5">
                <span className="text-gray-400 shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{r.label}</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trend bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nivel de Stock</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500"><Icons.TrendDown/> Tendencia baja</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, backgroundColor: barColor }}/>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">0%</span>
              <span className="text-[10px] text-gray-400">100%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            Cerrar
          </button>
          <button onClick={() => { onRestock(item.name); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ backgroundColor: G }}>
            <Icons.PackagePlus /> Reabastecer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Alerts Card ────────────────────────────────────────────────────────
function StockAlertsCard({ onRestock }: { onRestock: (items?: string) => void }) {
  const [hoveredItem,  setHoveredItem]  = useState<string | null>(null);
  const [detailItem,   setDetailItem]   = useState<StockItem | null>(null);
  const [btnState,     setBtnState]     = useState<"default" | "hover" | "pressed">("default");

  const critCount = STOCK.filter(s => s.level === "CRÍTICO").length;

  const badgeStyle = (s: StockItem) => s.level === "CRÍTICO"
    ? { color: "#DC2626" }
    : { color: "#D97706" };

  const barColor = (s: StockItem) => s.level === "CRÍTICO" ? "#EF4444" : "#F59E0B";

  const btnBg = btnState === "pressed" ? "#143E1F" : btnState === "hover" ? G : "transparent";
  const btnTextColor = btnState === "default" ? G : "#FFFFFF";

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-4">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2.2}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3 className="text-base font-bold text-[#0F172A] leading-none">Alertas de Stock Bajo</h3>
          {critCount > 0 && (
            <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">
              {critCount} CRÍTICO
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5"/>

        {/* Items */}
        <div className="px-5 py-3 space-y-0">
          {STOCK.map((s, i) => (
            <div key={s.id}>
              <div
                onClick={() => setDetailItem(s)}
                onMouseEnter={() => setHoveredItem(s.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative -mx-2 px-2 py-3 rounded-xl cursor-pointer transition-all duration-150 group"
                style={{ backgroundColor: hoveredItem === s.id ? "#F9FAFB" : "transparent" }}>

                {/* Tooltip */}
                {hoveredItem === s.id && (
                  <div className="absolute right-2 -top-9 z-10 px-2.5 py-1.5 text-[11px] font-semibold text-white rounded-lg whitespace-nowrap pointer-events-none"
                    style={{ backgroundColor: "#0F172A", animation: "dropIn 0.12s ease-out", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                    Clic para ver detalle
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #0F172A" }}/>
                  </div>
                )}

                {/* Name + badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-bold text-gray-900 leading-tight group-hover:underline decoration-dotted underline-offset-2 transition-all">{s.name}</p>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide shrink-0" style={badgeStyle(s)}>{s.level}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, backgroundColor: barColor(s) }}/>
                </div>

                {/* Disp / Min */}
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-700">Disp: <b>{s.disp.toLocaleString()}</b></span>
                  <span className="text-[11px] text-gray-500">Mín: <b>{s.min.toLocaleString()}</b></span>
                </div>
              </div>
              {i < STOCK.length - 1 && <div className="h-px bg-gray-100"/>}
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="px-5 pb-5 pt-2">
          <button
            onMouseEnter={() => setBtnState("hover")}
            onMouseLeave={() => setBtnState("default")}
            onMouseDown={() => setBtnState("pressed")}
            onMouseUp={() => setBtnState("hover")}
            onClick={() => onRestock()}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 leading-snug text-center"
            style={{
              backgroundColor: btnBg,
              color: btnTextColor,
              borderColor: G,
              transform: btnState === "pressed" ? "scale(0.98)" : "scale(1)",
              boxShadow: btnState === "hover" ? `0 4px 16px ${G}35` : "none",
            }}>
            Generar Orden de<br/>Reabastecimiento
          </button>
        </div>
      </div>

      {/* Item detail popover */}
      {detailItem && (
        <StockDetailPopover
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRestock={name => onRestock(name)}
        />
      )}
    </>
  );
}

// ─── Support Card ─────────────────────────────────────────────────────────────
function SupportCard({ onOpenTicket }: { onOpenTicket: () => void }) {
  const [state, setState] = useState<"default"|"hover"|"pressed">("default");

  const shadowMap = {
    default: "0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px #E5E7EB",
    hover:   "0 8px 24px rgba(30,94,47,0.12), 0 0 0 1px #C6E0CC",
    pressed: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px #E5E7EB",
  };
  const bgMap = {
    default: "#FFFFFF",
    hover:   "#FFFFFF",
    pressed: "#F9FAFB",
  };
  const translateMap = {
    default: "translateY(0px) scale(1)",
    hover:   "translateY(-2px) scale(1)",
    pressed: "translateY(0px) scale(0.98)",
  };

  return (
    <div
      onMouseEnter={() => setState("hover")}
      onMouseLeave={() => setState("default")}
      onMouseDown={() => setState("pressed")}
      onMouseUp={() => setState("hover")}
      style={{
        background: bgMap[state],
        boxShadow: shadowMap[state],
        borderRadius: 16,
        padding: 20,
        transform: translateMap[state],
        transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
        cursor: "default",
      }}>

      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ backgroundColor: state === "hover" ? "#D1EAD9" : GL }}>
          <svg className="w-6 h-6 transition-colors duration-200" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.7}>
            <path d="M3 18v-6a9 9 0 0118 0v6"/>
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/>
            <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
          </svg>
        </div>
        <p className="text-base font-bold text-gray-900 leading-snug">¿Necesitas ayuda?</p>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-500 leading-relaxed mb-3">
        Soporte técnico de DAFIM disponible.
      </p>

      {/* Link */}
      <button
        onClick={onOpenTicket}
        onMouseDown={e => e.stopPropagation()}
        className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group"
        style={{ color: state === "hover" ? "#28A745" : G }}>
        <span className={state === "hover" ? "underline underline-offset-2" : ""}>Abrir Ticket</span>
        <span className="transition-transform duration-200" style={{ transform: state === "hover" ? "translateX(3px)" : "translateX(0)" }}>
          <Icons.ArrowRight />
        </span>
      </button>
    </div>
  );
}

// ─── Support Ticket Drawer ────────────────────────────────────────────────────
type Priority = "Baja" | "Media" | "Alta" | "Urgente";
type Category = "Técnico" | "Presupuesto" | "Solicitudes" | "Acceso" | "Otro";

function SupportTicketDrawer({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [asunto,    setAsunto]    = useState("");
  const [categoria, setCategoria] = useState<Category>("Técnico");
  const [prioridad, setPrioridad] = useState<Priority>("Media");
  const [desc,      setDesc]      = useState("");
  const [nombre,    setNombre]    = useState("Lic. Ricardo Gómez");
  const [email,     setEmail]     = useState("rgomez@munipanajachel.gob.gt");
  const [visible,   setVisible]   = useState(false);
  const [focusField, setFocus]    = useState<string|null>(null);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 320); };

  const CATS: Category[]     = ["Técnico","Presupuesto","Solicitudes","Acceso","Otro"];
  const PRIOS: Priority[]    = ["Baja","Media","Alta","Urgente"];
  const PRIO_COLOR: Record<Priority, string> = {
    Baja: "bg-gray-100 text-gray-600", Media: "bg-amber-50 text-amber-700",
    Alta: "bg-orange-50 text-orange-600", Urgente: "bg-red-50 text-red-600",
  };

  const fi = (id: string) => ({
    onFocus: () => setFocus(id), onBlur: () => setFocus(null),
    style: {
      borderColor: focusField === id ? G : "#E5E7EB",
      boxShadow: focusField === id ? `0 0 0 3px ${G}20` : "none",
      outline: "none", transition: "all 0.15s",
    },
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.4 : 0})`, backdropFilter: "blur(1px)", transition: "background-color 0.32s" }} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[210] flex flex-col bg-white shadow-2xl"
        style={{
          width: 440,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.16,1,0.3,1)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Headset />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Abrir Ticket de Soporte</h2>
              <p className="text-xs font-semibold mt-0.5 uppercase tracking-wider" style={{ color: G }}>Centro de Soporte DAFIM</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Contact info (pre-filled) */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Información del Solicitante</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2.5">
                <Icons.User />
                <span className="text-sm font-semibold text-gray-800">{nombre}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500">
                <Icons.Send />
                <span className="text-sm">{email}</span>
              </div>
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Asunto del Ticket</label>
            <input value={asunto} onChange={e => setAsunto(e.target.value)}
              placeholder="Ej. Error al generar reporte PDF..."
              className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400"
              {...fi("asunto")} />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATS.map(c => (
                <button key={c} onClick={() => setCategoria(c)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={categoria === c
                    ? { backgroundColor: G, color: "white", borderColor: G }
                    : { backgroundColor: "white", color: "#374151", borderColor: "#E5E7EB" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Prioridad</label>
            <div className="flex gap-2">
              {PRIOS.map(p => (
                <button key={p} onClick={() => setPrioridad(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${PRIO_COLOR[p]}`}
                  style={prioridad === p
                    ? { borderColor: G, outline: `2px solid ${G}`, outlineOffset: 2 }
                    : { borderColor: "#E5E7EB" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descripción Detallada</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
              placeholder="Describe el problema o consulta con el mayor detalle posible..."
              className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400 resize-none"
              {...fi("desc")} />
          </div>

          {/* Attachment hint */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Icons.FileText />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">Adjuntar captura o archivo</p>
              <p className="text-[10px] text-gray-400 mt-0.5">PNG, PDF hasta 5 MB</p>
            </div>
            <button className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-100" style={{ color: G, borderColor: GB }}>
              Subir
            </button>
          </div>

          {/* SLA notice */}
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 border" style={{ backgroundColor: GL, borderColor: GB }}>
            <span style={{ color: G }} className="mt-0.5 shrink-0"><Icons.Info /></span>
            <p className="text-xs text-gray-700 leading-relaxed">
              El equipo de soporte <strong>DAFIM</strong> responde en un máximo de <strong>4 horas hábiles</strong>. Tickets urgentes tienen respuesta en 1 hora.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button onClick={handleClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}>
            <Icons.Send />
            Enviar Ticket
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Shared Dropdown ──────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all text-left"
          style={{ borderColor: open ? G : "#D1D5DB", boxShadow: open ? `0 0 0 3px ${G}22` : "none" }}>
          <span className="text-gray-800 font-medium">{value}</span>
          <span className="text-gray-400 ml-2 shrink-0">{open ? <Icons.ChevUp /> : <Icons.ChevDown />}</span>
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden"
            style={{ animation: "dropIn 0.13s ease-out" }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
                style={{ backgroundColor: opt === value ? GL : undefined, color: opt === value ? G : "#374151" }}>
                <span className="font-medium">{opt}</span>
                {opt === value && <span style={{ color: G }}><Icons.CheckMark /></span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ show, message, sub, onHide }: { show: boolean; message: string; sub?: string; onHide: () => void }) {
  useEffect(() => { if (show) { const t = setTimeout(onHide, 4500); return () => clearTimeout(t); } }, [show, onHide]);
  return (
    <div className={`fixed top-5 right-5 z-[500] transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}>
      <div className="flex items-start gap-3 bg-white border border-gray-200 shadow-2xl rounded-xl px-5 py-4 max-w-sm">
        <span style={{ color: G }} className="mt-0.5 shrink-0"><Icons.CheckCircle /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{message}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <button onClick={onHide} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"><Icons.X /></button>
      </div>
    </div>
  );
}

// ─── Audit Modal ──────────────────────────────────────────────────────────────
function AuditModal({ onClose, onExport }: { onClose: () => void; onExport: () => void }) {
  const [usuario,    setUsuario]    = useState("A. Reyes");
  const [tipoAct,    setTipoAct]    = useState("Todas las actividades");
  const [fecha,      setFecha]      = useState("11/06/2026");
  const [page,       setPage]       = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number|null>(null);
  const [focusUser,  setFocusUser]  = useState(false);
  const [focusFecha, setFocusFecha] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(ALL_AUDIT.length / PAGE_SIZE);

  const filtered = ALL_AUDIT.filter(e => {
    if (usuario.trim() && !e.usuario.toLowerCase().includes(usuario.toLowerCase())) return false;
    if (tipoAct !== "Todas las actividades") {
      const map: Record<string,string[]> = { "Orden de Compra":["Procesado"],"Aprobación":["Auto-Aprobado"],"Actualización":["Actualizado"],"Creación":["Creado"],"Borrador":["Guardado"] };
      if (!map[tipoAct]?.includes(e.estado)) return false;
    }
    return true;
  });
  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{backgroundColor:"rgba(0,0,0,0.52)",backdropFilter:"blur(1.5px)"}}>
      <div className="bg-white rounded-xl shadow-2xl w-full flex flex-col" style={{maxWidth:900,animation:"modalIn 0.22s cubic-bezier(.16,1,.3,1)"}}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-none">Registro de Actividades Recientes</h2>
            <p className="text-xs font-bold uppercase tracking-widest mt-1.5" style={{color:G}}>Institutional Audit Log</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 hidden sm:block">Thursday, June 11, 2026</span>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{color:G}}>Usuario:</label>
              <input value={usuario} onChange={e=>setUsuario(e.target.value)} onFocus={()=>setFocusUser(true)} onBlur={()=>setFocusUser(false)}
                className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all"
                style={{borderColor:focusUser?G:"#D1D5DB",boxShadow:focusUser?`0 0 0 3px ${G}22`:"none"}} placeholder="Filtrar usuario..."/>
            </div>
            <Dropdown label="Tipo de Actividad:" value={tipoAct} options={TIPO_OPTIONS} onChange={v=>{setTipoAct(v);setPage(1);}}/>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filtrar por Fecha:</label>
              <div className="flex">
                <input value={fecha} onChange={e=>setFecha(e.target.value)} onFocus={()=>setFocusFecha(true)} onBlur={()=>setFocusFecha(false)}
                  placeholder="DD/MM/YYYY" className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white border border-r-0 rounded-l-lg outline-none transition-all"
                  style={{borderColor:focusFecha?G:"#D1D5DB",boxShadow:focusFecha?`0 0 0 3px ${G}22`:"none"}}/>
                <button onClick={()=>setPage(1)} className="px-3 py-2.5 text-white rounded-r-lg transition-all hover:opacity-90 flex items-center justify-center shrink-0" style={{backgroundColor:G}}>
                  <Icons.Search/>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              {["FECHA Y HORA","USUARIO","ACTIVIDAD/SOLICITUD","DESCRIPCIÓN DETALLADA","ESTADO"].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pageEntries.length===0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Sin resultados.</td></tr>
              ) : pageEntries.map((e,i)=>(
                <tr key={i} onMouseEnter={()=>setHoveredRow(i)} onMouseLeave={()=>setHoveredRow(null)}
                  className="border-b border-gray-100 last:border-0 transition-colors"
                  style={{backgroundColor:hoveredRow===i?"#F0FAF4":undefined}}>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-600 whitespace-nowrap">{e.fecha}</td>
                  <td className="px-4 py-3.5"><span className={`text-sm font-semibold ${e.usuario==="(System)"?"text-gray-400 italic":"text-gray-900"}`}>{e.usuario}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${e.actividadColor==="green"?"text-white":"bg-gray-100 text-gray-600 border border-gray-200"}`} style={e.actividadColor==="green"?{backgroundColor:G}:{}}>{e.actividad}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700 max-w-xs">{e.descripcion}</td>
                  <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${e.estadoStyle}`}><e.EstadoIcon/>{e.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cerrar</button>
            <span className="text-xs text-gray-500">Mostrando <b className="text-gray-700">{pageEntries.length}</b> de <b className="text-gray-700">{ALL_AUDIT.length}</b> entradas</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><Icons.ChevLeft/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all"
                style={p===page?{backgroundColor:G,color:"white"}:{border:"1px solid #E5E7EB",color:"#374151",backgroundColor:"white"}}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><Icons.ChevRight/></button>
          </div>
          <button onClick={onExport} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm active:scale-95 uppercase tracking-wide" style={{backgroundColor:G}}
            onMouseEnter={e=>(e.currentTarget.style.backgroundColor="#175228")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor=G)}>
            <Icons.Download/>Exportar Log
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Solicitud + Gastos Modals (compact) ──────────────────────────────────────
const DEPS_LIST   = ["Oficina de Agua","DAFIM","Secretaría General","Policía Municipal","Obras Públicas","Cultura"];
const GASTOS_DATA = [
  {mes:"Enero",   presupuesto:"Q 50,000.00",ejecutado:"Q 42,100.00",saldo:"Q 7,900.00", saldoC:"green"as const,estado:"Dentro de Límite"},
  {mes:"Febrero", presupuesto:"Q 50,000.00",ejecutado:"Q 48,500.00",saldo:"Q 1,500.00", saldoC:"red"  as const,estado:"Al Límite"},
  {mes:"Marzo",   presupuesto:"Q 50,000.00",ejecutado:"Q 35,000.00",saldo:"Q 15,000.00",saldoC:"green"as const,estado:"Dentro de Límite"},
];
const ESTADO_BADGE: Record<string,string> = {
  "Dentro de Límite":"bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Al Límite":"bg-orange-50 text-orange-600 border border-orange-200",
};

function GastosModal({onClose,onPDF}:{onClose:()=>void;onPDF:()=>void}) {
  const [dep,setDep]=useState("Oficina de Agua");
  const [año,setAño]=useState("2026");
  const [mes,setMes]=useState("Todos los Meses");
  const [añoOpen,setAñoOpen]=useState(true);
  const overlayRef=useRef<HTMLDivElement>(null);
  const rows=mes==="Todos los Meses"?GASTOS_DATA:GASTOS_DATA.filter(r=>r.mes===mes);
  return (
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()} className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.52)",backdropFilter:"blur(1px)"}}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col" style={{animation:"modalIn 0.22s cubic-bezier(.16,1,.3,1)"}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{backgroundColor:G}}><Icons.Money/></div><h2 className="text-lg font-bold text-gray-900">Control de Gastos del Departamento</h2></div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X/></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Dropdown label="Departamento" value={dep} options={DEPS_LIST} onChange={setDep}/>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Año Fiscal</label>
              <div className="relative">
                <button onClick={()=>setAñoOpen(o=>!o)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg transition-all" style={{borderColor:añoOpen?G:"#D1D5DB",boxShadow:añoOpen?`0 0 0 3px ${G}22`:"none"}}>
                  <span className="font-medium text-gray-800">{año}</span><span className="text-gray-400">{añoOpen?<Icons.ChevUp/>:<Icons.ChevDown/>}</span>
                </button>
                {añoOpen&&<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden" style={{animation:"dropIn 0.13s ease-out"}}>
                  {["2026","2025","2024","2023"].map(y=><button key={y} onClick={()=>{setAño(y);setAñoOpen(false);}} className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors" style={{backgroundColor:y===año?GL:"white",color:y===año?G:"#374151"}}><span className="font-medium">{y}</span>{y===año&&<span style={{color:G}}><Icons.CheckMark/></span>}</button>)}
                </div>}
              </div>
            </div>
            <Dropdown label="Mes" value={mes} options={["Todos los Meses","Enero","Febrero","Marzo"]} onChange={setMes}/>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{["MES","PRESUPUESTO","EJECUTADO","SALDO","ESTADO"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r,i)=><tr key={r.mes} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/70 ${i%2===1?"bg-gray-50/40":""}`}><td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{r.mes}</td><td className="px-4 py-3.5 text-sm font-mono text-gray-700">{r.presupuesto}</td><td className="px-4 py-3.5 text-sm font-mono text-gray-700">{r.ejecutado}</td><td className="px-4 py-3.5"><span className={`text-sm font-bold font-mono ${r.saldoC==="green"?"text-emerald-600":"text-red-600"}`}>{r.saldo}</span></td><td className="px-4 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ESTADO_BADGE[r.estado]}`}>{r.estado}</span></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
            <div className="flex items-center gap-2.5 flex-1 px-5 py-3"><span className="text-gray-500"><Icons.Wallet/></span><span className="text-sm font-semibold text-gray-700">Total Ejecutado: <b className="text-gray-900">Q 125,600.00</b></span></div>
            <div className="w-px h-10 bg-gray-200"/>
            <div className="flex items-center gap-2.5 flex-1 px-5 py-3"><span className="text-gray-500"><Icons.PiggyBank/></span><span className="text-sm font-semibold text-gray-700">Presupuesto Restante: <b className="text-gray-900">Q 474,400.00</b></span></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all">Cerrar</button>
          <button onClick={onPDF} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm active:scale-95" style={{backgroundColor:G}} onMouseEnter={e=>(e.currentTarget.style.backgroundColor="#175228")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor=G)}><Icons.PDF/>Generar Reporte PDF</button>
        </div>
      </div>
    </div>
  );
}

function SolicitudModal({onClose,onSubmit}:{onClose:()=>void;onSubmit:()=>void}) {
  const [dep,setDep]=useState("Oficina de Agua");const [tipo,setTipo]=useState("Compra de Materiales");const [item,setItem]=useState("");const [cant,setCant]=useState("0");const [unidad,setUnidad]=useState("Resma");const [just,setJust]=useState("");const [notas,setNotas]=useState("");const [prio,setPrio]=useState<"Baja"|"Media"|"Alta">("Alta");
  const overlayRef=useRef<HTMLDivElement>(null);
  const TIPOS=["Compra de Materiales","Servicio Técnico","Equipamiento","Mantenimiento"];const UNIDS=["Resma","Unidad","Caja","Paquete"];
  const FI=({label,children}:{label:string;children:React.ReactNode})=><div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>{children}</div>;
  const TI=({ph,val,set,type="text"}:{ph?:string;val:string;set:(v:string)=>void;type?:string})=>{const[f,setF]=useState(false);return<input type={type} value={val} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>setF(true)} onBlur={()=>setF(false)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg outline-none transition-all placeholder-gray-400" style={{borderColor:f?G:"#E5E7EB",boxShadow:f?`0 0 0 3px ${G}22`:"none"}}/>;};
  const TA=({ph,val,set}:{ph?:string;val:string;set:(v:string)=>void})=>{const[f,setF]=useState(false);return<textarea value={val} placeholder={ph} rows={3} onChange={e=>set(e.target.value)} onFocus={()=>setF(true)} onBlur={()=>setF(false)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg outline-none resize-none transition-all placeholder-gray-400" style={{borderColor:f?G:"#E5E7EB",boxShadow:f?`0 0 0 3px ${G}22`:"none"}}/>;};
  return(
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()} className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.52)",backdropFilter:"blur(1px)"}}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col" style={{animation:"modalIn 0.22s cubic-bezier(.16,1,.3,1)"}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{backgroundColor:G}}><Icons.ShieldCheck/></div><h2 className="text-lg font-bold text-gray-900">Formulario de Solicitud</h2></div><button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X/></button></div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4"><Dropdown label="Dependencia / Unidad" value={dep} options={DEPS_LIST} onChange={setDep}/><Dropdown label="Tipo de Solicitud" value={tipo} options={TIPOS} onChange={setTipo}/></div>
          <div className="grid grid-cols-2 gap-4"><FI label="Nombre del Ítem"><TI ph="Ej. Papel Bond Carta" val={item} set={setItem}/></FI><div className="grid grid-cols-2 gap-3"><FI label="Cantidad"><TI ph="0" val={cant} set={setCant} type="number"/></FI><Dropdown label="Unidad" value={unidad} options={UNIDS} onChange={setUnidad}/></div></div>
          <FI label="Justificación"><TA ph="Describe la necesidad institucional..." val={just} set={setJust}/></FI>
          <div className="flex items-start gap-3 rounded-lg px-4 py-3.5 border" style={{backgroundColor:GL,borderColor:GB}}><span style={{color:G}} className="mt-0.5 shrink-0"><Icons.Info/></span><div><p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:G}}>Presupuesto Asignado</p><p className="text-xs text-gray-700">Presupuesto restante = <b>Q 5,200</b></p></div></div>
          <FI label="Notas para Aprobación"><TA ph="Notas para Aprobación" val={notas} set={setNotas}/></FI>
          <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Prioridad</label><div className="flex items-center gap-6">{(["Baja","Media","Alta"]as const).map(p=><label key={p} className="flex items-center gap-2 cursor-pointer select-none" onClick={()=>setPrio(p)}><div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all" style={{borderColor:prio===p?G:"#D1D5DB",backgroundColor:prio===p?G:"white"}}>{prio===p&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}</div><span className={`text-sm font-medium ${prio===p?"text-gray-900":"text-gray-500"}`}>{p}</span></label>)}</div></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0"><button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancelar</button><button onClick={onSubmit} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm" style={{backgroundColor:G}}><Icons.CirclePlus/>Crear Solicitud</button></div>
      </div>
    </div>
  );
}

// ─── Jurisdiction Map Modal ───────────────────────────────────────────────────
function JurisdictionModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  const BARRIOS = [
    { name: "Barrio Jucanyá",     pop: "2,840", area: "1.2 km²", type: "Residencial" },
    { name: "Barrio San Francisco",pop: "1,920", area: "0.8 km²", type: "Comercial" },
    { name: "Barrio El Calvario",  pop: "3,100", area: "1.5 km²", type: "Mixto" },
    { name: "Aldea Tzanjuyú",      pop: "1,240", area: "2.1 km²", type: "Rural" },
    { name: "Aldea Santa Cruz",    pop: "890",   area: "1.8 km²", type: "Rural" },
  ];
  const STATS = [
    { label: "Superficie total",   value: "13.4 km²" },
    { label: "Población",          value: "15,200" },
    { label: "Altitud",            value: "1,563 msnm" },
    { label: "Departamento",       value: "Sololá" },
  ];

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && handleClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`, backdropFilter: "blur(2px)", transition: "background-color 0.28s" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.24s cubic-bezier(.16,1,.3,1)", maxHeight: "88vh" }}>

        {/* Hero photo header */}
        <div className="relative h-44 shrink-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1650734837693-7169695a7f79?w=800&h=400&fit=crop&auto=format"
            alt="Lago de Atitlán, Panajachel" className="w-full h-full object-cover"/>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)" }}/>

          {/* Close */}
          <button onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all">
            <Icons.X />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[2px] mb-0.5">Jurisdicción Municipal</p>
            <h2 className="text-white text-2xl font-extrabold leading-none tracking-tight">Panajachel</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg className="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-white/75 text-xs font-medium">Sololá, Guatemala · Lago de Atitlán</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Stats strip */}
          <div className="grid grid-cols-4 border-b border-gray-100">
            {STATS.map((s, i) => (
              <div key={s.label} className={`px-4 py-3.5 ${i < STATS.length - 1 ? "border-r border-gray-100" : ""}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-extrabold text-gray-900 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div className="mx-5 my-4 rounded-xl overflow-hidden border border-gray-100 relative" style={{ height: 180 }}>
            {/* Stylized SVG map stand-in */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 30%, #93c5fd 60%, #60a5fa 100%)",
            }}>
              {/* Lake shape */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
                <ellipse cx="200" cy="95" rx="155" ry="62" fill="rgba(59,130,246,0.4)" stroke="rgba(29,78,216,0.3)" strokeWidth="1.5"/>
                <ellipse cx="200" cy="95" rx="110" ry="44" fill="rgba(37,99,235,0.25)"/>
                {/* Volcanoes */}
                <polygon points="90,130 130,50 170,130" fill="rgba(16,185,129,0.6)" stroke="rgba(4,120,87,0.4)" strokeWidth="1"/>
                <polygon points="220,130 265,45 310,130" fill="rgba(16,185,129,0.55)" stroke="rgba(4,120,87,0.4)" strokeWidth="1"/>
                {/* Town marker */}
                <circle cx="200" cy="78" r="7" fill={G} stroke="white" strokeWidth="2"/>
                <circle cx="200" cy="78" r="3" fill="white"/>
                {/* Contour lines */}
                <ellipse cx="200" cy="95" rx="175" ry="78" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
                <ellipse cx="200" cy="95" rx="185" ry="85" fill="none" stroke="rgba(99,102,241,0.10)" strokeWidth="1" strokeDasharray="4 3"/>
              </svg>
              {/* Overlay label */}
              <div className="absolute top-2 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/60">
                <p className="text-[10px] font-bold text-gray-700">Lago de Atitlán</p>
              </div>
              <div className="absolute bottom-2 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/60 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: G }}/>
                <p className="text-[10px] font-bold text-gray-700">Panajachel</p>
              </div>
            </div>
          </div>

          {/* Barrios / Aldeas table */}
          <div className="px-5 pb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Barrios y Aldeas</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Sector", "Población", "Área", "Tipo"].map(h => (
                      <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BARRIOS.map((b, i) => (
                    <tr key={b.name} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-3.5 py-2.5 text-xs font-semibold text-gray-800">{b.name}</td>
                      <td className="px-3.5 py-2.5 text-xs font-mono text-gray-600">{b.pop}</td>
                      <td className="px-3.5 py-2.5 text-xs font-mono text-gray-600">{b.area}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.type === "Rural" ? "bg-amber-50 text-amber-700" : b.type === "Comercial" ? "bg-blue-50 text-blue-700" : b.type === "Mixto" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {b.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            Cerrar
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Ver en Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Branding Card ────────────────────────────────────────────────────────────
function BrandingCard({ onOpenMap }: { onOpenMap: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpenMap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden cursor-pointer"
      style={{
        borderRadius: 16,
        height: 140,
        boxShadow: hovered
          ? "0 10px 30px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}>

      {/* Background photo with zoom on hover */}
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 16 }}>
        <img
          src="https://images.unsplash.com/photo-1650734837693-7169695a7f79?w=640&h=320&fit=crop&auto=format"
          alt="Lago de Atitlán, Panajachel, Guatemala"
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            transformOrigin: "center center",
          }}
        />
      </div>

      {/* Gradient overlay — deepens on hover */}
      <div className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.68) 100%)",
          opacity: hovered ? 0.95 : 0.85,
        }}/>

      {/* "Ver mapa" badge — appears on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200"
        style={{
          backgroundColor: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.30)",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.95)",
        }}>
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span className="text-[10px] font-bold text-white whitespace-nowrap">Ver mapa</span>
      </div>

      {/* Text content — bottom aligned */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
        <p className="text-white/55 text-[9px] font-bold uppercase tracking-[1.8px] mb-0.5 leading-none">
          Jurisdicción Actual
        </p>
        <p className="text-white text-[22px] font-extrabold leading-none tracking-tight mb-1.5">
          Panajachel
        </p>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="rgba(203,213,225,0.9)" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="text-[#CBD5E1] text-[13px] font-normal leading-none">Sololá, Guatemala</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dependencias data ────────────────────────────────────────────────────────
type SolPrioridad = "Urgente" | "Media" | "Baja";
type SolEstado    = "En Revisión" | "Aprobado" | "Pagado" | "Pendiente" | "Rechazado";
interface SolicitudRow {
  id: string; dep: string; item: string; cant: string;
  prioridad: SolPrioridad; estado: SolEstado; fecha: string;
  monto: string; solicitante: string; justificacion: string;
}
const ALL_DEPS_SOLICITUDES: SolicitudRow[] = [
  { id:"SC-2024-042", dep:"Oficina de Agua",    item:"Cloro Granulado (Hipoclorito de Calcio 65%)",    cant:"15 Tambos",    prioridad:"Urgente", estado:"En Revisión", fecha:"24/05/2024", monto:"Q 12,450.00", solicitante:"Ing. Carlos Velásquez",  justificacion:"Mantenimiento urgente de planta de tratamiento de agua." },
  { id:"SC-2024-039", dep:"Secretaría",         item:"Papelería y Útiles de Oficina",                  cant:"1 Lote",       prioridad:"Media",   estado:"Aprobado",    fecha:"22/05/2024", monto:"Q 3,200.00",  solicitante:"Lic. Ana González",     justificacion:"Suministros para operaciones de secretaría mes de mayo." },
  { id:"SC-2024-035", dep:"DAFIM",              item:"Tóner para Impresora Láser HP LaserJet 85A",     cant:"4 Unidades",   prioridad:"Baja",    estado:"Pagado",      fecha:"15/05/2024", monto:"Q 1,140.00",  solicitante:"Lic. Mario Estrada",    justificacion:"Reposición de tóners para equipos de impresión de DAFIM." },
  { id:"SC-2024-041", dep:"Oficina de Agua",    item:"Medidores de Caudal Digitales",                  cant:"6 Unidades",   prioridad:"Media",   estado:"Aprobado",    fecha:"23/05/2024", monto:"Q 8,400.00",  solicitante:"Ing. Carlos Velásquez",  justificacion:"Reemplazo de medidores obsoletos en red de distribución." },
  { id:"SC-2024-040", dep:"Obras Públicas",     item:"Cemento Portland Tipo I (Sacos 42.5 kg)",        cant:"200 Sacos",    prioridad:"Urgente", estado:"En Revisión", fecha:"21/05/2024", monto:"Q 18,600.00", solicitante:"Ing. Roberto Alvarado", justificacion:"Reparación de calles en Barrio Jucanyá. Deterioro crítico." },
  { id:"SC-2024-038", dep:"Secretaría",         item:"Sellos y Timbres Notariales",                   cant:"2 Juegos",     prioridad:"Baja",    estado:"Pagado",      fecha:"18/05/2024", monto:"Q 850.00",    solicitante:"Lic. Ana González",     justificacion:"Sellos reglamentarios para documentos oficiales municipales." },
  { id:"SC-2024-037", dep:"DAFIM",              item:"Software de Contabilidad Gubernamental (Licencia)",cant:"1 Licencia", prioridad:"Media",   estado:"En Revisión", fecha:"17/05/2024", monto:"Q 6,500.00",  solicitante:"Lic. Mario Estrada",    justificacion:"Renovación anual de licencia sistema contable institucional." },
  { id:"SC-2024-036", dep:"Policía Municipal",  item:"Uniformes Policiales Completos",                 cant:"12 Juegos",    prioridad:"Media",   estado:"Aprobado",    fecha:"16/05/2024", monto:"Q 4,800.00",  solicitante:"Com. Luis Pérez",       justificacion:"Dotación anual de uniformes para agentes de policía municipal." },
  { id:"SC-2024-034", dep:"Obras Públicas",     item:"Varilla de Hierro Corrugado 3/8 pulgada",        cant:"50 Quintales", prioridad:"Media",   estado:"Pagado",      fecha:"14/05/2024", monto:"Q 22,500.00", solicitante:"Ing. Roberto Alvarado", justificacion:"Material para construcción de muros en zona de riesgo." },
  { id:"SC-2024-033", dep:"Cultura",            item:"Sistema de Audio Profesional (Amplificadores)",  cant:"1 Sistema",    prioridad:"Baja",    estado:"Aprobado",    fecha:"12/05/2024", monto:"Q 9,200.00",  solicitante:"Prof. María Tzul",      justificacion:"Equipo para eventos culturales y festividades municipales." },
  { id:"SC-2024-032", dep:"Policía Municipal",  item:"Vehículo Pickup Doble Cabina 4x4",               cant:"1 Unidad",     prioridad:"Urgente", estado:"En Revisión", fecha:"10/05/2024", monto:"Q 185,000.00",solicitante:"Com. Luis Pérez",       justificacion:"Reposición de vehículo dañado en servicio. Necesidad urgente." },
  { id:"SC-2024-031", dep:"DAFIM",              item:"Archivadores Metálicos de 4 Gavetas",            cant:"6 Unidades",   prioridad:"Baja",    estado:"Pagado",      fecha:"08/05/2024", monto:"Q 3,600.00",  solicitante:"Lic. Mario Estrada",    justificacion:"Reorganización de archivos documentales departamento DAFIM." },
  { id:"SC-2024-030", dep:"Oficina de Agua",    item:"Tubería PVC de 4 pulgadas SDR-26",               cant:"500 Metros",   prioridad:"Urgente", estado:"Aprobado",    fecha:"07/05/2024", monto:"Q 14,750.00", solicitante:"Ing. Carlos Velásquez",  justificacion:"Reposición de red de distribución. Tubería con fugas activas." },
  { id:"SC-2024-029", dep:"Cultura",            item:"Disfraces y Vestuario Tradicional Maya",         cant:"30 Juegos",    prioridad:"Baja",    estado:"Pagado",      fecha:"05/05/2024", monto:"Q 6,000.00",  solicitante:"Prof. María Tzul",      justificacion:"Vestuario para festival cultural anual Día de la Madre." },
  { id:"SC-2024-028", dep:"Secretaría",         item:"Computadoras de Escritorio (Core i5, 8GB RAM)",  cant:"3 Unidades",   prioridad:"Media",   estado:"Aprobado",    fecha:"03/05/2024", monto:"Q 12,900.00", solicitante:"Lic. Ana González",     justificacion:"Renovación de equipos de cómputo para personal administrativo." },
];

const PRIORIDAD_STYLE: Record<SolPrioridad, string> = {
  Urgente: "bg-red-50 text-red-600 border border-red-200",
  Media:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Baja:    "bg-gray-100 text-gray-600 border border-gray-200",
};
const ESTADO_SOL_STYLE: Record<SolEstado, string> = {
  "En Revisión": "bg-sky-50 text-sky-700 border border-sky-200",
  "Aprobado":    "bg-green-50 text-green-700 border border-green-200",
  "Pagado":      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Pendiente":   "bg-gray-100 text-gray-500 border border-gray-200",
  "Rechazado":   "bg-red-50 text-red-600 border border-red-200",
};
const ALL_DEPS_NAMES = ["Todas las Dependencias","Oficina de Agua","Secretaría","DAFIM","Obras Públicas","Policía Municipal","Cultura"];
const SOL_PAGE_SIZE  = 5;

// ─── Solicitud Row Detail Modal ───────────────────────────────────────────────
function SolicitudDetailModal({ row, onClose, onEdit }: { row: SolicitudRow; onClose: () => void; onEdit: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeline = [
    { label: "Solicitud creada",      date: row.fecha, done: true  },
    { label: "En revisión DAFIM",     date: row.fecha, done: row.estado !== "Pendiente" },
    { label: "Aprobación alcalde",    date: row.estado === "Aprobado" || row.estado === "Pagado" ? row.fecha : "—", done: row.estado === "Aprobado" || row.estado === "Pagado" },
    { label: "Pago procesado",        date: row.estado === "Pagado" ? row.fecha : "—",                              done: row.estado === "Pagado" },
  ];
  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1.5px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">#{row.id}</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PRIORIDAD_STYLE[row.prioridad]}`}>{row.prioridad}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_SOL_STYLE[row.estado]}`}>{row.estado}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{row.dep} · {row.fecha}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0 mt-0.5"><Icons.X /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Item info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ítem Solicitado</p>
              <p className="text-sm font-bold text-gray-900 leading-snug">{row.item}</p>
              <div className="flex items-center gap-4 mt-3">
                <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Cantidad</p><p className="text-sm font-bold text-gray-800">{row.cant}</p></div>
                <div className="w-px h-8 bg-gray-200"/>
                <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Monto</p><p className="text-sm font-bold font-mono" style={{ color: G }}>{row.monto}</p></div>
                <div className="w-px h-8 bg-gray-200"/>
                <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Solicitante</p><p className="text-sm font-bold text-gray-800">{row.solicitante}</p></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dependencia</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2" style={{ backgroundColor: G }}>
                <Icons.Dependencias />
              </div>
              <p className="text-sm font-bold text-gray-900 leading-snug">{row.dep}</p>
            </div>
          </div>

          {/* Justificación */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Justificación</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{row.justificacion}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial de Estado</p>
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={t.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={{ backgroundColor: t.done ? G : "#F3F4F6", border: t.done ? "none" : "2px solid #E5E7EB" }}>
                      {t.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 my-1" style={{ minHeight: 20, backgroundColor: t.done ? `${G}60` : "#E5E7EB" }}/>}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-semibold leading-none ${t.done ? "text-gray-900" : "text-gray-400"}`}>{t.label}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cerrar</button>
          <button onClick={onEdit}  className="px-5 py-2.5 text-sm font-semibold border rounded-xl transition-all hover:bg-gray-50" style={{ color: G, borderColor: GB }}>
            <span className="flex items-center gap-2"><Icons.Pencil /> Editar</span>
          </button>
          <div className="flex-1"/>
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
            <Icons.PDF /> Imprimir Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row context menu ──────────────────────────────────────────────────────────
function RowMenu({ onVer, onEditar, onAprobar, onRechazar }: { onVer: () => void; onEditar: () => void; onAprobar: () => void; onRechazar: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const items = [
    { label: "Ver detalle",   icon: <Icons.Eye />,       action: () => { onVer();      setOpen(false); }, color: "#374151" },
    { label: "Editar",        icon: <Icons.Pencil />,    action: () => { onEditar();   setOpen(false); }, color: "#374151" },
    { label: "Aprobar",       icon: <Icons.CheckMark />, action: () => { onAprobar();  setOpen(false); }, color: "#16A34A" },
    { label: "Rechazar",      icon: <Icons.X />,         action: () => { onRechazar(); setOpen(false); }, color: "#DC2626" },
  ];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        style={open ? { backgroundColor: GL, color: G } : {}}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-[200] overflow-hidden w-40"
          style={{ animation: "dropIn 0.13s ease-out" }}>
          {items.map(it => (
            <button key={it.label} onClick={it.action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 font-medium"
              style={{ color: it.color }}>
              <span>{it.icon}</span>{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dependencias View ────────────────────────────────────────────────────────
function DependenciasView({ onNewSolicitud, onToast }: { onNewSolicitud: () => void; onToast: (m: string, s: string) => void }) {
  const [depFilter,   setDepFilter]   = useState("Todas las Dependencias");
  const [depOpen,     setDepOpen]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [detailRow,   setDetailRow]   = useState<SolicitudRow | null>(null);
  const [hoveredRow,  setHoveredRow]  = useState<string | null>(null);
  const depRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (depRef.current && !depRef.current.contains(e.target as Node)) setDepOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = depFilter === "Todas las Dependencias"
    ? ALL_DEPS_SOLICITUDES
    : ALL_DEPS_SOLICITUDES.filter(r => r.dep === depFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / SOL_PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * SOL_PAGE_SIZE, page * SOL_PAGE_SIZE);

  // Build grouped rows for current page (insert section header when dept changes)
  const grouped: Array<{ type: "header"; dep: string; idx: number } | { type: "row"; row: SolicitudRow; idx: number }> = [];
  let lastDep = "";
  let gIdx = 0;
  pageRows.forEach(r => {
    if (r.dep !== lastDep) { grouped.push({ type: "header", dep: r.dep, idx: gIdx++ }); lastDep = r.dep; }
    grouped.push({ type: "row", row: r, idx: gIdx++ });
  });

  const summaryMetrics = [
    { title: "Total Solicitudes", value: "124",      sub: "↑ 12% vs mes anterior", subColor: "#16A34A" },
    { title: "Pendientes",        value: "18",       sub: "Promedio 4.2 días",      subColor: "#D97706" },
    { title: "Monto Solicitado",  value: "Q 45,280", sub: "Mes de Mayo 2024",       subColor: "#6B7280" },
    { title: "Ejecución",         value: "88%",      sub: "Meta Institucional",     subColor: "#16A34A" },
  ];

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Dependencias y Solicitudes</h1>
              <p className="text-sm text-gray-500 mt-1">Gestione las peticiones de compra de las unidades municipales.</p>
            </div>
            <button onClick={onNewSolicitud}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}>
              <Icons.Plus /> Nueva Solicitud
            </button>
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Filter card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Filtrar por Dependencia</p>
              <div ref={depRef} className="relative">
                <button onClick={() => setDepOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white border rounded-xl transition-all text-left"
                  style={{ borderColor: depOpen ? G : "#E5E7EB", boxShadow: depOpen ? `0 0 0 3px ${G}22` : "none" }}>
                  <span className="font-semibold text-gray-800">{depFilter}</span>
                  <span className="text-gray-400 ml-2 shrink-0">{depOpen ? <Icons.ChevUp /> : <Icons.ChevDown />}</span>
                </button>
                {depOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[300] overflow-hidden"
                    style={{ animation: "dropIn 0.13s ease-out" }}>
                    {ALL_DEPS_NAMES.map(dep => (
                      <button key={dep} onClick={() => { setDepFilter(dep); setDepOpen(false); setPage(1); }}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50"
                        style={{ backgroundColor: dep === depFilter ? GL : undefined, color: dep === depFilter ? G : "#374151" }}>
                        <span className="font-medium">{dep}</span>
                        {dep === depFilter && <span style={{ color: G }}><Icons.CheckMark /></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Budget card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: G }}><Icons.Info /></span>
                <p className="text-sm font-bold" style={{ color: G }}>Estado de Presupuesto</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                El presupuesto anual disponible para compras operativas presenta un avance del 64%.
              </p>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: "64%", backgroundColor: G }}/>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] font-semibold" style={{ color: G }}>64% ejecutado</span>
                <span className="text-[11px] text-gray-400">Q 4.5M presupuesto</span>
              </div>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold" style={{ color: G }}>Listado Maestro de Solicitudes</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => onToast("Imprimiendo listado...", "El documento se enviará a la impresora.")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <button onClick={() => onToast("Exportando CSV...", "El archivo se descargará en un momento.")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                  <Icons.Download />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["DEPENDENCIA / ID","ÍTEM","CANT.","PRIORIDAD","ESTADO","FECHA","ACCIONES"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin solicitudes para esta dependencia.</td></tr>
                  ) : grouped.map((g) => {
                    if (g.type === "header") return (
                      <tr key={`h-${g.dep}-${g.idx}`}>
                        <td colSpan={7} className="px-4 py-2.5 border-t border-b border-gray-100" style={{ backgroundColor: "#F0FAF4" }}>
                          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: G }}>{g.dep}</span>
                        </td>
                      </tr>
                    );
                    const r = g.row;
                    return (
                      <tr key={`r-${r.id}-${g.idx}`}
                        onMouseEnter={() => setHoveredRow(r.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="border-b border-gray-50 last:border-0 transition-colors"
                        style={{ backgroundColor: hoveredRow === r.id ? "#FAFFFE" : "white" }}>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold font-mono text-gray-700">#{r.id}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{r.dep}</p>
                        </td>
                        <td className="px-4 py-4 max-w-[200px]">
                          <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{r.item}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-700">{r.cant}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${PRIORIDAD_STYLE[r.prioridad]}`}>{r.prioridad}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ESTADO_SOL_STYLE[r.estado]}`}>{r.estado}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 font-mono">{r.fecha}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setDetailRow(r)}
                              className="text-sm font-bold transition-colors hover:opacity-70"
                              style={{ color: G }}>
                              Ver
                            </button>
                            <RowMenu
                              onVer={() => setDetailRow(r)}
                              onEditar={() => onToast("Editando solicitud", `#${r.id} abierta para edición.`)}
                              onAprobar={() => onToast("Solicitud aprobada", `#${r.id} fue marcada como Aprobada.`)}
                              onRechazar={() => onToast("Solicitud rechazada", `#${r.id} fue marcada como Rechazada.`)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Mostrando <b className="text-gray-700">{Math.min((page-1)*SOL_PAGE_SIZE+1, filtered.length)}–{Math.min(page*SOL_PAGE_SIZE, filtered.length)}</b> de <b className="text-gray-700">{filtered.length}</b> solicitudes
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
                    style={p===page ? { backgroundColor: G, color: "white" } : { border: "1px solid #E5E7EB", color: "#374151" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Icons.ChevRight />
                </button>
              </div>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryMetrics.map(m => (
              <div key={m.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.title}</p>
                <p className="text-3xl font-extrabold mt-2 mb-1 leading-none" style={{ color: m.subColor }}>{m.value}</p>
                <p className="text-xs font-medium text-gray-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row detail modal */}
      {detailRow && (
        <SolicitudDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={() => { setDetailRow(null); onNewSolicitud(); }}
        />
      )}
    </>
  );
}

// ─── Proveedores data ─────────────────────────────────────────────────────────
type ConexionEstado = "Conectado" | "Sin Conexión" | "Acceso Bloqueado";
type ProvRol = "Proveedor Premium" | "Proveedor Estándar" | "Distribuidor Mayorista" | "Bloqueado";
interface Proveedor {
  id: string; initials: string; avatarColor: string;
  name: string; nit: string; rol: ProvRol;
  estado: ConexionEstado; ultimaActividad: string;
  email: string; telefono: string; categoria: string;
}
const PROV_ROLES: ProvRol[] = ["Proveedor Estándar","Proveedor Premium","Distribuidor Mayorista","Bloqueado"];
const ALL_PROVEEDORES: Proveedor[] = [
  { id:"p1",  initials:"SL", avatarColor:"#D1FAE5", name:"Suministros El Lago",        nit:"459823-1", rol:"Proveedor Premium",      estado:"Conectado",       ultimaActividad:"Hoy, 10:24 AM",    email:"contacto@sumlagο.gt",      telefono:"7762-1100", categoria:"Insumos Generales" },
  { id:"p2",  initials:"FS", avatarColor:"#D1FAE5", name:"Ferretería El Sol",           nit:"102938-4", rol:"Proveedor Estándar",      estado:"Sin Conexión",    ultimaActividad:"Hace 3 días",      email:"ventas@ferresol.gt",       telefono:"7762-4421", categoria:"Ferretería y Construcción" },
  { id:"p3",  initials:"DM", avatarColor:"#D1FAE5", name:"Distribuidora Maya",          nit:"882736-2", rol:"Distribuidor Mayorista",  estado:"Conectado",       ultimaActividad:"Ayer, 04:15 PM",   email:"pedidos@distmaya.gt",      telefono:"7762-8830", categoria:"Distribución General" },
  { id:"p4",  initials:"CC", avatarColor:"#F3F4F6", name:"Construcciones del Centro",   nit:"554433-K", rol:"Proveedor Premium",      estado:"Acceso Bloqueado", ultimaActividad:"21 Oct, 2023",    email:"info@constrcentro.gt",     telefono:"7762-5591", categoria:"Construcción" },
  { id:"p5",  initials:"PS", avatarColor:"#D1FAE5", name:"Papelería y Suministros GT",  nit:"331209-7", rol:"Proveedor Estándar",      estado:"Conectado",       ultimaActividad:"Hoy, 08:15 AM",   email:"ventas@papelgt.com",       telefono:"7762-3302", categoria:"Papelería" },
  { id:"p6",  initials:"TG", avatarColor:"#D1FAE5", name:"TecnoSupplies Guatemala",    nit:"778812-3", rol:"Proveedor Estándar",      estado:"Sin Conexión",    ultimaActividad:"Hace 1 semana",   email:"soporte@tecnogt.com",      telefono:"2338-7700", categoria:"Tecnología" },
  { id:"p7",  initials:"AG", avatarColor:"#D1FAE5", name:"Agroservicios del Lago",      nit:"215544-8", rol:"Distribuidor Mayorista",  estado:"Conectado",       ultimaActividad:"Hace 2 días",     email:"pedidos@agrolago.gt",      telefono:"7762-0091", categoria:"Agropecuario" },
  { id:"p8",  initials:"ME", avatarColor:"#D1FAE5", name:"Muebles y Equipos S.A.",      nit:"664431-2", rol:"Proveedor Estándar",      estado:"Conectado",       ultimaActividad:"Hace 4 días",     email:"ventas@muebequipos.gt",    telefono:"7762-1198", categoria:"Mobiliario" },
  { id:"p9",  initials:"LQ", avatarColor:"#FEF3C7", name:"Lubricantes y Químicos Xela", nit:"992210-5", rol:"Proveedor Estándar",     estado:"Sin Conexión",    ultimaActividad:"Hace 2 semanas",  email:"quimicos@lqxela.com",      telefono:"7761-4422", categoria:"Químicos" },
  { id:"p10", initials:"SP", avatarColor:"#D1FAE5", name:"Servicios Profesionales GT",  nit:"119876-4", rol:"Proveedor Premium",      estado:"Conectado",       ultimaActividad:"Hoy, 09:40 AM",   email:"servicios@spgt.com.gt",    telefono:"2234-9900", categoria:"Servicios" },
  { id:"p11", initials:"RB", avatarColor:"#FEE2E2", name:"Repuestos y Bocinas Sololá",  nit:"441122-9", rol:"Bloqueado",              estado:"Acceso Bloqueado", ultimaActividad:"12 Sep, 2023",    email:"repuestos@rbsolola.gt",    telefono:"7762-5500", categoria:"Automotriz" },
  { id:"p12", initials:"EC", avatarColor:"#D1FAE5", name:"Electrónica y Comunicaciones", nit:"663300-1",rol:"Proveedor Estándar",     estado:"Conectado",       ultimaActividad:"Ayer, 02:00 PM",  email:"electronica@ecgt.com.gt",  telefono:"2244-1133", categoria:"Electrónica" },
];
const PROV_PAGE_SIZE = 4;

const CONEXION_STYLE: Record<ConexionEstado, { bg: string; text: string; dot: string }> = {
  "Conectado":       { bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  "Sin Conexión":    { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  "Acceso Bloqueado":{ bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
};

// ─── Conectar Proveedor Modal ──────────────────────────────────────────────────
function ConectarProveedorModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [nombre,   setNombre]   = useState("");
  const [nit,      setNit]      = useState("");
  const [email,    setEmail]    = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol,      setRol]      = useState<ProvRol>("Proveedor Estándar");
  const [categoria,setCategoria]= useState("Insumos Generales");
  const [visible,  setVisible]  = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const CATS = ["Insumos Generales","Ferretería y Construcción","Papelería","Tecnología","Distribución General","Agropecuario","Mobiliario","Químicos","Servicios","Automotriz","Electrónica","Construcción"];
  const [focusField, setFocus] = useState<string|null>(null);
  const fi = (id: string) => ({ onFocus: () => setFocus(id), onBlur: () => setFocus(null), style: { borderColor: focusField === id ? G : "#E5E7EB", boxShadow: focusField === id ? `0 0 0 3px ${G}20` : "none", outline: "none", transition: "all 0.15s" } as React.CSSProperties });
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`, backdropFilter: "blur(1.5px)", transition: "background-color 0.28s" }}/>
      <div className="fixed right-0 top-0 bottom-0 z-[210] flex flex-col bg-white shadow-2xl"
        style={{ width: 460, transform: visible ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Conectar Nuevo Proveedor</h2>
              <p className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: G }}>Portal Municipal</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {[{ label:"Nombre del Proveedor", id:"nombre", val:nombre, set:setNombre, ph:"Ej. Suministros El Lago" },
              { label:"NIT",                  id:"nit",    val:nit,    set:setNit,    ph:"Ej. 459823-1" },
              { label:"Correo Electrónico",   id:"email",  val:email,  set:setEmail,  ph:"contacto@proveedor.gt" },
              { label:"Teléfono",             id:"tel",    val:telefono,set:setTelefono,ph:"7762-0000" },
            ].map(f => (
              <div key={f.id}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400" {...fi(f.id)}/>
              </div>
            ))}
          </div>
          <Dropdown label="Rol Asignado" value={rol} options={PROV_ROLES} onChange={v => setRol(v as ProvRol)} />
          <Dropdown label="Categoría" value={categoria} options={CATS} onChange={setCategoria} />
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 border" style={{ backgroundColor: GL, borderColor: GB }}>
            <span style={{ color: G }} className="mt-0.5 shrink-0"><Icons.Info /></span>
            <p className="text-xs text-gray-700 leading-relaxed">El proveedor recibirá un correo con sus credenciales de acceso al portal municipal DAFIM.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancelar</button>
          <button onClick={onSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Conectar Proveedor
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Role dropdown cell ────────────────────────────────────────────────────────
function RolCell({ value, onChange }: { value: ProvRol; onChange: (v: ProvRol) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border rounded-lg transition-all whitespace-nowrap"
        style={{ borderColor: open ? G : "#D1D5DB", color: "#374151", boxShadow: open ? `0 0 0 2px ${G}22` : "none" }}>
        <span>{value}</span>
        <Icons.ChevDown />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[300] overflow-hidden w-48"
          style={{ animation: "dropIn 0.13s ease-out" }}>
          {PROV_ROLES.map(r => (
            <button key={r} onClick={() => { onChange(r); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
              style={{ backgroundColor: r === value ? GL : undefined, color: r === value ? G : r === "Bloqueado" ? "#DC2626" : "#374151" }}>
              <span className="font-medium">{r}</span>
              {r === value && <span style={{ color: G }}><Icons.CheckMark /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Proveedores View ─────────────────────────────────────────────────────────
function ProveedoresView({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [tab,          setTab]          = useState<"Todos"|"Activos"|"Inactivos">("Todos");
  const [page,         setPage]         = useState(1);
  const [showConectar, setShowConectar] = useState(false);
  const [hoveredRow,   setHoveredRow]   = useState<string|null>(null);
  const [roles,        setRoles]        = useState<Record<string, ProvRol>>(
    () => Object.fromEntries(ALL_PROVEEDORES.map(p => [p.id, p.rol]))
  );

  const filtered = ALL_PROVEEDORES.filter(p => {
    if (tab === "Activos")   return p.estado === "Conectado";
    if (tab === "Inactivos") return p.estado !== "Conectado";
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROV_PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PROV_PAGE_SIZE, page * PROV_PAGE_SIZE);

  const activos = ALL_PROVEEDORES.filter(p => p.estado === "Conectado").length;

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Proveedores</span>
            <Icons.ChevRight />
            <span style={{ color: G }}>Gestión de Accesos</span>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Gestión de Accesos — Proveedores</h1>
              <p className="text-sm text-gray-500 mt-1">Administración de roles, credenciales y conexión al portal municipal.</p>
            </div>
            <button onClick={() => setShowConectar(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Conectar Nuevo Proveedor
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label:"TOTAL USUARIOS",   value: ALL_PROVEEDORES.length.toString(), icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
              { label:"ACTIVOS PORTAL",   value: activos.toString(),                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> },
              { label:"SIN CONEXIÓN",     value: ALL_PROVEEDORES.filter(p=>p.estado==="Sin Conexión").length.toString(), icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> },
              { label:"ACCESO BLOQUEADO", value: ALL_PROVEEDORES.filter(p=>p.estado==="Acceso Bloqueado").length.toString(), icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            ].map((k, i) => {
              const colors = [G, G, "#D97706", "#DC2626"];
              return (
                <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: i === 2 ? "#FEF3C7" : i === 3 ? "#FEE2E2" : GL, color: colors[i] }}>
                    {k.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{k.label}</p>
                    <p className="text-3xl font-extrabold leading-none mt-0.5" style={{ color: colors[i] }}>{k.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-base font-bold text-gray-900">Directorio de Accesos</h2>
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                  {(["Todos","Activos","Inactivos"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setPage(1); }}
                      className="px-3 py-1 text-xs font-bold rounded-full transition-all"
                      style={tab === t
                        ? { backgroundColor: G, color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                        : { color: "#6B7280" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70" style={{ color: G }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filtros Avanzados
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["NOMBRE DEL PROVEEDOR / NIT","ROL ASIGNADO","ESTADO DE CONEXIÓN","ÚLTIMA ACTIVIDAD","ACCIONES DE SEGURIDAD"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(p => {
                    const cs = CONEXION_STYLE[p.estado];
                    return (
                      <tr key={p.id}
                        onMouseEnter={() => setHoveredRow(p.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="border-b border-gray-50 last:border-0 transition-colors"
                        style={{ backgroundColor: hoveredRow === p.id ? "#F8FFFE" : "white" }}>

                        {/* Name */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0" style={{ backgroundColor: p.avatarColor, color: G }}>
                              {p.initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-none">{p.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 font-mono">NIT: {p.nit}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role dropdown */}
                        <td className="px-4 py-4">
                          <RolCell value={roles[p.id]} onChange={v => {
                            setRoles(r => ({ ...r, [p.id]: v }));
                            onToast("Rol actualizado", `${p.name} → ${v}`);
                          }}/>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                            style={{ backgroundColor: cs.bg, color: cs.text }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cs.dot }}/>
                            {p.estado}
                          </span>
                        </td>

                        {/* Last activity */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">{p.ultimaActividad}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.categoria}</p>
                        </td>

                        {/* Security actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Credentials */}
                            <button title="Ver credenciales"
                              onClick={() => onToast("Credenciales", `Acceso de ${p.name} copiado al portapapeles.`)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                            </button>
                            {/* Block / Unblock */}
                            {p.estado === "Acceso Bloqueado" ? (
                              <button title="Desbloquear acceso"
                                onClick={() => onToast("Acceso restaurado", `${p.name} fue desbloqueado.`)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
                              </button>
                            ) : (
                              <button title="Bloquear acceso"
                                onClick={() => onToast("Acceso bloqueado", `${p.name} fue bloqueado temporalmente.`)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                              </button>
                            )}
                            {/* Three-dot menu */}
                            <RowMenu
                              onVer={() => onToast("Perfil del proveedor", `${p.name} — ${p.email}`)}
                              onEditar={() => onToast("Editando proveedor", `${p.name} abierto para edición.`)}
                              onAprobar={() => onToast("Acceso aprobado", `${p.name} habilitado en el portal.`)}
                              onRechazar={() => onToast("Acceso denegado", `${p.name} fue desconectado.`)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Mostrando <b className="text-gray-700">{pageRows.length}</b> de <b className="text-gray-700">{ALL_PROVEEDORES.length}</b> proveedores registrados
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
                    style={pg===page ? { backgroundColor: G, color: "white" } : { border: "1px solid #E5E7EB", color: "#374151" }}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <Icons.ChevRight />
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-gray-400 pb-2">
            © 2023 Municipalidad de Panajachel — Sistema de Gestión Administrativa. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {showConectar && (
        <ConectarProveedorModal
          onClose={() => setShowConectar(false)}
          onSubmit={() => { setShowConectar(false); setTimeout(() => onToast("Proveedor conectado", "Las credenciales fueron enviadas por correo."), 150); }}
        />
      )}
    </>
  );
}

// ─── Proformas / Comparativa data ─────────────────────────────────────────────
interface ProveComparativa {
  id: string; name: string; provId: string; rating: number;
  items: { unit: number; total: number }[];
  entrega: string;
}
const COMP_ITEMS = [
  { label: "Papel Bond Carta 80g",       desc: "Resma de 500 hojas",  cant: 50  },
  { label: "Tóner HP Laser 58A",         desc: "Original, Negro",     cant: 5   },
  { label: "Archivadores de Palanca",    desc: "Lomo ancho, azul",    cant: 30  },
];
const COMP_PROVS: ProveComparativa[] = [
  { id:"p1", name:"Ferretería El Sol",       provId:"PROV-001", rating:4.8, items:[{unit:45,total:2250},{unit:850,total:4250},{unit:28,total:840}],   entrega:"3 días hábiles"      },
  { id:"p2", name:"Distribuidora Panajachel",provId:"PROV-045", rating:4.5, items:[{unit:42.5,total:2125},{unit:890,total:4450},{unit:32,total:960}],  entrega:"Inmediata (24 hrs)"  },
  { id:"p3", name:"Suministros Lago",        provId:"PROV-112", rating:4.2, items:[{unit:48,total:2400},{unit:875,total:4375},{unit:25.5,total:765}],  entrega:"5 días hábiles"      },
];
// best price per item (lowest total)
const BEST_PER_ITEM = COMP_ITEMS.map((_, i) => {
  const totals = COMP_PROVS.map(p => p.items[i].total);
  const min = Math.min(...totals);
  return COMP_PROVS.filter(p => p.items[i].total === min).map(p => p.id);
});

// ─── Confirmar Adjudicación modal ──────────────────────────────────────────────
function ConfirmarAdjudicacionModal({ winner, onClose, onConfirm }: { winner: string; onClose: () => void; onConfirm: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const prov = COMP_PROVS.find(p => p.id === winner)!;
  const total = prov.items.reduce((s, i) => s + i.total, 0);
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`, backdropFilter: "blur(2px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Confirmar Adjudicación</h2>
              <p className="text-xs text-gray-500 mt-0.5">Compra #SOL-2023-084</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl border p-4 flex items-start gap-4" style={{ backgroundColor: GL, borderColor: GB }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
                <Icons.Dependencias />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{prov.name}</p>
                <p className="text-xs text-gray-500">{prov.provId} · ★ {prov.rating}</p>
                <p className="text-lg font-extrabold mt-1" style={{ color: G }}>Q {total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="space-y-2">
              {COMP_ITEMS.map((item, i) => (
                <div key={item.label} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  <span className="font-bold font-mono text-gray-900">Q {prov.items[i].total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-100">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Esta acción generará una Orden de Compra oficial y notificará al proveedor y a DAFIM.
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={() => { onConfirm(); handleClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
              Adjudicar y Generar Orden de Compra
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Proformas View ────────────────────────────────────────────────────────────
function ProformasView({ onToast, onNav }: { onToast: (m: string, s: string) => void; onNav: (key: string) => void }) {
  const [winner,       setWinner]       = useState<string | null>(null);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [adjudicado,   setAdjudicado]   = useState(false);
  const [hoveredCol,   setHoveredCol]   = useState<string | null>(null);

  const fmt = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

  const DECISION_CARDS = [
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
      label: "OFERTA MÁS ECONÓMICA",
      title: "Ferretería El Sol",
      body:  "Ahorro del 2.5% respecto a la media de mercado en esta cotización.",
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8l5 5-5 5"/><path d="M10 16v5"/><path d="M6 16v5"/></svg>,
      label: "MEJOR TIEMPO DE ENTREGA",
      title: "Distribuidora Panajachel",
      body:  "Entrega garantizada en menos de 24 horas para todos los ítems.",
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
      label: "CUMPLIMIENTO TÉCNICO",
      title: null,
      body:  "Se verificó la vigencia de RTU y patente de comercio de los 3 proveedores.",
      status: "Todos los proveedores cumplen",
    },
  ];

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 flex-wrap">
            <span>Adquisiciones</span><Icons.ChevRight/>
            <span>Proformas</span><Icons.ChevRight/>
            <span style={{ color: G }}>Comparativa de Precios</span>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Comparativa de Proformas</h1>
              <p className="text-sm text-gray-500 mt-1">Análisis comparativo para la adjudicación de suministros de oficina.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => onToast("Exportando cuadro comparativo…", "El archivo Excel se descargará en un momento.")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
                style={{ color: G, borderColor: G }}>
                <Icons.PDF /> Exportar Cuadro
              </button>
              <button onClick={() => { if (!winner && !adjudicado) { onToast("Selecciona un proveedor ganador primero.", "Haz clic en «Seleccionar Ganadora» en la tabla."); return; } setShowConfirm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}>
                Finalizar Comparativa
              </button>
            </div>
          </div>

          {/* Solicitud summary card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
                  <Icons.Doc />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 leading-none">Solicitud de Compra #SOL-2023-084</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Resumen del Requerimiento</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full text-white uppercase tracking-wide"
                style={{ backgroundColor: adjudicado ? "#16A34A" : "#22C55E" }}>
                {adjudicado ? "FASE: ADJUDICADO" : "FASE: COMPARACIÓN"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
              {[
                { label: "Dependencia Solicitante", value: "Dirección Administrativa", accent: false },
                { label: "Fecha de Solicitud",      value: "12 de Octubre, 2023",      accent: false },
                { label: "Presupuesto Estimado",    value: "Q 12,500.00",              accent: true  },
                { label: "Categoría",               value: "Suministros de Oficina",   accent: false },
              ].map(f => (
                <div key={f.label} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</p>
                  <p className={`text-sm font-bold mt-1 ${f.accent ? "" : "text-gray-900"}`} style={f.accent ? { color: G } : {}}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                {/* Column headers */}
                <thead>
                  <tr className="border-b border-gray-100">
                    {/* Item col */}
                    <th className="px-4 py-4 text-left w-52 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-xs font-bold text-gray-700">Ítem / Descripción</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">CANT.</p>
                    </th>
                    {COMP_PROVS.map(prov => {
                      const isWinner = winner === prov.id;
                      const isHovered = hoveredCol === prov.id;
                      return (
                        <th key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 text-left border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{ backgroundColor: isWinner ? GL : isHovered ? "#FAFFFE" : undefined, minWidth: 200 }}>
                          <p className="text-sm font-extrabold leading-none" style={{ color: G }}>{prov.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-gray-600 border-gray-200 bg-gray-50">{prov.provId}</span>
                            <span className="text-[11px] font-semibold text-amber-500">★ {prov.rating}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Item rows */}
                  {COMP_ITEMS.map((item, itemIdx) => (
                    <tr key={item.label} className="border-b border-gray-50">
                      <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10">
                        <p className="text-sm font-bold text-gray-900 leading-snug">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        <p className="text-xs font-bold text-gray-500 mt-1">{item.cant.toString().padStart(2,"0")}</p>
                      </td>
                      {COMP_PROVS.map(prov => {
                        const cell = prov.items[itemIdx];
                        const isBest = BEST_PER_ITEM[itemIdx].includes(prov.id);
                        const isWinner = winner === prov.id;
                        return (
                          <td key={prov.id}
                            onMouseEnter={() => setHoveredCol(prov.id)}
                            onMouseLeave={() => setHoveredCol(null)}
                            className="px-4 py-4 border-r border-gray-50 last:border-r-0 transition-colors"
                            style={{ backgroundColor: isWinner ? GL : hoveredCol === prov.id ? "#FAFFFE" : undefined }}>
                            <p className="text-xs text-gray-500">U: {fmt(cell.unit)}</p>
                            <p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmt(cell.total)}</p>
                            {isBest && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: GL, color: G }}>
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                MEJOR PRECIO
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Tiempo de entrega row */}
                  <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                    <td className="px-4 py-3.5 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-sm font-bold text-gray-700">Tiempo de Entrega</p>
                    </td>
                    {COMP_PROVS.map(prov => {
                      const isWinner = winner === prov.id;
                      return (
                        <td key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-3.5 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{ backgroundColor: isWinner ? GL : hoveredCol === prov.id ? "#FAFFFE" : "#F9FAFB" }}>
                          <p className="text-sm font-semibold text-gray-700">{prov.entrega}</p>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total row */}
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Total General</p>
                    </td>
                    {COMP_PROVS.map(prov => {
                      const total = prov.items.reduce((s, i) => s + i.total, 0);
                      const isWinner = winner === prov.id;
                      return (
                        <td key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{ backgroundColor: isWinner ? GL : hoveredCol === prov.id ? "#FAFFFE" : undefined }}>
                          <p className="text-xl font-extrabold" style={{ color: isWinner ? G : "#111827" }}>{fmt(total)}</p>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Award buttons row */}
                  <tr>
                    <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10"/>
                    {COMP_PROVS.map(prov => {
                      const isWinner = winner === prov.id;
                      return (
                        <td key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{ backgroundColor: isWinner ? GL : hoveredCol === prov.id ? "#FAFFFE" : undefined }}>
                          {isWinner ? (
                            <button onClick={() => setShowConfirm(true)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm active:scale-95"
                              style={{ backgroundColor: G }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                              Adjudicar Oferta
                            </button>
                          ) : (
                            <button onClick={() => setWinner(prov.id)}
                              className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50 active:scale-95"
                              style={{ color: G, borderColor: G }}>
                              Seleccionar Ganadora
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision analysis cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DECISION_CARDS.map((card, i) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL, color: G }}>
                    {card.icon}
                  </div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{card.label}</p>
                </div>
                {card.status && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/>
                    <p className="text-sm font-bold text-gray-900">{card.status}</p>
                  </div>
                )}
                {card.title && <p className="text-base font-extrabold mb-1" style={{ color: G }}>{card.title}</p>}
                <p className="text-sm text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Admin notes */}
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-600 mb-3">Notas Administrativas:</p>
            <ul className="space-y-1.5">
              {[
                "Los precios incluyen IVA (12%) conforme a la legislación guatemalteca vigente.",
                "La validez de las proformas es de 30 días calendario a partir de la fecha de recepción.",
                "Se recomienda la adjudicación a Distribuidora Panajachel debido a la urgencia del requerimiento a pesar de no ser el precio más bajo absoluto.",
              ].map(note => (
                <li key={note} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-gray-400"/>
                  {note}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {showConfirm && winner && (
        <ConfirmarAdjudicacionModal
          winner={winner}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            setAdjudicado(true);
            const prov = COMP_PROVS.find(p => p.id === winner)!;
            setTimeout(() => onToast("¡Oferta adjudicada!", `Orden de compra generada para ${prov.name}.`), 150);
          }}
        />
      )}
    </>
  );
}

// ─── Facturacion data ─────────────────────────────────────────────────────────
type FactEstado = "VENCIDO" | "PENDIENTE" | "PAGADO";
interface Factura {
  id: string; num: string; proveedor: string; fecha: string;
  monto: number; estado: FactEstado;
  nit: string; concepto: string; xml: string;
}
const ALL_FACTURAS: Factura[] = [
  { id:"f1", num:"FEL-49201", proveedor:"Suministros Eléctricos S.A.", fecha:"25/09/2023", monto:45200,   estado:"VENCIDO",   nit:"289301-4", concepto:"Material eléctrico para alumbrado",   xml:"XML-49201" },
  { id:"f2", num:"FEL-38492", proveedor:"Constructora del Lago",       fecha:"01/10/2023", monto:128000,  estado:"PENDIENTE",  nit:"102938-4", concepto:"Construcción muro perimetral",      xml:"XML-38492" },
  { id:"f3", num:"FEL-38481", proveedor:"Papelería El Centro",         fecha:"20/09/2023", monto:4150,    estado:"PAGADO",     nit:"334455-K", concepto:"Suministros de papelería Q3",       xml:"XML-38481" },
  { id:"f4", num:"FEL-38477", proveedor:"Distribuidora Panajachel",    fecha:"18/09/2023", monto:12800,   estado:"PAGADO",     nit:"459823-1", concepto:"Distribución de insumos limpieza", xml:"XML-38477" },
  { id:"f5", num:"FEL-38455", proveedor:"Mantenimiento Global S.A.",   fecha:"15/09/2023", monto:33000,   estado:"PENDIENTE",  nit:"778899-2", concepto:"Mantenimiento edificio municipal", xml:"XML-38455" },
  { id:"f6", num:"FEL-38400", proveedor:"Seguridad Total",             fecha:"10/09/2023", monto:25000,   estado:"PAGADO",     nit:"112233-6", concepto:"Servicio mensual de seguridad",     xml:"XML-38400" },
];

const ESTADO_STYLE: Record<FactEstado, { bg: string; color: string }> = {
  VENCIDO:   { bg: "#FEE2E2", color: "#DC2626" },
  PENDIENTE: { bg: "#FEF9C3", color: "#854D0E" },
  PAGADO:    { bg: "#DCFCE7", color: "#16A34A" },
};

const CAL_DAYS = [
  { d: 25, wk: true }, { d: 26, wk: true }, { d: 27, wk: true }, { d: 28, wk: true }, { d: 29, wk: true }, { d: 30, wk: false, red: true }, { d: 1, wk: false, red: true },
  { d: 2,  wk: true, cur: true }, { d: 3, wk: true }, { d: 4, wk: true }, { d: 5, wk: true, dot: true }, { d: 6, wk: true }, { d: 7, wk: false, red: true }, { d: 8, wk: false, red: true },
];

// ─── Nueva Orden de Pago modal ─────────────────────────────────────────────────
function NuevaOrdenModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const [proveedor, setProveedor] = useState(""); const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState(""); const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<"FACTURA" | "CONTRATO" | "PLANILLA">("FACTURA");
  const submit = () => {
    if (!proveedor || !monto) return;
    handleClose();
    setTimeout(() => onToast("Orden de pago creada", `Se registró la orden para ${proveedor}.`), 300);
  };
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`, backdropFilter: "blur(2px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Facturacion />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Nueva Orden de Pago</h2>
              <p className="text-xs text-gray-500 mt-0.5">Registro de compromiso financiero municipal</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["FACTURA","CONTRATO","PLANILLA"] as const).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className="py-2 text-xs font-bold rounded-lg border-2 transition-all"
                  style={{ borderColor: tipo===t ? G : "#E5E7EB", backgroundColor: tipo===t ? GL : "white", color: tipo===t ? G : "#6B7280" }}>
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Proveedor *</label>
              <input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Nombre del proveedor"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Concepto</label>
              <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Descripción del servicio o bien"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Monto (Q) *</label>
                <input value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" type="number"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Fecha de Vencimiento</label>
                <input value={fecha} onChange={e => setFecha(e.target.value)} type="date"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={submit}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G, opacity: (!proveedor || !monto) ? 0.5 : 1 }}>
              Crear Orden de Pago
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Factura Detail Drawer ─────────────────────────────────────────────────────
function FacturaDrawer({ factura, onClose, onToast }: { factura: Factura; onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOpen(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setOpen(false); setTimeout(onClose, 300); };
  const est = ESTADO_STYLE[factura.estado];
  const fmt = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  return (
    <>
      <div className="fixed inset-0 z-[190]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${open ? 0.4 : 0})`, transition: "background-color 0.3s" }}/>
      <div className="fixed top-0 right-0 h-full w-full max-w-md z-[195] bg-white shadow-2xl flex flex-col"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(.16,1,.3,1)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
            <Icons.Doc />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-gray-900 leading-none">{factura.num}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{factura.proveedor}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: est.bg, color: est.color }}>{factura.estado}</span>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all ml-1"><Icons.X /></button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {/* Comprobante mock */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: GL }}>
              <svg className="w-7 h-7" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">Comprobante {factura.xml}</p>
              <p className="text-xs text-gray-400 mt-0.5">Factura Electrónica en Línea (FEL)</p>
            </div>
            <button onClick={() => onToast("Descargando comprobante", `${factura.xml}.pdf se descargará en un momento.`)}
              className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: GL, color: G }}>
              <Icons.PDF /> Descargar PDF
            </button>
          </div>
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "N.° Factura",    value: factura.num         },
              { label: "NIT Proveedor",  value: factura.nit         },
              { label: "Fecha Emisión",  value: factura.fecha       },
              { label: "Monto Total",    value: fmt(factura.monto), accent: true },
            ].map(f => (
              <div key={f.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</p>
                <p className={`text-sm font-bold mt-1 ${f.accent ? "" : "text-gray-900"}`} style={f.accent ? { color: G } : {}}>{f.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Concepto</p>
            <p className="text-sm text-gray-800 mt-1">{factura.concepto}</p>
          </div>
          {/* Actions */}
          {factura.estado !== "PAGADO" && (
            <div className="space-y-2.5">
              {factura.estado === "VENCIDO" && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 border" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">Esta factura ha vencido. Se requiere aprobación del Director Administrativo para procesarla.</p>
                </div>
              )}
              <button onClick={() => { onToast("Pago aprobado", `${factura.num} marcada para procesarse.`); handleClose(); }}
                className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: G }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                Aprobar y Procesar Pago
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Facturación View ──────────────────────────────────────────────────────────
function FacturacionView({ onToast, onNav }: { onToast: (m: string, s: string) => void; onNav: (k: string) => void }) {
  const [showNuevaOrden, setShowNuevaOrden] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<"Todos" | FactEstado>("Todos");
  const [showEstadoDD, setShowEstadoDD] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [calMonth, setCalMonth] = useState(0); // 0 = Octubre 2023
  const estadoDDRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (estadoDDRef.current && !estadoDDRef.current.contains(e.target as Node)) setShowEstadoDD(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = estadoFilter === "Todos" ? ALL_FACTURAS : ALL_FACTURAS.filter(f => f.estado === estadoFilter);
  const fmt = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

  const MONTHS = ["Octubre 2023", "Noviembre 2023", "Diciembre 2023"];

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Facturación y Órdenes de Pago</h1>
              <p className="text-sm text-gray-500 mt-1">Gestión administrativa de compromisos financieros municipales.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => onToast("Exportando reporte…", "El archivo se descargará en breve.")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
                style={{ color: G, borderColor: G }}>
                <Icons.PDF /> Exportar Reporte
              </button>
              <button onClick={() => setShowNuevaOrden(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}>
                <Icons.Plus /> Nueva Orden de Pago
              </button>
            </div>
          </div>

          {/* KPI + upload row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">Total por Pagar<br/>(Mes)</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL }}>
                  <Icons.Facturacion />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 mt-3 font-mono leading-none">Q<br/>1,245,800.50</p>
              <p className="text-xs font-bold mt-1.5" style={{ color: G }}>↑ +12% vs mes anterior</p>
            </div>
            {/* KPI 2 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Facturas<br/>Pendientes</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL }}>
                  <svg className="w-4 h-4" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 mt-3 font-mono">42</p>
              <p className="text-xs text-gray-500 mt-1.5">15 en revisión técnica</p>
            </div>
            {/* KPI 3 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Vencimientos<br/>Próximos</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 16l-3-3-3 3"/></svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold font-mono mt-3 text-red-600">08</p>
              <p className="text-xs font-semibold text-red-500 mt-1.5">Requiere acción inmediata</p>
            </div>
            {/* Upload card */}
            <div className="rounded-xl text-white px-5 py-4 flex flex-col gap-3" style={{ backgroundColor: G }}>
              <p className="text-sm font-extrabold leading-none">Portal de Proveedores</p>
              <p className="text-xs opacity-80 leading-relaxed">Carga digital de facturas y documentos de soporte para agilizar procesos.</p>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); onToast("Factura subida con éxito", "El documento fue recibido y está en proceso de validación."); }}
                onClick={() => onToast("Factura subida con éxito", "El documento fue recibido y está en proceso de validación.")}
                className="flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer transition-all"
                style={{ borderColor: isDragging ? "#FFFFFF" : "rgba(255,255,255,0.45)", backgroundColor: isDragging ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)" }}>
                <svg className="w-7 h-7 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                <p className="text-[10px] font-semibold text-center opacity-80 leading-tight">Arrastra o selecciona<br/>archivos PDF/XML</p>
              </div>
            </div>
          </div>

          {/* Main two-column section */}
          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">

            {/* Left: Calendar widget */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 w-full xl:w-64 shrink-0">
              <p className="text-base font-extrabold text-gray-900 mb-3">Cronograma de Pagos</p>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalMonth(m => Math.max(0, m - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="text-xs font-bold text-gray-700">{MONTHS[calMonth]}</span>
                <button onClick={() => setCalMonth(m => Math.min(MONTHS.length - 1, m + 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["L","M","M","J","V","S","D"].map((d,i) => (
                  <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {CAL_DAYS.map((day, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-default
                      ${day.cur ? "text-white" : day.red ? "text-red-500" : "text-gray-600 hover:bg-gray-100"}`}
                      style={day.cur ? { backgroundColor: G } : {}}>
                      {day.d}
                    </div>
                    {day.dot && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: G }}/>}
                  </div>
                ))}
              </div>
              {/* Alerts */}
              <div className="space-y-2.5 mt-4">
                <div className="rounded-lg px-3 py-2.5 border-l-4 border-red-400 bg-red-50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p className="text-[11px] font-extrabold text-red-600">Vence Mañana</p>
                  </div>
                  <p className="text-[11px] text-red-700 leading-snug">Suministros Eléctricos S.A.</p>
                  <p className="text-[11px] font-bold text-red-600">Q 45,200.00</p>
                </div>
                <div className="rounded-lg px-3 py-2.5 border-l-4 bg-emerald-50" style={{ borderColor: G }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p className="text-[11px] font-extrabold" style={{ color: G }}>Pago Programado (Oct 05)</p>
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: "#166534" }}>Constructora del Lago</p>
                  <p className="text-[11px] font-bold" style={{ color: G }}>Q 128,000.00</p>
                </div>
              </div>
            </div>

            {/* Right: Invoice table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                <p className="text-base font-extrabold text-gray-900">Historial de Facturas y Pagos</p>
                {/* Estado filter */}
                <div className="relative" ref={estadoDDRef}>
                  <button onClick={() => setShowEstadoDD(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    {estadoFilter === "Todos" ? "Todos los estados" : estadoFilter}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showEstadoDD && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                      {(["Todos","PAGADO","PENDIENTE","VENCIDO"] as const).map(opt => (
                        <button key={opt} onClick={() => { setEstadoFilter(opt as typeof estadoFilter); setShowEstadoDD(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: estadoFilter===opt ? G : "#374151", fontWeight: estadoFilter===opt ? 700 : 400 }}>
                          {opt === "Todos" ? "Todos los estados" : opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                      {["NO. FACTURA","PROVEEDOR","FECHA EMISIÓN","MONTO","ESTADO"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(f => {
                      const est = ESTADO_STYLE[f.estado];
                      return (
                        <tr key={f.id} onClick={() => setSelectedFactura(f)}
                          className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-green-50/40 group">
                          <td className="px-5 py-4">
                            <p className="text-sm font-extrabold text-gray-900 leading-none">{f.num.split("-")[0]}-</p>
                            <p className="text-sm font-extrabold text-gray-900">{f.num.split("-")[1]}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700 leading-snug">{f.proveedor}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600">{f.fecha}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-extrabold text-gray-900 font-mono">{fmt(f.monto)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: est.bg, color: est.color }}>{f.estado}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
                <p className="text-xs text-gray-500">Mostrando <b className="text-gray-700">{filtered.length}</b> de <b className="text-gray-700">128</b> facturas</p>
                <div className="flex items-center gap-1.5">
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Anterior</button>
                  {[1,2,3].map(p => (
                    <button key={p} className="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all"
                      style={p===1 ? { backgroundColor: G, color: "white" } : { color: "#6B7280", border: "1px solid #E5E7EB" }}>
                      {p}
                    </button>
                  ))}
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Siguiente</button>
                </div>
              </div>
            </div>
          </div>

          {/* Transparency banner */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL }}>
                  <svg className="w-5 h-5" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Transparencia Municipal</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toda transacción está sujeta a auditoría de la Contraloría General de Cuentas.</p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Auditoría</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">22/09/2023</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado de Fondo</p>
                  <p className="text-sm font-extrabold mt-0.5" style={{ color: G }}>Saludable</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showNuevaOrden && <NuevaOrdenModal onClose={() => setShowNuevaOrden(false)} onToast={onToast} />}
      {selectedFactura && <FacturaDrawer factura={selectedFactura} onClose={() => setSelectedFactura(null)} onToast={onToast} />}
    </>
  );
}

// ─── Bodega data ──────────────────────────────────────────────────────────────
type VerifState = "RECIBIDO" | "RECHAZADO" | "FALTANTE" | null;
interface RecepcionItem { id: string; name: string; sku: string; esperado: string; }
const OC_ITEMS: RecepcionItem[] = [
  { id: "i1", name: "Resmas de Papel Bond A4 (75g)",   sku: "SKU: IN-001-PB", esperado: "50 u."  },
  { id: "i2", name: "Marcadores Permanentes (Negro)",   sku: "SKU: IN-012-MP", esperado: "24 u."  },
  { id: "i3", name: "Folders Manilas Oficio",           sku: "SKU: IN-045-FM", esperado: "500 u." },
];
type HistEstado = "COMPLETO" | "CON RECHAZO";
interface HistEntry { id: string; fecha: string; estado: HistEstado; empresa: string; oc: string; detalle: string; link: string; }
const HIST_ENTRIES: HistEntry[] = [
  { id:"h1", fecha:"OCT 24, 2023 · 09:45 AM", estado:"COMPLETO",    empresa:"Suministros Ofimática S.A.", oc:"OC-2023-042", detalle:"5 ítems recibidos sin novedad.",                      link:"Ver detalles" },
  { id:"h2", fecha:"OCT 22, 2023 · 14:20 PM", estado:"CON RECHAZO", empresa:"Limpieza Profesional GT",    oc:"OC-2023-039", detalle:"2 Galones de Cloro rechazados por derrame.",            link:"Ver reporte"  },
  { id:"h3", fecha:"OCT 21, 2023 · 11:10 AM", estado:"COMPLETO",    empresa:"Mantenimiento Global",       oc:"OC-2023-038", detalle:"Repuestos para bomba de agua.",                         link:"Ver detalles" },
  { id:"h4", fecha:"OCT 19, 2023 · 08:30 AM", estado:"COMPLETO",    empresa:"Insumos El Lago",            oc:"OC-2023-035", detalle:"12 Baterías de alto rendimiento.",                      link:"Ver detalles" },
];

// ─── Nueva Recepción modal ─────────────────────────────────────────────────────
function NuevaRecepcionModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const [oc, setOc] = useState(""); const [prov, setProv] = useState("");
  const submit = () => {
    if (!oc) return;
    handleClose();
    setTimeout(() => onToast("Recepción iniciada", `OC ${oc || "nueva"} cargada para verificación.`), 300);
  };
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`, backdropFilter: "blur(2px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Bodega />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Nueva Recepción</h2>
              <p className="text-xs text-gray-500 mt-0.5">Buscar Orden de Compra para recepción</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">N.° Orden de Compra *</label>
              <input value={oc} onChange={e => setOc(e.target.value)} placeholder="Ej. OC-2023-046"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Proveedor</label>
              <input value={prov} onChange={e => setProv(e.target.value)} placeholder="Nombre del proveedor"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
            </div>
            <div className="rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed border border-gray-100" style={{ backgroundColor: GL }}>
              Al confirmar, la orden quedará en estado <b>EN PROCESO</b> y se habilitará el panel de verificación de ítems.
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={submit}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G, opacity: !oc ? 0.5 : 1 }}>
              Cargar Orden para Recepción
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Finalizar Ingreso modal ───────────────────────────────────────────────────
function FinalizarIngresoModal({ states, onClose, onToast }: { states: Record<string, VerifState>; onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const recibidos  = OC_ITEMS.filter(i => states[i.id] === "RECIBIDO").length;
  const rechazados = OC_ITEMS.filter(i => states[i.id] === "RECHAZADO").length;
  const faltantes  = OC_ITEMS.filter(i => states[i.id] === "FALTANTE").length;
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`, backdropFilter: "blur(2px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto text-center"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="px-6 pt-8 pb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4" style={{ backgroundColor: G }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">Ingreso a Inventario Confirmado</h2>
            <p className="text-sm text-gray-500 mt-1">OC-2023-045 · Papelería del Lago S.A.</p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Recibidos",  value: recibidos,  color: G          },
                { label: "Rechazados", value: rechazados, color: "#DC2626"   },
                { label: "Faltantes",  value: faltantes,  color: "#D97706"   },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 py-3">
                  <p className="text-2xl font-extrabold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">El stock del inventario ha sido actualizado. Se generó el acta de recepción <b>REC-2023-045</b>.</p>
          </div>
          <div className="px-6 pb-6">
            <button onClick={() => { handleClose(); setTimeout(() => onToast("Inventario actualizado", "Acta REC-2023-045 generada y archivada."), 300); }}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
              Aceptar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Bodega View ───────────────────────────────────────────────────────────────
function BodegaView({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [verifStates, setVerifStates] = useState<Record<string, VerifState>>({});
  const [showNuevaRec, setShowNuevaRec] = useState(false);
  const [showFinalizar, setShowFinalizar] = useState(false);

  const setVerif = (id: string, val: VerifState) =>
    setVerifStates(prev => ({ ...prev, [id]: prev[id] === val ? null : val }));

  const allVerified = OC_ITEMS.every(i => verifStates[i.id] != null);

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Bodega y Recepción</h1>
              <p className="text-sm text-gray-500 mt-1">Control de ingresos de mercancía e inventario de insumos.</p>
            </div>
            <button onClick={() => setShowNuevaRec(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}>
              <Icons.Plus /> Nueva Recepción
            </button>
          </div>

          {/* Top 2-panel row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Alertas de Stock */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-extrabold text-gray-900">Alertas de Stock</p>
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: "📄", name: "Papel Bond A4",  sub: "Mín: 50 | Actual: 12", badge: "Crítico", bg: "#FEE2E2", color: "#DC2626" },
                  { icon: "🖨",  name: "Tóner HP-415X", sub: "Mín: 5 | Actual: 4",   badge: "Bajo",    bg: "#DCFCE7", color: "#16A34A" },
                ].map(a => (
                  <div key={a.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                    <span className="text-lg shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-none">{a.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.sub}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: a.bg, color: a.color }}>{a.badge}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onToast("Inventario completo", "Cargando vista de inventario detallado...")}
                className="mt-4 w-full py-2.5 text-sm font-bold rounded-xl border-2 transition-all hover:bg-green-50 active:scale-95"
                style={{ color: G, borderColor: G }}>
                Ver Inventario Completo
              </button>
            </div>

            {/* Resumen Mensual */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-extrabold text-gray-900">Resumen Mensual</p>
                <p className="text-sm font-semibold text-gray-400">Octubre 2023</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-2">
                {[
                  { value: "24", label: "Recepciones Exitosas", color: G        },
                  { value: "03", label: "Devoluciones",         color: "#DC2626" },
                  { value: "12", label: "Órdenes Pendientes",   color: G        },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center px-3 py-3 text-center">
                    <p className="text-4xl font-extrabold font-mono leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-2 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom two-column: verification panel + history */}
          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">

            {/* Verification panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">Recepción de Pedido: OC-2023-045</p>
                  <p className="text-xs text-gray-500 mt-0.5">Proveedor: Papelería del Lago S.A.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>EN PROCESO</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_1fr] px-5 py-3 border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Producto / Insumo</p>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center px-6">Esperado</p>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Acciones de Verificación</p>
              </div>

              {/* Item rows */}
              {OC_ITEMS.map((item, i) => {
                const state = verifStates[item.id] ?? null;
                return (
                  <div key={item.id}
                    className="grid grid-cols-[1fr_auto_1fr] px-5 py-4 border-b border-gray-50 last:border-b-0 items-center transition-colors"
                    style={{ backgroundColor: state === "RECIBIDO" ? "#F0FDF4" : state === "RECHAZADO" ? "#FFF5F5" : state === "FALTANTE" ? "#FFFBEB" : undefined }}>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">{item.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.sku}</p>
                    </div>
                    <p className="text-sm font-extrabold px-6 font-mono" style={{ color: G }}>{item.esperado}</p>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* Recibido */}
                      <button onClick={() => setVerif(item.id, "RECIBIDO")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={state === "RECIBIDO"
                          ? { backgroundColor: G, color: "white" }
                          : { backgroundColor: "white", color: G, border: `1.5px solid ${G}` }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                        Recibido
                      </button>
                      {/* Rechazar */}
                      <button onClick={() => setVerif(item.id, "RECHAZADO")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={state === "RECHAZADO"
                          ? { backgroundColor: "#DC2626", color: "white" }
                          : { backgroundColor: "white", color: "#DC2626", border: "1.5px solid #DC2626" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Rechazar
                      </button>
                      {/* Faltante */}
                      <button onClick={() => setVerif(item.id, "FALTANTE")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={state === "FALTANTE"
                          ? { backgroundColor: "#D97706", color: "white" }
                          : { backgroundColor: "white", color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Faltante
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Footer actions */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                  Cancelar Recepción
                </button>
                <button
                  onClick={() => { if (!allVerified) { onToast("Verifica todos los ítems", "Marca cada ítem como Recibido, Rechazado o Faltante."); return; } setShowFinalizar(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: G, opacity: allVerified ? 1 : 0.6 }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Finalizar y Cargar a Inventario
                </button>
              </div>
            </div>

            {/* Historial Reciente sidebar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full xl:w-72 shrink-0 overflow-hidden">
              <p className="px-5 pt-5 pb-3 text-base font-extrabold text-gray-900 border-b border-gray-100">Historial Reciente</p>
              <div className="divide-y divide-gray-50">
                {HIST_ENTRIES.map(h => {
                  const isRechazo = h.estado === "CON RECHAZO";
                  return (
                    <div key={h.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">{h.fecha}</p>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                          style={isRechazo
                            ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                            : { backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                          {h.estado}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug mt-1">{h.empresa}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{h.oc} | {h.detalle}</p>
                      <button onClick={() => onToast(h.link, `Cargando detalles de ${h.oc}...`)}
                        className="flex items-center gap-1.5 text-xs font-semibold mt-2 transition-colors hover:opacity-70"
                        style={{ color: G }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {h.link}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={() => onToast("Historial completo", "Cargando historial de todas las recepciones...")}
                  className="w-full text-xs font-extrabold uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ color: G }}>
                  Ver Historial Completo
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showNuevaRec   && <NuevaRecepcionModal onClose={() => setShowNuevaRec(false)}   onToast={onToast} />}
      {showFinalizar  && <FinalizarIngresoModal states={verifStates} onClose={() => setShowFinalizar(false)} onToast={onToast} />}
    </>
  );
}

// ─── Reportes data ────────────────────────────────────────────────────────────
const CHART_DATA_BY_MONTH: Record<string, { name: string; value: number }[]> = {
  "Octubre 2023": [
    { name: "Construcciones\nPanajachel",   value: 142000 },
    { name: "Suministros\nGlobales S.A.",   value: 88500  },
    { name: "Ferretería\nEl Lago",          value: 65200  },
    { name: "Servicios de\nLimpieza",       value: 54300  },
    { name: "Papelería\nProgreso",          value: 45750  },
  ],
  "Septiembre 2023": [
    { name: "Construcciones\nPanajachel",   value: 118000 },
    { name: "Suministros\nGlobales S.A.",   value: 76200  },
    { name: "Ferretería\nEl Lago",          value: 59800  },
    { name: "Servicios de\nLimpieza",       value: 49100  },
    { name: "Papelería\nProgreso",          value: 38400  },
  ],
  "Agosto 2023": [
    { name: "Construcciones\nPanajachel",   value: 135000 },
    { name: "Suministros\nGlobales S.A.",   value: 92300  },
    { name: "Ferretería\nEl Lago",          value: 48700  },
    { name: "Servicios de\nLimpieza",       value: 61500  },
    { name: "Papelería\nProgreso",          value: 29800  },
  ],
};
const MONTHS_REPORT = ["Octubre 2023", "Septiembre 2023", "Agosto 2023"];

type DeptoEstado = "Dentro de Límite" | "Excedido" | "En Proceso";
interface DeptoRow { dep: string; resp: string; presupuesto: number; gasto: number; estado: DeptoEstado; }
const DEPTO_ROWS: DeptoRow[] = [
  { dep: "Obras Públicas",    resp: "Ing. Carlos Méndez",    presupuesto: 500000, gasto: 425000, estado: "Dentro de Límite" },
  { dep: "Servicios Públicos",resp: "Licda. Elena Soto",     presupuesto: 250000, gasto: 265000, estado: "Excedido"          },
  { dep: "Administración",    resp: "Don Roberto García",    presupuesto: 150000, gasto: 138500, estado: "En Proceso"        },
  { dep: "Turismo y Cultura", resp: "Sofía Alvarado",        presupuesto: 80000,  gasto: 72100,  estado: "Dentro de Límite" },
];
const DEPTO_ESTADO_STYLE: Record<DeptoEstado, { bg: string; color: string }> = {
  "Dentro de Límite": { bg: "#DCFCE7", color: "#16A34A" },
  "Excedido":         { bg: "#FEE2E2", color: "#DC2626" },
  "En Proceso":       { bg: "#FEF9C3", color: "#92400E" },
};

// ─── Filtrar Reportes flyout ───────────────────────────────────────────────────
function FiltrarReportesModal({ onClose, onApply }: { onClose: () => void; onApply: (estado: DeptoEstado | "Todos") => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const [sel, setSel] = useState<DeptoEstado | "Todos">("Todos");
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.35 : 0})`, backdropFilter: "blur(1px)", transition: "background-color 0.25s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto"
          style={{ animation: "modalIn 0.2s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-none">Filtrar Departamentos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Filtrar por estado presupuestario</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-2">
            {(["Todos", "Dentro de Límite", "Excedido", "En Proceso"] as const).map(opt => {
              const active = sel === opt;
              const s = opt !== "Todos" ? DEPTO_ESTADO_STYLE[opt] : null;
              return (
                <button key={opt} onClick={() => setSel(opt)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold"
                  style={active
                    ? { borderColor: G, backgroundColor: GL, color: G }
                    : { borderColor: "#E5E7EB", backgroundColor: "white", color: "#374151" }}>
                  <span>{opt === "Todos" ? "Todos los estados" : opt}</span>
                  {s && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{opt}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
            <button onClick={() => { onApply(sel); handleClose(); }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: G }}>
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Custom bar chart tick ─────────────────────────────────────────────────────
function MultiLineTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (x === undefined || y === undefined || !payload) return null;
  const lines = (payload.value ?? "").split("\n");
  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#9CA3AF" fontSize={10} fontWeight={600}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{l}</tspan>)}
    </text>
  );
}

// ─── Reportes View ─────────────────────────────────────────────────────────────
function ReportesView({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [month, setMonth]           = useState("Octubre 2023");
  const [showMonthDD, setShowMonthDD] = useState(false);
  const [showFiltrar, setShowFiltrar] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<DeptoEstado | "Todos">("Todos");
  const [hoveredBar, setHoveredBar]   = useState<number | null>(null);
  const monthDDRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (monthDDRef.current && !monthDDRef.current.contains(e.target as Node)) setShowMonthDD(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const chartData = CHART_DATA_BY_MONTH[month];
  const fmtQ = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const fmtShort = (n: number) => n >= 1000 ? `Q${(n / 1000).toFixed(0)}k` : `Q${n}`;
  const filteredRows = estadoFilter === "Todos" ? DEPTO_ROWS : DEPTO_ROWS.filter(r => r.estado === estadoFilter);

  const varColor = (depto: DeptoRow) => {
    const diff = ((depto.gasto - depto.presupuesto) / depto.presupuesto) * 100;
    if (depto.estado === "Excedido") return "#DC2626";
    if (depto.estado === "Dentro de Límite") return G;
    return "#6B7280";
  };
  const varText = (depto: DeptoRow) => {
    const diff = ((depto.gasto - depto.presupuesto) / depto.presupuesto) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  };

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Reportes</h1>
              <p className="text-sm text-gray-500 mt-1">Análisis de ejecución presupuestaria y parámetros del sistema.</p>
            </div>
            <button onClick={() => onToast("Generando reporte PDF…", "Ejecución Presupuestaria — el archivo se descargará en breve.")}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}>
              <Icons.PDF /> Exportar a PDF
            </button>
          </div>

          {/* Analytics row: chart (left) + stat cards (right) */}
          <div className="flex gap-4 items-stretch flex-wrap xl:flex-nowrap">

            {/* Bar chart card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-base font-extrabold" style={{ color: G }}>Gasto Mensual por Proveedor</p>
                {/* Month dropdown */}
                <div className="relative" ref={monthDDRef}>
                  <button onClick={() => setShowMonthDD(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    {month}
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showMonthDD && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[180px]">
                      {MONTHS_REPORT.map(m => (
                        <button key={m} onClick={() => { setMonth(m); setShowMonthDD(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: month === m ? G : "#374151", fontWeight: month === m ? 700 : 400 }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 240 }}>
                <BarChart data={chartData} width={undefined as unknown as number} height={240}
                  margin={{ top: 8, right: 8, bottom: 32, left: 10 }}
                  style={{ width: "100%" }}
                  className="w-full">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={<MultiLineTick />} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(30,94,47,0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg">
                          <p className="text-gray-300 mb-0.5">{(d.payload as { name: string }).name.replace("\n", " ")}</p>
                          <p>{fmtQ(d.value as number)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={hoveredBar === i ? "#166534" : G}
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </div>

            {/* Right stat cards */}
            <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">

              {/* Total gasto card — dark green */}
              <div className="rounded-xl p-5 text-white flex flex-col gap-2" style={{ backgroundColor: G }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-75">Total Gasto Mensual</p>
                <p className="text-3xl font-extrabold leading-tight font-mono">Q395,750.00</p>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  12.5% respecto al mes anterior
                </p>
              </div>

              {/* Eficiencia presupuestaria card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <p className="text-sm font-extrabold text-gray-900">Eficiencia Presupuestaria</p>
                {/* Progress bar */}
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: "78%", backgroundColor: G }}/>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span style={{ color: G }}>Ejecutado: 78%</span>
                  <span className="text-gray-400">Restante: 22%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-base font-extrabold text-gray-900">Gastos por Departamento</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowFiltrar(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50"
                  style={{ color: G, borderColor: G }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  {estadoFilter !== "Todos" ? estadoFilter : "Filtrar"}
                </button>
                {estadoFilter !== "Todos" && (
                  <button onClick={() => setEstadoFilter("Todos")}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors hover:bg-red-100 border border-gray-200 text-gray-500">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                    {["Departamento","Responsable","Presupuesto Asignado","Gasto Real","Estado","Variación"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(row => {
                    const es = DEPTO_ESTADO_STYLE[row.estado];
                    const vt = varText(row);
                    const vc = varColor(row);
                    return (
                      <tr key={row.dep} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4"><p className="text-sm font-bold text-gray-900">{row.dep}</p></td>
                        <td className="px-5 py-4"><p className="text-sm text-gray-600">{row.resp}</p></td>
                        <td className="px-5 py-4"><p className="text-sm text-gray-700 font-mono">{fmtQ(row.presupuesto)}</p></td>
                        <td className="px-5 py-4"><p className="text-sm font-extrabold text-gray-900 font-mono">{fmtQ(row.gasto)}</p></td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>{row.estado}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold" style={{ color: vc }}>{vt}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 py-2">
            © 2023 Municipalidad de Panajachel - Sistema de Auditoría y Transparencia
          </p>

        </div>
      </div>

      {showFiltrar && (
        <FiltrarReportesModal onClose={() => setShowFiltrar(false)} onApply={v => setEstadoFilter(v)} />
      )}
    </>
  );
}

// ─── Cerrar Sesión Modal ──────────────────────────────────────────────────────
function CerrarSesionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`, backdropFilter: "blur(3px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto text-center"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="px-6 pt-8 pb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-red-50">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-snug">¿Desea cerrar la sesión activa?</h2>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Está a punto de salir del Sistema de Gestión Municipal de Panajachel. Guarde sus cambios antes de continuar.
            </p>
          </div>
          <div className="flex gap-3 px-6 py-6">
            <button onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button onClick={() => { setVisible(false); setTimeout(onConfirm, 280); }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: "#DC2626" }}>
              Confirmar y Salir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Configuración View ───────────────────────────────────────────────────────
type ConfigTab = "apariencia" | "perfil" | "notificaciones" | "seguridad" | "auditoria";

const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
  { key: "apariencia",     label: "Apariencia y Tema"    },
  { key: "perfil",         label: "Perfil de Usuario"    },
  { key: "notificaciones", label: "Notificaciones"       },
  { key: "seguridad",      label: "Seguridad y Accesos"  },
  { key: "auditoria",      label: "Auditoría"            },
];

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none"
      style={{ backgroundColor: on ? G : "#D1D5DB" }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
        style={{ transform: on ? "translateX(24px)" : "translateX(0)" }}/>
    </button>
  );
}

function ConfiguracionView({ onToast, onLogout, dark, onDark, accent, onAccent, compact, onCompact, anim, onAnim }:
  { onToast:(m:string,s:string)=>void; onLogout:()=>void;
    dark:boolean; onDark:(v:boolean)=>void;
    accent:string; onAccent:(v:string)=>void;
    compact:boolean; onCompact:(v:boolean)=>void;
    anim:boolean; onAnim:(v:boolean)=>void; }) {
  const [activeTab, setActiveTab]       = useState<ConfigTab>("apariencia");
  const [darkMode,   setDarkMode]       = useState(dark);
  const [compactUI,  setCompactUI]      = useState(compact);
  const [animaciones, setAnimaciones]   = useState(anim);
  useEffect(() => { setDarkMode(dark); }, [dark]);
  useEffect(() => { setCompactUI(compact); }, [compact]);
  useEffect(() => { setAnimaciones(anim); }, [anim]);
  const [notifEmail,  setNotifEmail]    = useState(true);
  const [notifSistema,setNotifSistema]  = useState(true);
  const [notifVenc,   setNotifVenc]     = useState(true);
  const [accentColor, setAccentColor]   = useState("#1E5E2F");
  const [idioma, setIdioma]             = useState("Español - Guatemala");
  const [zona,   setZona]               = useState("UTC-6 America/Guatemala");
  const [showIdiomaDD, setShowIdiomaDD] = useState(false);
  const [showZonaDD,   setShowZonaDD]   = useState(false);
  const idiomaDDRef = useRef<HTMLDivElement>(null);
  const zonaDDRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (idiomaDDRef.current && !idiomaDDRef.current.contains(e.target as Node)) setShowIdiomaDD(false);
      if (zonaDDRef.current   && !zonaDDRef.current.contains(e.target as Node))   setShowZonaDD(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const ACCENT_COLORS = ["#1E5E2F","#1D4ED8","#7C3AED","#B45309","#0F766E","#BE123C"];

  const SettingRow = ({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
      <div className="px-6 py-5 space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Configuración del Sistema</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de preferencias de interfaz, seguridad y parámetros administrativos.</p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {CONFIG_TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="relative px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors shrink-0"
                  style={{ color: active ? G : "#6B7280" }}>
                  {tab.label}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: G }}/>}
                </button>
              );
            })}
          </div>

          {/* ── Apariencia y Tema ── */}
          {activeTab === "apariencia" && (
            <div className="p-6 space-y-6">

              {/* Interface settings */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Tema de Interfaz</p>
                <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                  <SettingRow
                    title="Modo Oscuro (Dark Theme)"
                    desc="Cambia la interfaz entre tema claro y oscuro para reducir la fatiga visual."
                    control={<ToggleSwitch on={darkMode} onChange={v => { setDarkMode(v); onDark(v); onToast(v ? "Modo oscuro activado" : "Modo claro activado", "El tema de la interfaz ha sido actualizado."); }}/>}
                  />
                  <SettingRow
                    title="Interfaz Compacta"
                    desc="Reduce el espaciado de filas y tarjetas para mostrar más información."
                    control={<ToggleSwitch on={compactUI} onChange={v => { setCompactUI(v); onCompact(v); }}/>}
                  />
                  <SettingRow
                    title="Animaciones de Transición"
                    desc="Habilita efectos de transición suaves entre vistas y modales."
                    control={<ToggleSwitch on={animaciones} onChange={v => { setAnimaciones(v); onAnim(v); }}/>}
                  />
                </div>
              </div>

              {/* Accent color */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Color de Acento del Sistema</p>
                <div className="rounded-xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Color Principal</p>
                      <p className="text-xs text-gray-500 mt-0.5">Color de botones, indicadores activos y elementos de marca.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ACCENT_COLORS.map(c => (
                        <button key={c} onClick={() => { setAccentColor(c); onAccent(c); onToast("Color actualizado", `Color de acento cambiado a ${c}.`); }}
                          className="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95"
                          style={{
                            backgroundColor: c,
                            boxShadow: accentColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                          }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional settings */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Idioma y Región</p>
                <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Idioma del Sistema</p>
                      <p className="text-xs text-gray-500 mt-0.5">Idioma de la interfaz y mensajes del sistema.</p>
                    </div>
                    <div className="relative" ref={idiomaDDRef}>
                      <button onClick={() => setShowIdiomaDD(v => !v)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all min-w-[200px] justify-between">
                        {idioma}
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {showIdiomaDD && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[200px]">
                          {["Español - Guatemala","Español - México","English (US)"].map(opt => (
                            <button key={opt} onClick={() => { setIdioma(opt); setShowIdiomaDD(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                              style={{ color: idioma===opt ? G : "#374151", fontWeight: idioma===opt ? 700 : 400 }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Zona Horaria</p>
                      <p className="text-xs text-gray-500 mt-0.5">Zona horaria para fechas, logs y notificaciones.</p>
                    </div>
                    <div className="relative" ref={zonaDDRef}>
                      <button onClick={() => setShowZonaDD(v => !v)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all min-w-[200px] justify-between">
                        {zona}
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {showZonaDD && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[200px]">
                          {["UTC-6 America/Guatemala","UTC-5 America/Bogota","UTC-4 America/Caracas"].map(opt => (
                            <button key={opt} onClick={() => { setZona(opt); setShowZonaDD(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                              style={{ color: zona===opt ? G : "#374151", fontWeight: zona===opt ? 700 : 400 }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button onClick={() => onToast("Configuración guardada", "Los cambios de apariencia han sido aplicados.")}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G }}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* ── Perfil de Usuario ── */}
          {activeTab === "perfil" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Información Personal</p>
                <div className="rounded-xl border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0" style={{ borderColor: GB }}>
                      <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&auto=format" alt="Avatar" className="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-gray-900">Lic. Ricardo Gómez</p>
                      <p className="text-xs text-gray-500 mt-0.5">Administrador General · Municipalidad de Panajachel</p>
                      <button onClick={() => onToast("Función en desarrollo", "La carga de foto de perfil estará disponible próximamente.")}
                        className="text-xs font-bold mt-2 px-3 py-1 rounded-lg transition-all hover:opacity-80" style={{ backgroundColor: GL, color: G }}>
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      { label: "Nombre completo",  value: "Ricardo Gómez Barrios" },
                      { label: "Cargo",             value: "Director Administrativo" },
                      { label: "Correo electrónico",value: "r.gomez@munipanajachel.gob.gt" },
                      { label: "Extensión",         value: "Ext. 214" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                        <input defaultValue={f.value}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => onToast("Perfil actualizado", "Los datos de usuario fueron guardados correctamente.")}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
                  Guardar Perfil
                </button>
              </div>
            </div>
          )}

          {/* ── Notificaciones ── */}
          {activeTab === "notificaciones" && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Canales de Notificación</p>
                <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                  <SettingRow title="Notificaciones por Correo" desc="Recibir alertas de solicitudes, vencimientos y aprobaciones por email." control={<ToggleSwitch on={notifEmail} onChange={setNotifEmail}/>}/>
                  <SettingRow title="Notificaciones del Sistema" desc="Alertas dentro del portal para actividades que requieren acción." control={<ToggleSwitch on={notifSistema} onChange={setNotifSistema}/>}/>
                  <SettingRow title="Alertas de Vencimiento" desc="Avisos preventivos 48 y 24 horas antes de vencer facturas u órdenes." control={<ToggleSwitch on={notifVenc} onChange={setNotifVenc}/>}/>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => onToast("Preferencias guardadas", "La configuración de notificaciones fue actualizada.")}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* ── Seguridad ── */}
          {activeTab === "seguridad" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Contraseña</p>
                <div className="rounded-xl border border-gray-100 p-5 space-y-4">
                  {[
                    { label: "Contraseña actual",       ph: "••••••••" },
                    { label: "Nueva contraseña",        ph: "Mínimo 8 caracteres" },
                    { label: "Confirmar contraseña",    ph: "Repetir nueva contraseña" },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                      <input type="password" placeholder={f.ph}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"/>
                    </div>
                  ))}
                  <button onClick={() => onToast("Contraseña actualizada", "Su contraseña fue cambiada correctamente.")}
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Sesión Activa</p>
                <div className="rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Sesión actual</p>
                    <p className="text-xs text-gray-500 mt-0.5">Chrome · Windows 11 · Panajachel, Sololá · Iniciada hoy 08:15 AM</p>
                  </div>
                  <button onClick={onLogout}
                    className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90" style={{ backgroundColor: "#DC2626" }}>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Auditoría ── */}
          {activeTab === "auditoria" && (
            <div className="p-6">
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#F9FAFB" }}>
                  <p className="text-sm font-extrabold text-gray-700">Registro de Actividad del Sistema</p>
                  <button onClick={() => onToast("Log exportado", "El registro de auditoría fue descargado como CSV.")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-50" style={{ color: G, borderColor: G }}>
                    Exportar CSV
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { time: "Hoy 09:42",       action: "Inicio de sesión",                user: "Lic. Ricardo Gómez",  status: "exitoso"   },
                    { time: "Ayer 17:18",       action: "Exportación de reporte PDF",      user: "Lic. Ricardo Gómez",  status: "exitoso"   },
                    { time: "Ayer 14:05",       action: "Modificación de proveedor",       user: "Asistente Sánchez",   status: "exitoso"   },
                    { time: "22/10 11:30",      action: "Intento de acceso denegado",      user: "Usuario desconocido", status: "denegado"  },
                    { time: "21/10 08:00",      action: "Inicio de sesión",                user: "Lic. Ricardo Gómez",  status: "exitoso"   },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.status === "denegado" ? "#DC2626" : G }}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{e.action}</p>
                        <p className="text-xs text-gray-400">{e.user}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">{e.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Supplier Portal ──────────────────────────────────────────────────────────
type SupplierNav = "oportunidades" | "ordenes" | "entregas" | "configuracion";
type SolEstadoProv = "En Licitación" | "Cotización Enviada" | "Adjudicado";

const SOL_ESTADO_PROV: Record<SolEstadoProv, { bg: string; color: string; text?: string }> = {
  "En Licitación":    { bg: "#E0F2FE", color: "#0284C7" },
  "Cotización Enviada":{ bg: "#DCFCE7", color: "#16A34A" },
  "Adjudicado":       { bg: "#22C55E", color: "#FFFFFF" },
};

interface SolProv { id: string; num: string; cat: string; limite: string; presupuesto: string; estado: SolEstadoProv; }
const SOL_PROV: SolProv[] = [
  { id:"s1", num:"#SOL-2026-089", cat:"Suministros de Oficina",    limite:"28/08/2026", presupuesto:"Q 12,500.00", estado:"En Licitación"     },
  { id:"s2", num:"#SOL-2026-084", cat:"Materiales de Construcción",limite:"30/08/2026", presupuesto:"Q 45,000.00", estado:"Cotización Enviada" },
  { id:"s3", num:"#SOL-2026-078", cat:"Repuestos de Maquinaria",   limite:"15/08/2026", presupuesto:"Q 8,200.00",  estado:"Adjudicado"        },
];

// ─── Nueva Proforma modal ──────────────────────────────────────────────────────
function NuevaProformaModal({ sol, dark, onClose, onToast }: { sol: SolProv; dark: boolean; onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const [precio, setPrecio] = useState(""); const [entrega, setEntrega] = useState("");
  const card = dark ? "#1E293B" : "#FFFFFF"; const text = dark ? "#F8FAFC" : "#111827"; const sub = dark ? "#94A3B8" : "#6B7280";
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor:`rgba(0,0,0,${visible?0.6:0})`, backdropFilter:"blur(3px)", transition:"background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ backgroundColor: card, animation:"modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b" style={{ borderColor: dark?"#334155":"#F3F4F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Doc />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none" style={{ color: text }}>Nueva Proforma</h2>
              <p className="text-xs mt-0.5" style={{ color: sub }}>Solicitud {sol.num} · {sol.cat}</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: sub }}><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: sub }}>Precio Unitario Ofertado (Q)</label>
              <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" type="number"
                className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                style={{ backgroundColor: dark?"#0F172A":"#F9FAFB", borderColor: precio?G:"#334155", color: text }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: sub }}>Tiempo de Entrega</label>
              <input value={entrega} onChange={e => setEntrega(e.target.value)} placeholder="Ej. 3 días hábiles"
                className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                style={{ backgroundColor: dark?"#0F172A":"#F9FAFB", borderColor: entrega?G:"#334155", color: text }} />
            </div>
            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed border"
              style={{ backgroundColor: dark?"rgba(30,94,47,0.15)":"#F0FDF4", borderColor: dark?"rgba(30,94,47,0.3)":GB, color: dark?"#86EFAC":G }}>
              Presupuesto estimado de la solicitud: <b>{sol.presupuesto}</b>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all"
              style={{ color: sub, borderColor: dark?"#334155":"#E5E7EB" }}>Cancelar</button>
            <button onClick={() => { if (!precio||!entrega) return; handleClose(); setTimeout(()=>onToast("Proforma enviada","Tu cotización fue registrada para revisión técnica."),300); }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor:G, opacity:(!precio||!entrega)?0.5:1 }}>
              Enviar Cotización
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Subir Proforma modal ──────────────────────────────────────────────────────
function SubirProformaModal({ dark, onClose, onToast }: { dark: boolean; onClose: () => void; onToast: (m: string, s: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<string|null>(null);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  const card = dark?"#1E293B":"#FFFFFF"; const text = dark?"#F8FAFC":"#111827"; const sub = dark?"#94A3B8":"#6B7280";
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor:`rgba(0,0,0,${visible?0.6:0})`, backdropFilter:"blur(3px)", transition:"background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ backgroundColor:card, animation:"modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b" style={{ borderColor:dark?"#334155":"#F3F4F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor:G }}>
              <Icons.PDF />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none" style={{ color:text }}>Subir Proforma Directa</h2>
              <p className="text-xs mt-0.5" style={{ color:sub }}>Adjunte su documento de proforma o cotización</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color:sub }}><Icons.X /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true)}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);setFile("proforma_documento.pdf");}}
              onClick={()=>setFile("proforma_documento.pdf")}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-all"
              style={{ borderColor:dragging||file?G:dark?"#334155":"#D1D5DB", backgroundColor:dragging?dark?"rgba(30,94,47,0.15)":"#F0FDF4":dark?"#0F172A":"#F9FAFB" }}>
              {file
                ? <><svg className="w-10 h-10" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p className="text-sm font-bold" style={{ color:G }}>{file}</p>
                    <p className="text-xs" style={{ color:sub }}>Haga clic para cambiar el archivo</p></>
                : <><svg className="w-10 h-10 opacity-40" fill="none" stroke={dark?"#94A3B8":"#9CA3AF"} viewBox="0 0 24 24" strokeWidth={1.5}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                    <p className="text-sm font-semibold" style={{ color:sub }}>Arrastre o haga clic para adjuntar</p>
                    <p className="text-xs" style={{ color:dark?"#475569":"#9CA3AF" }}>PDF · XML · hasta 10 MB</p></>
              }
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all"
              style={{ color:sub, borderColor:dark?"#334155":"#E5E7EB" }}>Cancelar</button>
            <button onClick={()=>{if(!file)return;handleClose();setTimeout(()=>onToast("Proforma subida","Tu documento fue enviado para revisión técnica."),300);}}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor:G, opacity:!file?0.5:1 }}>
              Enviar Proforma
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Supplier Portal root ──────────────────────────────────────────────────────
function SupplierPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav,        setActiveNav]        = useState<SupplierNav>("oportunidades");
  const [dark,             setDark]             = useState(false);
  const [solFilter,        setSolFilter]        = useState<"todas"|"pendientes"|"enviadas">("todas");
  const [proformaTarget,   setProformaTarget]   = useState<SolProv|null>(null);
  const [showSubir,        setShowSubir]        = useState(false);
  const [isDraggingFEL,    setIsDraggingFEL]    = useState(false);
  const [toast,            setToast]            = useState({ show:false, message:"", sub:"" });
  const [showLogout,       setShowLogout]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen,setMobileSidebarOpen]= useState(false);

  const fireToast = (message: string, sub: string) => {
    setToast({ show:true, message, sub });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 4500);
  };

  const bg   = dark ? "#0F172A" : "#F8F9FA";
  const card = dark ? "#1E293B" : "#FFFFFF";
  const border = dark ? "#334155" : "#F1F5F9";
  const text = dark ? "#F8FAFC" : "#111827";
  const sub  = dark ? "#94A3B8" : "#6B7280";
  const sidebarBg = dark ? "#1E293B" : "#FFFFFF";

  const NAV_PROV: { key: SupplierNav; label: string; icon: React.ReactNode }[] = [
    { key:"oportunidades",  label:"Mis Oportunidades",   icon:<Icons.Solicitudes/> },
    { key:"ordenes",        label:"Órdenes y Facturas",  icon:<Icons.Facturacion/> },
    { key:"entregas",       label:"Entregas en Bodega",  icon:<Icons.Bodega/>       },
    { key:"configuracion",  label:"Configuración",       icon:<Icons.Config/>       },
  ];

  const filteredSols = solFilter === "pendientes"
    ? SOL_PROV.filter(s => s.estado === "En Licitación")
    : solFilter === "enviadas"
    ? SOL_PROV.filter(s => s.estado === "Cotización Enviada" || s.estado === "Adjudicado")
    : SOL_PROV;

  const goHome = () => { setActiveNav("oportunidades"); setMobileSidebarOpen(false); };

  const SupplierSidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const collapsed = !inDrawer && sidebarCollapsed;
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: sidebarBg }}>
        {/* Logo */}
        <div className="px-3 py-4 border-b flex items-center gap-2.5" style={{ borderColor: border }}>
          <MunicipalSeal size={32} onClick={goHome} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate leading-none" style={{ color: text }}>Portal de Proveedores</p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: sub }}>Municipalidad de Panajachel</p>
            </div>
          )}
        </div>
        {/* Company chip */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-2 py-1.5 rounded-lg text-[10px] font-semibold truncate" style={{ backgroundColor: dark?"#0F172A":GL, color:G }}>
            Suministros El Lago S.A.
          </div>
        )}
        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_PROV.map(({ key, label, icon }) => {
            const active = activeNav === key;
            return (
              <button key={key}
                onClick={() => { setActiveNav(key); setMobileSidebarOpen(false); }}
                title={collapsed ? label : undefined}
                className="w-full flex items-center gap-2.5 text-sm font-medium transition-all"
                style={{
                  borderRadius: 12,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : undefined,
                  backgroundColor: active ? G : undefined,
                  color: active ? "#FFFFFF" : sub,
                  boxShadow: active ? "0 1px 4px rgba(30,94,47,0.2)" : undefined,
                }}
                onMouseEnter={e=>{ if(!active){ e.currentTarget.style.backgroundColor=dark?"rgba(30,94,47,0.15)":"#F0FDF4"; e.currentTarget.style.color=G; } }}
                onMouseLeave={e=>{ if(!active){ e.currentTarget.style.backgroundColor=""; e.currentTarget.style.color=sub; } }}>
                {icon}
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
        {/* Logout */}
        <div className="px-2 pb-4 border-t pt-2" style={{ borderColor:border }}>
          <button onClick={() => setShowLogout(true)}
            title={sidebarCollapsed && !inDrawer ? "Cerrar Sesión" : undefined}
            className="w-full flex items-center gap-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            style={{ padding: collapsed ? "10px 0" : "10px 12px", justifyContent: collapsed ? "center" : undefined }}>
            <Icons.Logout/>
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: bg }}>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay lg:hidden" onClick={() => setMobileSidebarOpen(false)}/>
      )}

      {/* ── Mobile sidebar drawer ── */}
      <div className={`sidebar-drawer lg:hidden ${mobileSidebarOpen ? "open" : ""}`} style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${border}` }}>
        <SupplierSidebarContent inDrawer={true}/>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col shrink-0 border-r relative transition-all duration-300"
        style={{ width: sidebarCollapsed ? 56 : 224, backgroundColor: sidebarBg, borderColor: border }}>
        <SupplierSidebarContent/>
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{ backgroundColor: sidebarBg, borderColor: border, color: sub }}>
          <svg className="w-3 h-3 transition-transform" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor:card, borderColor:border }}>
          {/* Hamburger (mobile/tablet only) */}
          <button onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-all hover:opacity-70 shrink-0" style={{ color:sub }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          {/* Mobile logo */}
          <div className="lg:hidden shrink-0">
            <MunicipalSeal size={28} onClick={goHome}/>
          </div>
          <div className="flex-1 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm max-w-sm"
            style={{ backgroundColor:dark?"#0F172A":"#F9FAFB", borderColor:border }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke={sub} viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar solicitud o licitación..." className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color:text }} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-xl transition-all hover:opacity-70" style={{ color:sub }}>
              <Icons.Bell />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"/>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor:border }}>
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor:GB }}>
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format" alt="Proveedor" className="w-full h-full object-cover"/>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold leading-none" style={{ color:text }}>Suministros El Lago S.A.</p>
                <p className="text-[10px] mt-0.5" style={{ color:sub }}>NIT: 459823-1</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-auto" style={{ background:bg }}>
          <div className="px-4 sm:px-6 py-5 space-y-5 pb-24 lg:pb-5">

            {/* ── Mis Oportunidades ── */}
            {activeNav === "oportunidades" && (
              <>
                {/* Page header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-extrabold leading-tight" style={{ color:text }}>Mis Oportunidades y Cotizaciones</h1>
                    <p className="text-sm mt-1" style={{ color:sub }}>Revise los requerimientos publicados por la Municipalidad de Panajachel y envíe sus proformas.</p>
                  </div>
                  <button onClick={() => setShowSubir(true)}
                    className="hidden lg:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
                    style={{ backgroundColor:G }}>
                    <Icons.Plus/> Subir Proforma Directa
                  </button>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon:<Icons.Solicitudes/>, label:"COTIZACIONES ENVIADAS", value:"18", sub2:"4 en revisión técnica",         subColor: sub    },
                    { icon:<Icons.Proformas/>,   label:"ÓRDENES ADJUDICADAS",   value:"05", sub2:"Q 85,400.00 en ejecución",       subColor: G      },
                    { icon:<Icons.Facturacion/>, label:"FACTURAS PENDIENTES",   value:"02", sub2:"Próximo pago: 25/08/2026",        subColor:"#D97706" },
                  ].map(k => (
                    <div key={k.label} className="rounded-xl border p-5" style={{ backgroundColor:card, borderColor:border }}>
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color:sub }}>{k.label}</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:dark?"rgba(30,94,47,0.25)":GL, color:G }}>{k.icon}</div>
                      </div>
                      <p className="text-4xl font-extrabold font-mono" style={{ color:text }}>{k.value}</p>
                      <p className="text-xs font-semibold mt-1.5" style={{ color:k.subColor }}>{k.sub2}</p>
                    </div>
                  ))}
                </div>

                {/* Two-column: table + invoice upload */}
                <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">

                  {/* Opportunities table */}
                  <div className="flex-1 min-w-0 rounded-xl border overflow-hidden" style={{ backgroundColor:card, borderColor:border }}>
                    {/* Table header + filter tabs */}
                    <div className="px-5 pt-4 pb-0 border-b" style={{ borderColor:border }}>
                      <p className="text-base font-extrabold mb-3" style={{ color:text }}>Solicitudes de Compra Activas</p>
                      <div className="flex gap-0 overflow-x-auto">
                        {(["todas","pendientes","enviadas"] as const).map(f => {
                          const labels = { todas:"Todas", pendientes:"Pendientes de Cotizar", enviadas:"Enviadas" };
                          const active = solFilter === f;
                          return (
                            <button key={f} onClick={() => setSolFilter(f)}
                              className="relative px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                              style={{ color:active?G:sub }}>
                              {labels[f]}
                              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor:G }}/>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[540px]">
                        <thead>
                          <tr className="border-b" style={{ borderColor:border, backgroundColor:dark?"#0F172A":"#F9FAFB" }}>
                            {["NO. SOLICITUD","CATEGORÍA","FECHA LÍMITE","PRESUPUESTO","ESTADO","ACCIONES"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest" style={{ color:sub }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSols.map(sol => {
                            const es = SOL_ESTADO_PROV[sol.estado];
                            return (
                              <tr key={sol.id} className="border-b transition-colors" style={{ borderColor:border }}
                                onMouseEnter={e=>(e.currentTarget.style.backgroundColor=dark?"rgba(255,255,255,0.03)":"#F9FFF9")}
                                onMouseLeave={e=>(e.currentTarget.style.backgroundColor="")}>
                                <td className="px-4 py-4"><p className="text-sm font-extrabold" style={{ color:G }}>{sol.num}</p></td>
                                <td className="px-4 py-4"><p className="text-sm" style={{ color:text }}>{sol.cat}</p></td>
                                <td className="px-4 py-4"><p className="text-sm" style={{ color:sub }}>{sol.limite}</p></td>
                                <td className="px-4 py-4"><p className="text-sm font-bold font-mono" style={{ color:text }}>{sol.presupuesto}</p></td>
                                <td className="px-4 py-4">
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor:es.bg, color:es.color }}>{sol.estado}</span>
                                </td>
                                <td className="px-4 py-4">
                                  {sol.estado === "En Licitación" ? (
                                    <button onClick={() => setProformaTarget(sol)}
                                      className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                                      style={{ backgroundColor:G }}>
                                      Enviar Cotización
                                    </button>
                                  ) : (
                                    <button onClick={() => fireToast(sol.estado === "Adjudicado" ? "Orden de Compra" : "Mi Proforma", `Cargando documento de ${sol.num}...`)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                      style={{ color:G, borderColor:G }}>
                                      {sol.estado === "Adjudicado" ? "Ver Orden de Compra" : "Ver Mi Proforma"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile card list */}
                    <div className="md:hidden divide-y" style={{ borderColor:border }}>
                      {filteredSols.map(sol => {
                        const es = SOL_ESTADO_PROV[sol.estado];
                        return (
                          <div key={sol.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-extrabold" style={{ color:G }}>{sol.num}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor:es.bg, color:es.color }}>{sol.estado}</span>
                            </div>
                            <p className="text-sm font-medium" style={{ color:text }}>{sol.cat}</p>
                            <div className="flex items-center justify-between text-xs" style={{ color:sub }}>
                              <span>Límite: {sol.limite}</span>
                              <span className="font-bold font-mono" style={{ color:text }}>{sol.presupuesto}</span>
                            </div>
                            <div className="pt-1">
                              {sol.estado === "En Licitación" ? (
                                <button onClick={() => setProformaTarget(sol)}
                                  className="w-full py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                                  style={{ backgroundColor:G }}>
                                  Enviar Cotización
                                </button>
                              ) : (
                                <button onClick={() => fireToast(sol.estado === "Adjudicado" ? "Orden de Compra" : "Mi Proforma", `Cargando documento de ${sol.num}...`)}
                                  className="w-full py-2 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                  style={{ color:G, borderColor:G }}>
                                  {sol.estado === "Adjudicado" ? "Ver Orden de Compra" : "Ver Mi Proforma"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick invoice upload */}
                  <div className="w-full xl:w-64 shrink-0 rounded-xl border overflow-hidden" style={{ backgroundColor:card, borderColor:border }}>
                    <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor:border }}>
                      <p className="text-sm font-extrabold" style={{ color:text }}>Carga Rápida de Factura FEL</p>
                      <p className="text-xs mt-0.5" style={{ color:sub }}>Envíe su factura electrónica directamente.</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div
                        onDragOver={e=>{e.preventDefault();setIsDraggingFEL(true)}}
                        onDragLeave={()=>setIsDraggingFEL(false)}
                        onDrop={e=>{e.preventDefault();setIsDraggingFEL(false);fireToast("Factura recibida","El documento FEL fue enviado a revisión de pago.");}}
                        onClick={()=>fireToast("Factura recibida","El documento FEL fue enviado a revisión de pago.")}
                        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-all"
                        style={{ borderColor:isDraggingFEL?G:dark?"#334155":"#CBD5E1", backgroundColor:isDraggingFEL?dark?"rgba(30,94,47,0.15)":"#F0FDF4":dark?"#0F172A":"#F9FAFB" }}>
                        <svg className="w-9 h-9" fill="none" stroke={isDraggingFEL?G:sub} viewBox="0 0 24 24" strokeWidth={1.5}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                        <p className="text-xs text-center leading-snug font-semibold" style={{ color:sub }}>Arrastre aquí su factura digital<br/>(PDF / XML)</p>
                      </div>
                      <button onClick={() => fireToast("Factura enviada","Tu factura FEL fue enviada a revisión de pago.")}
                        className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                        style={{ backgroundColor:G }}>
                        Enviar a Revisión de Pago
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Órdenes y Facturas ── */}
            {activeNav === "ordenes" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold" style={{ color:text }}>Órdenes y Facturas</h1>
                <p className="text-sm" style={{ color:sub }}>Historial de órdenes de compra adjudicadas y estado de pago de sus facturas.</p>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor:card, borderColor:border }}>
                  {[
                    { oc:"OC-2026-042", desc:"Suministros de limpieza",   monto:"Q 8,400.00",  estado:"Pagado",    fecha:"12/08/2026" },
                    { oc:"OC-2026-038", desc:"Papelería y suministros",   monto:"Q 12,100.00", estado:"Pendiente", fecha:"25/08/2026" },
                    { oc:"OC-2026-031", desc:"Repuestos eléctricos",      monto:"Q 64,900.00", estado:"En Proceso",fecha:"30/08/2026" },
                  ].map((r,i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors"
                      style={{ borderColor:border }}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor=dark?"rgba(255,255,255,0.03)":"#F9FFF9")}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor="")}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:dark?"rgba(30,94,47,0.25)":GL, color:G }}>
                        <Icons.Doc />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color:text }}>{r.oc}</p>
                        <p className="text-xs" style={{ color:sub }}>{r.desc}</p>
                      </div>
                      <p className="text-sm font-extrabold font-mono" style={{ color:text }}>{r.monto}</p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={r.estado==="Pagado"?{backgroundColor:"#DCFCE7",color:"#16A34A"}:r.estado==="En Proceso"?{backgroundColor:"#FEF9C3",color:"#92400E"}:{backgroundColor:"#FEE2E2",color:"#DC2626"}}>
                        {r.estado}
                      </span>
                      <p className="text-xs" style={{ color:sub }}>{r.fecha}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Entregas en Bodega ── */}
            {activeNav === "entregas" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold" style={{ color:text }}>Entregas en Bodega</h1>
                <p className="text-sm" style={{ color:sub }}>Programación y estado de sus entregas físicas en la bodega municipal.</p>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor:card, borderColor:border }}>
                  {[
                    { oc:"OC-2026-042", items:"12 cajas papelería",   fecha:"14/08/2026 09:00", estado:"Programada",  bodeguero:"Enc. Ramírez"  },
                    { oc:"OC-2026-031", items:"Caja repuestos x4",    fecha:"18/08/2026 14:00", estado:"Completada",   bodeguero:"Enc. López"     },
                    { oc:"OC-2026-028", items:"Suministros limpieza", fecha:"20/08/2026 10:30", estado:"Pendiente",    bodeguero:"Por asignar"    },
                  ].map((r,i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors"
                      style={{ borderColor:border }}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor=dark?"rgba(255,255,255,0.03)":"#F9FFF9")}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor="")}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:dark?"rgba(30,94,47,0.25)":GL, color:G }}>
                        <Icons.Bodega />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color:text }}>{r.oc} · {r.items}</p>
                        <p className="text-xs" style={{ color:sub }}>{r.fecha} · {r.bodeguero}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={r.estado==="Completada"?{backgroundColor:"#DCFCE7",color:"#16A34A"}:r.estado==="Programada"?{backgroundColor:"#E0F2FE",color:"#0284C7"}:{backgroundColor:"#FEF9C3",color:"#92400E"}}>
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Configuración ── */}
            {activeNav === "configuracion" && (
              <div className="space-y-5 max-w-lg">
                <h1 className="text-2xl font-extrabold" style={{ color:text }}>Configuración</h1>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor:card, borderColor:border }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:border }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color:text }}>Modo Oscuro</p>
                      <p className="text-xs mt-0.5" style={{ color:sub }}>Cambia el tema del portal entre claro y oscuro.</p>
                    </div>
                    <button onClick={() => setDark(v => !v)} role="switch" aria-checked={dark}
                      className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                      style={{ backgroundColor: dark ? G : "#D1D5DB" }}>
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
                        style={{ transform: dark ? "translateX(24px)" : "translateX(0)" }}/>
                    </button>
                  </div>
                  <div className="px-5 py-4 border-b" style={{ borderColor:border }}>
                    <p className="text-sm font-bold" style={{ color:text }}>Proveedor</p>
                    <p className="text-xs mt-0.5" style={{ color:sub }}>Suministros El Lago S.A. · NIT: 459823-1</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm font-bold" style={{ color:text }}>Correo de Contacto</p>
                    <p className="text-xs mt-0.5" style={{ color:sub }}>ventas@suministroselago.com</p>
                  </div>
                </div>
                <button onClick={() => setShowLogout(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor:"#DC2626" }}>
                  <Icons.Logout/> Cerrar Sesión
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      {activeNav === "oportunidades" && (
        <button
          onClick={() => setShowSubir(true)}
          className="fixed bottom-6 right-5 lg:hidden flex items-center gap-2 px-4 py-3 text-sm font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all z-30"
          style={{ backgroundColor: G, boxShadow: "0 4px 20px rgba(30,94,47,0.4)" }}>
          <Icons.Plus/>
          <span className="hidden xs:inline">Subir Proforma</span>
        </button>
      )}

      {/* Modals */}
      {proformaTarget && <NuevaProformaModal sol={proformaTarget} dark={dark} onClose={() => setProformaTarget(null)} onToast={fireToast}/>}
      {showSubir       && <SubirProformaModal dark={dark} onClose={() => setShowSubir(false)} onToast={fireToast}/>}
      {showLogout      && <CerrarSesionModal onClose={() => setShowLogout(false)} onConfirm={() => { setShowLogout(false); setTimeout(onLogout, 280); }}/>}

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} sub={toast.sub} onHide={() => setToast(t=>({...t,show:false}))}/>
    </div>
  );
}

// ─── Forgot Password modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`, backdropFilter: "blur(4px)", transition: "background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}>
          {!sent ? (
            <>
              <div className="px-8 pt-8 pb-2 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: GL }}>
                  <svg className="w-7 h-7" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Recuperar Contraseña</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">Ingrese su correo institucional y le enviaremos las instrucciones para restablecer su acceso.</p>
              </div>
              <div className="px-8 py-5">
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Correo Institucional</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@munipanajachel.gob.gt"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: email ? G : undefined }}
                  onFocus={e => e.currentTarget.style.borderColor = G}
                  onBlur={e => { if (!email) e.currentTarget.style.borderColor = ""; }}/>
              </div>
              <div className="flex gap-3 px-8 pb-8">
                <button onClick={handleClose} className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={() => { if (email) setSent(true); }}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G, opacity: !email ? 0.5 : 1 }}>
                  Enviar Instrucciones
                </button>
              </div>
            </>
          ) : (
            <div className="px-8 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Correo enviado</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Revise su bandeja <b className="text-gray-700">{email}</b>. Si la cuenta existe, recibirá las instrucciones en los próximos minutos.</p>
              <button onClick={handleClose}
                className="mt-6 w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: G }}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
const LAKE_IMG = "https://images.unsplash.com/photo-1669025467316-a1bff8696c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1400";

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [usuario,      setUsuario]      = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [remember,     setRemember]     = useState(false);
  const [focusField,   setFocusField]   = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const [error,        setError]        = useState("");

  const handleLogin = () => {
    setError("");
    if (!usuario || !password) { setError("Por favor complete todos los campos."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(password); }, 900);
  };

  const fieldStyle = (name: string) => ({
    borderColor: focusField === name ? G : "#E2E8F0",
    boxShadow: focusField === name ? `0 0 0 3px rgba(30,94,47,0.08)` : undefined,
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F9FA" }}>

      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Background photo */}
        <img src={LAKE_IMG} alt="Lago de Atitlán" className="absolute inset-0 w-full h-full object-cover"/>
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.25) 40%, rgba(15,23,42,0.75) 100%)" }}/>
        {/* Content */}
        <div className="relative flex flex-col h-full px-10 py-10 text-white">
          {/* Emblem */}
          <div className="flex items-center gap-3">
            <MunicipalSeal size={48} />
            <div>
              <p className="text-sm font-extrabold leading-none">Municipalidad de Panajachel</p>
              <p className="text-[11px] text-white/60 mt-0.5">Sololá, Guatemala</p>
            </div>
          </div>
          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 w-fit"
              style={{ backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.35)", color: "#86EFAC" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              Sistema Activo · Versión 2.4.1
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Sistema de Gestión Municipal y Cadena de Suministros
            </h1>
            <p className="mt-4 text-base text-white/70 leading-relaxed">
              Plataforma digital centralizada para la administración de inventario, proveedores y finanzas públicas.
            </p>
            {/* Stats */}
            <div className="flex gap-6 mt-10">
              {[
                { value: "148", label: "Proveedores activos" },
                { value: "Q4.5M", label: "Presupuesto gestionado" },
                { value: "24/7", label: "Disponibilidad" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold" style={{ color: "#86EFAC" }}>{s.value}</p>
                  <p className="text-xs text-white/55 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Footer badge */}
          <div className="flex items-center gap-2 text-white/55 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Panajachel, Sololá · Guatemala
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <MunicipalSeal size={40} />
            <div>
              <p className="text-sm font-extrabold text-gray-900 leading-none">Municipalidad de Panajachel</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Gestión Municipal · Sololá</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="mb-5">
              <MunicipalSeal size={56} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Iniciar Sesión</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Ingrese sus credenciales administrativas para acceder al sistema.</p>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Usuario field */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Usuario / Correo</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input value={usuario} onChange={e => setUsuario(e.target.value)}
                  onFocus={() => setFocusField("usuario")} onBlur={() => setFocusField(null)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="ejemplo@munipanajachel.gob.gt"
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl bg-white focus:outline-none"
                  style={fieldStyle("usuario")}/>
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Contraseña</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")} onBlur={() => setFocusField(null)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm border-2 rounded-xl bg-white focus:outline-none"
                  style={fieldStyle("password")}/>
                <button onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button onClick={() => setRemember(v => !v)}
                  className="w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                  style={{
                    width: 18, height: 18,
                    borderColor: remember ? G : "#CBD5E1",
                    backgroundColor: remember ? G : "white",
                  }}>
                  {remember && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                <span className="text-xs font-semibold text-gray-600">Recordar usuario</span>
              </label>
              <button onClick={() => setShowForgot(true)}
                className="text-xs font-semibold transition-all hover:underline"
                style={{ color: G }}>
                ¿Olvidó su contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-extrabold text-white rounded-xl transition-all shadow-md mt-2 active:scale-[.98]"
              style={{
                backgroundColor: G,
                opacity: loading ? 0.8 : 1,
                boxShadow: `0 4px 14px rgba(30,94,47,0.35)`,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#164A24"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = G; }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Verificando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Ingresar al Sistema
                </>
              )}
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 mt-6 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <p className="text-[11px] text-gray-400 leading-relaxed">Acceso restringido únicamente a personal autorizado por la Municipalidad de Panajachel.</p>
          </div>

          <p className="text-center text-[11px] text-gray-300 mt-6">© 2023 Municipalidad de Panajachel · v2.4.1</p>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)}/>}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({title,value,sub,subColor,icon,progress}:{title:string;value:string;sub:string;subColor?:string;icon:React.ReactNode;progress?:number}) {
  return(
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{title}</p><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:GL,color:G}}>{icon}</div></div>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
      {progress!==undefined?<div className="space-y-1.5"><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${progress}%`,backgroundColor:G}}/></div><p className={`text-xs font-medium ${subColor||"text-gray-400"}`}>{sub}</p></div>:<p className={`text-xs font-medium ${subColor||"text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,          setScreen]          = useState<"login"|"admin"|"supplier">("login");
  const [activeNav,       setActiveNav]       = useState("dashboard");
  const [darkAdmin,       setDarkAdmin]       = useState(false);
  const [accentColor,     setAccentColor]     = useState(G);
  const [compactUI,       setCompactUI]       = useState(false);
  const [animEnabled,     setAnimEnabled]     = useState(true);
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false);
  const [mobileSidebar,   setMobileSidebar]   = useState(false);
  const [showSolModal,    setShowSolModal]    = useState(false);
  const [showGasModal,    setShowGasModal]    = useState(false);
  const [showAuditModal,  setShowAuditModal]  = useState(false);
  const [showTicketDrawer,setShowTicketDrawer]= useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMapModal,    setShowMapModal]    = useState(false);
  const [hoveredBar,      setHoveredBar]      = useState<string|null>(null);
  const [toast, setToast] = useState({ show:false, message:"", sub:"" });

  // Inject CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", darkAdmin ? "dark" : "light");
    root.setAttribute("data-compact", compactUI ? "true" : "false");
    root.style.setProperty("--muni-accent", accentColor);
    const r = parseInt(accentColor.slice(1,3),16), gv = parseInt(accentColor.slice(3,5),16), b = parseInt(accentColor.slice(5,7),16);
    root.style.setProperty("--muni-accent-light", `rgba(${r},${gv},${b},0.1)`);
    root.style.setProperty("--muni-accent-border", `rgba(${r},${gv},${b},0.3)`);
    if (!animEnabled) root.style.setProperty("--muni-transition", "none");
    else root.style.removeProperty("--muni-transition");
  }, [darkAdmin, accentColor, compactUI, animEnabled]);

  const fireToast = (message:string, sub:string) => setToast({ show:true, message, sub });
  const hideToast = () => setToast({ show:false, message:"", sub:"" });

  // Derived theme values for inline styles
  const DK = darkAdmin;
  const thBg      = DK ? "#0F172A" : "#F8F9FA";
  const thSurface = DK ? "#1E293B" : "#FFFFFF";
  const thBorder  = DK ? "#334155" : "#F1F5F9";
  const thText    = DK ? "#F8FAFC" : "#111827";
  const thSub     = DK ? "#94A3B8" : "#6B7280";
  const thNav     = DK ? "#0B1120" : "#FFFFFF";
  const ac        = accentColor;

  const goToDash  = () => { setActiveNav("dashboard"); setMobileSidebar(false); };

  if (screen === "login") return <LoginScreen onLogin={(pw) => setScreen(pw === "123456" ? "supplier" : "admin")} />;
  if (screen === "supplier") return <SupplierPortal onLogout={() => setScreen("login")} />;

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Logo / seal */}
      <div className="px-3 py-4 border-b flex items-center gap-2.5" style={{ borderColor: thBorder }}>
        <MunicipalSeal size={sidebarCollapsed && !mobile ? 36 : 40} onClick={goToDash} />
        {(!sidebarCollapsed || mobile) && (
          <div className="brand-text min-w-0">
            <p className="text-xs font-extrabold leading-none truncate" style={{ color: thText }}>Muni Panajachel</p>
            <p className="text-[10px] font-bold leading-none mt-0.5 uppercase tracking-wider truncate" style={{ color: ac }}>Gestión Administrativa</p>
          </div>
        )}
      </div>
      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_MAIN.map(({key,label,Icon})=>{
          const active = activeNav === key;
          return (
            <button key={key} onClick={()=>{ setActiveNav(key); setMobileSidebar(false); }}
              className="nav-btn w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all text-left"
              title={sidebarCollapsed && !mobile ? label : undefined}
              style={{
                borderRadius: 12,
                backgroundColor: active ? ac : undefined,
                color: active ? "#FFFFFF" : thSub,
                boxShadow: active ? `0 1px 4px ${ac}44` : undefined,
                justifyContent: sidebarCollapsed && !mobile ? "center" : undefined,
                paddingLeft: sidebarCollapsed && !mobile ? 0 : undefined,
                paddingRight: sidebarCollapsed && !mobile ? 0 : undefined,
              }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.backgroundColor=DK?"rgba(255,255,255,0.07)":GL; e.currentTarget.style.color=ac; } }}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.backgroundColor=""; e.currentTarget.style.color=thSub; } }}>
              <Icon />
              {(!sidebarCollapsed || mobile) && <span className="nav-label">{label}</span>}
            </button>
          );
        })}
      </nav>
      {/* Logout */}
      <div className="px-2 pb-3 border-t pt-2" style={{ borderColor: thBorder }}>
        <button onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          style={{ justifyContent: sidebarCollapsed && !mobile ? "center" : undefined }}>
          <Icons.Logout/>
          {(!sidebarCollapsed || mobile) && <span className="nav-label">Cerrar Sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes dropIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="flex h-screen overflow-hidden" style={{ background: thBg }}>

        {/* ── Mobile sidebar overlay ── */}
        {mobileSidebar && (
          <div className="sidebar-overlay lg:hidden" onClick={() => setMobileSidebar(false)}/>
        )}
        <div className={`sidebar-drawer lg:hidden flex flex-col shadow-2xl ${mobileSidebar ? "open" : ""}`}
          style={{ backgroundColor: thNav, borderRight: `1px solid ${thBorder}` }}>
          <SidebarContent mobile />
        </div>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col shrink-0 border-r shadow-sm transition-all duration-300"
          style={{ width: sidebarCollapsed ? 56 : 208, backgroundColor: thNav, borderColor: thBorder }}>
          {/* Collapse toggle */}
          <button onClick={() => setSidebarCollapsed(v => !v)}
            className="absolute top-4 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:scale-110"
            style={{ left: sidebarCollapsed ? 44 : 196, backgroundColor: ac }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              {sidebarCollapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
          <SidebarContent />
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <header className="shrink-0 border-b px-4 md:px-6 flex items-center gap-3 shadow-sm" style={{ height:56, backgroundColor: thSurface, borderColor: thBorder }}>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl transition-all hover:opacity-70" style={{ color: thSub }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <SearchBar />
            <div className="flex items-center gap-1 ml-auto">
              <NotificationBell onOpenAudit={() => setShowAuditModal(true)} />
              <HelpButton onOpenTicket={() => setShowTicketDrawer(true)} />
              <div className="h-8 w-px mx-2" style={{ backgroundColor: thBorder }}/>
              <div className="flex items-center gap-2.5 pl-1">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none" style={{ color: thText }}>Lic. Ricardo Gómez</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: ac }}>Administrador General</p>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: thBorder }}>
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&auto=format" alt="Lic. Ricardo Gómez" className="w-full h-full object-cover"/>
                </div>
              </div>
            </div>
          </header>

          {/* KPI strip — dashboard only */}
          {activeNav === "dashboard" && (
          <div className="shrink-0 border-b px-6 py-4 flex items-center gap-8 flex-wrap"
            style={{ backgroundColor: thSurface, borderColor: thBorder }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: thSub }}>Total Solicitudes</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold" style={{ color: thText }}>1,248</span>
                <span className="text-xs font-semibold text-emerald-500">+8% este mes</span>
              </div>
            </div>
            <div className="h-10 w-px" style={{ backgroundColor: thBorder }}/>
            <div className="flex-1 max-w-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: thSub }}>Presupuesto Ejecutado</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-extrabold" style={{ color: thText }}>64.5%</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: DK?"#334155":"#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width:"64.5%", backgroundColor: ac }}/>
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={()=>setShowAuditModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:opacity-80" style={{ color: ac, borderColor: ac }}><Icons.Activity/><span className="hidden sm:block">Actividades</span></button>
              <button onClick={()=>setActiveNav("dependencias")} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg shadow-sm transition-all hover:opacity-90 shrink-0" style={{ backgroundColor: ac }}><Icons.Plus/><span className="hidden sm:block">Nueva Solicitud</span></button>
            </div>
          </div>
          )}

          {/* Body — conditional view */}
          {activeNav === "dependencias" ? (
            <DependenciasView
              onNewSolicitud={() => setShowSolModal(true)}
              onToast={(m, s) => fireToast(m, s)}
            />
          ) : activeNav === "proveedores" ? (
            <ProveedoresView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "proformas" ? (
            <ProformasView onToast={(m, s) => fireToast(m, s)} onNav={(k) => setActiveNav(k)} />
          ) : activeNav === "facturacion" ? (
            <FacturacionView onToast={(m, s) => fireToast(m, s)} onNav={(k) => setActiveNav(k)} />
          ) : activeNav === "bodega" ? (
            <BodegaView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "reportes" ? (
            <ReportesView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "configuracion" ? (
            <ConfiguracionView
              onToast={(m,s) => fireToast(m,s)} onLogout={() => setShowLogoutModal(true)}
              dark={darkAdmin} onDark={setDarkAdmin}
              accent={accentColor} onAccent={setAccentColor}
              compact={compactUI} onCompact={setCompactUI}
              anim={animEnabled} onAnim={setAnimEnabled}
            />
          ) : (
          <div className="flex-1 overflow-auto p-5" style={{ background: thBg }}>
            <div className="flex gap-5 min-h-full">
              {/* Main col */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <KpiCard title="Total Solicitudes"  value="1,248" sub="↑ +8% este mes"              subColor="text-emerald-600" icon={<Icons.Solicitudes/>}/>
                  <KpiCard title="Órdenes Pendientes" value="42"    sub="Q 245,300.00 en trámite"                                 icon={<Icons.Bodega/>}/>
                  <KpiCard title="Entregas Parciales" value="18"    sub="⚠ 8 requieren seguimiento"  subColor="text-amber-500"   icon={<Icons.Proformas/>}/>
                  <KpiCard title="Presupuesto Ejec."  value="64.5%" sub="Q 2.9M de Q 4.5M"            subColor="text-gray-500"   icon={<Icons.Facturacion/>} progress={64.5}/>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div><h2 className="text-base font-bold text-gray-900">Gastos por Departamento</h2><p className="text-xs text-gray-400 mt-0.5">Clic en una barra para ver el detalle</p></div>
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 cursor-pointer hover:border-gray-300 transition-colors">Octubre 2026 <Icons.ChevDown/></div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={CHART_DATA} barSize={34} margin={{top:8,right:0,bottom:0,left:-10}} onClick={()=>setShowGasModal(true)}>
                      <CartesianGrid vertical={false} stroke="#F3F4F6"/>
                      <XAxis dataKey="dept" tick={{fontSize:10,fill:"#9CA3AF",fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:"#9CA3AF",fontFamily:"Inter"}} axisLine={false} tickLine={false} tickFormatter={v=>`Q${(v/1000).toFixed(0)}k`}/>
                      <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid #E5E7EB"}} formatter={(v:number)=>[`Q ${v.toLocaleString("es-GT")}`,"Gasto"]} cursor={{fill:GL}}/>
                      <Bar dataKey="gasto" radius={[3,3,0,0]} cursor="pointer" onMouseEnter={(_:any,i:number)=>setHoveredBar(CHART_DATA[i].dept)} onMouseLeave={()=>setHoveredBar(null)}>
                        {CHART_DATA.map(e=><Cell key={e.dept} fill={hoveredBar===e.dept?"#155228":G}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Actividad Reciente</h2>
                    <button onClick={()=>setShowAuditModal(true)} className="text-sm font-semibold transition-colors hover:opacity-70" style={{color:G}}>Ver Todo</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 border-b border-gray-100">{["NO. SOLICITUD","DEPENDENCIA","MONTO","ESTADO","ACCIÓN"].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>
                        {ACTIVITY.map(row=>(
                          <tr key={row.sol} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono">{row.sol}</td>
                            <td className="px-5 py-3.5 text-sm text-gray-700">{row.dep}</td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono whitespace-nowrap">{row.monto}</td>
                            <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[row.status]}`}>{row.status}</span></td>
                            <td className="px-5 py-3.5"><button className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{color:G}}><Icons.Eye/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="w-60 shrink-0 flex-col gap-4 hidden lg:flex">
                {/* Stock Alerts Card */}
                <StockAlertsCard onRestock={(itemName) => {
                  const msg = itemName
                    ? `Orden generada para: ${itemName}`
                    : "Orden de reabastecimiento generada para ítems críticos";
                  fireToast(msg, "La solicitud fue enviada a bodega central.");
                }} />

                {/* ── Branding Card (interactive component) ── */}
                <BrandingCard onOpenMap={() => setShowMapModal(true)} />

                {/* ── Support Card (interactive component) ── */}
                <SupportCard onOpenTicket={() => setShowTicketDrawer(true)} />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ── Modals & Drawers ── */}
      {showSolModal    && <SolicitudModal onClose={()=>setShowSolModal(false)}   onSubmit={()=>{ setShowSolModal(false); setTimeout(()=>fireToast("Solicitud creada exitosamente","SOL-2024-046 enviada para aprobación."),150); }}/>}
      {showGasModal    && <GastosModal    onClose={()=>setShowGasModal(false)}   onPDF={()=>{ setShowGasModal(false); setTimeout(()=>fireToast("Reporte descargado con éxito","El archivo PDF fue generado correctamente."),150); }}/>}
      {showAuditModal  && <AuditModal     onClose={()=>setShowAuditModal(false)} onExport={()=>{ setShowAuditModal(false); setTimeout(()=>fireToast("Audit log exportado","El archivo CSV/PDF fue descargado correctamente."),150); }}/>}
      {showTicketDrawer && <SupportTicketDrawer onClose={()=>setShowTicketDrawer(false)} onSubmit={()=>{ setShowTicketDrawer(false); setTimeout(()=>fireToast("Ticket enviado exitosamente","Redirigiendo al Centro de Soporte DAFIM..."),150); }}/>}
      {showMapModal     && <JurisdictionModal   onClose={()=>setShowMapModal(false)}  />}
      {showLogoutModal  && <CerrarSesionModal  onClose={()=>setShowLogoutModal(false)} onConfirm={()=>{ setShowLogoutModal(false); setTimeout(()=>{ setScreen("login"); setActiveNav("dashboard"); },280); }}/>}

      {/* ── Toast ── */}
      <Toast show={toast.show} message={toast.message} sub={toast.sub} onHide={hideToast}/>

      {/* ── FAB ── */}
      <button onClick={()=>setActiveNav("dependencias")} className="fixed bottom-5 right-5 w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:opacity-90 z-50" style={{backgroundColor:G}} title="Nueva Solicitud"><Icons.Plus/></button>
    </>
  );
}
