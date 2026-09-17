import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  Layers, 
  Target, 
  FilePieChart, 
  Sparkles, 
  MessageCircle, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  TrendingUp,
  Cpu,
  ShoppingBag,
  MapPin,
  Shield,
  RefreshCw,
  Boxes,
  FileSpreadsheet
} from "lucide-react";

// Components
import Dashboard from "./components/Dashboard";
import SalesEntry from "./components/SalesEntry";
import ExcelImport, { ExcelImportHistoryEntry } from "./components/ExcelImport";
import SalesmenList from "./components/SalesmenList";
import DepartmentsList from "./components/DepartmentsList";
import TargetsList from "./components/TargetsList";
import ReportsSection from "./components/ReportsSection";
import AIAssistant from "./components/AIAssistant";
import WhatsAppShare from "./components/WhatsAppShare";
import Settings from "./components/Settings";
import LocationsList from "./components/LocationsList";
import AdminPanel from "./components/AdminPanel";
import SyncPanel from "./components/SyncPanel";
import StockControl from "./components/StockControl";

// Seed Data
import { 
  INITIAL_SALESMEN, 
  INITIAL_DEPARTMENTS, 
  INITIAL_SALES_RECORDS,
  INITIAL_LOCATIONS,
  INITIAL_PCS,
  INITIAL_CUSTOMER_COUNTS,
  INITIAL_STOCK_ITEMS,
  INITIAL_STOCK_TRANSFERS
} from "./data";
import { Salesman, Department, SalesRecord, AppTotals, Location, PCInstallation, CustomerCountRecord, StockItem, StockTransfer } from "./types";

export default function App() {
  // --- Centralized Date & Time Service ---
  const timeOffsetRef = useRef<number>((() => {
    const saved = localStorage.getItem("laksela_time_offset");
    return saved ? parseInt(saved, 10) : 0;
  })());

  const getSyncedDateString = (): string => {
    const currentSyncedTimeMs = Date.now() + timeOffsetRef.current;
    const d = new Date(currentSyncedTimeMs);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(Date.UTC(parseInt(year), monthNum, day));
        return dateObj.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
      }
    } catch (e) {}
    return dateStr;
  };

  // --- States ---
  const [systemDate, setSystemDate] = useState<string>(getSyncedDateString);
  const [onlineTimeStatus, setOnlineTimeStatus] = useState<string>("Syncing...");
  const [dbLoading, setDbLoading] = useState(true);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>("N/A");
  const [lastAutoSaveStatus, setLastAutoSaveStatus] = useState<string>("Waiting...");
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("laksela_dark_mode");
    return saved ? JSON.parse(saved) : false;
  });

  // Central Central DB lists
  const [locations, setLocations] = useState<Location[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_locations") === "true") return [];
    const saved = localStorage.getItem("laksela_locations");
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [pcs, setPcs] = useState<PCInstallation[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_pcs") === "true") return [];
    const saved = localStorage.getItem("laksela_pcs");
    return saved ? JSON.parse(saved) : INITIAL_PCS;
  });

  const [customerCounts, setCustomerCounts] = useState<CustomerCountRecord[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_customer_counts") === "true") return [];
    const saved = localStorage.getItem("laksela_customer_counts");
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_COUNTS;
  });

  const [salesmen, setSalesmen] = useState<Salesman[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_salesmen") === "true") return [];
    const saved = localStorage.getItem("laksela_salesmen");
    return saved ? JSON.parse(saved) : INITIAL_SALESMEN;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_departments") === "true") return [];
    const saved = localStorage.getItem("laksela_departments");
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_sales_records") === "true") return [];
    const saved = localStorage.getItem("laksela_sales_records");
    return saved ? JSON.parse(saved) : INITIAL_SALES_RECORDS;
  });

  const [overallMonthlyTarget, setOverallMonthlyTarget] = useState<number>(() => {
    if (localStorage.getItem("laksela_sample_deleted_targets") === "true") return 0;
    const saved = localStorage.getItem("laksela_monthly_target");
    return saved ? parseFloat(saved) : 1300000; // Default 1.3M LKR
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_stock") === "true") return [];
    const saved = localStorage.getItem("laksela_stock_items");
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    if (localStorage.getItem("laksela_sample_deleted_transfers") === "true") return [];
    const saved = localStorage.getItem("laksela_stock_transfers");
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
  });

  // Access Mode & active terminal settings
  const [accessMode, setAccessMode] = useState<"admin" | "terminal">(() => {
    const saved = localStorage.getItem("laksela_access_mode");
    return saved === "terminal" ? "terminal" : "admin";
  });

  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(() => {
    const saved = localStorage.getItem("laksela_selected_terminal_id");
    return saved || INITIAL_PCS[0]?.id || "pc-01";
  });

  // Global selector for Active Showroom filtering
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

  const [syncInProgress, setSyncInProgress] = useState(false);

  // Excel Data Import history
  const [importHistory, setImportHistory] = useState<ExcelImportHistoryEntry[]>(() => {
    const saved = localStorage.getItem("laksela_excel_import_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync Stats & logs archive from gateway server
  const [syncStats, setSyncStats] = useState({
    totalPCs: 4,
    onlinePCs: 3,
    offlinePCs: 1,
    successfullyUpdated: 3,
    pendingUpdates: 1,
    failedUpdates: 0,
    lastSyncTime: "N/A",
    pcs: [] as PCInstallation[],
    logs: [] as any[]
  });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem("laksela_auto_sync_enabled") === "true";
  });

  const [autoSyncTime, setAutoSyncTime] = useState(() => {
    return localStorage.getItem("laksela_auto_sync_time") || "22:00";
  });

  const handleToggleGlobalAutoSync = () => {
    setAutoSyncEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem("laksela_auto_sync_enabled", newVal ? "true" : "false");
      return newVal;
    });
  };

  const handleSetGlobalAutoSyncTime = (time: string) => {
    setAutoSyncTime(time);
    localStorage.setItem("laksela_auto_sync_time", time);
  };

  const fetchSyncStatus = () => {
    fetch("/api/sync/status")
      .then(res => {
        if (!res.ok) throw new Error("Status failed");
        return res.json();
      })
      .then(data => {
        if (data) {
          setSyncStats({
            totalPCs: data.totalPCs || 0,
            onlinePCs: data.onlinePCs || 0,
            offlinePCs: data.offlinePCs || 0,
            successfullyUpdated: data.successfullyUpdated || 0,
            pendingUpdates: data.pendingUpdates || 0,
            failedUpdates: data.failedUpdates || 0,
            lastSyncTime: data.lastSyncTime || "N/A",
            pcs: data.pcs || [],
            logs: data.logs || []
          });
        }
      })
      .catch(err => console.warn("Error fetching sync status:", err));
  };

  // --- Effects ---
  // Centralized Server Time Synchronization routine
  const syncTime = async () => {
    try {
      const res = await fetch("/api/time");
      if (res.ok) {
        const data = await res.json();
        if (data && data.datetime) {
          const serverTimeMs = new Date(data.datetime).getTime();
          const localTimeMs = Date.now();
          const calculatedOffset = serverTimeMs - localTimeMs;
          
          timeOffsetRef.current = calculatedOffset;
          localStorage.setItem("laksela_time_offset", String(calculatedOffset));
          
          const newDateStr = getSyncedDateString();
          setSystemDate(newDateStr);
          setOnlineTimeStatus(`Online (Synced: ${newDateStr})`);
          return;
        }
      }
      throw new Error("Invalid payload");
    } catch (err) {
      const newDateStr = getSyncedDateString();
      setSystemDate(newDateStr);
      setOnlineTimeStatus(`Local Fallback (Active: ${newDateStr})`);
    }
  };

  // Real-Time Time Synchronization and Midnight Crossing Listener
  useEffect(() => {
    // 1. Initial time sync
    syncTime();

    // 2. Refresh time sync periodically every 30s
    const timeSyncInterval = setInterval(() => {
      syncTime();
    }, 30000);

    // 3. Keep clock ticking locally to track exact midnight transitions every 1s
    const midnightInterval = setInterval(() => {
      const correctDate = getSyncedDateString();
      setSystemDate((prevDate) => {
        if (prevDate !== correctDate) {
          return correctDate;
        }
        return prevDate;
      });
    }, 1000);

    // cleanup
    return () => {
      clearInterval(timeSyncInterval);
      clearInterval(midnightInterval);
    };
  }, []);

  // Separate DB loader effect to fetch state once on startup
  useEffect(() => {
    // Fetch central DB state
    fetch("/api/db/get")
      .then(res => {
        if (!res.ok) throw new Error("Could not contact central DB");
        return res.json();
      })
      .then(db => {
        if (db && db.centralData) {
          const { locations: locs, salesmen: sms, salesRecords: recs, customerCounts: cCounts, overallMonthlyTarget: oTarget, stockItems: sItems, stockTransfers: sTransfers, excelImportHistory: eHistory } = db.centralData;
          
          if (db.sampleDataCleared) {
            setSalesRecords(recs || []);
            setCustomerCounts(cCounts || []);
            setStockTransfers(sTransfers || []);
            setImportHistory(eHistory || []);
            if (sItems) setStockItems(sItems);
          } else {
            if (recs && recs.length > 0) setSalesRecords(recs);
            if (cCounts && cCounts.length > 0) setCustomerCounts(cCounts);
            if (sTransfers && sTransfers.length > 0) setStockTransfers(sTransfers);
            if (eHistory && eHistory.length > 0) setImportHistory(eHistory);
            if (sItems && sItems.length > 0) setStockItems(sItems);
          }

          if (locs && locs.length > 0) setLocations(locs);
          if (sms && sms.length > 0) setSalesmen(sms);
          if (oTarget !== undefined) setOverallMonthlyTarget(oTarget);
          if (db.pcs) setPcs(db.pcs);
          if (db.syncLogs) setSyncStats(prev => ({ ...prev, logs: db.syncLogs }));
        }
        setDbLoading(false);
        setLastAutoSaveStatus("Synced");
        setLastAutoSaveTime(new Date().toLocaleTimeString());
      })
      .catch(err => {
        console.warn("Error pulling master DB state, defaulting to LocalStorage:", err);
        setDbLoading(false);
        setLastAutoSaveStatus("Local Backup Only");
      });
  }, []);

  // Transactional Auto-Save trigger
  useEffect(() => {
    if (dbLoading) return;

    const controller = new AbortController();
    const triggerSave = async () => {
      try {
        setLastAutoSaveStatus("Saving...");
        const res = await fetch("/api/db/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations,
            salesmen,
            salesRecords,
            customerCounts,
            overallMonthlyTarget,
            stockItems,
            stockTransfers,
            excelImportHistory: importHistory,
            pcs
          }),
          signal: controller.signal
        });
        if (res.ok) {
          setLastAutoSaveStatus("Auto-saved");
          setLastAutoSaveTime(new Date().toLocaleTimeString());
          setShowAutoSaveIndicator(true);
          const t = setTimeout(() => setShowAutoSaveIndicator(false), 2000);
          return () => clearTimeout(t);
        } else {
          setLastAutoSaveStatus("Save failed");
        }
      } catch (err) {
        console.warn("Auto-save sync failure:", err);
        setLastAutoSaveStatus("Local Backup Active");
      }
    };

    const delayTimer = setTimeout(triggerSave, 600);
    return () => {
      clearTimeout(delayTimer);
      controller.abort();
    };
  }, [locations, salesmen, salesRecords, customerCounts, overallMonthlyTarget, stockItems, stockTransfers, importHistory, pcs, dbLoading]);

  // Sync Dark mode to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("laksela_dark_mode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Status Polling Effect
  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Background Auto-Sync Daily Checker
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      if (currentTimeString === autoSyncTime) {
        console.log("⏰ Auto sync daily window matched! Starting sync handshake...");
        handleTriggerSync("internet");
      }
    }, 60000); // Check once per minute

    return () => clearInterval(interval);
  }, [autoSyncEnabled, autoSyncTime]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("laksela_locations", JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem("laksela_pcs", JSON.stringify(pcs));
  }, [pcs]);

  useEffect(() => {
    localStorage.setItem("laksela_customer_counts", JSON.stringify(customerCounts));
  }, [customerCounts]);

  useEffect(() => {
    localStorage.setItem("laksela_salesmen", JSON.stringify(salesmen));
  }, [salesmen]);

  useEffect(() => {
    localStorage.setItem("laksela_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("laksela_sales_records", JSON.stringify(salesRecords));
  }, [salesRecords]);

  useEffect(() => {
    localStorage.setItem("laksela_monthly_target", overallMonthlyTarget.toString());
  }, [overallMonthlyTarget]);

  useEffect(() => {
    localStorage.setItem("laksela_stock_items", JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem("laksela_stock_transfers", JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem("laksela_excel_import_history", JSON.stringify(importHistory));
  }, [importHistory]);

  useEffect(() => {
    localStorage.setItem("laksela_access_mode", accessMode);
  }, [accessMode]);

  useEffect(() => {
    localStorage.setItem("laksela_selected_terminal_id", selectedTerminalId);
  }, [selectedTerminalId]);

  // Handle Terminal Node Lock - if mode changes, automatically set global filter
  useEffect(() => {
    if (accessMode === "terminal") {
      const activePC = pcs.find(p => p.id === selectedTerminalId);
      if (activePC) {
        setSelectedLocationId(activePC.locationId);
      }
    } else {
      setSelectedLocationId("all");
    }
  }, [accessMode, selectedTerminalId, pcs]);

  // --- Reactive Calculations ---
  // 1. Calculate dynamic salesman stats (daily, monthly totals, dept shares, customer counts)
  const computedSalesmen = useMemo(() => {
    return salesmen.map(sm => {
      // Filter records for this salesman
      const sRecords = salesRecords.filter(r => r.salesmanId === sm.id && (selectedLocationId === "all" || r.locationId === selectedLocationId));
      
      // Daily sales
      const todayRecords = sRecords.filter(r => r.date === systemDate);
      const dailySales = todayRecords.reduce((sum, r) => sum + r.amount, 0);

      // Monthly sales
      const monthlyRecords = sRecords.filter(r => r.date.startsWith(systemDate.substring(0, 7)));
      const monthlySales = monthlyRecords.reduce((sum, r) => sum + r.amount, 0);
      
      const totalSales = sRecords.reduce((sum, r) => sum + r.amount, 0);
      const customerCount = sRecords.length; // Number of transaction events recorded

      // Electronic department share
      const electronicSales = sRecords
        .filter(r => {
          const dept = departments.find(d => d.id === r.departmentId);
          return dept && dept.type === 'electronic';
        })
        .reduce((sum, r) => sum + r.amount, 0);

      // Non-Electronic department share
      const nonElectronicSales = sRecords
        .filter(r => {
          const dept = departments.find(d => d.id === r.departmentId);
          return dept && dept.type === 'non-electronic';
        })
        .reduce((sum, r) => sum + r.amount, 0);

      const targetPortion = selectedLocationId === "all" ? sm.monthlyTarget : sm.monthlyTarget / locations.length;
      const achievementRate = targetPortion > 0 ? (monthlySales / targetPortion) * 100 : 0;

      return {
        ...sm,
        dailySales,
        monthlySales,
        totalSales,
        customerCount,
        electronicSales,
        nonElectronicSales,
        achievementRate
      };
    });
  }, [salesmen, salesRecords, departments, selectedLocationId, locations.length, systemDate]);

  // 2. Calculate corporate/appwide totals (filtered by selected showroom location)
  const computedTotals = useMemo((): AppTotals => {
    const locFilteredRecords = salesRecords.filter(r => selectedLocationId === "all" || r.locationId === selectedLocationId);

    const todaySales = locFilteredRecords
      .filter(r => r.date === systemDate)
      .reduce((sum, r) => sum + r.amount, 0);

    const monthlySales = locFilteredRecords
      .filter(r => r.date.startsWith(systemDate.substring(0, 7)))
      .reduce((sum, r) => sum + r.amount, 0);

    // If specific location, set target to that showroom's target
    let monthlyTarget = overallMonthlyTarget;
    if (selectedLocationId !== "all") {
      const matchedLoc = locations.find(l => l.id === selectedLocationId);
      if (matchedLoc) {
        monthlyTarget = matchedLoc.monthlyTarget;
      }
    }

    const totalCustomers = customerCounts
      .filter(cc => selectedLocationId === "all" || cc.locationId === selectedLocationId)
      .reduce((sum, cc) => sum + cc.count, 0);

    const electronicSales = locFilteredRecords
      .filter(r => {
        const dept = departments.find(d => d.id === r.departmentId);
        return dept && dept.type === 'electronic';
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const nonElectronicSales = locFilteredRecords
      .filter(r => {
        const dept = departments.find(d => d.id === r.departmentId);
        return dept && dept.type === 'non-electronic';
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const achievementRate = monthlyTarget > 0 ? (monthlySales / monthlyTarget) * 100 : 0;

    return {
      todaySales,
      monthlySales,
      monthlyTarget,
      achievementRate,
      totalCustomers,
      salesmenCount: salesmen.length,
      electronicSales,
      nonElectronicSales
    };
  }, [salesRecords, salesmen, departments, overallMonthlyTarget, selectedLocationId, locations, customerCounts, systemDate]);

  // --- Handlers ---
  // Real-Time Database State Controls
  const handleClearSampleData = async () => {
    const res = await fetch("/api/db/clear-sample", { method: "POST" });
    if (res.ok) {
      setSalesRecords([]);
      setCustomerCounts([]);
      setStockTransfers([]);
      localStorage.setItem("laksela_sample_deleted_sales_records", "true");
    } else {
      throw new Error("Could not contact server to clear sample data");
    }
  };

  const handleClearAllDatabaseData = async () => {
    const res = await fetch("/api/db/clear-all", { method: "POST" });
    if (res.ok) {
      setSalesRecords([]);
      setCustomerCounts([]);
      setStockTransfers([]);
      setStockItems(prev => prev.map(item => ({
        ...item,
        openingStock: 0,
        stockIn: 0,
        stockOut: 0,
        currentStock: 0,
        physicalStock: 0,
        stockDifference: 0,
        stockValue: 0
      })));
      localStorage.setItem("laksela_sample_deleted_sales_records", "true");
    } else {
      throw new Error("Could not contact server to wipe database");
    }
  };

  const handleRefreshDatabase = async () => {
    const res = await fetch("/api/db/get");
    if (res.ok) {
      const db = await res.json();
      if (db && db.centralData) {
        const { locations: locs, salesmen: sms, salesRecords: recs, customerCounts: cCounts, overallMonthlyTarget: oTarget, stockItems: sItems, stockTransfers: sTransfers } = db.centralData;
        if (recs) setSalesRecords(recs);
        if (cCounts) setCustomerCounts(cCounts);
        if (sTransfers) setStockTransfers(sTransfers);
        if (sItems) setStockItems(sItems);
        if (locs) setLocations(locs);
        if (sms) setSalesmen(sms);
        if (oTarget !== undefined) setOverallMonthlyTarget(oTarget);
      }
    } else {
      throw new Error("Could not contact server to sync data");
    }
  };

  // Sales records handlers
  const handleAddRecord = (record: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">) => {
    const matchedSalesman = salesmen.find(s => s.id === record.salesmanId);
    const matchedDept = departments.find(d => d.id === record.departmentId);
    const matchedLocation = locations.find(l => l.id === record.locationId);

    const newRecord: SalesRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      salesmanName: matchedSalesman?.name || "Unknown",
      departmentName: matchedDept?.name || "Unknown",
      locationName: matchedLocation?.name || "Unknown"
    };

    setSalesRecords(prev => [newRecord, ...prev]);
  };

  const handleEditRecord = (id: string, updated: Partial<SalesRecord>) => {
    setSalesRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...updated } : rec));
  };

  const handleDeleteRecord = (id: string) => {
    setSalesRecords(prev => prev.filter(rec => rec.id !== id));
  };

  // Customer Count handlers
  const handleAddOrUpdateCustomerCount = (locationId: string, date: string, count: number) => {
    setCustomerCounts(prev => {
      const idx = prev.findIndex(cc => cc.locationId === locationId && cc.date === date);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          count,
          syncStatus: "pending"
        };
        return copy;
      } else {
        return [
          {
            id: `cc-${Date.now()}`,
            locationId,
            date,
            count,
            syncStatus: "pending"
          },
          ...prev
        ];
      }
    });
  };

  const handleDeleteCustomerCount = (id: string) => {
    setCustomerCounts(prev => prev.filter(cc => cc.id !== id));
  };

  // Excel Data Import handlers
  const handleAddRecordsBatch = (records: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">[]) => {
    const fullRecords = records.map((r, index) => {
      const salesmanObj = salesmen.find(s => s.id === r.salesmanId);
      const departmentObj = departments.find(d => d.id === r.departmentId);
      const locationObj = locations.find(l => l.id === r.locationId);
      
      return {
        ...r,
        id: "rec-batch-" + Math.random().toString(36).substring(2, 9) + "-" + index,
        salesmanName: salesmanObj?.name || "Unknown Salesman",
        departmentName: departmentObj?.name || "Non-Electronic",
        locationName: locationObj?.name || "Colombo Main Showroom"
      } as SalesRecord;
    });

    setSalesRecords(prev => [...fullRecords, ...prev]);
  };

  const handleImportSalesSummaryBatch = (
    records: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">[],
    overwrite: boolean,
    targetDatesAndSalesmen: { date: string; salesmanId: string }[]
  ) => {
    setSalesRecords(prev => {
      let baseRecords = [...prev];
      if (overwrite) {
        // Filter out existing records matching both date AND salesmanId to update them in place safely
        baseRecords = baseRecords.filter(rec => {
          return !targetDatesAndSalesmen.some(t => t.date === rec.date && t.salesmanId === rec.salesmanId);
        });
      }

      const fullRecords = records.map((r, index) => {
        const salesmanObj = salesmen.find(s => s.id === r.salesmanId);
        const departmentObj = departments.find(d => d.id === r.departmentId);
        const locationObj = locations.find(l => l.id === r.locationId);

        return {
          ...r,
          id: "rec-summary-" + Math.random().toString(36).substring(2, 9) + "-" + index,
          salesmanName: salesmanObj?.name || "Unknown Salesman",
          departmentName: departmentObj?.name || (r.departmentId === "dep-1" ? "Electronic" : "Non-Electronic"),
          locationName: locationObj?.name || "Colombo Main Showroom"
        } as SalesRecord;
      });

      return [...fullRecords, ...baseRecords];
    });
  };

  const handleAddOrUpdateCustomerCountsBatch = (counts: { locationId: string; date: string; count: number }[]) => {
    setCustomerCounts(prev => {
      const updated = [...prev];
      counts.forEach(item => {
        const idx = updated.findIndex(cc => cc.date === item.date && cc.locationId === item.locationId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            count: item.count,
            syncStatus: "pending"
          };
        } else {
          const locObj = locations.find(l => l.id === item.locationId);
          updated.push({
            id: "cc-batch-" + Math.random().toString(36).substring(2, 9),
            locationId: item.locationId,
            locationName: locObj?.name || "Colombo Main Showroom",
            date: item.date,
            count: item.count,
            createdTimestamp: new Date().toISOString(),
            syncStatus: "pending"
          });
        }
      });
      return updated;
    });
  };

  const handleUpdateSalesRecordInline = (id: string, updated: Partial<SalesRecord>) => {
    setSalesRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...updated } : rec));
  };

  const handleSaveImportHistory = (entry: ExcelImportHistoryEntry) => {
    setImportHistory(prev => [entry, ...prev]);
  };

  const handleDeleteImportHistory = () => {
    setImportHistory([]);
  };

  // Locations Handlers
  const handleAddLocation = (loc: Omit<Location, "id">) => {
    const newLoc: Location = {
      ...loc,
      id: `loc-${Date.now()}`,
      monthlyTarget: 400000, // Default 400k showroom target
    };
    setLocations(prev => [...prev, newLoc]);
  };

  const handleEditLocation = (id: string, updated: Partial<Location>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  // PC installations handlers
  const handleAddPC = (pc: Omit<PCInstallation, "id" | "locationName">) => {
    const matchedLoc = locations.find(l => l.id === pc.locationId);
    const newPC: PCInstallation = {
      ...pc,
      id: `pc-${Date.now()}`,
      locationName: matchedLoc?.name || "Unknown"
    };
    setPcs(prev => [...prev, newPC]);
  };

  const handleEditPC = (id: string, updated: Partial<PCInstallation>) => {
    setPcs(prev => prev.map(p => {
      if (p.id === id) {
        const matchedLoc = locations.find(l => l.id === (updated.locationId || p.locationId));
        return {
          ...p,
          ...updated,
          locationName: matchedLoc?.name || p.locationName
        };
      }
      return p;
    }));
  };

  const handleDeletePC = (id: string) => {
    setPcs(prev => prev.filter(p => p.id !== id));
  };

  // Salesmen handlers
  const handleAddSalesman = (sm: Omit<Salesman, "id" | "dailySales" | "monthlySales" | "customerCount" | "achievementRate" | "electronicSales" | "nonElectronicSales" | "totalSales">) => {
    const newSalesman: Salesman = {
      ...sm,
      id: `sm-${Date.now()}`,
      dailySales: 0,
      monthlySales: 0,
      customerCount: 0,
      achievementRate: 0,
      electronicSales: 0,
      nonElectronicSales: 0,
      totalSales: 0
    };
    setSalesmen(prev => [...prev, newSalesman]);
  };

  const handleEditSalesman = (id: string, updated: Partial<Salesman>) => {
    setSalesmen(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteSalesman = (id: string) => {
    setSalesmen(prev => prev.filter(s => s.id !== id));
    setSalesRecords(prev => prev.map(r => r.salesmanId === id ? { ...r, salesmanName: `${r.salesmanName} (Archived)` } : r));
  };

  // Departments handlers
  const handleAddDepartment = (name: string, type: 'electronic' | 'non-electronic' | 'custom', description?: string) => {
    const newDept: Department = {
      id: `dep-${Date.now()}`,
      name,
      type,
      description
    };
    setDepartments(prev => [...prev, newDept]);
  };

  const handleEditDepartment = (id: string, updated: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    setSalesRecords(prev => prev.map(r => r.departmentId === id ? { ...r, departmentName: `${r.departmentName} (Archived)` } : r));
  };

  // Targets handlers
  const handleUpdateOverallTarget = (target: number) => {
    setOverallMonthlyTarget(target);
  };

  const handleUpdateSalesmanTarget = (id: string, target: number) => {
    setSalesmen(prev => prev.map(s => s.id === id ? { ...s, monthlyTarget: target } : s));
  };

  // Stock Handlers
  const handleAddStockItem = (item: Omit<StockItem, "id">) => {
    const newItem: StockItem = {
      ...item,
      id: `st-${Date.now()}`
    };
    setStockItems(prev => [...prev, newItem]);
  };

  const handleEditStockItem = (id: string, updated: Partial<StockItem>) => {
    setStockItems(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(s => s.id !== id));
  };

  // Stock Transfer Handlers
  const handleAddStockTransfer = (transfer: Omit<StockTransfer, "id">) => {
    const newTransfer: StockTransfer = {
      ...transfer,
      id: `tr-${Date.now()}`
    };
    setStockTransfers(prev => {
      const updatedTransfers = [newTransfer, ...prev];
      // Automatically adjust stock in/out bidirectionally upon transfer!
      setStockItems(stockPrev => {
        return stockPrev.map(item => {
          if (item.productCode === transfer.productCode) {
            if (item.locationId === transfer.fromLocationId) {
              return { ...item, stockOut: item.stockOut + transfer.quantity };
            }
            if (item.locationId === transfer.toLocationId) {
              return { ...item, stockIn: item.stockIn + transfer.quantity };
            }
          }
          return item;
        });
      });
      return updatedTransfers;
    });
  };

  const handleDeleteStockTransfer = (id: string) => {
    const transfer = stockTransfers.find(t => t.id === id);
    if (!transfer) return;
    setStockTransfers(prev => prev.filter(t => t.id !== id));
    // Rollback transfer adjustments on stock items
    setStockItems(stockPrev => {
      return stockPrev.map(item => {
        if (item.productCode === transfer.productCode) {
          if (item.locationId === transfer.fromLocationId) {
            return { ...item, stockOut: Math.max(0, item.stockOut - transfer.quantity) };
          }
          if (item.locationId === transfer.toLocationId) {
            return { ...item, stockIn: Math.max(0, item.stockIn - transfer.quantity) };
          }
        }
        return item;
      });
    });
  };

  // Bidirectional Synchronization handshake with Central Server Broker
  const handleTriggerSync = async (method: 'internet' | 'wifi') => {
    setSyncInProgress(true);
    const activeTerminal = pcs.find(p => p.id === selectedTerminalId);

    try {
      if (accessMode === "admin") {
        // Send master update
        const payload = {
          locations,
          salesmen,
          departments,
          overallMonthlyTarget
        };

        const res = await fetch("/api/sync/send-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Central Sync push failed");
        
        fetchSyncStatus();
      } else {
        // Location PC sends local logs and pulls updated targets
        const payload = {
          pcId: selectedTerminalId,
          salesRecords: salesRecords.filter(r => r.syncStatus === "pending"),
          customerCounts: customerCounts.filter(cc => cc.syncStatus === "pending")
        };

        const res = await fetch("/api/sync/pull-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Terminal Sync pull failed");
        const data = await res.json();

        // Mark local entries as synced
        setSalesRecords(prev => prev.map(r => ({ ...r, syncStatus: "synced" })));
        setCustomerCounts(prev => prev.map(cc => ({ ...cc, syncStatus: "synced" })));

        // Sync with updated central datasets
        if (data.locations) setLocations(data.locations);
        if (data.salesmen) setSalesmen(data.salesmen);
        if (data.departments) setDepartments(data.departments);
        if (data.overallMonthlyTarget !== undefined) setOverallMonthlyTarget(data.overallMonthlyTarget);

        fetchSyncStatus();
      }

      // Record successful local timestamp update for active locations
      const nowStr = new Date().toLocaleTimeString();
      setLocations(prev => prev.map(l => {
        if (accessMode === "admin" || (activeTerminal && l.id === activeTerminal.locationId)) {
          return { ...l, lastSyncTime: nowStr };
        }
        return l;
      }));

    } catch (err) {
      console.warn("Sync handshake failed, offline caching active:", err);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleToggleAutoSync = (id: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, syncMode: l.syncMode === "auto" ? "manual" : "auto" } : l));
  };

  // Permanently delete sample data
  const handleDeleteSampleData = (type: "locations" | "salesmen" | "sales" | "targets" | "customer_counts" | "departments" | "all") => {
    if (type === "all" || type === "locations") {
      localStorage.setItem("laksela_sample_deleted_locations", "true");
      setLocations([]);
    }
    if (type === "all" || type === "salesmen") {
      localStorage.setItem("laksela_sample_deleted_salesmen", "true");
      setSalesmen([]);
    }
    if (type === "all" || type === "sales") {
      localStorage.setItem("laksela_sample_deleted_sales_records", "true");
      setSalesRecords([]);
    }
    if (type === "all" || type === "targets") {
      localStorage.setItem("laksela_sample_deleted_targets", "true");
      setOverallMonthlyTarget(0);
    }
    if (type === "all" || type === "customer_counts") {
      localStorage.setItem("laksela_sample_deleted_customer_counts", "true");
      setCustomerCounts([]);
    }
    if (type === "all" || type === "departments") {
      localStorage.setItem("laksela_sample_deleted_departments", "true");
      setDepartments([]);
    }

    // Hit server API so the backup persistence also reflects the wipe
    fetch("/api/sync/reset-demo-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    }).catch(err => console.error("Error purging central gateway demo data:", err));
  };

  // Full system reset
  const handleResetApp = () => {
    setSalesmen(INITIAL_SALESMEN);
    setDepartments(INITIAL_DEPARTMENTS);
    setSalesRecords(INITIAL_SALES_RECORDS);
    setLocations(INITIAL_LOCATIONS);
    setPcs(INITIAL_PCS);
    setCustomerCounts(INITIAL_CUSTOMER_COUNTS);
    setOverallMonthlyTarget(1300000);
    setCurrentTab("dashboard");
    setSelectedLocationId("all");
    setAccessMode("admin");
    localStorage.clear();
  };

  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "daily-sales", label: "Daily Sales & Traffic", icon: <PlusCircle size={18} /> },
    { id: "excel-import", label: "Import Excel", icon: <FileSpreadsheet size={18} /> },
    { id: "salesmen", label: "Salesmen", icon: <Users size={18} /> },
    { id: "departments", label: "Departments", icon: <Layers size={18} /> },
    { id: "sales-targets", label: "Sales Targets", icon: <Target size={18} /> },
    { id: "locations", label: "Showrooms", icon: <MapPin size={18} /> },
    { id: "admin-panel", label: "Terminals Admin", icon: <Shield size={18} /> },
    { id: "sync-panel", label: "Data Sync", icon: <RefreshCw size={18} /> },
    { id: "reports", label: "Reports", icon: <FilePieChart size={18} /> },
    { id: "ai-assistant", label: "AI Assistant", icon: <Sparkles size={18} /> },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans" id="app-container">
      
      {/* 1. LEFT NAVIGATION DRAWER (Hidden on Print) */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between shrink-0 h-screen sticky top-0 print:hidden transition-colors">
        <div className="overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              L
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white leading-tight">
                Laksela Smart
              </h1>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase">
                Sales Log
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10 font-extrabold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Brand/System version footer on Sidebar */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <p className="font-semibold">Laksela Desktop</p>
            <p className="mt-0.5">Version 4.1.0 (Stable)</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[8px] font-black ${accessMode === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}`}>
            {accessMode === "admin" ? "ADMIN" : "NODE"}
          </span>
        </div>
      </aside>

      {/* 2. RIGHT PANEL CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header bar (Hidden on print) */}
        <header className="h-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors">
          <div className="flex items-center gap-3">
            {/* Showroom filtering dropdown (Disabled in terminal mode) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
              <MapPin size={14} className="text-blue-500 shrink-0" />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                disabled={accessMode === "terminal"}
                className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none disabled:opacity-80 cursor-pointer"
              >
                <option value="all">All Showrooms (මුළු පද්ධතියම)</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-300 items-center gap-1.5">
              <TrendingUp size={12} className="text-blue-500" />
              Sales MTD: <span className="text-slate-800 dark:text-white font-black">{formatLKR(computedTotals.todaySales)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Date & Auto-Save Notification */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                System Date: <strong className="text-slate-600 dark:text-slate-300">{formatFriendlyDate(systemDate)}</strong>
              </span>
              {showAutoSaveIndicator && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all duration-300 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Auto-saved
                </span>
              )}
            </div>

            {/* Quick Dark Mode Icon button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
              title={darkMode ? "Switch to Light theme" : "Switch to Dark theme"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Primary tab views content pane */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {currentTab === "dashboard" && (
                <Dashboard 
                  totals={computedTotals} 
                  salesmen={computedSalesmen} 
                  departments={departments}
                  salesRecords={salesRecords}
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  customerCounts={customerCounts}
                  systemDate={systemDate}
                  syncStats={syncStats}
                  onSyncAll={() => handleTriggerSync("internet")}
                  onSyncSelectedPC={() => handleTriggerSync("internet")}
                  onRefreshStatus={fetchSyncStatus}
                  onViewSyncHistory={() => setCurrentTab("sync-panel")}
                />
              )}
              {currentTab === "daily-sales" && (
                <SalesEntry 
                  salesmen={computedSalesmen} 
                  departments={departments} 
                  salesRecords={salesRecords}
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  customerCounts={customerCounts}
                  onAddRecord={handleAddRecord}
                  onEditRecord={handleEditRecord}
                  onDeleteRecord={handleDeleteRecord}
                  onAddOrUpdateCustomerCount={handleAddOrUpdateCustomerCount}
                  onDeleteCustomerCount={handleDeleteCustomerCount}
                  systemDate={systemDate}
                  accessMode={accessMode}
                  selectedTerminalId={selectedTerminalId}
                  pcs={pcs}
                />
              )}
              {currentTab === "excel-import" && (
                <ExcelImport 
                  salesmen={computedSalesmen} 
                  departments={departments} 
                  salesRecords={salesRecords}
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  customerCounts={customerCounts}
                  importHistory={importHistory}
                  onAddRecordsBatch={handleAddRecordsBatch}
                  onImportSalesSummaryBatch={handleImportSalesSummaryBatch}
                  onAddOrUpdateCustomerCountsBatch={handleAddOrUpdateCustomerCountsBatch}
                  onUpdateSalesRecordInline={handleUpdateSalesRecordInline}
                  onSaveImportHistory={handleSaveImportHistory}
                  onDeleteImportHistory={handleDeleteImportHistory}
                  systemDate={systemDate}
                />
              )}
              {currentTab === "stock-transfers" && (
                <StockControl 
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  stockItems={stockItems}
                  stockTransfers={stockTransfers}
                  onAddStockItem={handleAddStockItem}
                  onEditStockItem={handleEditStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                  onAddStockTransfer={handleAddStockTransfer}
                  onDeleteStockTransfer={handleDeleteStockTransfer}
                  accessMode={accessMode}
                  selectedTerminalId={selectedTerminalId}
                />
              )}
              {currentTab === "salesmen" && (
                <SalesmenList 
                  salesmen={computedSalesmen} 
                  salesRecords={salesRecords}
                  onAddSalesman={handleAddSalesman}
                  onEditSalesman={handleEditSalesman}
                  onDeleteSalesman={handleDeleteSalesman}
                />
              )}
              {currentTab === "departments" && (
                <DepartmentsList 
                  departments={departments} 
                  totals={computedTotals}
                  onAddDepartment={handleAddDepartment}
                  onEditDepartment={handleEditDepartment}
                  onDeleteDepartment={handleDeleteDepartment}
                />
              )}
              {currentTab === "sales-targets" && (
                <TargetsList 
                  salesmen={computedSalesmen} 
                  totals={computedTotals}
                  onUpdateOverallTarget={handleUpdateOverallTarget}
                  onUpdateSalesmanTarget={handleUpdateSalesmanTarget}
                />
              )}
              {currentTab === "locations" && (
                <LocationsList 
                  locations={locations}
                  onAddLocation={handleAddLocation}
                  onEditLocation={handleEditLocation}
                  onDeleteLocation={handleDeleteLocation}
                />
              )}
              {currentTab === "admin-panel" && (
                <AdminPanel 
                  pcs={pcs}
                  locations={locations}
                  onAddPC={handleAddPC}
                  onEditPC={handleEditPC}
                  onDeletePC={handleDeletePC}
                  accessMode={accessMode}
                  onChangeAccessMode={setAccessMode}
                  selectedTerminalId={selectedTerminalId}
                  onSelectTerminal={setSelectedTerminalId}
                />
              )}
              {currentTab === "sync-panel" && (
                <SyncPanel 
                  locations={locations}
                  pcs={pcs}
                  onTriggerSync={handleTriggerSync}
                  syncInProgress={syncInProgress}
                  onToggleAutoSync={handleToggleAutoSync}
                  syncStats={syncStats}
                  autoSyncEnabled={autoSyncEnabled}
                  autoSyncTime={autoSyncTime}
                  onToggleGlobalAutoSync={handleToggleGlobalAutoSync}
                  onSetGlobalAutoSyncTime={handleSetGlobalAutoSyncTime}
                  onRefreshStatus={fetchSyncStatus}
                  accessMode={accessMode}
                  selectedTerminalId={selectedTerminalId}
                />
              )}
              {currentTab === "reports" && (
                <ReportsSection 
                  salesmen={computedSalesmen} 
                  departments={departments} 
                  salesRecords={salesRecords}
                  totals={computedTotals}
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  customerCounts={customerCounts}
                  systemDate={systemDate}
                />
              )}
              {currentTab === "ai-assistant" && (
                <AIAssistant 
                  salesmen={computedSalesmen} 
                  departments={departments} 
                  salesRecords={salesRecords}
                  totals={computedTotals}
                />
              )}
              {currentTab === "whatsapp" && (
                <WhatsAppShare 
                  salesmen={computedSalesmen} 
                  departments={departments} 
                  salesRecords={salesRecords}
                  totals={computedTotals}
                />
              )}
              {currentTab === "settings" && (
                <Settings 
                  darkMode={darkMode} 
                  onToggleDarkMode={() => setDarkMode(!darkMode)} 
                  onResetApp={handleResetApp}
                  accessMode={accessMode}
                  onDeleteSampleData={handleDeleteSampleData}
                  dbStatus={onlineTimeStatus}
                  totalRecordCount={salesRecords.length + customerCounts.length + stockTransfers.length}
                  currentMonthName={new Date(systemDate + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  lastAutoSaveTime={lastAutoSaveTime}
                  lastAutoSaveStatus={lastAutoSaveStatus}
                  onClearSampleData={handleClearSampleData}
                  onClearAllDatabaseData={handleClearAllDatabaseData}
                  onRefreshDatabase={handleRefreshDatabase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
