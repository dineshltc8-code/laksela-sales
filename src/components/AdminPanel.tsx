import React, { useState } from "react";
import { Plus, Edit, Trash2, Monitor, Laptop, Shield, Wifi, Network, Activity, CheckCircle, AlertCircle } from "lucide-react";
import { PCInstallation, Location } from "../types";

interface AdminPanelProps {
  pcs: PCInstallation[];
  locations: Location[];
  onAddPC: (pc: Omit<PCInstallation, "id" | "locationName">) => void;
  onEditPC: (id: string, updated: Partial<PCInstallation>) => void;
  onDeletePC: (id: string) => void;
  accessMode: "admin" | "terminal";
  onChangeAccessMode: (mode: "admin" | "terminal") => void;
  selectedTerminalId: string;
  onSelectTerminal: (id: string) => void;
}

export default function AdminPanel({
  pcs,
  locations,
  onAddPC,
  onEditPC,
  onDeletePC,
  accessMode,
  onChangeAccessMode,
  selectedTerminalId,
  onSelectTerminal
}: AdminPanelProps) {
  const [pcName, setPcName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPcName, setEditPcName] = useState("");
  const [editLocationId, setEditLocationId] = useState("");
  const [editIpAddress, setEditIpAddress] = useState("");
  const [editMacAddress, setEditMacAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"online" | "offline">("online");

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcName || !locationId) {
      showNotification("❌ PC Name and Location Assignment are required!");
      return;
    }

    onAddPC({
      pcName,
      locationId,
      ipAddress: ipAddress || "192.168.1.100",
      macAddress: macAddress || "00:AA:BB:CC:DD:EE",
      status: "online",
      lastActive: "Just added",
      syncStatus: "synced"
    });

    setPcName("");
    setLocationId("");
    setIpAddress("");
    setMacAddress("");
    showNotification("✅ PC Installation Registered & Paired Successfully!");
  };

  const startEdit = (pc: PCInstallation) => {
    setEditingId(pc.id);
    setEditPcName(pc.pcName);
    setEditLocationId(pc.locationId);
    setEditIpAddress(pc.ipAddress);
    setEditMacAddress(pc.macAddress);
    setEditStatus(pc.status);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    onEditPC(editingId, {
      pcName: editPcName,
      locationId: editLocationId,
      ipAddress: editIpAddress,
      macAddress: editMacAddress,
      status: editStatus
    });

    setEditingId(null);
    showNotification("✅ PC Terminal config saved.");
  };

  const handleDelete = (id: string) => {
    if (pcs.length <= 1) {
      alert("❌ At least one PC terminal registry is required to run location simulations.");
      return;
    }
    if (confirm("Are you sure you want to remove this PC registration?")) {
      onDeletePC(id);
      showNotification("🗑️ PC Terminal registration deleted.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-600 shrink-0" size={22} />
            පද්ධති පරිපාලන පැනලය (Central System & Terminal Admin Panel)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle global access rights, bind terminals to physical showrooms, and supervise network status.
          </p>
        </div>

        {/* Global Access Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 self-start md:self-auto">
          <button
            onClick={() => onChangeAccessMode("admin")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              accessMode === "admin"
                ? "bg-blue-600 text-white shadow-sm font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            CENTRAL ADMIN
          </button>
          <button
            onClick={() => onChangeAccessMode("terminal")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              accessMode === "terminal"
                ? "bg-amber-500 text-white shadow-sm font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            TERMINAL NODE
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md text-center">
          {notification}
        </div>
      )}

      {accessMode === "terminal" && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Active Local Terminal Mode</h4>
            <p className="mt-1 leading-relaxed">
              The software is currently operating under a simulated localized cash desk installation. Sales entry, daily targets, and localized customer logs are restricted to the selected terminal.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-bold">Pair client as PC:</span>
              <select
                value={selectedTerminalId}
                onChange={(e) => onSelectTerminal(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg px-2 py-1 focus:outline-none text-slate-800 dark:text-slate-200 font-bold"
              >
                {pcs.map(pc => (
                  <option key={pc.id} value={pc.id}>{pc.pcName} ({pc.locationName})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Add/Edit Form */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm self-start">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-blue-500" />
            {editingId ? "ටර්මිනල් සැකසුම් වෙනස් කරන්න" : "නව ටර්මිනලයක් යුගලනය කරන්න"}
          </h3>

          {editingId ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">PC Terminal Name *</label>
                <input
                  type="text"
                  value={editPcName}
                  onChange={(e) => setEditPcName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Assign Showroom Location *</label>
                <select
                  value={editLocationId}
                  onChange={(e) => setEditLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">IP Address</label>
                  <input
                    type="text"
                    value={editIpAddress}
                    onChange={(e) => setEditIpAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={editMacAddress}
                    onChange={(e) => setEditMacAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Network Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="online">Online / Connected</option>
                  <option value="offline">Offline / Disconnected</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-center"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">PC Terminal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Counter 03 POS Terminal"
                  value={pcName}
                  onChange={(e) => setPcName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Assign Showroom Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Local IP Address</label>
                  <input
                    type="text"
                    placeholder="192.168.1.100"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">MAC Address</label>
                  <input
                    type="text"
                    placeholder="D4:12:E8:FC:92:4B"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/15 transition-all duration-150 cursor-pointer text-center"
              >
                Register & Bind Terminal
              </button>
            </form>
          )}
        </div>

        {/* Terminals list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Paired Terminals / Registered Client PCs ({pcs.length})
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                Network Grid
              </span>
            </div>

            <div className="space-y-3">
              {pcs.map(pc => {
                const matchedLocation = locations.find(l => l.id === pc.locationId);
                const isSelected = pc.id === selectedTerminalId;
                
                return (
                  <div 
                    key={pc.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                      isSelected
                        ? "border-amber-400 dark:border-amber-600 bg-amber-500/5 dark:bg-amber-950/10"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${pc.status === "online" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} shrink-0`}>
                        <Monitor size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{pc.pcName}</h4>
                          <span className={`h-2 w-2 rounded-full ${pc.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`}></span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Assigned to: <strong className="text-slate-600 dark:text-slate-300">{matchedLocation?.name || "Unassigned"} ({matchedLocation?.code || "N/A"})</strong>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 mt-1.5 font-mono">
                          <span className="flex items-center gap-1"><Wifi size={10} /> IP: {pc.ipAddress}</span>
                          <span className="flex items-center gap-1"><Network size={10} /> MAC: {pc.macAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center md:flex-col items-end gap-3 md:gap-1 text-right w-full md:w-auto border-t md:border-0 pt-3 md:pt-0 mt-2 md:mt-0 justify-between md:justify-center">
                      <div className="text-[10px] text-slate-400">
                        Status: <span className={`font-semibold ${pc.syncStatus === "synced" ? "text-emerald-500" : "text-amber-500"}`}>
                          {pc.syncStatus === "synced" ? "Synced" : "Pending Sync"}
                        </span>
                        <p className="mt-0.5">Active: <span className="text-slate-600 dark:text-slate-300 font-medium">{pc.lastActive}</span></p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(pc)}
                          className="p-1 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(pc.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
