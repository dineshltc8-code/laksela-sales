import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  Edit, 
  Award, 
  Users, 
  TrendingUp, 
  DollarSign,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Salesman, AppTotals } from "../types";

interface TargetsListProps {
  salesmen: Salesman[];
  totals: AppTotals;
  onUpdateOverallTarget: (target: number) => void;
  onUpdateSalesmanTarget: (id: string, target: number) => void;
}

export default function TargetsList({ 
  salesmen, 
  totals, 
  onUpdateOverallTarget, 
  onUpdateSalesmanTarget 
}: TargetsListProps) {
  // Input states
  const [overallTarget, setOverallTarget] = useState(totals.monthlyTarget.toString());
  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [editingSalesmanId, setEditingSalesmanId] = useState<string | null>(null);
  const [salesmanTargetInput, setSalesmanTargetInput] = useState("");

  const handleSaveOverall = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(overallTarget);
    if (!isNaN(num) && num >= 0) {
      onUpdateOverallTarget(num);
      setIsEditingOverall(false);
    }
  };

  const handleStartEditSalesman = (sm: Salesman) => {
    setEditingSalesmanId(sm.id);
    setSalesmanTargetInput(sm.monthlyTarget.toString());
  };

  const handleSaveSalesmanTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesmanId) return;
    const num = parseFloat(salesmanTargetInput);
    if (!isNaN(num) && num >= 0) {
      onUpdateSalesmanTarget(editingSalesmanId, num);
      setEditingSalesmanId(null);
    }
  };

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Compare actual vs target
  const gap = totals.monthlyTarget - totals.monthlySales;
  const isTargetAchieved = gap <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="targets-title">
          මාසික ඉලක්ක කළමනාකරණය (Monthly Target Management)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Define monthly quotas for Laksela and assign individual salesman quotas. Compare performance in real-time.
        </p>
      </div>

      {/* Target Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="targets-grid">
        
        {/* Overall Corporate Target Setup */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Target className="text-blue-500" size={20} /> පොදු මාසික ඉලක්කය (Overall Monthly Target)
            </h3>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-bold">Current Target</span>
                {!isEditingOverall && (
                  <button 
                    onClick={() => setIsEditingOverall(true)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>

              {isEditingOverall ? (
                <form onSubmit={handleSaveOverall} className="flex gap-2">
                  <input
                    type="number"
                    value={overallTarget}
                    onChange={(e) => setOverallTarget(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingOverall(false)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="text-2xl font-black text-slate-800 dark:text-white">
                  {formatLKR(totals.monthlyTarget)}
                </div>
              )}
            </div>

            {/* Achievement Info */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Monthly Sales achieved:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatLKR(totals.monthlySales)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Achievement percentage:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totals.achievementRate.toFixed(1)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, totals.achievementRate)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
            isTargetAchieved 
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/30 text-emerald-800 dark:text-emerald-400" 
              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/30 text-amber-800 dark:text-amber-400"
          }`}>
            {isTargetAchieved ? (
              <>
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                <div className="text-xs">
                  <strong>Target Met!</strong> Laksela overall target of {formatLKR(totals.monthlyTarget)} has been achieved! All excess is profitable surplus.
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="text-xs">
                  <strong>Pace Update:</strong> {formatLKR(gap)} remaining of target. Salesmen need to push electronic or non-electronic items to close the gap.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Salesmen-Specific targets setting */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Sliders className="text-indigo-500" size={20} /> සේල්ස්මන් ඉලක්ක සැකසීම (Salesman-Specific Targets)
          </h3>

          <div className="space-y-4">
            {salesmen.map((sm) => {
              const isEditing = editingSalesmanId === sm.id;
              const salesmanGap = sm.monthlyTarget - sm.monthlySales;
              const salesmanAchieved = salesmanGap <= 0;

              return (
                <div 
                  key={sm.id} 
                  className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Salesman Name and details */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={sm.photo} 
                      alt={sm.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sm.name)}`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">{sm.name}</h4>
                      <span className="text-[10px] text-slate-400 block">
                        Sales: {formatLKR(sm.monthlySales)} • Achievement: {sm.achievementRate.toFixed(1)}%
                      </span>
                      <span className={`text-[9px] font-bold block mt-0.5 ${sm.monthlySales >= sm.monthlyTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {sm.monthlySales >= sm.monthlyTarget 
                          ? '🏆 Quota Completed!' 
                          : `Remaining Target: ${formatLKR(sm.monthlyTarget - sm.monthlySales)}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Target input and controls */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {isEditing ? (
                      <form onSubmit={handleSaveSalesmanTarget} className="flex gap-1">
                        <input
                          type="number"
                          value={salesmanTargetInput}
                          onChange={(e) => setSalesmanTargetInput(e.target.value)}
                          className="w-28 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                          required
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="py-1 px-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSalesmanId(null)}
                          className="py-1 px-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-[10px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Monthly Quota</span>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{formatLKR(sm.monthlyTarget)}</span>
                        </div>
                        <button
                          onClick={() => handleStartEditSalesman(sm)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit Target"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
