import React, { useState } from "react";
import { Plus, Edit, Trash2, MapPin, Phone, RefreshCw, Layers, CheckCircle2, AlertTriangle } from "lucide-react";
import { Location } from "../types";

interface LocationsListProps {
  locations: Location[];
  onAddLocation: (loc: Omit<Location, "id">) => void;
  onEditLocation: (id: string, updated: Partial<Location>) => void;
  onDeleteLocation: (id: string) => void;
}

export default function LocationsList({
  locations,
  onAddLocation,
  onEditLocation,
  onDeleteLocation
}: LocationsListProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>("auto");
  const [syncMethod, setSyncMethod] = useState<'internet' | 'wifi'>("internet");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSyncMode, setEditSyncMode] = useState<'auto' | 'manual'>("auto");
  const [editSyncMethod, setEditSyncMethod] = useState<'internet' | 'wifi'>("internet");

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      showNotification("❌ Name and Code are required!");
      return;
    }

    onAddLocation({
      name,
      code,
      address,
      phone,
      isActive: true,
      syncMode,
      syncMethod,
      lastSyncTime: "Just registered"
    });

    setName("");
    setCode("");
    setAddress("");
    setPhone("");
    showNotification("✅ New Showroom registered successfully!");
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditCode(loc.code);
    setEditAddress(loc.address);
    setEditPhone(loc.phone);
    setEditSyncMode(loc.syncMode);
    setEditSyncMethod(loc.syncMethod);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    onEditLocation(editingId, {
      name: editName,
      code: editCode,
      address: editAddress,
      phone: editPhone,
      syncMode: editSyncMode,
      syncMethod: editSyncMethod
    });

    setEditingId(null);
    showNotification("✅ Showroom details updated successfully!");
  };

  const handleDelete = (id: string) => {
    if (locations.length <= 1) {
      alert("❌ Cannot delete the last remaining location showroom! At least one active branch must persist.");
      return;
    }
    if (confirm("⚠️ Are you sure you want to delete this showroom? All transactions associated with this location will lose their location link.")) {
      onDeleteLocation(id);
      showNotification("🗑️ Location showroom removed successfully.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">
            ප්‍රදර්ශනාගාර සහ ස්ථාන කළමනාකරණය (Showroom & Location Management)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register and manage multiple physical stores, warehouses, or client terminal offices.
          </p>
        </div>

        {notification && (
          <div className="mt-2 sm:mt-0 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md">
            {notification}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm self-start">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-500" /> 
            {editingId ? "ස්ථාන තොරතුරු වෙනස් කරන්න" : "නව ස්ථානයක් ඇතුළත් කරන්න"}
          </h3>

          {editingId ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Showroom Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Location Code *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Physical Address</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sync Mode</label>
                  <select
                    value={editSyncMode}
                    onChange={(e) => setEditSyncMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  >
                    <option value="auto">Auto Sync</option>
                    <option value="manual">Manual Sync</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sync Channel</label>
                  <select
                    value={editSyncMethod}
                    onChange={(e) => setEditSyncMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  >
                    <option value="internet">Cloud Internet</option>
                    <option value="wifi">Local Wi-Fi</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-center"
                >
                  Save Changes
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
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Showroom Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kurunegala Branch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Location Code *</label>
                  <input
                    type="text"
                    placeholder="LAK-KRG-04"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+94 37 222 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Physical Address</label>
                <textarea
                  placeholder="Street name, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sync Mode</label>
                  <select
                    value={syncMode}
                    onChange={(e) => setSyncMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  >
                    <option value="auto">Auto Sync</option>
                    <option value="manual">Manual Sync</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sync Channel</label>
                  <select
                    value={syncMethod}
                    onChange={(e) => setSyncMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                  >
                    <option value="internet">Cloud Internet</option>
                    <option value="wifi">Local Wi-Fi</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/15 transition-all duration-150 cursor-pointer text-center"
              >
                Register Location
              </button>
            </form>
          )}
        </div>

        {/* Location List Display */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
              Registered Locations ({locations.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div 
                  key={loc.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    loc.isActive 
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25 hover:border-slate-300"
                      : "border-slate-100 dark:border-slate-900 bg-slate-100/30 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{loc.name}</h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                          {loc.code}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(loc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Edit Location"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Delete Location"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{loc.address || "No physical address listed"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{loc.phone || "No phone listed"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 font-semibold text-slate-400">
                      <RefreshCw size={10} className="animate-spin text-blue-500" />
                      <span>{loc.syncMode === "auto" ? "Auto" : "Manual"} • {loc.syncMethod === "internet" ? "Cloud" : "Wi-Fi"}</span>
                    </div>

                    <div className="text-right text-slate-400">
                      Last update: <span className="text-slate-600 dark:text-slate-300 font-medium">{loc.lastSyncTime || "Never"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
