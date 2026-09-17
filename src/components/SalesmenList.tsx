import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  UserPlus, 
  Target, 
  Briefcase, 
  Users, 
  Percent, 
  DollarSign, 
  Grid, 
  ShoppingBag,
  Clock,
  User,
  Image as ImageIcon
} from "lucide-react";
import { Salesman, SalesRecord } from "../types";

interface SalesmenListProps {
  salesmen: Salesman[];
  salesRecords: SalesRecord[];
  onAddSalesman: (salesman: Omit<Salesman, "id" | "dailySales" | "monthlySales" | "customerCount" | "achievementRate" | "electronicSales" | "nonElectronicSales" | "totalSales">) => void;
  onEditSalesman: (id: string, updated: Partial<Salesman>) => void;
  onDeleteSalesman: (id: string) => void;
}

export default function SalesmenList({ 
  salesmen, 
  salesRecords, 
  onAddSalesman, 
  onEditSalesman, 
  onDeleteSalesman 
}: SalesmenListProps) {
  // UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [photo, setPhoto] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setMonthlyTarget("");
    setPhoto("");
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !monthlyTarget) return;

    const targetNum = parseFloat(monthlyTarget);
    if (isNaN(targetNum) || targetNum <= 0) return;

    // Use default premium avatar if no URL provided
    const avatarUrl = photo.trim() || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;

    onAddSalesman({
      name,
      monthlyTarget: targetNum,
      photo: avatarUrl
    });

    setShowAddModal(false);
  };

  const handleOpenEdit = (sm: Salesman, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop from opening salesman profile dashboard
    setEditingSalesman(sm);
    setName(sm.name);
    setMonthlyTarget(sm.monthlyTarget.toString());
    setPhoto(sm.photo);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesman || !name || !monthlyTarget) return;

    const targetNum = parseFloat(monthlyTarget);
    if (isNaN(targetNum) || targetNum <= 0) return;

    onEditSalesman(editingSalesman.id, {
      name,
      monthlyTarget: targetNum,
      photo: photo.trim() || editingSalesman.photo
    });

    setEditingSalesman(null);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop from opening profile
    if (confirm(`Are you sure you want to delete salesman "${name}"? All calculations will be recalculated.`)) {
      onDeleteSalesman(id);
      // Close selected profile if it was the deleted one
      if (selectedSalesman?.id === id) {
        setSelectedSalesman(null);
      }
    }
  };

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Get specific salesman records for detail dashboard
  const getSalesmanHistory = (smId: string) => {
    return salesRecords.filter(r => r.salesmanId === smId).reverse();
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="salesmen-title">
            සේල්ස්මන් කළමනාකරණය (Salesmen Management)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register and manage Laksela salesmen profiles, individual targets, and track their monthly achievements.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <UserPlus size={16} /> Add Salesman
        </button>
      </div>

      {/* Grid of Salesmen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="salesmen-grid">
        {salesmen.map((sm) => {
          const isTargetAchieved = sm.monthlySales >= sm.monthlyTarget;
          
          return (
            <motion.div
              key={sm.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedSalesman(sm)}
              className="group cursor-pointer p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Avatar and Basic info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={sm.photo}
                      alt={sm.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800"
                      onError={(e) => {
                        // Fallback image
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sm.name)}`;
                      }}
                    />
                    {isTargetAchieved && (
                      <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full text-[8px] font-bold shadow-md">
                        🏆
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sm.name}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                      Laksela Sales Team
                    </span>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Target Progress:</span>
                    <span className={sm.achievementRate >= 100 ? "text-emerald-600" : sm.achievementRate >= 70 ? "text-blue-600" : "text-amber-500"}>
                      {sm.achievementRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        sm.achievementRate >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, sm.achievementRate)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-t border-slate-100 dark:border-slate-800/40">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase">Monthly Target</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatLKR(sm.monthlyTarget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase">Monthly Sales</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatLKR(sm.monthlySales)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with actions */}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Users size={12} /> {sm.customerCount} Customers
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleOpenEdit(sm, e)}
                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                    title="Edit Salesman Info"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(sm.id, sm.name, e)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    title="Delete Salesman"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 1. SALESMAN DETAIL DASHBOARD (MODAL OVERLAY) */}
      <AnimatePresence>
        {selectedSalesman && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-slate-900 dark:to-slate-950 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedSalesman.photo}
                    alt={selectedSalesman.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedSalesman.name)}`;
                    }}
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold">{selectedSalesman.name}</h3>
                    <span className="text-xs text-blue-100/80">සේල්ස්මන් පුද්ගලික දත්ත සාරාංශය (Salesman Performance Dashboard)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleOpenEdit(selectedSalesman, e)}
                    className="py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setSelectedSalesman(null)}
                    className="py-1.5 px-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>

              {/* Scrollable body content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Core KPI metrics of Salesman */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Sales */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400 block mt-1">{formatLKR(selectedSalesman.totalSales)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">මුළු විකුණුම් එකතුව</span>
                  </div>
                  {/* Monthly Sales */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Sales</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{formatLKR(selectedSalesman.monthlySales)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">මාසික විකුණුම්</span>
                  </div>
                  {/* Monthly Target */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Target</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 block mt-1">{formatLKR(selectedSalesman.monthlyTarget)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">මාසික ඉලක්කය</span>
                  </div>
                  {/* Achievement */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Achievement %</span>
                    <span className="text-xl font-bold text-amber-500 block mt-1">{selectedSalesman.achievementRate.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">ළඟා වීමේ ප්‍රතිශතය</span>
                  </div>
                </div>

                {/* Sub KPI: department breakdown and customer count */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Electronic Department */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg">
                      <Grid size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Electronic Sales</span>
                      <span className="font-bold text-slate-800 dark:text-white block text-sm">{formatLKR(selectedSalesman.electronicSales)}</span>
                    </div>
                  </div>

                  {/* Non-Electronic Department */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Non-Electronic Sales</span>
                      <span className="font-bold text-slate-800 dark:text-white block text-sm">{formatLKR(selectedSalesman.nonElectronicSales)}</span>
                    </div>
                  </div>

                  {/* Total Customer Count */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Customers Logged</span>
                      <span className="font-bold text-slate-800 dark:text-white block text-sm">{selectedSalesman.customerCount} Customers</span>
                    </div>
                  </div>
                </div>

                {/* Salesman specific transaction history */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> මෑතකාලීන ගනුදෙනු ලේඛනය (Recent Transactions)
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Department</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                          <th className="py-2.5 px-4 text-center">Customers</th>
                          <th className="py-2.5 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                        {getSalesmanHistory(selectedSalesman.id).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 bg-white dark:bg-slate-900">
                              No sales records logged for this salesman yet.
                            </td>
                          </tr>
                        ) : (
                          getSalesmanHistory(selectedSalesman.id).map(r => (
                            <tr key={r.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="py-2.5 px-4 font-semibold">{r.date}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                  r.departmentName === "Electronic" 
                                    ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400" 
                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                                }`}>
                                  {r.departmentName}
                                </span>
                              </td>
                              <td className={`py-2.5 px-4 text-right font-bold ${
                                r.amount < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                              }`}>{formatLKR(r.amount)}</td>
                              <td className="py-2.5 px-4 text-center font-semibold">{r.customerCount}</td>
                              <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">{r.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD SALESMAN MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  නව සේල්ස්මන් ඇතුළත් කිරීම (Add New Salesman)
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-xs font-bold cursor-pointer">Close</button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Suresh Perera"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <User size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Monthly Sales Target (LKR) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(e.target.value)}
                      placeholder="e.g. 350000"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Target size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Photo / Avatar Image URL (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <ImageIcon size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">හෝ රූපයක් පූරණය කරන්න (Or Load Local Image file)</label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    {photo && (
                      <img 
                        src={photo} 
                        alt="Preview" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;
                        }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400
                        file:mr-3 file:py-1 file:px-2.5
                        file:rounded-lg file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400 cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">රූපය තෝරා පූරණය කරන්න. (Pick and load a local image file instantly).</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Save Salesman
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. EDIT SALESMAN MODAL */}
      <AnimatePresence>
        {editingSalesman && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  සේල්ස්මන් දත්ත සංශෝධනය (Edit Salesman Profile)
                </h3>
                <button onClick={() => setEditingSalesman(null)} className="text-slate-400 text-xs font-bold cursor-pointer">Close</button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <User size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Monthly Target (LKR) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Target size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Photo / Avatar URL</label>
                  <div className="relative font-sans mb-3">
                    <input
                      type="text"
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <ImageIcon size={16} />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    {photo && (
                      <img 
                        src={photo} 
                        alt="Preview" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;
                        }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400
                        file:mr-3 file:py-1 file:px-2.5
                        file:rounded-lg file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSalesman(null)}
                    className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
