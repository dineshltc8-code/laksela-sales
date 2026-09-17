export interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  lastSyncTime?: string;
  syncMode: 'auto' | 'manual';
  syncMethod: 'internet' | 'wifi';
  monthlyTarget?: number;
}

export interface PCInstallation {
  id: string;
  pcName: string;
  locationId: string;
  locationName: string;
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline';
  lastActive: string;
  syncStatus: 'synced' | 'pending_sync' | 'error';
}

export interface Salesman {
  id: string;
  name: string;
  photo: string; // Base64 string or placeholder avatar URL
  monthlyTarget: number;
  dailySales: number;
  monthlySales: number;
  achievementRate: number; // monthlySales / monthlyTarget * 100
  electronicSales: number;
  nonElectronicSales: number;
  totalSales: number;
  customerCount?: number;
}

export interface Department {
  id: string;
  name: string;
  type: 'electronic' | 'non-electronic' | 'custom';
  description?: string;
}

export interface SalesRecord {
  id: string;
  locationId: string;
  locationName: string;
  salesmanId: string;
  salesmanName: string;
  departmentId: string;
  departmentName: string;
  amount: number; // can be positive or negative
  date: string; // YYYY-MM-DD
  notes: string;
  createdTimestamp: string;
  syncStatus: 'synced' | 'pending';
  customerCount?: number;

  // Excel template specific fields
  invoiceNo?: string;
  customerCode?: string;
  customerName?: string;
  itemCode?: string;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface CustomerCountRecord {
  id: string;
  locationId: string;
  locationName: string;
  date: string; // YYYY-MM-DD
  count: number;
  createdTimestamp: string;
  syncStatus: 'synced' | 'pending';
}

export interface AppTotals {
  todaySales: number;
  monthlySales: number;
  monthlyTarget: number;
  achievementRate: number; // total actual / total target * 100
  totalCustomers: number;
  salesmenCount: number;
  electronicSales: number;
  nonElectronicSales: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface StockItem {
  id: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  physicalStock: number;
  locationId: string; // The specific showroom location this stock belongs to
}

export interface StockTransfer {
  id: string;
  productCode: string;
  productName: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unitPrice: number;
  date: string;
  notes?: string;
}
