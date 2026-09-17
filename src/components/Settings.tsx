import { useState } from "react";
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  CheckCircle,
  HelpCircle,
  Globe,
  AlertCircle
} from "lucide-react";

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetApp: () => void;
  accessMode: "admin" | "terminal";
  onDeleteSampleData: (type: "locations" | "salesmen" | "sales" | "targets" | "customer_counts" | "departments" | "all") => void;

  // Real-Time Database State & Transaction logs
  dbStatus: string;
  totalRecordCount: number;
  currentMonthName: string;
  lastAutoSaveTime: string;
  lastAutoSaveStatus: string;
  onClearSampleData: () => Promise<void>;
  onClearAllDatabaseData: () => Promise<void>;
  onRefreshDatabase: () => Promise<void>;
}

export default function Settings({ 
  darkMode, 
  onToggleDarkMode, 
  onResetApp,
  accessMode,
  onDeleteSampleData,

  dbStatus,
  totalRecordCount,
  currentMonthName,
  lastAutoSaveTime,
  lastAutoSaveStatus,
  onClearSampleData,
  onClearAllDatabaseData,
  onRefreshDatabase
}: SettingsProps) {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [clearSampleSuccess, setClearSampleSuccess] = useState(false);
  const [clearAllSuccess, setClearAllSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleReset = () => {
    if (confirm("This will clear any records or changes you have entered and restore the default Laksela demonstrative database. Are you sure?")) {
      onResetApp();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleClearSample = async () => {
    if (accessMode !== "admin") {
      alert("❌ Unauthorized: Only authorized administrators are permitted to clear sample data.");
      return;
    }
    if (confirm("⚠️ WARNING: This will permanently purge all existing temporary, demo, sample, and test sales records, customer counts, and stock transfers from the central database.\n\nStructure, settings, configurations, and core tables will be preserved.\n\nDo you wish to continue?")) {
      try {
        await onClearSampleData();
        setClearSampleSuccess(true);
        setTimeout(() => setClearSampleSuccess(false), 3000);
      } catch (err) {
        alert("Failed to clear sample data. Connection lost.");
      }
    }
  };

  const handleClearAll = async () => {
    if (accessMode !== "admin") {
      alert("❌ Unauthorized: Only authorized administrators are permitted to clear all database data.");
      return;
    }
    if (confirm("🛑 CRITICAL ACTION: This will permanently delete ALL user transactions, sales logs, customer counts, stock transfers, and reset current stock items to 0.\n\nThis action is irreversible.\n\nAre you absolutely sure? Type 'YES' inside the prompt if you are sure.")) {
      const resp = prompt("Please type 'CONFIRM-DELETE' to permanently wipe all database data:");
      if (resp === "CONFIRM-DELETE") {
        try {
          await onClearAllDatabaseData();
          setClearAllSuccess(true);
          setTimeout(() => setClearAllSuccess(false), 3000);
        } catch (err) {
          alert("Failed to wipe database. Connection lost.");
        }
      } else {
        alert("Action aborted. Incorrect confirmation text.");
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshDatabase();
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="settings-title">
          පද්ධති සැකසුම් (System Settings)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust visual styles, theme preferences, and manage the Laksela database state.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-grid">
        
        {/* Appearance & Style */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <SettingsIcon className="text-blue-500" size={18} /> Theme & Style Options
          </h3>
          <p className="text-xs text-slate-500">Customize the UI appearance of the desktop client interface.</p>

          <div className="flex items-center justify-between py-3 border-y border-slate-150/40 dark:border-slate-800/40">
            <div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Dark Color Mode</span>
              <span className="text-[10px] text-slate-400">Reduce glare and strain on visual displays.</span>
            </div>
            
            <button
              onClick={onToggleDarkMode}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                darkMode 
                  ? "bg-slate-800 border-slate-700 text-amber-400" 
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        {/* Real-Time Database settings */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Database className="text-blue-600" size={18} /> Real-Time Database Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Control live transactions, status metrics, and perform secure system clear-downs.</p>
          </div>

          {/* DB Status Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/25 p-4 rounded-xl border border-slate-150/50 dark:border-slate-850/50 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">DB Sync Status:</span>
              <span className={`inline-flex items-center gap-1 font-extrabold mt-1 px-2 py-0.5 rounded-full ${
                dbStatus.includes("Online") 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.includes("Online") ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                {dbStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Record Log Count:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block mt-1.5 text-sm">{totalRecordCount} registered logs</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Current Audit Month:</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block mt-1.5 text-sm">{currentMonthName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Last Auto-Saved:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block mt-1.5 text-xs">{lastAutoSaveTime} ({lastAutoSaveStatus})</span>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="space-y-3 pt-2">
            {/* Refresh/Recalculate */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Refresh & Recompute Totals</span>
                <span className="text-[10px] text-slate-400">Trigger full sync pull from backend and force calculate budgets.</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="py-1.5 px-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 flex items-center gap-1"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Recalculating..." : "Recalculate"}
              </button>
            </div>

            {/* Clear Temporary Sample Data */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div>
                <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block flex items-center gap-1">
                  <Shield size={12} /> Clear Temporary/Sample Data
                </span>
                <span className="text-[10px] text-slate-400">Wipe preloaded mock records without altering showroom setups or ROIs.</span>
              </div>
              <button
                onClick={handleClearSample}
                className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                  clearSampleSuccess 
                    ? "bg-emerald-500 border-emerald-400 text-white" 
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                }`}
              >
                {clearSampleSuccess ? "Cleared!" : "Clear Sample"}
              </button>
            </div>

            {/* Clear All Database Data */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-extrabold text-red-700 dark:text-red-400 block flex items-center gap-1">
                  <AlertCircle size={12} /> Clear All Database Data
                </span>
                <span className="text-[10px] text-slate-400">Permanently wipe all transaction registers and reset inventory pools to 0.</span>
              </div>
              <button
                onClick={handleClearAll}
                className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                  clearAllSuccess 
                    ? "bg-emerald-500 border-emerald-400 text-white" 
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-100"
                }`}
              >
                {clearAllSuccess ? "Wiped Clean!" : "Clear Database"}
              </button>
            </div>
          </div>
        </div>



        {/* Security & API Status */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="text-emerald-500" size={18} /> API & Secret Security Status
          </h3>
          <p className="text-xs text-slate-500">Configuration variables injected from Google AI Studio workspace environment.</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-slate-400">Gemini Key API:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                <CheckCircle size={12} className="text-emerald-500" /> Server-Side Injected (Secured)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-slate-400">Server proxy Endpoint:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] font-mono">/api/ai/chat</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Sinhala LLM model:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">gemini-3.8-flash (Latest)</span>
            </div>
          </div>
        </div>

        {/* Help Center */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-slate-500" size={18} /> Laksela Support Guidelines
          </h3>
          <p className="text-xs text-slate-500">Essential shortcuts and keyboard mappings.</p>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>• <strong>Print Reports</strong>: Select any category in the Reports section and press the <em>Print</em> button.</p>
            <p>• <strong>Sinhala Audio Input</strong>: Turn on your mic, click the microphone toggle on the <em>AI Assistant</em> page, and speak in Sinhala.</p>
            <p>• <strong>Log Cancellations</strong>: Enter positive or negative sales quantities directly into the Sales Entry forms.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
