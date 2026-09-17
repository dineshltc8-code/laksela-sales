import { motion } from "motion/react";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Cpu, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  Briefcase,
  MapPin,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  History,
  Sliders
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { Salesman, Department, SalesRecord, AppTotals, Location, CustomerCountRecord } from "../types";

interface SyncStats {
  totalPCs: number;
  onlinePCs: number;
  offlinePCs: number;
  successfullyUpdated: number;
  pendingUpdates: number;
  failedUpdates: number;
  lastSyncTime: string;
}

interface DashboardProps {
  totals: AppTotals;
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  locations: Location[];
  selectedLocationId: string;
  customerCounts: CustomerCountRecord[];
  systemDate: string;
  syncStats: SyncStats;
  onSyncAll: () => void;
  onSyncSelectedPC: () => void;
  onRefreshStatus: () => void;
  onViewSyncHistory: () => void;
}

export default function Dashboard({ 
  totals, 
  salesmen, 
  departments, 
  salesRecords,
  locations,
  selectedLocationId,
  customerCounts,
  systemDate,
  syncStats,
  onSyncAll,
  onSyncSelectedPC,
  onRefreshStatus,
  onViewSyncHistory
}: DashboardProps) {

  // Selected Location Label
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const locationLabel = selectedLocation ? selectedLocation.name : "All Showrooms (මුළු පද්ධතියම)";

  // 1. Process daily sales trend (last 7 days up to systemDate)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(systemDate);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const dailyTrendData = last7Days.map(date => {
    const total = salesRecords
      .filter(r => r.date === date && (selectedLocationId === "all" || r.locationId === selectedLocationId))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const dateObj = new Date(date);
    const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    return { date, label, sales: total };
  });

  // Parse year, month, and day dynamically from the central systemDate
  const dateParts = systemDate.split("-");
  const yearStr = dateParts[0] || "2026";
  const monthStr = dateParts[1] || "09";
  const dayNum = parseInt(dateParts[2] || "15", 10);
  const currentMonthPrefix = `${yearStr}-${monthStr}`;

  // Generate days from 1 to the current day of the systemDate dynamically
  const currentMonthDays = Array.from({ length: dayNum }, (_, i) => {
    const dNum = i + 1;
    const dStr = dNum < 10 ? `0${dNum}` : `${dNum}`;
    return `${currentMonthPrefix}-${dStr}`;
  });

  // 2. Process salesman-wise sales (filtered by location if active)
  const salesmanSalesData = salesmen.map(sm => {
    // If a location is selected, only take records for that salesman at that location
    const sRecords = salesRecords.filter(r => r.salesmanId === sm.id && (selectedLocationId === "all" || r.locationId === selectedLocationId));
    const monthlySales = sRecords.filter(r => r.date.startsWith(currentMonthPrefix)).reduce((sum, r) => sum + r.amount, 0);
    // Approximate target portion
    const locationTarget = selectedLocationId === "all" ? sm.monthlyTarget : sm.monthlyTarget / locations.length;
    
    return {
      name: sm.name.split(" ")[0],
      sales: monthlySales,
      target: Math.round(locationTarget),
    };
  });

  // 3. Process department-wise sales
  const deptPieData = departments.map(d => {
    const total = salesRecords
      .filter(r => r.departmentId === d.id && (selectedLocationId === "all" || r.locationId === selectedLocationId))
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      name: d.name,
      value: Math.max(0, total),
    };
  });

  // 4. Sparkline trends calculations for KPI cards
  // Today's cumulative sales trend
  const todayRecords = salesRecords
    .filter(r => r.date === systemDate && (selectedLocationId === "all" || r.locationId === selectedLocationId))
    .sort((a, b) => a.createdTimestamp.localeCompare(b.createdTimestamp));

  let runningSumToday = 0;
  const todaySparklineData = todayRecords.map((r, i) => {
    runningSumToday += r.amount;
    return { index: i, value: runningSumToday };
  });

  if (todaySparklineData.length === 0) {
    todaySparklineData.push({ index: 0, value: 0 });
    todaySparklineData.push({ index: 1, value: 0 });
  } else if (todaySparklineData.length === 1) {
    todaySparklineData.unshift({ index: -1, value: 0 });
  }

  // Monthly cumulative sales trend (MTD)
  let runningSumMonthly = 0;
  const monthlySparklineData = currentMonthDays.map((date, idx) => {
    const dayTotal = salesRecords
      .filter(r => r.date === date && (selectedLocationId === "all" || r.locationId === selectedLocationId))
      .reduce((sum, r) => sum + r.amount, 0);
    runningSumMonthly += dayTotal;
    return { day: idx + 1, value: runningSumMonthly };
  });

  // Target progression trend
  const dailyTargetRatio = totals.monthlyTarget / Math.max(1, dayNum);
  const targetSparklineData = currentMonthDays.map((_, idx) => ({
    day: idx + 1,
    value: Math.round(dailyTargetRatio * (idx + 1))
  }));

  // MTD Customer count trend
  let runningCustomers = 0;
  const customerSparklineData = currentMonthDays.map((date, idx) => {
    const dayCust = customerCounts
      .filter(cc => cc.date === date && (selectedLocationId === "all" || cc.locationId === selectedLocationId))
      .reduce((sum, cc) => sum + cc.count, 0);
    runningCustomers += dayCust;
    return { day: idx + 1, value: runningCustomers };
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"];

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header section with location badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white transition-colors flex items-center gap-2" id="dashboard-title">
            <MapPin className="text-blue-600" size={20} />
            විශ්ලේෂණ උපකරණ පුවරුව (Location-Wise Sales Dashboard)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time visual monitoring of physical PC installations, daily salesmen quotas, and centralized customer flow logs.
          </p>
        </div>

        <div className="px-4 py-2 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black border border-blue-200/50 dark:border-blue-900/40">
          📍 Filtered: {locationLabel}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Today's Sales */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Today's Sales
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block mt-1">
                {formatLKR(totals.todaySales)}
              </span>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          
          <div className="h-10 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={todaySparklineData}>
                <defs>
                  <linearGradient id="todaySparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} dot={false} fill="url(#todaySparklineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>අද දවසේ විකුණුම්</span>
            <span className="font-semibold text-blue-500">Live Trend</span>
          </div>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Monthly Sales
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                {formatLKR(totals.monthlySales)}
              </span>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          
          <div className="h-10 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySparklineData}>
                <defs>
                  <linearGradient id="monthlySparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} dot={false} fill="url(#monthlySparklineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>මාසික විකුණුම් එකතුව</span>
            <span className="font-semibold text-emerald-500">Cumulative MTD</span>
          </div>
        </motion.div>

        {/* Monthly Target */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Monthly Target
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-500 block mt-1">
                {formatLKR(totals.monthlyTarget)}
              </span>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          
          <div className="h-10 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={targetSparklineData}>
                <defs>
                  <linearGradient id="targetSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.5} dot={false} fill="url(#targetSparklineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>මාසික ඉලක්කය</span>
            <span className="font-semibold text-amber-500">Target Pace MTD</span>
          </div>
        </motion.div>

        {/* Achievement % */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Achievement %
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-1">
                {totals.achievementRate.toFixed(1)}%
              </span>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Percent size={18} />
            </div>
          </div>
          
          <div className="mt-4 px-1 w-full">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div 
                className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.achievementRate)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
              <span>0%</span>
              <span>100% Target</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>ප්‍රතිශතය සාක්ෂාත් කිරීම</span>
            <span className="font-semibold text-indigo-500">{totals.achievementRate >= 100 ? "Goal Met! 🎉" : "Active"}</span>
          </div>
        </motion.div>

        {/* Total Customers */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Total Customers
              </span>
              <span className="text-2xl font-black text-slate-700 dark:text-slate-200 block mt-1">
                {totals.totalCustomers}
              </span>
            </div>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          
          <div className="h-10 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerSparklineData}>
                <defs>
                  <linearGradient id="customerSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#64748b" strokeWidth={1.5} dot={false} fill="url(#customerSparklineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>මුළු පාරිභෝගිකයින්</span>
            <span className="font-semibold text-slate-500">Traffic MTD</span>
          </div>
        </motion.div>

        {/* Number of Salesmen */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Number of Salesmen
              </span>
              <span className="text-2xl font-black text-violet-600 dark:text-violet-400 block mt-1">
                {totals.salesmenCount}
              </span>
            </div>
            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl">
              <Briefcase size={18} />
            </div>
          </div>
          
          <div className="mt-3 flex gap-1 flex-wrap w-full">
            {salesmen.slice(0, 4).map((sm) => (
              <div 
                key={sm.id} 
                className="text-[9px] px-2 py-0.5 rounded-full bg-violet-100/60 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold truncate max-w-[80px]"
                title={sm.name}
              >
                {sm.name.split(" ")[0]}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>සේල්ස්මන් සංඛ්‍යාව</span>
            <span className="font-semibold text-violet-500">Active Team</span>
          </div>
        </motion.div>

        {/* Electronic Department Sales */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Electronic Sales
              </span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 block mt-1">
                {formatLKR(totals.electronicSales)}
              </span>
            </div>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Cpu size={18} />
            </div>
          </div>
          
          <div className="mt-4 px-1 w-full">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div 
                className="bg-cyan-600 dark:bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.monthlySales > 0 ? (totals.electronicSales / totals.monthlySales) * 100 : 0)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
              <span>0% Share</span>
              <span>{totals.monthlySales > 0 ? ((totals.electronicSales / totals.monthlySales) * 100).toFixed(0) : 0}% Share</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>ඉලෙක්ට්‍රොනික අංශය</span>
            <span className="font-semibold text-cyan-500">Hardware Line</span>
          </div>
        </motion.div>

        {/* Non-Electronic Department Sales */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between min-h-[160px] transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Non-Electronic Sales
              </span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block mt-1">
                {formatLKR(totals.nonElectronicSales)}
              </span>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <ShoppingBag size={18} />
            </div>
          </div>
          
          <div className="mt-4 px-1 w-full">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div 
                className="bg-rose-600 dark:bg-rose-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.monthlySales > 0 ? (totals.nonElectronicSales / totals.monthlySales) * 100 : 0)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
              <span>0% Share</span>
              <span>{totals.monthlySales > 0 ? ((totals.nonElectronicSales / totals.monthlySales) * 100).toFixed(0) : 0}% Share</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <span>නොවන ඉලෙක්ට්‍රොනික</span>
            <span className="font-semibold text-rose-500">Retail & Goods</span>
          </div>
        </motion.div>
      </div>

      {/* PC-to-PC Data Transfer / Sync Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6" id="sync-dashboard-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sliders size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                PC-to-PC Internet Data Transfer & Sync Status
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Centralized gateway broker monitoring all showroom cashier terminals, enforcing conflict-free sales ledger synchronization.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={onSyncAll}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Sync All
            </button>
            <button
              onClick={onSyncSelectedPC}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders size={13} /> Sync Selected PC
            </button>
            <button
              onClick={onRefreshStatus}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Status
            </button>
            <button
              onClick={onViewSyncHistory}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <History size={13} /> View Sync History
            </button>
          </div>
        </div>

        {/* Sync metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total PCs</span>
            <span className="text-lg font-black text-slate-700 dark:text-slate-200 block mt-1">{syncStats.totalPCs}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider flex items-center justify-center gap-1">
              <Wifi size={10} /> Online
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-1">{syncStats.onlinePCs}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-950/10 border border-slate-200/20 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider flex items-center justify-center gap-1">
              <WifiOff size={10} /> Offline
            </span>
            <span className="text-lg font-black text-slate-500 dark:text-slate-400 block mt-1">{syncStats.offlinePCs}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider flex items-center justify-center gap-1">
              <CheckCircle size={10} /> Updated
            </span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 block mt-1">{syncStats.successfullyUpdated}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 block uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock size={10} /> Pending
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-500 block mt-1">{syncStats.pendingUpdates}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider flex items-center justify-center gap-1">
              <AlertTriangle size={10} /> Failed
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-1">{syncStats.failedUpdates}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 text-center col-span-2 md:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock size={10} /> Last Sync
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 block mt-2 truncate" title={syncStats.lastSyncTime}>
              {syncStats.lastSyncTime !== "N/A" ? syncStats.lastSyncTime.split(",")[1] || syncStats.lastSyncTime : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-grid">
        {/* Daily Sales Trend (Area Chart) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
            දෛනික විකුණුම් ප්‍රවණතාවය (Daily Sales Trend - Last 7 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [formatLKR(value), "Sales"]} 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} 
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution (Pie Chart) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
            අංශය අනුව බෙදීම (Department-wise Sales)
          </h3>
          <div className="h-64 flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptPieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatLKR(value)} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              {deptPieData.map((item, idx) => {
                const total = totals.electronicSales + totals.nonElectronicSales;
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Salesman Performance vs Target (Bar Chart) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
            සේල්ස්මන් අනුව ප්‍රගතිය (Salesman-wise Sales vs Targets)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesmanSalesData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(value: any) => formatLKR(value)} 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Target Progress Circular and Analytics */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
              ඉලක්කය ළඟා කර ගැනීමේ ප්‍රතිශතය (Monthly Target Progress)
            </h3>
            
            <div className="relative flex items-center justify-center py-6">
              <svg className="w-36 h-36">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  className="stroke-slate-100 dark:stroke-slate-800" 
                  strokeWidth="12" 
                  fill="transparent" 
                />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-1000" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - Math.min(100, totals.achievementRate) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white block">
                  {totals.achievementRate.toFixed(1)}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Achievement
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Overall Status:</span>
              <span className={totals.achievementRate >= 80 ? "text-emerald-600" : totals.achievementRate >= 50 ? "text-amber-500" : "text-rose-500"}>
                {totals.achievementRate >= 100 ? "Goal Exceeded! 🎉" : totals.achievementRate >= 85 ? "Excellent Pace" : totals.achievementRate >= 60 ? "On Track" : "Needs Push"}
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.achievementRate)}%` }}
              ></div>
            </div>

            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              {totals.monthlySales >= totals.monthlyTarget 
                ? "Target achieved!"
                : `Remaining gap: ${formatLKR(Math.max(0, totals.monthlyTarget - totals.monthlySales))}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
