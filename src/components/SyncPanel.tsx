import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Wifi, 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Database, 
  ShieldAlert, 
  WifiOff,
  Laptop,
  CheckCircle,
  XCircle,
  Sliders,
  History,
  Send,
  Download
} from "lucide-react";
import { Location, PCInstallation } from "../types";

interface SyncLog {
  id: string;
  device: string;
  location: string;
  dateTime: string;
  recordsSent: number;
  recordsReceived: number;
  status: 'SUCCESS' | 'FAILED';
  errorDetails?: string;
}

interface SyncStats {
  totalPCs: number;
  onlinePCs: number;
  offlinePCs: number;
  successfullyUpdated: number;
  pendingUpdates: number;
  failedUpdates: number;
  lastSyncTime: string;
  pcs: PCInstallation[];
  logs: SyncLog[];
}

interface SyncPanelProps {
  locations: Location[];
  pcs: PCInstallation[];
  onTriggerSync: (method: 'internet' | 'wifi') => void;
  syncInProgress: boolean;
  onToggleAutoSync: (id: string) => void;
  syncStats: SyncStats;
  autoSyncEnabled: boolean;
  autoSyncTime: string;
  onToggleGlobalAutoSync: () => void;
  onSetGlobalAutoSyncTime: (time: string) => void;
  onRefreshStatus: () => void;
  accessMode: "admin" | "terminal";
  selectedTerminalId: string;
}

export default function SyncPanel({
  locations,
  pcs,
  onTriggerSync,
  syncInProgress,
  onToggleAutoSync,
  syncStats,
  autoSyncEnabled,
  autoSyncTime,
  onToggleGlobalAutoSync,
  onSetGlobalAutoSyncTime,
  onRefreshStatus,
  accessMode,
  selectedTerminalId
}: SyncPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<'internet' | 'wifi'>("internet");
  const [isOnline, setIsOnline] = useState(true);
  
  // State for data selection checkboxes for synchronization
  const [syncCategories, setSyncCategories] = useState({
    locations: true,
    salesmen: true,
    sales: true,
    targets: true,
    customerCounts: true
  });

  const activeTerminal = pcs.find(p => p.id === selectedTerminalId);
  const activeLocation = activeTerminal ? locations.find(l => l.id === activeTerminal.locationId) : null;

  // Manual Trigger Sync Now for Location terminal PC
  const handleTerminalSyncNow = async () => {
    onTriggerSync(selectedMethod);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors flex items-center gap-2">
            <RefreshCw className={`text-blue-600 ${syncInProgress ? 'animate-spin' : ''}`} size={20} />
            දත්ත සමමුහුර්තකරණය (Internet Data Transfer & Sync Control)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure secure cloud broker handshakes, manage physical terminal PC installations, and supervise the sync event ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">WAN Status:</span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              isOnline 
                ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                : "bg-rose-100/60 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
            }`}
          >
            {isOnline ? <Globe size={12} /> : <WifiOff size={12} />}
            {isOnline ? "ONLINE" : "OFFLINE FALLBACK"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sync Settings & Action Block */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Sync Controls Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Sliders className="text-blue-500" size={16} />
              {accessMode === "admin" ? "Admin Sync & Update Hub" : "Location Terminal Sync"}
            </h3>

            {accessMode === "terminal" ? (
              // Location Terminal PC View
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Identified Showroom:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{activeLocation ? activeLocation.name : " Colombo HQ"}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Terminal Node ID:</span>
                    <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {selectedTerminalId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Broker Status:</span>
                    <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded ${
                      syncInProgress ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40" :
                      !isOnline ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40" :
                      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40"
                    }`}>
                      {syncInProgress ? "Syncing" : !isOnline ? "Offline" : "Connected & Updated"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Sync Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMethod("internet")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center transition-all cursor-pointer ${
                        selectedMethod === "internet"
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <Globe size={12} /> Internet WAN
                    </button>
                    <button
                      onClick={() => setSelectedMethod("wifi")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center transition-all cursor-pointer ${
                        selectedMethod === "wifi"
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <Wifi size={12} /> Local Wi-Fi
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTerminalSyncNow}
                  disabled={syncInProgress}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={syncInProgress ? "animate-spin" : ""} />
                  {syncInProgress ? "SYNCHRONIZING TERMINAL REPOSITORY..." : "SYNC NOW (දැන්ම සමමුහුර්ත කරන්න)"}
                </button>
              </div>
            ) : (
              // Admin PC View
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Select Database Schemas to Transfer</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={syncCategories.locations} 
                        onChange={() => setSyncCategories(p => ({ ...p, locations: !p.locations }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      Showroom Locations
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={syncCategories.salesmen} 
                        onChange={() => setSyncCategories(p => ({ ...p, salesmen: !p.salesmen }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      Salesmen Roster
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={syncCategories.sales} 
                        onChange={() => setSyncCategories(p => ({ ...p, sales: !p.sales }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      Sales Records
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={syncCategories.targets} 
                        onChange={() => setSyncCategories(p => ({ ...p, targets: !p.targets }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      Monthly Quota targets
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer col-span-2 mt-1">
                      <input 
                        type="checkbox" 
                        checked={syncCategories.customerCounts} 
                        onChange={() => setSyncCategories(p => ({ ...p, customerCounts: !p.customerCounts }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      Central Customer Traffic Logs
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => onTriggerSync(selectedMethod)}
                  disabled={syncInProgress}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send size={13} />
                  SYNC / SEND UPDATE TO ALL PCS
                </button>
              </div>
            )}
          </div>

          {/* Automatic Daily Updates Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Clock className="text-emerald-500" size={16} />
              Automatic Daily Sync Broker
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Enable Auto Sync</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Automate off-peak cloud database upload/download.</span>
              </div>
              <button
                onClick={onToggleGlobalAutoSync}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  autoSyncEnabled 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {autoSyncEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Preferred Sync Window (Daily)</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={autoSyncTime}
                  onChange={(e) => onSetGlobalAutoSyncTime(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 font-bold"
                />
                <button 
                  onClick={onRefreshStatus}
                  className="px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer text-xs font-bold"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1">
                * If offline at preferred sync window, the system automatically schedules a persistent background worker retry loop when online.
              </p>
            </div>
          </div>

        </div>

        {/* Location Showroom PC Registries & Event Sync Logs list */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Registered Location PCs table list */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Laptop size={15} className="text-blue-500" />
                Registered Location Showroom PC Installations
              </h3>
              <button 
                onClick={onRefreshStatus}
                className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase cursor-pointer"
              >
                Refresh State
              </button>
            </div>

            <div className="space-y-3">
              {pcs.map(pc => {
                const matchedLocation = locations.find(l => l.id === pc.locationId);
                return (
                  <div key={pc.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/10 flex items-center justify-between text-xs transition-all hover:bg-slate-100/50">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${pc.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100">{pc.pcName}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Showroom Location: <strong className="text-slate-600 dark:text-slate-300">{matchedLocation?.name || "Colombo Showroom"}</strong></p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Last Successful Sync</span>
                      <span className="text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                        {pc.status === "online" ? new Date().toLocaleDateString() + " " + (matchedLocation?.lastSyncTime || "06:15 AM") : "Never"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Persistent Event Synchronizer Ledger Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <History size={15} className="text-slate-500" />
              Internet Synchronization Event Logs (Broker Audit Ledger)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/50">
                    <th className="py-2">Device Node</th>
                    <th className="py-2">Showroom Location</th>
                    <th className="py-2">Date/Time</th>
                    <th className="py-2 text-center">Tx Sent</th>
                    <th className="py-2 text-center">Tx Recv</th>
                    <th className="py-2 text-right">Handshake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {syncStats.logs && syncStats.logs.length > 0 ? (
                    syncStats.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">{log.device}</td>
                        <td className="py-2.5 text-slate-500">{log.location}</td>
                        <td className="py-2.5 font-mono text-slate-400">{log.dateTime}</td>
                        <td className="py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">{log.recordsSent}</td>
                        <td className="py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">{log.recordsReceived}</td>
                        <td className="py-2.5 text-right font-black">
                          <span className={`px-2 py-0.5 rounded text-[9px] ${
                            log.status === "SUCCESS" 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                        No synchronization event log history found. Click sync to trigger handshakes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
