import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Layers, 
  Grid, 
  Cpu, 
  ShoppingBag,
  HelpCircle
} from "lucide-react";
import { Department, AppTotals } from "../types";

interface DepartmentsListProps {
  departments: Department[];
  totals: AppTotals;
  onAddDepartment: (name: string, type: 'electronic' | 'non-electronic' | 'custom', description?: string) => void;
  onEditDepartment: (id: string, updated: Partial<Department>) => void;
  onDeleteDepartment: (id: string) => void;
}

export default function DepartmentsList({ 
  departments, 
  totals, 
  onAddDepartment, 
  onEditDepartment, 
  onDeleteDepartment 
}: DepartmentsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<'electronic' | 'non-electronic' | 'custom'>('custom');
  const [description, setDescription] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setType("custom");
    setDescription("");
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAddDepartment(name, type, description);
    setShowAddModal(false);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setType(dept.type);
    setDescription(dept.description || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !name) return;
    onEditDepartment(editingDept.id, {
      name,
      type,
      description
    });
    setEditingDept(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === "dep-1" || id === "dep-2") {
      alert("Core departments (Electronic and Non-Electronic) cannot be deleted as they are system defaults.");
      return;
    }
    if (confirm(`Are you sure you want to remove the department category "${name}"? Existing sales connected to this department might need re-assignment.`)) {
      onDeleteDepartment(id);
    }
  };

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getDeptSales = (deptType: string) => {
    return deptType === 'electronic' ? totals.electronicSales : totals.nonElectronicSales;
  };

  const totalSales = totals.electronicSales + totals.nonElectronicSales;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="departments-title">
            අංශ කළමනාකරණය (Department Management)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system categories such as Electronic and Non-Electronic. Organize product logs and track their sales share.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Grid of Department cards with Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="departments-grid">
        {departments.map((dept) => {
          const sales = getDeptSales(dept.type);
          const percentage = totalSales > 0 ? (sales / totalSales) * 100 : 0;
          const isElectronic = dept.type === 'electronic';

          return (
            <motion.div
              key={dept.id}
              whileHover={{ y: -2 }}
              className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    isElectronic 
                      ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400" 
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  }`}>
                    {isElectronic ? <Cpu size={22} /> : <ShoppingBag size={22} />}
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                    {dept.type}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                  {dept.description || "No description provided."}
                </p>

                {/* Sales Share and Metric */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Department Share</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isElectronic ? "bg-cyan-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-400">Total Recorded Sales:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatLKR(sales)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Edit Category Name"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    dept.id === "dep-1" || dept.id === "dep-2"
                      ? "text-slate-200 dark:text-slate-800 cursor-not-allowed"
                      : "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                  disabled={dept.id === "dep-1" || dept.id === "dep-2"}
                  title="Delete Category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ADD DEPARTMENT CATEGORY MODAL */}
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
                  නව අංශයක් ඇතුළත් කිරීම (Add New Department)
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-xs font-bold cursor-pointer">Close</button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Department Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Household Appliances"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Layers size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Category Type Alignment *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="custom">General / Custom Share</option>
                    <option value="electronic">Electronic Department Alignment</option>
                    <option value="non-electronic">Non-Electronic Department Alignment</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1">This aligns sales inside this category into either Electronic or Non-Electronic totals on your primary dashboard indicators.</span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe products handled..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  ></textarea>
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
                    Save Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DEPARTMENT CATEGORY MODAL */}
      <AnimatePresence>
        {editingDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  අංශය දත්ත සංශෝධනය (Edit Department)
                </h3>
                <button onClick={() => setEditingDept(null)} className="text-slate-400 text-xs font-bold cursor-pointer">Close</button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Department Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Layers size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Category Type Alignment *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="custom">General / Custom Share</option>
                    <option value="electronic">Electronic Department Alignment</option>
                    <option value="non-electronic">Non-Electronic Department Alignment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
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
