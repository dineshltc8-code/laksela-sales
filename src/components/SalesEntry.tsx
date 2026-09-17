import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Calendar, 
  User, 
  Layers, 
  Coins, 
  FileText, 
  MapPin,
  CheckCircle,
  HelpCircle,
  Users
} from "lucide-react";
import { Salesman, Department, SalesRecord, Location, CustomerCountRecord, PCInstallation } from "../types";

interface SalesEntryProps {
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  locations: Location[];
  selectedLocationId: string;
  customerCounts: CustomerCountRecord[];
  onAddRecord: (record: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">) => void;
  onEditRecord: (id: string, updated: Partial<SalesRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onAddOrUpdateCustomerCount: (locationId: string, date: string, count: number) => void;
  onDeleteCustomerCount: (id: string) => void;
  systemDate: string;
  accessMode: "admin" | "terminal";
  selectedTerminalId: string;
  pcs: PCInstallation[];
}

export default function SalesEntry({ 
  salesmen, 
  departments, 
  salesRecords,
  locations,
  selectedLocationId,
  customerCounts,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onAddOrUpdateCustomerCount,
  onDeleteCustomerCount,
  systemDate,
  accessMode,
  selectedTerminalId,
  pcs
}: SalesEntryProps) {
  
  // Find current terminal active location
  const activeTerminal = pcs.find(p => p.id === selectedTerminalId);
  const terminalLocationId = activeTerminal?.locationId || locations[0]?.id || "";

  // Set default form values
  const [salesmanId, setSalesmanId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(systemDate);
  const [notes, setNotes] = useState("");
  // Form location selection (Admin can choose, Terminal is locked)
  const [formLocationId, setFormLocationId] = useState(() => {
    return accessMode === "terminal" ? terminalLocationId : (selectedLocationId !== "all" ? selectedLocationId : locations[0]?.id || "");
  });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSalesmanId, setEditSalesmanId] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLocationId, setEditLocationId] = useState("");

  // Customer Count Edit State
  const [editingCcId, setEditingCcId] = useState<string | null>(null);
  const [editCcLocationId, setEditCcLocationId] = useState("");
  const [editCcDate, setEditCcDate] = useState("");
  const [editCcCount, setEditCcCount] = useState("");

  // Customer Count State Widget
  const [ccLocationId, setCcLocationId] = useState(() => {
    return accessMode === "terminal" ? terminalLocationId : (selectedLocationId !== "all" ? selectedLocationId : locations[0]?.id || "");
  });
  const [ccDate, setCcDate] = useState(systemDate);
  const [ccCount, setCcCount] = useState("");

  // Filters for list
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSalesman, setFilterSalesman] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterLocation, setFilterLocation] = useState(selectedLocationId);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Keep location forms in sync when accessMode changes
  React.useEffect(() => {
    if (accessMode === "terminal") {
      setFormLocationId(terminalLocationId);
      setCcLocationId(terminalLocationId);
      setFilterLocation(terminalLocationId);
    }
  }, [accessMode, terminalLocationId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetLocationId = accessMode === "terminal" ? terminalLocationId : formLocationId;
    if (!salesmanId || !departmentId || !amount || !date || !targetLocationId) {
      showNotification("❌ Please fill in all required fields!");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      showNotification("❌ Invalid sales amount!");
      return;
    }

    onAddRecord({
      locationId: targetLocationId,
      salesmanId,
      departmentId,
      amount: numAmount,
      date,
      notes,
      createdTimestamp: new Date().toISOString(),
      syncStatus: "pending"
    });

    // Reset Form
    setSalesmanId("");
    setDepartmentId("");
    setAmount("");
    setNotes("");
    showNotification("✅ Sales transaction logged successfully!");
  };

  const handleCustomerCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLocationId = accessMode === "terminal" ? terminalLocationId : ccLocationId;
    if (!targetLocationId || !ccDate || ccCount === "") {
      showNotification("❌ Please select location, date and count.");
      return;
    }

    const countNum = parseInt(ccCount, 10);
    if (isNaN(countNum) || countNum < 0) {
      showNotification("❌ Customer count must be 0 or greater.");
      return;
    }

    onAddOrUpdateCustomerCount(targetLocationId, ccDate, countNum);
    setCcCount("");
    showNotification("👥 Customer count registered successfully!");
  };

  const startEdit = (rec: SalesRecord) => {
    setEditingId(rec.id);
    setEditSalesmanId(rec.salesmanId);
    setEditDepartmentId(rec.departmentId);
    setEditAmount(rec.amount.toString());
    setEditDate(rec.date);
    setEditNotes(rec.notes);
    setEditLocationId(rec.locationId);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount)) {
      showNotification("❌ Invalid sales amount!");
      return;
    }

    const matchedSalesman = salesmen.find(s => s.id === editSalesmanId);
    const matchedDept = departments.find(d => d.id === editDepartmentId);
    const matchedLocation = locations.find(l => l.id === editLocationId);

    onEditRecord(editingId, {
      salesmanId: editSalesmanId,
      salesmanName: matchedSalesman?.name || "Unknown",
      departmentId: editDepartmentId,
      departmentName: matchedDept?.name || "Unknown",
      locationId: editLocationId,
      locationName: matchedLocation?.name || "Unknown",
      amount: numAmount,
      date: editDate,
      notes: editNotes,
      syncStatus: "pending"
    });

    setEditingId(null);
    showNotification("✅ Sales record updated successfully!");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sales record? This will instantly adjust all totals.")) {
      onDeleteRecord(id);
      showNotification("🗑️ Sales record deleted successfully.");
    }
  };

  const startEditCc = (cc: CustomerCountRecord) => {
    setEditingCcId(cc.id);
    setEditCcLocationId(cc.locationId);
    setEditCcDate(cc.date);
    setEditCcCount(cc.count.toString());
  };

  const handleUpdateCc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCcId) return;

    const countNum = parseInt(editCcCount, 10);
    if (isNaN(countNum) || countNum < 0) {
      showNotification("❌ Customer count must be 0 or greater.");
      return;
    }

    onAddOrUpdateCustomerCount(editCcLocationId, editCcDate, countNum);
    setEditingCcId(null);
    showNotification("👥 Customer count updated successfully!");
  };

  const handleDeleteCc = (id: string) => {
    if (confirm("Are you sure you want to delete this customer traffic record?")) {
      onDeleteCustomerCount(id);
      showNotification("🗑️ Customer traffic record deleted successfully.");
    }
  };

  // Filtered list of transactions
  const filteredRecords = salesRecords.filter(rec => {
    const matchesSearch = rec.notes.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.salesmanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSalesman = filterSalesman === "all" || rec.salesmanId === filterSalesman;
    const matchesDept = filterDept === "all" || rec.departmentId === filterDept;
    const matchesLocation = filterLocation === "all" || rec.locationId === filterLocation;

    return matchesSearch && matchesSalesman && matchesDept && matchesLocation;
  });

  // Get customer count log listings (MTD)
  const loggedCustomerCounts = customerCounts.filter(cc => {
    const matchesLocation = filterLocation === "all" || cc.locationId === filterLocation;
    return matchesLocation;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="entry-title">
            දෛනික ගනුදෙනු ඇතුළත් කිරීම (Daily Transactions & Traffic Entry)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log physical cash drawer invoices, adjustments, or central showroom daily traffic totals.
          </p>
        </div>
        
        {/* Notification toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2 sm:mt-0 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-2"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Entry & Customer Entry Forms */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sales Form */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-500" /> නව විකුණුම් ඇතුළත් කරන්න (New Transaction)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location Select (Disabled for Terminal) */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Showroom Location *</label>
                <div className="relative">
                  <select
                    value={accessMode === "terminal" ? terminalLocationId : formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    disabled={accessMode === "terminal"}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200 disabled:opacity-60"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                    ))}
                  </select>
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <MapPin size={16} />
                  </span>
                </div>
              </div>

              {/* Salesman */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Salesman *</label>
                <div className="relative">
                  <select
                    value={salesmanId}
                    onChange={(e) => setSalesmanId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="">Select Salesman</option>
                    {salesmen.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <User size={16} />
                  </span>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Department *</label>
                <div className="relative">
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Layers size={16} />
                  </span>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sales Amount (LKR) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="LKR amount (refunds as negative)"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Coins size={16} />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Calendar size={16} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Notes</label>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Invoice ID, specific model specs..."
                    rows={2}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 resize-none"
                  ></textarea>
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <FileText size={16} />
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 cursor-pointer text-center"
              >
                SAVE INVOICE RECORD
              </button>
            </form>
          </div>

          {/* Customer Count Widget */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Users size={18} className="text-indigo-500" /> දෛනික පාරිභෝගික සංඛ්‍යාව (Customer Count)
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">
              Input single total customer count for the location showroom today. Not split by transaction.
            </p>

            <form onSubmit={handleCustomerCountSubmit} className="space-y-4">
              {/* Location Select (Disabled for Terminal) */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Showroom Location *</label>
                <select
                  value={accessMode === "terminal" ? terminalLocationId : ccLocationId}
                  onChange={(e) => setCcLocationId(e.target.value)}
                  disabled={accessMode === "terminal"}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 disabled:opacity-60"
                  required
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={ccDate}
                    onChange={(e) => setCcDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Total Count *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={ccCount}
                    onChange={(e) => setCcCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 cursor-pointer text-center"
              >
                REGISTER VISITOR COUNT
              </button>
            </form>
          </div>

        </div>

        {/* Transaction Table and customer table */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Edit transaction modal/overlay */}
          {editingId && (
            <div className="p-5 border border-amber-300 bg-amber-500/5 rounded-2xl mb-4 space-y-4">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
                Edit Record Row ID: {editingId}
              </h4>
              <form onSubmit={handleUpdate} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <select
                  value={editSalesmanId}
                  onChange={(e) => setEditSalesmanId(e.target.value)}
                  className="bg-white dark:bg-slate-900 border text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  className="bg-white dark:bg-slate-900 border text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="bg-white dark:bg-slate-900 border text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                />
                <div className="col-span-2">
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <button type="submit" className="flex-1 py-1 bg-amber-500 text-white rounded text-xs font-bold cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-xs cursor-pointer">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* List display */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                විකුණුම් ලේඛන ගොනුව (Showroom Sales Journal)
              </h3>

              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500">
                  Transactions: {filteredRecords.length}
                </span>
              </div>
            </div>

            {/* List filter headers */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
              <input
                type="text"
                placeholder="Search notes, salesmen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              />

              <select
                value={filterSalesman}
                onChange={(e) => setFilterSalesman(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Salesmen</option>
                {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Depts</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                disabled={accessMode === "terminal"}
                className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-60 focus:outline-none"
              >
                <option value="all">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Salesman</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-center">Sync</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">No sales logs match active filters.</td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const matchedLocation = locations.find(l => l.id === rec.locationId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{rec.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{matchedLocation?.name.split(" ")[0] || "Colombo"}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{rec.salesmanName}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              rec.departmentName === "Electronic" 
                                ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400" 
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                            }`}>
                              {rec.departmentName}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">{formatLKR(rec.amount)}</td>
                          <td className="py-2 px-3 text-[11px] text-slate-400 max-w-[150px] truncate" title={rec.notes}>{rec.notes}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rec.syncStatus === "synced" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                              {rec.syncStatus === "synced" ? "Cloud" : "Pending"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => startEdit(rec)} className="p-1 hover:text-blue-500 rounded cursor-pointer" title="Edit"><Edit size={12} /></button>
                              <button onClick={() => handleDelete(rec.id)} className="p-1 hover:text-rose-500 rounded cursor-pointer" title="Delete"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer log tracker table (MTD) */}
          {editingCcId && (
            <div className="p-5 border border-indigo-300 bg-indigo-500/5 rounded-2xl mb-4 space-y-4">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Users size={14} /> පාරිභෝගික ගමනාගමන දත්ත සංශෝධනය (Edit Customer Traffic Log Record)
              </h4>
              <form onSubmit={handleUpdateCc} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Showroom Location</label>
                  <select
                    value={editCcLocationId}
                    onChange={(e) => setEditCcLocationId(e.target.value)}
                    disabled={accessMode === "terminal"}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 disabled:opacity-60"
                  >
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={editCcDate}
                    onChange={(e) => setEditCcDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Count</label>
                  <input
                    type="number"
                    min="0"
                    value={editCcCount}
                    onChange={(e) => setEditCcCount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button type="submit" className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer text-center">Save</button>
                  <button type="button" onClick={() => setEditingCcId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs cursor-pointer hover:bg-slate-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
               පාරිභෝගික ගමනාගමන සටහන් (Central Location Customer Traffic Logs)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Showroom Location</th>
                    <th className="py-2.5 px-4 text-center">Total Customer Traffic</th>
                    <th className="py-2.5 px-4 text-center">Synchronized</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                  {loggedCustomerCounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">No customer traffic records registered for this showroom yet.</td>
                    </tr>
                  ) : (
                    loggedCustomerCounts.map(cc => {
                      const matchedLocation = locations.find(l => l.id === cc.locationId);
                      return (
                        <tr key={cc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{cc.date}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">{matchedLocation?.name || "Colombo"}</td>
                          <td className="py-2.5 px-4 text-center font-black text-indigo-600 dark:text-indigo-400">{cc.count} customers</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {cc.syncStatus === "synced" ? "Central Cloud" : "Local PC"}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => startEditCc(cc)} className="p-1 hover:text-indigo-500 text-slate-400 rounded cursor-pointer" title="Edit Traffic Record"><Edit size={12} /></button>
                              <button onClick={() => handleDeleteCc(cc.id)} className="p-1 hover:text-rose-500 text-slate-400 rounded cursor-pointer" title="Delete Traffic Record"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
