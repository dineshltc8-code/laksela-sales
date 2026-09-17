import { Salesman, Department, SalesRecord, Location, PCInstallation, CustomerCountRecord } from "./types";

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: "dep-1", name: "Electronic", type: "electronic", description: "Appliances, Smartphones, Laptops, Accessories" },
  { id: "dep-2", name: "Non-Electronic", type: "non-electronic", description: "Furniture, Apparel, Groceries, Houseware" }
];

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: "loc-1",
    name: "Colombo Main Showroom",
    code: "LAK-CMB-01",
    address: "No. 45, Galle Road, Colombo 03",
    phone: "+94 11 234 5678",
    isActive: true,
    lastSyncTime: "2026-09-15 06:15 AM",
    syncMode: "auto",
    syncMethod: "internet",
    monthlyTarget: 800000
  },
  {
    id: "loc-2",
    name: "Kandy Hill Capital Branch",
    code: "LAK-KDY-02",
    address: "No. 89, Dalada Veediya, Kandy",
    phone: "+94 81 223 4567",
    isActive: true,
    lastSyncTime: "2026-09-15 06:05 AM",
    syncMode: "auto",
    syncMethod: "wifi",
    monthlyTarget: 500000
  },
  {
    id: "loc-3",
    name: "Galle Coastal Showroom",
    code: "LAK-GLE-03",
    address: "No. 12, Fort Street, Galle",
    phone: "+94 91 224 5678",
    isActive: true,
    lastSyncTime: "2026-09-14 09:30 PM",
    syncMode: "manual",
    syncMethod: "internet",
    monthlyTarget: 400000
  }
];

export const INITIAL_PCS: PCInstallation[] = [
  {
    id: "pc-1",
    pcName: "Colombo Main Cashier PC",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    ipAddress: "192.168.1.50",
    macAddress: "00:1A:2B:3C:4D:5E",
    status: "online",
    lastActive: "Just now",
    syncStatus: "synced"
  },
  {
    id: "pc-2",
    pcName: "Kandy Tablet Admin Node",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    ipAddress: "192.168.8.12",
    macAddress: "3C:D9:2B:1F:4A:88",
    status: "online",
    lastActive: "5 mins ago",
    syncStatus: "synced"
  },
  {
    id: "pc-3",
    pcName: "Galle Office Desktop",
    locationId: "loc-3",
    locationName: "Galle Coastal Showroom",
    ipAddress: "192.168.10.5",
    macAddress: "B4:F2:E6:9A:8C:7D",
    status: "offline",
    lastActive: "9 hours ago",
    syncStatus: "pending_sync"
  },
  {
    id: "pc-4",
    pcName: "Colombo Rear Desk Billing",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    ipAddress: "192.168.1.52",
    macAddress: "E8:99:C4:B2:D1:A5",
    status: "online",
    lastActive: "2 mins ago",
    syncStatus: "synced"
  }
];

export const INITIAL_SALESMEN: Salesman[] = [
  {
    id: "sm-1",
    name: "Suresh Perera",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    monthlyTarget: 350000,
    dailySales: 0,
    monthlySales: 0,
    achievementRate: 0,
    electronicSales: 0,
    nonElectronicSales: 0,
    totalSales: 0
  },
  {
    id: "sm-2",
    name: "Chaminda Silva",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    monthlyTarget: 400000,
    dailySales: 0,
    monthlySales: 0,
    achievementRate: 0,
    electronicSales: 0,
    nonElectronicSales: 0,
    totalSales: 0
  },
  {
    id: "sm-3",
    name: "Dilini Fernando",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    monthlyTarget: 300000,
    dailySales: 0,
    monthlySales: 0,
    achievementRate: 0,
    electronicSales: 0,
    nonElectronicSales: 0,
    totalSales: 0
  },
  {
    id: "sm-4",
    name: "Ruwan Kumara",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    monthlyTarget: 250000,
    dailySales: 0,
    monthlySales: 0,
    achievementRate: 0,
    electronicSales: 0,
    nonElectronicSales: 0,
    totalSales: 0
  }
];

// Seed sales records for September 2026 mapped location-wise
export const INITIAL_SALES_RECORDS: SalesRecord[] = [
  // 2026-09-10
  {
    id: "rec-1",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 45000,
    date: "2026-09-10",
    notes: "Sold 1x Samsung Smart TV",
    createdTimestamp: "2026-09-10T10:30:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-2",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-2",
    salesmanName: "Chaminda Silva",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 15000,
    date: "2026-09-10",
    notes: "Office chairs and desk accessories",
    createdTimestamp: "2026-09-10T14:15:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-2-kdy",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    salesmanId: "sm-3",
    salesmanName: "Dilini Fernando",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 32000,
    date: "2026-09-10",
    notes: "Sold Bluetooth speaker arrays",
    createdTimestamp: "2026-09-10T11:45:00Z",
    syncStatus: "synced"
  },

  // 2026-09-11
  {
    id: "rec-3",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-3",
    salesmanName: "Dilini Fernando",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 85000,
    date: "2026-09-11",
    notes: "ASUS Vivobook Laptop sale",
    createdTimestamp: "2026-09-11T09:20:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-4",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-4",
    salesmanName: "Ruwan Kumara",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 28000,
    date: "2026-09-11",
    notes: "Living room Sofa and Pillows",
    createdTimestamp: "2026-09-11T16:00:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-4-gle",
    locationId: "loc-3",
    locationName: "Galle Coastal Showroom",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 67000,
    date: "2026-09-11",
    notes: "Galle store opening appliance bundle",
    createdTimestamp: "2026-09-11T12:00:00Z",
    syncStatus: "synced"
  },

  // 2026-09-12
  {
    id: "rec-5",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: -12000,
    date: "2026-09-12",
    notes: "Return of defective soundbar (Defective Unit)",
    createdTimestamp: "2026-09-12T11:05:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-6",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-2",
    salesmanName: "Chaminda Silva",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 120000,
    date: "2026-09-12",
    notes: "2x iPad Air for corporate client",
    createdTimestamp: "2026-09-12T15:30:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-7",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    salesmanId: "sm-3",
    salesmanName: "Dilini Fernando",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 32000,
    date: "2026-09-12",
    notes: "Assorted kitchenware utensils",
    createdTimestamp: "2026-09-12T13:10:00Z",
    syncStatus: "synced"
  },

  // 2026-09-13
  {
    id: "rec-8",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-4",
    salesmanName: "Ruwan Kumara",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 55000,
    date: "2026-09-13",
    notes: "Sony Bluetooth Home Theater",
    createdTimestamp: "2026-09-13T10:45:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-9",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 41000,
    date: "2026-09-13",
    notes: "Wooden Coffee Table and 2x stools",
    createdTimestamp: "2026-09-13T12:15:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-10",
    locationId: "loc-3",
    locationName: "Galle Coastal Showroom",
    salesmanId: "sm-2",
    salesmanName: "Chaminda Silva",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 95000,
    date: "2026-09-13",
    notes: "Realme Smartphone and charging docks",
    createdTimestamp: "2026-09-13T14:40:00Z",
    syncStatus: "synced"
  },

  // 2026-09-14
  {
    id: "rec-11",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 60000,
    date: "2026-09-14",
    notes: "Xiaomi Vacuum Cleaner and Accessories (Today)",
    createdTimestamp: "2026-09-14T09:15:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-12",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-2",
    salesmanName: "Chaminda Silva",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 35000,
    date: "2026-09-14",
    notes: "Designer curtains and cushions (Today)",
    createdTimestamp: "2026-09-14T11:40:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-13",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    salesmanId: "sm-3",
    salesmanName: "Dilini Fernando",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 72000,
    date: "2026-09-14",
    notes: "Huawei Smartwatches (Today)",
    createdTimestamp: "2026-09-14T13:20:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-14",
    locationId: "loc-3",
    locationName: "Galle Coastal Showroom",
    salesmanId: "sm-4",
    salesmanName: "Ruwan Kumara",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 18000,
    date: "2026-09-14",
    notes: "Set of premium towels and bath accessories (Today)",
    createdTimestamp: "2026-09-14T15:10:00Z",
    syncStatus: "synced"
  },

  // 2026-09-15 (Current date in metadata)
  {
    id: "rec-15",
    locationId: "loc-1",
    locationName: "Colombo Main Showroom",
    salesmanId: "sm-1",
    salesmanName: "Suresh Perera",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 95000,
    date: "2026-09-15",
    notes: "Asus Dual-Band Wi-Fi 6 Routers batch",
    createdTimestamp: "2026-09-15T08:30:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-16",
    locationId: "loc-2",
    locationName: "Kandy Hill Capital Branch",
    salesmanId: "sm-2",
    salesmanName: "Chaminda Silva",
    departmentId: "dep-1",
    departmentName: "Electronic",
    amount: 54000,
    date: "2026-09-15",
    notes: "Kandy student laptop purchase program",
    createdTimestamp: "2026-09-15T10:15:00Z",
    syncStatus: "synced"
  },
  {
    id: "rec-17",
    locationId: "loc-3",
    locationName: "Galle Coastal Showroom",
    salesmanId: "sm-3",
    salesmanName: "Dilini Fernando",
    departmentId: "dep-2",
    departmentName: "Non-Electronic",
    amount: 43000,
    date: "2026-09-15",
    notes: "Galle dining chairs export sample",
    createdTimestamp: "2026-09-15T11:50:00Z",
    syncStatus: "synced"
  }
];

// Seed customer count records per location and per day
export const INITIAL_CUSTOMER_COUNTS: CustomerCountRecord[] = [
  // 2026-09-10
  { id: "cc-1", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-10", count: 18, createdTimestamp: "2026-09-10T18:00:00Z", syncStatus: "synced" },
  { id: "cc-2", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-10", count: 12, createdTimestamp: "2026-09-10T18:00:00Z", syncStatus: "synced" },
  { id: "cc-3", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-10", count: 8, createdTimestamp: "2026-09-10T18:00:00Z", syncStatus: "synced" },

  // 2026-09-11
  { id: "cc-4", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-11", count: 22, createdTimestamp: "2026-09-11T18:00:00Z", syncStatus: "synced" },
  { id: "cc-5", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-11", count: 15, createdTimestamp: "2026-09-11T18:00:00Z", syncStatus: "synced" },
  { id: "cc-6", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-11", count: 11, createdTimestamp: "2026-09-11T18:00:00Z", syncStatus: "synced" },

  // 2026-09-12
  { id: "cc-7", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-12", count: 25, createdTimestamp: "2026-09-12T18:00:00Z", syncStatus: "synced" },
  { id: "cc-8", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-12", count: 19, createdTimestamp: "2026-09-12T18:00:00Z", syncStatus: "synced" },
  { id: "cc-9", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-12", count: 14, createdTimestamp: "2026-09-12T18:00:00Z", syncStatus: "synced" },

  // 2026-09-13
  { id: "cc-10", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-13", count: 30, createdTimestamp: "2026-09-13T18:00:00Z", syncStatus: "synced" },
  { id: "cc-11", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-13", count: 21, createdTimestamp: "2026-09-13T18:00:00Z", syncStatus: "synced" },
  { id: "cc-12", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-13", count: 17, createdTimestamp: "2026-09-13T18:00:00Z", syncStatus: "synced" },

  // 2026-09-14
  { id: "cc-13", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-14", count: 24, createdTimestamp: "2026-09-14T18:00:00Z", syncStatus: "synced" },
  { id: "cc-14", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-14", count: 16, createdTimestamp: "2026-09-14T18:00:00Z", syncStatus: "synced" },
  { id: "cc-15", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-14", count: 12, createdTimestamp: "2026-09-14T18:00:00Z", syncStatus: "synced" },

  // 2026-09-15 (Today)
  { id: "cc-16", locationId: "loc-1", locationName: "Colombo Main Showroom", date: "2026-09-15", count: 35, createdTimestamp: "2026-09-15T18:00:00Z", syncStatus: "synced" },
  { id: "cc-17", locationId: "loc-2", locationName: "Kandy Hill Capital Branch", date: "2026-09-15", count: 23, createdTimestamp: "2026-09-15T18:00:00Z", syncStatus: "synced" },
  { id: "cc-18", locationId: "loc-3", locationName: "Galle Coastal Showroom", date: "2026-09-15", count: 18, createdTimestamp: "2026-09-15T18:00:00Z", syncStatus: "synced" }
];

import { StockItem, StockTransfer } from "./types";

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  // Colombo (loc-1)
  { id: "st-1", productName: "Samsung Smart TV 55\"", productCode: "PRD-TV55", unitPrice: 45000, openingStock: 50, stockIn: 10, stockOut: 5, physicalStock: 55, locationId: "loc-1" },
  { id: "st-2", productName: "Asus ZenBook Laptop", productCode: "PRD-LAP14", unitPrice: 120000, openingStock: 20, stockIn: 5, stockOut: 2, physicalStock: 23, locationId: "loc-1" },
  { id: "st-3", productName: "Wooden Dining Table", productCode: "PRD-TBL01", unitPrice: 35000, openingStock: 15, stockIn: 0, stockOut: 3, physicalStock: 12, locationId: "loc-1" },
  { id: "st-4", productName: "Ergonomic Office Chair", productCode: "PRD-CHR05", unitPrice: 15000, openingStock: 40, stockIn: 20, stockOut: 12, physicalStock: 48, locationId: "loc-1" },
  
  // Kandy (loc-2)
  { id: "st-5", productName: "Samsung Smart TV 55\"", productCode: "PRD-TV55", unitPrice: 45000, openingStock: 30, stockIn: 5, stockOut: 4, physicalStock: 31, locationId: "loc-2" },
  { id: "st-6", productName: "Asus ZenBook Laptop", productCode: "PRD-LAP14", unitPrice: 120000, openingStock: 15, stockIn: 2, stockOut: 3, physicalStock: 14, locationId: "loc-2" },
  { id: "st-7", productName: "Wooden Dining Table", productCode: "PRD-TBL01", unitPrice: 35000, openingStock: 10, stockIn: 2, stockOut: 1, physicalStock: 11, locationId: "loc-2" },
  { id: "st-8", productName: "Ergonomic Office Chair", productCode: "PRD-CHR05", unitPrice: 15000, openingStock: 25, stockIn: 10, stockOut: 8, physicalStock: 27, locationId: "loc-2" },

  // Galle (loc-3)
  { id: "st-9", productName: "Samsung Smart TV 55\"", productCode: "PRD-TV55", unitPrice: 45000, openingStock: 25, stockIn: 4, stockOut: 2, physicalStock: 27, locationId: "loc-3" },
  { id: "st-10", productName: "Asus ZenBook Laptop", productCode: "PRD-LAP14", unitPrice: 120000, openingStock: 10, stockIn: 3, stockOut: 1, physicalStock: 12, locationId: "loc-3" },
  { id: "st-11", productName: "Wooden Dining Table", productCode: "PRD-TBL01", unitPrice: 35000, openingStock: 8, stockIn: 4, stockOut: 2, physicalStock: 10, locationId: "loc-3" },
  { id: "st-12", productName: "Ergonomic Office Chair", productCode: "PRD-CHR05", unitPrice: 15000, openingStock: 30, stockIn: 15, stockOut: 10, physicalStock: 35, locationId: "loc-3" }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [
  { id: "tr-1", productCode: "PRD-TV55", productName: "Samsung Smart TV 55\"", fromLocationId: "loc-1", toLocationId: "loc-2", quantity: 5, unitPrice: 45000, date: "2026-09-12", notes: "Inter-showroom demand replenishment" },
  { id: "tr-2", productCode: "PRD-CHR05", productName: "Ergonomic Office Chair", fromLocationId: "loc-1", toLocationId: "loc-3", quantity: 10, unitPrice: 15000, date: "2026-09-14", notes: "Bulk transfer for coastal showroom clearance" }
];

