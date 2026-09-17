import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Printer, 
  Share2, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle,
  TrendingUp,
  Award,
  Layers,
  Users,
  MapPin,
  AlertCircle
} from "lucide-react";
import { Salesman, Department, SalesRecord, AppTotals, Location, CustomerCountRecord } from "../types";

interface ReportsSectionProps {
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  totals: AppTotals;
  locations: Location[];
  selectedLocationId: string;
  customerCounts: CustomerCountRecord[];
  systemDate: string;
}

type ReportType = 
  | 'daily' 
  | 'monthly' 
  | 'salesman' 
  | 'department' 
  | 'locations';

export default function ReportsSection({ 
  salesmen, 
  departments, 
  salesRecords, 
  totals,
  locations,
  selectedLocationId,
  customerCounts,
  systemDate
}: ReportsSectionProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [reportLocationId, setReportLocationId] = useState(selectedLocationId);

  // Export success state
  const [exportNotification, setExportNotification] = useState<{
    recordsCount: number;
    totalValue: number;
    fileName: string;
  } | null>(null);

  // Dynamic Month List generated from actual database records + current month
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    if (systemDate) {
      months.add(systemDate.substring(0, 7));
    } else {
      months.add("2026-09");
    }
    salesRecords.forEach(r => {
      if (r.date && r.date.length >= 7) {
        months.add(r.date.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [salesRecords, systemDate]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return systemDate ? systemDate.substring(0, 7) : "2026-09";
  });

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Sync state with parent's active location filter
  useState(() => {
    if (selectedLocationId !== "all") {
      setReportLocationId(selectedLocationId);
    }
  });

  // Convert "YYYY-MM" to readable "Month Name Year"
  const getReadableMonthName = (yrMo: string) => {
    try {
      const [year, month] = yrMo.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 15);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch (e) {
      return yrMo;
    }
  };

  // 1. Generate active report data
  const getReportData = () => {
    // Filter raw records based on current selections
    const rawFiltered = salesRecords.filter(r => {
      const matchesSearch = r.salesmanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || r.date === dateFilter;
      const matchesLocation = reportLocationId === "all" || r.locationId === reportLocationId;
      return matchesSearch && matchesDate && matchesLocation;
    });

    switch (activeReport) {
      case 'daily':
        return rawFiltered; // Raw records filtered by date/location
      case 'monthly':
        // Show raw filtered monthly records based on dynamic dropdown selection
        return rawFiltered.filter(r => r.date.startsWith(selectedMonth));
      case 'salesman':
        // Aggregate by salesman for current location context
        return salesmen.map(sm => {
          const sRecords = salesRecords.filter(r => r.salesmanId === sm.id && (reportLocationId === "all" || r.locationId === reportLocationId));
          const totalAmount = sRecords.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            id: sm.id,
            name: sm.name,
            role: "Sales Executive",
            amount: totalAmount,
            target: reportLocationId === "all" ? sm.monthlyTarget : sm.monthlyTarget / locations.length,
            achievement: (reportLocationId === "all" ? sm.monthlyTarget : sm.monthlyTarget / locations.length) > 0 
              ? (totalAmount / (reportLocationId === "all" ? sm.monthlyTarget : sm.monthlyTarget / locations.length)) * 100 
              : 0
          };
        });
      case 'department':
        // Aggregate by department
        return departments.map(d => {
          const dRecords = salesRecords.filter(r => r.departmentId === d.id && (reportLocationId === "all" || r.locationId === reportLocationId));
          const totalAmount = dRecords.reduce((sum, r) => sum + r.amount, 0);
          const rawTarget = reportLocationId === "all" ? totals.monthlyTarget : totals.monthlyTarget;
          const targetSplit = d.type === 'electronic' ? rawTarget * 0.6 : rawTarget * 0.4;
          return {
            id: d.id,
            name: d.name,
            amount: totalAmount,
            target: targetSplit,
            achievement: targetSplit > 0 ? (totalAmount / targetSplit) * 100 : 0
          };
        });
      case 'locations':
        // Report for all locations
        return locations.map(loc => {
          const locRecords = salesRecords.filter(r => r.locationId === loc.id);
          const totalSales = locRecords.reduce((sum, r) => sum + r.amount, 0);
          const todaySales = locRecords.filter(r => r.date === systemDate).reduce((sum, r) => sum + r.amount, 0);
          const monthlyTarget = loc.monthlyTarget;
          const traffic = customerCounts.filter(cc => cc.locationId === loc.id).reduce((sum, cc) => sum + cc.count, 0);
          
          return {
            id: loc.id,
            name: loc.name,
            code: loc.code,
            amount: totalSales,
            today: todaySales,
            target: monthlyTarget,
            customers: traffic,
            achievement: monthlyTarget > 0 ? (totalSales / monthlyTarget) * 100 : 0
          };
        });
      default:
        return rawFiltered;
    }
  };

  const reportData = getReportData();

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeReport === 'locations') {
      csvContent += "Showroom,Code,Monthly Target (LKR),MTD Sales (LKR),Today's Sales (LKR),Total Customers,Achievement (%)\n";
      reportData.forEach((row: any) => {
        csvContent += `"${row.name}","${row.code}",${row.target},${row.amount},${row.today},${row.customers},${row.achievement.toFixed(1)}%\n`;
      });
    } else if (activeReport === 'salesman') {
      csvContent += "Salesman,MTD Sales (LKR),Location Target (LKR),Achievement (%)\n";
      reportData.forEach((row: any) => {
        csvContent += `"${row.name}",${row.amount},${row.target},${row.achievement.toFixed(1)}%\n`;
      });
    } else {
      csvContent += "Date,Salesman,Department,Sales Amount (LKR),Notes\n";
      reportData.forEach((row: any) => {
        csvContent += `"${row.date || ""}","${row.salesmanName || row.name || ""}","${row.departmentName || ""}","${row.amount || 0}","${(row.notes || "").replace(/"/g, '""')}"\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laksela_${activeReport}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx) using exact Sales Summary template headers and mapped values
  const handleExportToExcel = () => {
    if (salesRecords.length === 0) {
      alert("No sales data available to export");
      return;
    }

    try {
      // Group active records by Date and Salesman Name
      const summaryMap: Record<string, {
        date: string;
        salesmanName: string;
        electronicSales: number;
        nonElectronicSales: number;
      }> = {};

      salesRecords.forEach(rec => {
        // Apply active location filter from report context
        if (reportLocationId !== "all" && rec.locationId !== reportLocationId) {
          return;
        }
        // Apply active month filter if in monthly view
        if (activeReport === "monthly" && !rec.date.startsWith(selectedMonth)) {
          return;
        }
        // Apply search query term matches
        const matchesSearch = rec.salesmanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              rec.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              rec.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return;

        // Apply specific date filter
        if (dateFilter && rec.date !== dateFilter) return;

        const key = `${rec.date}_${rec.salesmanName.trim()}`;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            date: rec.date,
            salesmanName: rec.salesmanName,
            electronicSales: 0,
            nonElectronicSales: 0
          };
        }

        if (rec.departmentId === "dep-1") {
          summaryMap[key].electronicSales += rec.amount;
        } else {
          summaryMap[key].nonElectronicSales += rec.amount;
        }
      });

      const exportRows = Object.values(summaryMap).map(row => {
        // Find matching customer count
        const matchedCC = customerCounts
          .filter(cc => cc.date === row.date && (reportLocationId === "all" || cc.locationId === reportLocationId))
          .reduce((sum, cc) => sum + cc.count, 0);

        const totalSale = row.electronicSales + row.nonElectronicSales;

        return {
          "Sales_Date": row.date,
          "Salesman_Name": row.salesmanName,
          "Electronic_Sale_Value": Number(row.electronicSales),
          "Non_Electronic_Sale_Value": Number(row.nonElectronicSales),
          "Total_Sale_Value": Number(totalSale),
          "Customer_Count": Number(matchedCC)
        };
      });

      if (exportRows.length === 0) {
        alert("No records matched the active filters to export.");
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows, {
        header: [
          "Sales_Date",
          "Salesman_Name",
          "Electronic_Sale_Value",
          "Non_Electronic_Sale_Value",
          "Total_Sale_Value",
          "Customer_Count"
        ]
      });

      XLSX.utils.book_append_sheet(wb, ws, "Sales Summary Records");
      const fileName = "Laksela_Sales_Summary_Export.xlsx";
      XLSX.writeFile(wb, fileName);

      setExportNotification({
        recordsCount: exportRows.length,
        totalValue: exportRows.reduce((sum, item) => sum + item.Total_Sale_Value, 0),
        fileName: fileName
      });
    } catch (err) {
      console.error(err);
      alert("Export failed. An unexpected error occurred while writing the Excel workbook.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="reports-title">
            කළමනාකරණ වාර්තාකරණය (Management Reports Section)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export daily logs, salesmen summaries, department splits, and complete multi-location audit trails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            📤 Export to Excel
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            CSV Export
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>

      {/* Export Completed Notification Card */}
      {exportNotification && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} />
            <span className="font-extrabold uppercase text-xs tracking-wider">Export Completed</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-6">
            <p>• Number of exported records: <strong>{exportNotification.recordsCount}</strong></p>
            <p>• Total Sales Value: <strong>{formatLKR(exportNotification.totalValue)}</strong></p>
            <p>• Saved file name/location: <strong>{exportNotification.fileName}</strong></p>
          </div>
          <div className="flex justify-end pr-1">
            <button
              onClick={() => setExportNotification(null)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
        {/* Report Types Selection Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveReport('daily')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeReport === 'daily' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Daily Log Summary
          </button>
          <button
            onClick={() => setActiveReport('monthly')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeReport === 'monthly' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Monthly MTD Journal
          </button>
          <button
            onClick={() => setActiveReport('salesman')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeReport === 'salesman' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Salesmen Performance
          </button>
          <button
            onClick={() => setActiveReport('department')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeReport === 'department' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Department splits
          </button>
          <button
            onClick={() => setActiveReport('locations')}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeReport === 'locations' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Showroom Location Metrics
          </button>
        </div>

        {/* Input Filtering Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search box (ignored in locations, salesman summary) */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description/logs..."
              disabled={activeReport === 'locations' || activeReport === 'salesman' || activeReport === 'department'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={12} />
            </span>
          </div>

          {/* Date Picker / Monthly Report Selector */}
          <div className="relative">
            {activeReport === 'monthly' ? (
              <div className="flex items-center space-x-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-xl focus:outline-none font-extrabold cursor-pointer transition-colors"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m} className="text-slate-800 bg-white">{getReadableMonthName(m)}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  disabled={activeReport === 'locations' || activeReport === 'salesman' || activeReport === 'department'}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50"
                />
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Calendar size={12} />
                </span>
              </>
            )}
          </div>

          {/* Location filtering selector */}
          <div className="relative col-span-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-400 shrink-0">Showroom:</span>
              <select
                value={reportLocationId}
                onChange={(e) => setReportLocationId(e.target.value)}
                disabled={activeReport === 'locations'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="all">All Showrooms (මුළු ලේඛනයම)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table Render */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        
        {/* Dynamic header info */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={16} className="text-blue-500" />
            {activeReport === 'daily' && "DAILY TRANSACTION AUDIT LOG"}
            {activeReport === 'monthly' && `${getReadableMonthName(selectedMonth).toUpperCase()} MTD SALES JOURNAL`}
            {activeReport === 'salesman' && "SALESMEN REVENUE VS LOCATION QUOTA"}
            {activeReport === 'department' && "HARDWARE VS RETAIL DEPT REVENUE"}
            {activeReport === 'locations' && "CENTRALIZED SHOWROOM METRICS SUMMARY"}
          </span>

          <span className="text-xs font-semibold text-slate-500">
            Records found: {reportData.length}
          </span>
        </div>

        {/* Dynamic Tables rendering */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          
          {/* Daily or Monthly Logs view */}
          {(activeReport === 'daily' || activeReport === 'monthly') && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Showroom</th>
                  <th className="py-3 px-4">Salesman</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Amount (LKR)</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No transactions registered matching active filters.</td>
                  </tr>
                ) : (
                  reportData.map((row: any) => {
                    const matchedLoc = locations.find(l => l.id === row.locationId);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{matchedLoc?.name || "Colombo"}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{row.salesmanName}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            row.departmentName === "Electronic" 
                              ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400" 
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                          }`}>
                            {row.departmentName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-white">{formatLKR(row.amount)}</td>
                        <td className="py-2.5 px-4 text-slate-400 max-w-[200px] truncate" title={row.notes}>{row.notes || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* Salesmen view */}
          {activeReport === 'salesman' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Sales Representative</th>
                  <th className="py-3 px-4 text-right">MTD Sales (LKR)</th>
                  <th className="py-3 px-4 text-right">Showroom Target Portion (LKR)</th>
                  <th className="py-3 px-4 text-center">Achievement %</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {reportData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">{row.name}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatLKR(row.amount)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500">{formatLKR(row.target)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{row.achievement.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        row.achievement >= 100 
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" 
                          : row.achievement >= 75 
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                      }`}>
                        {row.achievement >= 100 ? "Goal Surpassed" : row.achievement >= 75 ? "On Pace" : "Pace Lacking"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Department view */}
          {activeReport === 'department' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Department Unit</th>
                  <th className="py-3 px-4 text-right">MTD Revenue (LKR)</th>
                  <th className="py-3 px-4 text-right">Estimated Target (LKR)</th>
                  <th className="py-3 px-4 text-center">Achievement %</th>
                  <th className="py-3 px-4">Quota Split Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {reportData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{row.name} Segment</td>
                    <td className="py-3 px-4 text-right font-black text-cyan-600 dark:text-cyan-400">{formatLKR(row.amount)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500">{formatLKR(row.target)}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-700 dark:text-slate-200">{row.achievement.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] text-slate-400 font-semibold">{row.name === "Electronic" ? "60% Share Allocation" : "40% Share Allocation"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Showroom Location view */}
          {activeReport === 'locations' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Showroom Showroom</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 text-right">Monthly Target</th>
                  <th className="py-3 px-4 text-right">MTD Total Sales</th>
                  <th className="py-3 px-4 text-right">Today's Sales</th>
                  <th className="py-3 px-4 text-center">Total Customer Traffic</th>
                  <th className="py-3 px-4 text-center">Achievement %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {reportData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{row.name}</td>
                    <td className="py-3 px-4 font-medium text-slate-500">{row.code}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">{formatLKR(row.target)}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatLKR(row.amount)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-white">{formatLKR(row.today)}</td>
                    <td className="py-3 px-4 text-center font-black text-indigo-600 dark:text-indigo-400">{row.customers} visitors</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{row.achievement.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>

      </div>
    </div>
  );
}
