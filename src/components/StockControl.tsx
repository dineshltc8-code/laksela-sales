import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, 
  ArrowLeftRight, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Layers, 
  FileText,
  MapPin,
  Boxes,
  TrendingUp,
  HelpCircle
} from "lucide-react";
import { Location, StockItem, StockTransfer } from "../types";

interface StockControlProps {
  locations: Location[];
  selectedLocationId: string;
  stockItems: StockItem[];
  stockTransfers: StockTransfer[];
  onAddStockItem: (item: Omit<StockItem, "id">) => void;
  onEditStockItem: (id: string, updated: Partial<StockItem>) => void;
  onDeleteStockItem: (id: string) => void;
  onAddStockTransfer: (transfer: Omit<StockTransfer, "id">) => void;
  onDeleteStockTransfer: (id: string) => void;
  accessMode: "admin" | "terminal";
  selectedTerminalId: string;
}

export default function StockControl({
  locations,
  selectedLocationId,
  stockItems,
  stockTransfers,
  onAddStockItem,
  onEditStockItem,
  onDeleteStockItem,
  onAddStockTransfer,
  onDeleteStockTransfer,
  accessMode,
  selectedTerminalId
}: StockControlProps) {
  
  // Tabs: 'ledger' | 'transfers'
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'transfers'>('ledger');
  
  // Ledger input states
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [physicalStock, setPhysicalStock] = useState("");
  const [itemLocationId, setItemLocationId] = useState(locations[0]?.id || "");
  
  // Transfer input states
  const [transferProductCode, setTransferProductCode] = useState("");
  const [fromLocId, setFromLocId] = useState("");
  const [toLocId, setToLocId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferDate, setTransferDate] = useState("2026-09-15");
  const [transferNotes, setTransferNotes] = useState("");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState(selectedLocationId);
  
  // Configurable Minimum Threshold for Low Stock
  const [minStockThreshold, setMinStockThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("laksela_min_stock_threshold");
    return saved ? parseInt(saved, 10) : 15; // default to 15
  });

  React.useEffect(() => {
    localStorage.setItem("laksela_min_stock_threshold", minStockThreshold.toString());
  }, [minStockThreshold]);

  // Edit Ledger modal/inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductCode, setEditProductCode] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editOpeningStock, setEditOpeningStock] = useState("");
  const [editStockIn, setEditStockIn] = useState("");
  const [editStockOut, setEditStockOut] = useState("");
  const [editPhysicalStock, setEditPhysicalStock] = useState("");
  const [editItemLocationId, setEditItemLocationId] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Keep filterLocation in sync with active showroom selection from parent
  React.useEffect(() => {
    setFilterLocation(selectedLocationId);
  }, [selectedLocationId]);

  // Adjust default locations when accessing via terminal
  React.useEffect(() => {
    if (accessMode === "terminal" && locations.length > 0) {
      setItemLocationId(selectedLocationId !== "all" ? selectedLocationId : locations[0].id);
      setFromLocId(selectedLocationId !== "all" ? selectedLocationId : locations[0].id);
    }
  }, [accessMode, selectedLocationId, locations]);

  const handleAddLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productCode || !unitPrice || !openingStock || !physicalStock || !itemLocationId) {
      showNotification("❌ Please fill in all required fields!");
      return;
    }

    const priceNum = parseFloat(unitPrice);
    const openingNum = parseFloat(openingStock);
    const physicalNum = parseFloat(physicalStock);

    if (isNaN(priceNum) || priceNum < 0 || isNaN(openingNum) || openingNum < 0 || isNaN(physicalNum) || physicalNum < 0) {
      showNotification("❌ Numerical values must be positive decimals or integers!");
      return;
    }

    onAddStockItem({
      productName,
      productCode,
      unitPrice: priceNum,
      openingStock: openingNum,
      stockIn: 0,
      stockOut: 0,
      physicalStock: physicalNum,
      locationId: itemLocationId
    });

    setProductName("");
    setProductCode("");
    setUnitPrice("");
    setOpeningStock("");
    setPhysicalStock("");
    showNotification("📦 Stock ledger item registered successfully!");
  };

  const handleStartEditItem = (item: StockItem) => {
    setEditingItemId(item.id);
    setEditProductName(item.productName);
    setEditProductCode(item.productCode);
    setEditUnitPrice(item.unitPrice.toString());
    setEditOpeningStock(item.openingStock.toString());
    setEditStockIn(item.stockIn.toString());
    setEditStockOut(item.stockOut.toString());
    setEditPhysicalStock(item.physicalStock.toString());
    setEditItemLocationId(item.locationId);
  };

  const handleUpdateItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;

    const priceNum = parseFloat(editUnitPrice);
    const openingNum = parseFloat(editOpeningStock);
    const inNum = parseFloat(editStockIn);
    const outNum = parseFloat(editStockOut);
    const physicalNum = parseFloat(editPhysicalStock);

    if (isNaN(priceNum) || isNaN(openingNum) || isNaN(inNum) || isNaN(outNum) || isNaN(physicalNum)) {
      showNotification("❌ Numerical entries must be valid decimals!");
      return;
    }

    onEditStockItem(editingItemId, {
      productName: editProductName,
      productCode: editProductCode,
      unitPrice: priceNum,
      openingStock: openingNum,
      stockIn: inNum,
      stockOut: outNum,
      physicalStock: physicalNum,
      locationId: editItemLocationId
    });

    setEditingItemId(null);
    showNotification("✅ Inventory ledger item updated successfully!");
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this stock ledger item? All related value analytics will be lost.")) {
      onDeleteStockItem(id);
      showNotification("🗑️ Stock ledger item deleted successfully.");
    }
  };

  const handleAddTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductCode || !fromLocId || !toLocId || !transferQty || !transferDate) {
      showNotification("❌ Please fill in all required transfer fields.");
      return;
    }

    if (fromLocId === toLocId) {
      showNotification("❌ Source and Destination showroom showrooms cannot be the same!");
      return;
    }

    const qtyNum = parseFloat(transferQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showNotification("❌ Transfer quantity must be greater than zero!");
      return;
    }

    // Find unit price from matching stock item
    const matchedStock = stockItems.find(s => s.productCode === transferProductCode);
    const price = matchedStock ? matchedStock.unitPrice : 0;
    const name = matchedStock ? matchedStock.productName : "Unknown Product";

    // Validate that fromLocation has enough current stock before executing transfer
    if (matchedStock) {
      const sourceStock = stockItems.find(s => s.productCode === transferProductCode && s.locationId === fromLocId);
      if (sourceStock) {
        const currentStock = sourceStock.openingStock + sourceStock.stockIn - sourceStock.stockOut;
        if (currentStock < qtyNum) {
          if (!confirm(`⚠️ Source showroom currently has only ${currentStock} units of this product. Executing this transfer will cause a negative stock balance. Proceed anyway?`)) {
            return;
          }
        }
      }
    }

    onAddStockTransfer({
      productCode: transferProductCode,
      productName: name,
      fromLocationId: fromLocId,
      toLocationId: toLocId,
      quantity: qtyNum,
      unitPrice: price,
      date: transferDate,
      notes: transferNotes
    });

    setTransferProductCode("");
    setTransferQty("");
    setTransferNotes("");
    showNotification("🔄 Stock transfer complete. Ledger balances adjusted bidirectionally!");
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm("Are you sure you want to reverse this stock transfer? Stock IN/OUT adjustments will be automatically rolled back.")) {
      onDeleteStockTransfer(id);
      showNotification("⏪ Stock transfer reversed. Balances recalculated.");
    }
  };

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filter stock items
  const filteredStock = stockItems.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === "all" || item.locationId === filterLocation;
    return matchesSearch && matchesLocation;
  });

  // Calculate summary stats based on current showroom filter context
  const summaryStats = React.useMemo(() => {
    const targetItems = stockItems.filter(item => filterLocation === "all" || item.locationId === filterLocation);
    
    let totalOpening = 0;
    let totalStockIn = 0;
    let totalStockOut = 0;
    let totalCurrentStock = 0;
    let totalPhysicalStock = 0;
    let totalDifference = 0;
    let totalValue = 0;

    targetItems.forEach(item => {
      const current = item.openingStock + item.stockIn - item.stockOut;
      const diff = item.physicalStock - current;
      const value = current * item.unitPrice;

      totalOpening += item.openingStock;
      totalStockIn += item.stockIn;
      totalStockOut += item.stockOut;
      totalCurrentStock += current;
      totalPhysicalStock += item.physicalStock;
      totalDifference += diff;
      totalValue += value;
    });

    return {
      totalOpening,
      totalStockIn,
      totalStockOut,
      totalCurrentStock,
      totalPhysicalStock,
      totalDifference,
      totalValue
    };
  }, [stockItems, filterLocation]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors" id="stock-title">
            තොග පාලනය සහ මාරු කිරීම් (Stock Control & Inter-showroom Transfers)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain high-precision logs of your physical inventory, opening balances, write-ins, and transfer logs between showrooms.
          </p>
        </div>

        {/* Notifications and Badges */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-3 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black border border-blue-200/50">
            Showroom context: {locations.find(l => l.id === filterLocation)?.name || "All Showrooms"}
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-5 py-2.5 text-xs font-black rounded-t-xl border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'ledger'
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package size={15} /> Stock Inventory Ledger
        </button>
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`px-5 py-2.5 text-xs font-black rounded-t-xl border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'transfers'
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight size={15} /> Showroom Stock Transfers
        </button>
      </div>

      {/* Summary KPI Block for the Active context */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Opening Stock</span>
          <span className="text-base font-black text-slate-700 dark:text-slate-200 block mt-1">{summaryStats.totalOpening.toFixed(1)}</span>
        </div>
        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Stock IN</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-1">+{summaryStats.totalStockIn.toFixed(1)}</span>
        </div>
        <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Stock OUT</span>
          <span className="text-base font-black text-rose-600 dark:text-rose-400 block mt-1">-{summaryStats.totalStockOut.toFixed(1)}</span>
        </div>
        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Current Stock</span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400 block mt-1">{summaryStats.totalCurrentStock.toFixed(1)}</span>
        </div>
        <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Physical Stock</span>
          <span className="text-base font-black text-purple-600 dark:text-purple-400 block mt-1">{summaryStats.totalPhysicalStock.toFixed(1)}</span>
        </div>
        <div className={`p-4 rounded-xl border ${summaryStats.totalDifference < 0 ? 'bg-amber-500/5 border-amber-500/10 text-amber-600' : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200/50'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block">Stock Diff</span>
          <span className="text-base font-black block mt-1">{summaryStats.totalDifference >= 0 ? `+${summaryStats.totalDifference.toFixed(1)}` : summaryStats.totalDifference.toFixed(1)}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Value</span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400 block mt-1">{formatLKR(summaryStats.totalValue)}</span>
        </div>
      </div>

      {activeSubTab === 'ledger' ? (
        /* ================= LEDGER SECTION ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add item panel */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> නව ද්‍රව්‍යයක් ඇතුළත් කරන්න (Add Ledger Item)
              </h3>

              <form onSubmit={handleAddLedgerSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Showroom Location *</label>
                  <select
                    value={itemLocationId}
                    onChange={(e) => setItemLocationId(e.target.value)}
                    disabled={accessMode === "terminal"}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200 disabled:opacity-60"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. LG Smart TV 43"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Product Code *</label>
                    <input
                      type="text"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PRD-TV43"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Unit Price (LKR) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Opening Stock *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={openingStock}
                      onChange={(e) => setOpeningStock(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Physical Stock *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={physicalStock}
                      onChange={(e) => setPhysicalStock(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 cursor-pointer text-center"
                >
                  SAVE INVENTORY ITEM
                </button>
              </form>
            </div>
          </div>

          {/* Table display */}
          <div className="lg:col-span-8 space-y-6">
            {/* Edit Stock Item Form */}
            {editingItemId && (
              <div className="p-5 border border-amber-300 bg-amber-500/5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Edit size={14} /> Item Row ID Edit: {editingItemId}
                </h4>
                <form onSubmit={handleUpdateItemSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editProductName}
                      onChange={(e) => setEditProductName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Code</label>
                    <input
                      type="text"
                      value={editProductCode}
                      onChange={(e) => setEditProductCode(e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="any"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Opening</label>
                    <input
                      type="number"
                      step="any"
                      value={editOpeningStock}
                      onChange={(e) => setEditOpeningStock(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Stock IN</label>
                    <input
                      type="number"
                      step="any"
                      value={editStockIn}
                      onChange={(e) => setEditStockIn(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Stock OUT</label>
                    <input
                      type="number"
                      step="any"
                      value={editStockOut}
                      onChange={(e) => setEditStockOut(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Physical Count</label>
                    <input
                      type="number"
                      step="any"
                      value={editPhysicalStock}
                      onChange={(e) => setEditPhysicalStock(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Showroom Location</label>
                    <select
                      value={editItemLocationId}
                      onChange={(e) => setEditItemLocationId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 text-xs px-2 py-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="submit" className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer text-center">Save</button>
                    <button type="button" onClick={() => setEditingItemId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs cursor-pointer">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  තොග ලේඛනය (Showroom Inventory Ledger Sheet)
                </h3>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Min Alert:</span>
                    <input
                      type="number"
                      min="0"
                      value={minStockThreshold}
                      onChange={(e) => setMinStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-center font-black text-xs text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by code or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                  />
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    disabled={accessMode === "terminal"}
                    className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-60"
                  >
                    <option value="all">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-3">Product / Code</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Opening</th>
                      <th className="py-2.5 px-3 text-center">IN</th>
                      <th className="py-2.5 px-3 text-center">OUT</th>
                      <th className="py-2.5 px-3 text-center bg-blue-50/40 dark:bg-blue-950/10">Current</th>
                      <th className="py-2.5 px-3 text-center bg-purple-50/40 dark:bg-purple-950/10">Physical</th>
                      <th className="py-2.5 px-3 text-center">Diff</th>
                      <th className="py-2.5 px-3 text-right">Value (LKR)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300 font-medium">
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-medium">No items matched the parameters.</td>
                      </tr>
                    ) : (
                      filteredStock.map(item => {
                        const current = item.openingStock + item.stockIn - item.stockOut;
                        const diff = item.physicalStock - current;
                        const value = current * item.unitPrice;
                        const matchedLoc = locations.find(l => l.id === item.locationId);

                        const isLowStock = current < minStockThreshold;

                        return (
                          <tr key={item.id} className={`transition-colors ${
                            isLowStock 
                              ? 'bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-100/30 dark:hover:bg-rose-900/10 border-l-2 border-rose-500' 
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                          }`}>
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-800 dark:text-white block flex items-center gap-1.5">
                                {item.productName}
                                {isLowStock && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-extrabold bg-rose-500 text-white animate-pulse">
                                    <AlertCircle size={9} /> LOW
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{item.productCode}</span>
                            </td>
                            <td className="py-3 px-3 truncate max-w-[80px]">{matchedLoc?.name.split(" ")[0] || "Colombo"}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">{item.unitPrice.toFixed(1)}</td>
                            <td className="py-3 px-3 text-center">{item.openingStock.toFixed(1)}</td>
                            <td className="py-3 px-3 text-center text-emerald-600">+{item.stockIn.toFixed(1)}</td>
                            <td className="py-3 px-3 text-center text-rose-500">-{item.stockOut.toFixed(1)}</td>
                            <td className={`py-3 px-3 text-center font-bold ${
                              isLowStock 
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 font-black' 
                                : 'text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/5'
                            }`}>{current.toFixed(1)}</td>
                            <td className="py-3 px-3 text-center bg-purple-50/20 dark:bg-purple-950/5 font-bold text-purple-600 dark:text-purple-400">{item.physicalStock.toFixed(1)}</td>
                            <td className={`py-3 px-3 text-center font-bold ${diff < 0 ? 'text-amber-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-white">{formatLKR(value)}</td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => handleStartEditItem(item)} className="p-1 hover:text-blue-500 text-slate-400 rounded cursor-pointer" title="Edit Count / Price"><Edit size={12} /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-500 text-slate-400 rounded cursor-pointer" title="Delete Ledger Entry"><Trash2 size={12} /></button>
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
      ) : (
        /* ================= TRANSFERS SECTION ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Transfer submission form */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-blue-500" /> නව මාරුවක් සිදු කරන්න (New Stock Transfer)
              </h3>

              <form onSubmit={handleAddTransferSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Select Ledger Product *</label>
                  <select
                    value={transferProductCode}
                    onChange={(e) => setTransferProductCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="">Choose item...</option>
                    {/* Unique product codes in ledger */}
                    {Array.from(new Set(stockItems.map(s => s.productCode))).map(code => {
                      const item = stockItems.find(s => s.productCode === code);
                      return <option key={code} value={code}>{item?.productName} ({code})</option>;
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">From Location *</label>
                    <select
                      value={fromLocId}
                      onChange={(e) => setFromLocId(e.target.value)}
                      disabled={accessMode === "terminal"}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-60"
                      required
                    >
                      <option value="">Source...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name.split(" ")[0]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">To Location *</label>
                    <select
                      value={toLocId}
                      onChange={(e) => setToLocId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                      required
                    >
                      <option value="">Destination...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name.split(" ")[0]}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={transferQty}
                      onChange={(e) => setTransferQty(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Transfer Date *</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Transfer Notes</label>
                  <textarea
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Provide justification reason, carrier ID..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight size={14} /> AUTHORIZE DISPATCH
                </button>
              </form>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">
                පද්ධති මාරු කිරීම් වාර්තා (Inter-showroom Stock Transfer Logs)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Product Code / Name</th>
                      <th className="py-2.5 px-4 text-center">From Showroom</th>
                      <th className="py-2.5 px-4 text-center">To Showroom</th>
                      <th className="py-2.5 px-4 text-center">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Selling Value (LKR)</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                    {stockTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">No transfer records found.</td>
                      </tr>
                    ) : (
                      stockTransfers.map(t => {
                        const fromLoc = locations.find(l => l.id === t.fromLocationId);
                        const toLoc = locations.find(l => l.id === t.toLocationId);
                        const sellingVal = t.quantity * t.unitPrice;

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{t.date}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 dark:text-white block">{t.productName}</span>
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{t.productCode}</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-rose-600">
                              {fromLoc?.name.split(" ")[0] || "Colombo"}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-600">
                              {toLoc?.name.split(" ")[0] || "Kandy"}
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold text-slate-800 dark:text-slate-100">
                              {t.quantity.toFixed(1)} pcs
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-800 dark:text-white">
                              {formatLKR(sellingVal)}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-400 max-w-[120px] truncate" title={t.notes}>
                              {t.notes}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => handleDeleteTransfer(t.id)} 
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 text-slate-400 rounded-lg cursor-pointer"
                                title="Reverse Transfer"
                              >
                                <Trash2 size={13} />
                              </button>
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
      )}
    </div>
  );
}
