import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Calendar, 
  User, 
  Coins, 
  Trash2, 
  History, 
  FileText,
  X,
  Plus,
  Filter,
  Check,
  AlertTriangle
} from "lucide-react";
import { Salesman, Department, SalesRecord, Location, CustomerCountRecord } from "../types";

// Interface for excel import history logged permanently
export interface ExcelImportHistoryEntry {
  id: string;
  fileName: string;
  importDateTime: string; // YYYY-MM-DD HH:MM:SS
  locationId: string;
  locationName: string;
  recordsCount: number;
  updatedCount: number;
  skippedCount: number;
  errorsCount: number;
}

interface ExcelImportProps {
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  locations: Location[];
  selectedLocationId: string;
  customerCounts: CustomerCountRecord[];
  importHistory: ExcelImportHistoryEntry[];
  onAddRecordsBatch: (records: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">[]) => void;
  onImportSalesSummaryBatch: (
    records: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">[],
    overwrite: boolean,
    targetDatesAndSalesmen: { date: string; salesmanId: string }[]
  ) => void;
  onAddOrUpdateCustomerCountsBatch: (counts: { locationId: string; date: string; count: number }[]) => void;
  onUpdateSalesRecordInline: (id: string, updated: Partial<SalesRecord>) => void;
  onSaveImportHistory: (entry: ExcelImportHistoryEntry) => void;
  onDeleteImportHistory: () => void;
  systemDate: string;
}

interface ProcessedExcelRow {
  index: number; // 1-indexed row number in the excel sheet (excluding headers)
  dateStr: string;
  salesmanName: string;
  salesmanId: string;
  electronicSaleValue: number;
  nonElectronicSaleValue: number;
  totalSaleValue: number;
  customerCount: number;
  
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_HEADERS = [
  "Sales_Date",
  "Salesman_Name",
  "Electronic_Sale_Value",
  "Non_Electronic_Sale_Value",
  "Total_Sale_Value",
  "Customer_Count"
];

export default function ExcelImport({
  salesmen,
  departments,
  salesRecords,
  locations,
  selectedLocationId,
  customerCounts,
  importHistory,
  onAddRecordsBatch,
  onImportSalesSummaryBatch,
  onAddOrUpdateCustomerCountsBatch,
  onUpdateSalesRecordInline,
  onSaveImportHistory,
  onDeleteImportHistory,
  systemDate
}: ExcelImportProps) {

  // Setup form states
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return selectedLocationId !== "all" ? selectedLocationId : (locations[0]?.id || "");
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ProcessedExcelRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Duplicate Conflict Resolution Mode: "skip" or "overwrite"
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "overwrite">("overwrite");

  // Summary modal states
  const [importSummary, setImportSummary] = useState<{
    fileName: string;
    totalRows: number;
    imported: number;
    updated: number;
    skipped: number;
    invalid: number;
    electronicSales: number;
    nonElectronicSales: number;
    totalSales: number;
    customerCount: number;
  } | null>(null);

  // Export filters state
  const [filterSalesman, setFilterSalesman] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Format LKR
  const formatLKR = (num: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // 1. Download Blank Excel Template
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS]);
      
      // Add a single row of mock/sample data so users see standard format
      XLSX.utils.sheet_add_aoa(ws, [[
        "2026-06-06",
        "John",
        150000,
        50000,
        200000,
        25
      ]], { origin: "A2" });

      XLSX.utils.book_append_sheet(wb, ws, "Sales Summary Template");
      XLSX.writeFile(wb, "Sales_Summary_Template.xlsx");
    } catch (err) {
      console.error(err);
      alert("Error generating Sales_Summary_Template.xlsx. Please verify your system permissions.");
    }
  };

  // Helper: Clean and format Excel Date
  const parseExcelDate = (val: any): string => {
    if (val === undefined || val === null || val === "") return "";
    
    if (val instanceof Date) {
      return val.toISOString().split("T")[0];
    }

    // Handle Excel Serial Numbers
    if (typeof val === "number" || (!isNaN(Number(val)) && String(val).trim() !== "")) {
      const num = Number(val);
      if (num > 20000 && num < 60000) {
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }
    }

    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // DD/MM/YYYY or D/M/YYYY
    const slashParts = str.split("/");
    if (slashParts.length === 3) {
      let d = slashParts[0].padStart(2, "0");
      let m = slashParts[1].padStart(2, "0");
      let y = slashParts[2];
      if (y.length === 2) y = "20" + y;
      if (y.length === 4) return `${y}-${m}-${d}`;
    }

    // DD-MM-YYYY or D-M-YYYY
    const dashParts = str.split("-");
    if (dashParts.length === 3) {
      if (dashParts[0].length === 4) {
        return `${dashParts[0]}-${dashParts[1].padStart(2, "0")}-${dashParts[2].padStart(2, "0")}`;
      }
      let d = dashParts[0].padStart(2, "0");
      let m = dashParts[1].padStart(2, "0");
      let y = dashParts[2];
      if (y.length === 2) y = "20" + y;
      if (y.length === 4) return `${y}-${m}-${d}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    return str;
  };

  // 2. Open File Browser and Parse
  const handleImportButtonClick = () => {
    setValidationError(null);
    setMissingHeaders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  // Helper: Find Salesman ID by Name
  const findSalesmanIdByName = (name: string): string => {
    const normalized = name.toLowerCase().trim();
    const match = salesmen.find(s => s.name.toLowerCase().trim() === normalized || s.name.toLowerCase().includes(normalized));
    return match ? match.id : "";
  };

  const processExcelFile = (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setValidationError(null);
    setMissingHeaders([]);
    setShowPreview(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error("Could not load binary data from file.");

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Retrieve raw JSON representing cell rows
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (rows.length === 0) {
          setValidationError("The selected Excel file appears to be empty.");
          setLoading(false);
          return;
        }

        // Get headers row
        const headers: string[] = (rows[0] as any[] || []).map(h => String(h || "").trim());
        
        // Check for missing required headers
        const missing = REQUIRED_HEADERS.filter(req => !headers.includes(req));
        if (missing.length > 0) {
          setMissingHeaders(missing);
          setValidationError(`Required headers are missing or incorrectly named. Incomplete format detected.`);
          setLoading(false);
          return;
        }

        const dataRows = rows.slice(1);
        const parsedRows: ProcessedExcelRow[] = [];

        dataRows.forEach((rowArray: any[], index) => {
          const excelRowIndex = index + 2; // Row number in Excel sheet (excluding header row)
          
          // Check if completely empty row
          const isRowEmpty = rowArray.every(cell => cell === undefined || cell === null || String(cell).trim() === "");
          if (isRowEmpty) return; // skip completely empty rows

          const rowData: Record<string, any> = {};
          headers.forEach((h, colIndex) => {
            rowData[h] = rowArray[colIndex];
          });

          const errors: string[] = [];
          const warnings: string[] = [];

          const rawDate = rowData["Sales_Date"];
          const salesmanName = String(rowData["Salesman_Name"] || "").trim();
          const rawElectronic = rowData["Electronic_Sale_Value"];
          const rawNonElectronic = rowData["Non_Electronic_Sale_Value"];
          const rawTotalValue = rowData["Total_Sale_Value"];
          const rawCustomerCount = rowData["Customer_Count"];

          // 1. Validation - Required fields
          if (!rawDate) errors.push("Sales_Date is missing.");
          if (!salesmanName) errors.push("Salesman_Name is missing.");

          // 2. Validation - Date Field
          const parsedDate = parseExcelDate(rawDate);
          if (!parsedDate || !/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
            errors.push(`Invalid Date representation: '${rawDate || "[Blank]"}'`);
          }

          // 3. Match salesman with records
          let salesmanId = findSalesmanIdByName(salesmanName);
          if (salesmanName && !salesmanId) {
            warnings.push(`Salesman '${salesmanName}' does not match existing records. Will fall back to custom entries.`);
            salesmanId = "sm-unknown";
          }

          // 4. Validation - Numeric fields
          const electronicValue = parseFloat(String(rawElectronic || "")) || 0;
          const nonElectronicValue = parseFloat(String(rawNonElectronic || "")) || 0;
          const totalValue = parseFloat(String(rawTotalValue || "")) || 0;
          const customerCount = Math.round(parseFloat(String(rawCustomerCount || "")) || 0);

          if (isNaN(electronicValue)) errors.push("Electronic_Sale_Value must be numeric.");
          if (isNaN(nonElectronicValue)) errors.push("Non_Electronic_Sale_Value must be numeric.");
          if (isNaN(totalValue)) errors.push("Total_Sale_Value must be numeric.");
          if (isNaN(customerCount) || customerCount < 0) errors.push("Customer_Count must be a positive integer.");

          // 5. Audit equation accuracy
          const computedTotal = electronicValue + nonElectronicValue;
          if (Math.abs(totalValue - computedTotal) > 0.01) {
            errors.push(`Total Sale Value calculation mismatch: Supplied Total (${totalValue}) !== Electronic (${electronicValue}) + Non-Electronic (${nonElectronicValue})`);
          }

          // 6. Check duplicates in the database: Same Date + Salesman Name
          const isDuplicate = salesRecords.some(r => 
            r.date === parsedDate && 
            r.salesmanName.toLowerCase().trim() === salesmanName.toLowerCase().trim()
          ) || parsedRows.some(r => r.dateStr === parsedDate && r.salesmanName.toLowerCase().trim() === salesmanName.toLowerCase().trim());

          if (isDuplicate) {
            warnings.push(`Duplicate row detected for ${parsedDate} and ${salesmanName}.`);
          }

          const isValid = errors.length === 0;

          parsedRows.push({
            index: excelRowIndex,
            dateStr: parsedDate,
            salesmanName,
            salesmanId: salesmanId || "sm-unknown",
            electronicSaleValue: electronicValue,
            nonElectronicSaleValue: nonElectronicValue,
            totalSaleValue: totalValue,
            customerCount,
            isValid,
            isDuplicate,
            errors,
            warnings
          });
        });

        setPreviewRows(parsedRows);
        setShowPreview(true);
      } catch (err) {
        console.error(err);
        setValidationError("Could not parse file. The file is corrupted or not in Excel format.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setValidationError("Failed to read files from your system.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // 3. Cancel Import Button
  const handleCancelImport = () => {
    setFile(null);
    setPreviewRows([]);
    setShowPreview(false);
    setValidationError(null);
    setMissingHeaders([]);
  };

  // 4. Confirm Import Button
  const handleConfirmImport = () => {
    // Only import valid rows
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid records are present to import.");
      return;
    }

    setLoading(true);

    try {
      // Divide imported data rows according to user's Conflict Mode setting
      const rowsToProcess = validRows.filter(r => !r.isDuplicate || duplicateMode === "overwrite");
      const skippedCount = validRows.filter(r => r.isDuplicate && duplicateMode === "skip").length;
      const updatedCount = validRows.filter(r => r.isDuplicate && duplicateMode === "overwrite").length;
      const newlyImportedCount = rowsToProcess.length - updatedCount;

      const recordsToInsert: Omit<SalesRecord, "id" | "salesmanName" | "departmentName" | "locationName">[] = [];
      const customerCountsToInsert: { locationId: string; date: string; count: number }[] = [];

      rowsToProcess.forEach(row => {
        // Find or map salesmanId
        let sId = row.salesmanId;
        if (sId === "sm-unknown" || !sId) {
          // Attempt to find dynamic match
          const dynamicMatch = salesmen.find(s => s.name.toLowerCase().trim() === row.salesmanName.toLowerCase().trim());
          sId = dynamicMatch ? dynamicMatch.id : (salesmen[0]?.id || "sm-1");
        }

        // 1. Electronic record if amount !== 0
        if (row.electronicSaleValue !== 0) {
          recordsToInsert.push({
            locationId: selectedLocation,
            salesmanId: sId,
            departmentId: "dep-1", // Electronic
            amount: row.electronicSaleValue,
            date: row.dateStr,
            notes: `Excel Summary Import: Electronic Sales for ${row.salesmanName}`,
            createdTimestamp: new Date().toISOString(),
            syncStatus: "pending"
          });
        }

        // 2. Non-Electronic record if amount !== 0
        if (row.nonElectronicSaleValue !== 0) {
          recordsToInsert.push({
            locationId: selectedLocation,
            salesmanId: sId,
            departmentId: "dep-2", // Non-Electronic
            amount: row.nonElectronicSaleValue,
            date: row.dateStr,
            notes: `Excel Summary Import: Non-Electronic Sales for ${row.salesmanName}`,
            createdTimestamp: new Date().toISOString(),
            syncStatus: "pending"
          });
        }

        // 3. Customer Traffic count tracking
        if (row.customerCount > 0) {
          customerCountsToInsert.push({
            locationId: selectedLocation,
            date: row.dateStr,
            count: row.customerCount
          });
        }
      });

      // Prepare dates & salesman list for targeted database replacement
      const targetsList = rowsToProcess.map(r => {
        let sId = r.salesmanId;
        if (sId === "sm-unknown" || !sId) {
          const match = salesmen.find(s => s.name.toLowerCase().trim() === r.salesmanName.toLowerCase().trim());
          sId = match ? match.id : (salesmen[0]?.id || "sm-1");
        }
        return { date: r.dateStr, salesmanId: sId };
      });

      // Commit transaction
      onImportSalesSummaryBatch(recordsToInsert, duplicateMode === "overwrite", targetsList);

      if (customerCountsToInsert.length > 0) {
        onAddOrUpdateCustomerCountsBatch(customerCountsToInsert);
      }

      // Log import history with target showroom information
      const timestamp = new Date();
      const formattedDateTime = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, "0")}-${String(timestamp.getDate()).padStart(2, "0")} ${String(timestamp.getHours()).padStart(2, "0")}:${String(timestamp.getMinutes()).padStart(2, "0")}:${String(timestamp.getSeconds()).padStart(2, "0")}`;
      const targetLocObj = locations.find(l => l.id === selectedLocation);
      const targetLocName = targetLocObj?.name || "Colombo Showroom";

      const historyLog: ExcelImportHistoryEntry = {
        id: "summary-log-" + Math.random().toString(36).substring(2, 9),
        fileName: file?.name || "Summary_File.xlsx",
        importDateTime: formattedDateTime,
        locationId: selectedLocation,
        locationName: targetLocName,
        recordsCount: newlyImportedCount,
        updatedCount: updatedCount,
        skippedCount: skippedCount,
        errorsCount: previewRows.filter(r => !r.isValid).length
      };
      onSaveImportHistory(historyLog);

      // Open completed summary popup
      setImportSummary({
        fileName: file?.name || "Summary_File.xlsx",
        totalRows: previewRows.length,
        imported: newlyImportedCount,
        updated: updatedCount,
        skipped: skippedCount,
        invalid: previewRows.filter(r => !r.isValid).length,
        electronicSales: rowsToProcess.reduce((sum, r) => sum + r.electronicSaleValue, 0),
        nonElectronicSales: rowsToProcess.reduce((sum, r) => sum + r.nonElectronicSaleValue, 0),
        totalSales: rowsToProcess.reduce((sum, r) => sum + r.totalSaleValue, 0),
        customerCount: rowsToProcess.reduce((sum, r) => sum + r.customerCount, 0)
      });

      // Clear preview states
      setFile(null);
      setPreviewRows([]);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      alert("❌ A database error occurred. The import has been rolled back successfully to prevent corrupted datasets.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Export Database Sales Summaries based on active filters
  const handleExportSummaryToExcel = () => {
    // Generate the sales summary from the current database records
    // Group records by Date and Salesman Name
    const summaryMap: Record<string, {
      date: string;
      salesmanName: string;
      electronicSales: number;
      nonElectronicSales: number;
    }> = {};

    salesRecords.forEach(rec => {
      // Filter out records from other locations if filtering
      if (selectedLocation !== "all" && rec.locationId !== selectedLocation) {
        return;
      }

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

    // Match customer counts to date
    const finalRows = Object.values(summaryMap).map(row => {
      // Find matching customer counts
      const matchedCC = customerCounts
        .filter(cc => cc.date === row.date && (selectedLocation === "all" || cc.locationId === selectedLocation))
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

    if (finalRows.length === 0) {
      alert("No sales data available to export.");
      return;
    }

    // Apply active export filters
    let filteredRows = finalRows;

    if (filterSalesman) {
      const query = filterSalesman.toLowerCase().trim();
      filteredRows = filteredRows.filter(r => r["Salesman_Name"].toLowerCase().includes(query));
    }

    if (filterStartDate) {
      filteredRows = filteredRows.filter(r => r["Sales_Date"] >= filterStartDate);
    }

    if (filterEndDate) {
      filteredRows = filteredRows.filter(r => r["Sales_Date"] <= filterEndDate);
    }

    if (filterMonth) {
      // filterMonth is in format YYYY-MM
      filteredRows = filteredRows.filter(r => r["Sales_Date"].startsWith(filterMonth));
    }

    if (filteredRows.length === 0) {
      alert("No records match the active filters selected.");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(filteredRows, {
        header: REQUIRED_HEADERS
      });

      XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");
      XLSX.writeFile(wb, "Laksela_Sales_Summary_Export.xlsx");

      alert(`📊 Successfully exported ${filteredRows.length} summary records to Excel!`);
    } catch (err) {
      console.error(err);
      alert("Export failed. An unexpected file system error occurred.");
    }
  };

  // Preview counts tallies
  const totalRowsCount = previewRows.length;
  const validRowsCount = previewRows.filter(r => r.isValid).length;
  const invalidRowsCount = previewRows.filter(r => !r.isValid).length;
  const duplicateRowsCount = previewRows.filter(r => r.isValid && r.isDuplicate).length;

  const previewTotalElectronic = previewRows.filter(r => r.isValid).reduce((sum, r) => sum + r.electronicSaleValue, 0);
  const previewTotalNonElectronic = previewRows.filter(r => r.isValid).reduce((sum, r) => sum + r.nonElectronicSaleValue, 0);
  const previewTotalSales = previewRows.filter(r => r.isValid).reduce((sum, r) => sum + r.totalSaleValue, 0);
  const previewTotalCustomers = previewRows.filter(r => r.isValid).reduce((sum, r) => sum + r.customerCount, 0);

  // Generate unique list of salesmen from database for export filters list
  const uniqueSalesmenNames = useMemo(() => {
    const list = new Set<string>();
    salesRecords.forEach(r => {
      if (r.salesmanName) list.add(r.salesmanName.trim());
    });
    return Array.from(list);
  }, [salesRecords]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
            Excel Integration Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            එක්සෙල් ගොනු කළමනාකරණය (Sales Summary Integration)
          </h2>
          <p className="text-white/80 text-sm mt-1 max-w-2xl">
            Download standard formats, import salesman sales summaries, map electronic or non-electronic splits, and synchronize customer showroom metrics automatically.
          </p>
          
          <div className="flex flex-wrap gap-2.5 mt-6">
            <button
              onClick={handleImportButtonClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Upload size={14} />
              📤 Upload (Import) Excel
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/10 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              <FileText size={14} />
              📥 Download Template
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 w-1/3 flex items-center justify-center">
          <FileSpreadsheet size={200} />
        </div>
      </div>

      {/* Invisible file input trigger */}
      <input 
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 2. Validation Errors Alert */}
      {validationError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400">
              {validationError}
            </h4>
            {missingHeaders.length > 0 && (
              <div className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                <span className="font-extrabold block mb-1">Missing required Excel column headers:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {missingHeaders.map(h => (
                    <span key={h} className="px-2 py-0.5 bg-rose-200/50 dark:bg-rose-900/60 font-black rounded text-[10px]">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-10 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-center space-y-4">
          <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Processing transactional calculations...</p>
        </div>
      )}

      {/* 3. Summary Modal Popup (Completed Actions) */}
      {importSummary && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-500 h-6 w-6" />
            <h3 className="text-base font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Import Completed Successfully
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The transactions from <strong>{importSummary.fileName}</strong> were validated and successfully saved.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Excel Rows</span>
              <span className="text-base font-black text-slate-800 dark:text-white">{importSummary.totalRows}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-emerald-500 font-bold block uppercase">Imported</span>
              <span className="text-base font-black text-emerald-600">{importSummary.imported}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-amber-500 font-bold block uppercase">Updated</span>
              <span className="text-base font-black text-amber-600">{importSummary.updated}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Skipped / Duplicates</span>
              <span className="text-base font-black text-slate-600">{importSummary.skipped}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-rose-500 font-bold block uppercase">Invalid Rows</span>
              <span className="text-base font-black text-rose-600">{importSummary.invalid}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-blue-500 font-bold block uppercase">Electronic Sales</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{formatLKR(importSummary.electronicSales)}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-indigo-500 font-bold block uppercase">Non-Electronic Sales</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{formatLKR(importSummary.nonElectronicSales)}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-emerald-500 font-bold block uppercase">Total Sales Value</span>
              <span className="text-xs font-black text-emerald-600">{formatLKR(importSummary.totalSales)}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-amber-500 font-bold block uppercase">Total Customer Count</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{importSummary.customerCount}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setImportSummary(null)}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Import Preview Screen */}
      {showPreview && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="text-blue-500" />
                excel import preview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Showroom Location: <strong>{locations.find(l => l.id === selectedLocation)?.name}</strong>
              </p>
            </div>

            {/* Target Location Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Showroom:</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conflict Resolution Selector */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-100/50 dark:border-blue-900/20">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Duplicate Protection Conflict Strategy
              </span>
              <p className="text-[10px] text-blue-700 dark:text-blue-400">
                Choose what action to execute if a record matching the same <strong>Sales_Date + Salesman_Name</strong> already exists in the database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDuplicateMode("overwrite")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  duplicateMode === "overwrite" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60"
                }`}
              >
                🔄 Overwrite & Update
              </button>
              <button
                type="button"
                onClick={() => setDuplicateMode("skip")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  duplicateMode === "skip" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60"
                }`}
              >
                🚫 Skip Duplicates
              </button>
            </div>
          </div>

          {/* Statistics tally cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Excel Rows</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">{totalRowsCount}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl text-center">
              <span className="text-[10px] text-emerald-500 font-bold block uppercase">Valid Rows</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{validRowsCount}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl text-center">
              <span className="text-[10px] text-amber-500 font-bold block uppercase">Duplicate Rows</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">{duplicateRowsCount}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl text-center">
              <span className="text-[10px] text-rose-500 font-bold block uppercase">Invalid Rows</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{invalidRowsCount}</span>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl text-center col-span-2 md:col-span-1">
              <span className="text-[10px] text-indigo-500 font-bold block uppercase">Total Customer Count</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{previewTotalCustomers}</span>
            </div>
          </div>

          {/* Aggregated Totals Preview bar */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase">Total Electronic Sales</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block">{formatLKR(previewTotalElectronic)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase">Total Non-Electronic Sales</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block">{formatLKR(previewTotalNonElectronic)}</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-500 font-black uppercase">Aggregate Sales Value</span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 block">{formatLKR(previewTotalSales)}</span>
            </div>
          </div>

          {/* Table Preview screen */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 text-center">Row</th>
                  <th className="py-2.5 px-3">Sales Date</th>
                  <th className="py-2.5 px-3">Salesman</th>
                  <th className="py-2.5 px-3 text-right">Electronic Sales</th>
                  <th className="py-2.5 px-3 text-right">Non-Electronic Sales</th>
                  <th className="py-2.5 px-3 text-right">Total Sales</th>
                  <th className="py-2.5 px-3 text-center">Customer Count</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {previewRows.map((row) => (
                  <tr 
                    key={row.index} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      !row.isValid 
                        ? "bg-rose-50/30 dark:bg-rose-950/10 text-rose-900 dark:text-rose-200" 
                        : row.isDuplicate 
                          ? "bg-amber-50/20 dark:bg-amber-950/5 text-amber-900 dark:text-amber-200" 
                          : ""
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{row.index}</td>
                    <td className="py-2 px-3 whitespace-nowrap font-semibold">{row.dateStr || <span className="text-rose-500 font-bold">INVALID</span>}</td>
                    <td className="py-2 px-3 font-medium whitespace-nowrap">{row.salesmanName || <span className="text-rose-500 font-bold">MISSING</span>}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-600">{formatLKR(row.electronicSaleValue)}</td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-600">{formatLKR(row.nonElectronicSaleValue)}</td>
                    <td className="py-2 px-3 text-right font-black text-slate-800 dark:text-white">{formatLKR(row.totalSaleValue)}</td>
                    <td className="py-2 px-3 text-center font-bold">{row.customerCount}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {row.errors.length > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] block text-center" title={row.errors.join(", ")}>
                          Invalid Field
                        </span>
                      ) : row.isDuplicate ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] block text-center ${
                          duplicateMode === "overwrite" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {duplicateMode === "overwrite" ? "Will Overwrite" : "Will Skip"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] block text-center">
                          Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleCancelImport}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={validRowsCount === 0 || (duplicateMode === "skip" && validRowsCount - duplicateRowsCount === 0)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Confirm Import
            </button>
          </div>
        </div>
      )}

      {/* 5. Export Database Sales Summaries Panel with Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500" />
            පෙර විකුණුම් සාරාංශ අපනයනය (Export Sales Summary)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrieve records directly from the database and export them using the exact 6-column structures with real-time filters.
          </p>
        </div>

        {/* Filter Toolbar inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold block uppercase">Filter by Salesman</label>
            <select
              value={filterSalesman}
              onChange={(e) => setFilterSalesman(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="">All Salesmen</option>
              {uniqueSalesmenNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold block uppercase">Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold block uppercase">End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold block uppercase">Month (YYYY-MM)</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-[10px] text-slate-400 font-medium">
            * Leaves all filter parameters blank to export all available records automatically.
          </div>
          <button
            onClick={handleExportSummaryToExcel}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            📊 Export to Excel
          </button>
        </div>
      </div>

      {/* 6. Historical Excel Upload Logs */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            පෙර ආනයනයන් පිළිබඳ විස්තර (Persistent Import History)
          </h3>
          {importHistory.length > 0 && (
            <button
              onClick={onDeleteImportHistory}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> Clear History
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 px-4">Import Timestamp</th>
                <th className="py-2.5 px-4">Showroom Target Location</th>
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4 text-center">New Rows</th>
                <th className="py-2.5 px-4 text-center">Updated Rows</th>
                <th className="py-2.5 px-4 text-center">Skipped / Duplicates</th>
                <th className="py-2.5 px-4 text-center">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
              {importHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                    No historical import logs registered yet on this PC system.
                  </td>
                </tr>
              ) : (
                importHistory.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white">{log.importDateTime}</td>
                    <td className="py-2.5 px-4 font-medium">{log.locationName}</td>
                    <td className="py-2.5 px-4 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                      <FileSpreadsheet size={12} /> {log.fileName}
                    </td>
                    <td className="py-2.5 px-4 text-center font-black text-emerald-600">{log.recordsCount} rows</td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-600">{log.updatedCount}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-amber-600">{log.skippedCount}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-rose-500">{log.errorsCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
