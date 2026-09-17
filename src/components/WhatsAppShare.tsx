import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  MessageCircle, 
  Send, 
  FileText, 
  Calendar, 
  User, 
  Sparkles, 
  CheckCircle,
  Copy
} from "lucide-react";
import { Salesman, Department, SalesRecord, AppTotals } from "../types";

interface WhatsAppShareProps {
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  totals: AppTotals;
}

export default function WhatsAppShare({ salesmen, departments, salesRecords, totals }: WhatsAppShareProps) {
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'monthly' | 'salesman' | 'ai'>('daily');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Format monetary value
  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Generate Message template based on selection
  useEffect(() => {
    let text = "";
    const systemDateStr = "2026-09-14";

    if (selectedReportType === 'daily') {
      const todayLogs = salesRecords.filter(r => r.date === systemDateStr);
      const todayTotal = todayLogs.reduce((sum, r) => sum + r.amount, 0);
      const todayCustomers = todayLogs.reduce((sum, r) => sum + r.customerCount, 0);

      text = `*LAKSELA SMART SALES - DAILY REPORT*\n`;
      text += `📅 Date: ${systemDateStr}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `• *Today's Total Sales*: LKR ${todayTotal.toLocaleString()}\n`;
      text += `• *Today's Customers Logged*: ${todayCustomers}\n`;
      text += `• *Total Transactions Recorded*: ${todayLogs.length}\n\n`;
      text += `*Transactions breakdown:*\n`;
      
      if (todayLogs.length === 0) {
        text += `_No transactions logged today yet._\n`;
      } else {
        todayLogs.forEach((l, idx) => {
          text += `${idx+1}. ${l.salesmanName} (${l.departmentName}): LKR ${l.amount.toLocaleString()} - ${l.notes || "No notes"}\n`;
        });
      }
    } 
    else if (selectedReportType === 'monthly') {
      text = `*LAKSELA SMART SALES - MONTHLY CONSOLIDATED*\n`;
      text += `📅 Month: September 2026\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `• *Monthly Total Sales*: LKR ${totals.monthlySales.toLocaleString()}\n`;
      text += `• *Monthly Sales Target*: LKR ${totals.monthlyTarget.toLocaleString()}\n`;
      text += `• *Achievement Rate*: ${totals.achievementRate.toFixed(1)}%\n`;
      text += `• *Total Customers Assisted*: ${totals.totalCustomers}\n`;
      text += `• *Registered Active Salesmen*: ${totals.salesmenCount}\n`;
      text += `• *Electronic Dept Sales*: LKR ${totals.electronicSales.toLocaleString()}\n`;
      text += `• *Non-Electronic Dept Sales*: LKR ${totals.nonElectronicSales.toLocaleString()}\n\n`;
      text += `_Generated from Laksela Smart Sales Log manager._`;
    } 
    else if (selectedReportType === 'salesman') {
      const sm = salesmen.find(s => s.id === selectedSalesmanId) || salesmen[0];
      if (sm) {
        text = `*LAKSELA SALESMAN PERFORMANCE REPORT*\n`;
        text += `👤 Salesperson: *${sm.name}*\n`;
        text += `📅 Assessment Month: September 2026\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `• *Monthly Sales Volume*: LKR ${sm.monthlySales.toLocaleString()}\n`;
        text += `• *Individual Monthly Quota*: LKR ${sm.monthlyTarget.toLocaleString()}\n`;
        text += `• *Performance quota Achieved*: ${sm.achievementRate.toFixed(1)}%\n`;
        text += `• *Unique Customers Logged*: ${sm.customerCount}\n`;
        text += `• *Electronic Dept Sales Share*: LKR ${sm.electronicSales.toLocaleString()}\n`;
        text += `• *Non-Electronic Share*: LKR ${sm.nonElectronicSales.toLocaleString()}\n\n`;
        text += `Status: ${sm.achievementRate >= 100 ? "🏆 Monthly quota fully achieved! Excellent job." : "⏳ On pace to achieve quota."}\n`;
      } else {
        text = `Select a salesman to generate report details.`;
      }
    } 
    else if (selectedReportType === 'ai') {
      text = `*LAKSELA SMART SALES - AI AUDIT & REPORT*\n`;
      text += `🤖 Analyst: Laksela Sinhala AI Sahakaru\n`;
      text += `📅 Audit Date: ${systemDateStr}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `• *Current Sales Volume*: LKR ${totals.monthlySales.toLocaleString()} vs Target LKR ${totals.monthlyTarget.toLocaleString()}\n`;
      text += `• *Corporate Target Achieved*: ${totals.achievementRate.toFixed(1)}%\n\n`;
      text += `*AI Strategic Observations:*\n`;
      
      // Calculate highest salesman
      const sortedSalesmen = [...salesmen].sort((a,b) => b.monthlySales - a.monthlySales);
      if (sortedSalesmen.length > 0) {
        text += `1. Highest Performing Salesperson: *${sortedSalesmen[0].name}* with total sales of ${formatLKR(sortedSalesmen[0].monthlySales)} (${sortedSalesmen[0].achievementRate.toFixed(0)}% target met).\n`;
      }

      // Department balance
      const electronicShare = totals.monthlySales > 0 ? (totals.electronicSales / totals.monthlySales) * 100 : 0;
      text += `2. Department Balance: Electronic products constitute *${electronicShare.toFixed(0)}%* of active sales volume, whereas Non-Electronic lines comprise *${(100 - electronicShare).toFixed(0)}%*.\n`;
      
      const rate = totals.achievementRate;
      text += `3. Overall Milestone Status: Laksela is currently running at a *${rate.toFixed(1)}%* overall achievement velocity. ${rate >= 100 ? "Corporate milestone satisfied." : "Recommend pushing high-margin electronic lines to close the gap."}\n\n`;
      
      text += `_Prepared for board transmission by Laksela Sinhala AI Sahakaru_`;
    }

    setMessage(text);
  }, [selectedReportType, selectedSalesmanId, salesmen, salesRecords, totals]);

  const handleSend = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="whatsapp-title">
          වට්ස්ඇප් හරහා වාර්තා යැවීම (WhatsApp Sharing Facility)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draft, format, and share business reports with managing directors or sales executives instantly via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="whatsapp-grid">
        
        {/* Share Configurations */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Share Configuration
          </h3>

          {/* Select Report Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 block">Report Selection</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedReportType('daily')}
                className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedReportType === 'daily'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'bg-slate-50/50 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Calendar size={16} /> Daily Report
              </button>
              
              <button
                onClick={() => setSelectedReportType('monthly')}
                className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedReportType === 'monthly'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'bg-slate-50/50 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <FileText size={16} /> Monthly Report
              </button>

              <button
                onClick={() => {
                  setSelectedReportType('salesman');
                  if (salesmen.length > 0 && !selectedSalesmanId) {
                    setSelectedSalesmanId(salesmen[0].id);
                  }
                }}
                className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedReportType === 'salesman'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'bg-slate-50/50 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <User size={16} /> Salesman Report
              </button>

              <button
                onClick={() => setSelectedReportType('ai')}
                className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedReportType === 'ai'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'bg-slate-50/50 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Sparkles size={16} /> AI Audit Report
              </button>
            </div>
          </div>

          {/* Conditional selector: Salesmen */}
          {selectedReportType === 'salesman' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 block">Select Target Salesman</label>
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              >
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Guidelines info */}
          <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
              <MessageCircle size={14} /> Official WhatsApp API Link
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              When you click <strong>Send via WhatsApp</strong>, the application generates a URL using WhatsApp Web protocol. It will prompt you to select your target contact or client and paste the beautifully formatted, clean markdown text automatically.
            </p>
          </div>
        </div>

        {/* Live Preview Text area */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Message Preview & Editor
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="py-1 px-2 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <CheckCircle size={10} className="text-emerald-500" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy to Clipboard"}
                </button>
              </div>
            </div>

            {/* Editable Textbox */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 leading-relaxed"
            ></textarea>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <button
              onClick={handleSend}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Send size={16} /> Send via WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
