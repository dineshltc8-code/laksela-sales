import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Server-side JSON Database for Sync and Device Tracking
const DB_PATH = path.join(process.cwd(), "server_db.json");

interface SyncLog {
  id: string;
  device: string;
  location: string;
  dateTime: string;
  recordsSent: number;
  recordsReceived: number;
  status: 'SUCCESS' | 'FAILED';
  errorDetails?: string;
}

interface ServerDb {
  pcs: any[];
  syncLogs: SyncLog[];
  centralData: {
    locations: any[];
    salesmen: any[];
    salesRecords: any[];
    customerCounts: any[];
    overallMonthlyTarget: number;
    stockItems?: any[];
    stockTransfers?: any[];
    excelImportHistory?: any[];
  };
  sampleDataCleared?: boolean;
}

const defaultDb: ServerDb = {
  pcs: [
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
  ],
  syncLogs: [
    {
      id: "log-init-1",
      device: "Central Controller",
      location: "Colombo Main Showroom",
      dateTime: "2026-09-15 06:15 AM",
      recordsSent: 15,
      recordsReceived: 0,
      status: "SUCCESS"
    }
  ],
  centralData: {
    locations: [],
    salesmen: [],
    salesRecords: [],
    customerCounts: [],
    overallMonthlyTarget: 1300000,
    stockItems: [],
    stockTransfers: [],
    excelImportHistory: []
  },
  sampleDataCleared: false
};

function readDb(): ServerDb {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading server_db.json:", err);
  }
  return defaultDb;
}

function writeDb(db: ServerDb) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing server_db.json:", err);
  }
}

// Ensure database file is initialized on startup
if (!fs.existsSync(DB_PATH)) {
  writeDb(defaultDb);
}

// API: Get Sync Status and Logs Dashboard Card Context
app.get("/api/sync/status", (req, res) => {
  const db = readDb();
  const total = db.pcs.length;
  const online = db.pcs.filter(p => p.status === "online").length;
  const offline = total - online;
  const updated = db.pcs.filter(p => p.syncStatus === "synced").length;
  const pending = db.pcs.filter(p => p.syncStatus === "pending_sync").length;
  const failed = db.pcs.filter(p => p.syncStatus === "error").length;

  const lastSyncTime = db.syncLogs.length > 0 
    ? db.syncLogs[0].dateTime 
    : "N/A";

  res.json({
    totalPCs: total,
    onlinePCs: online,
    offlinePCs: offline,
    successfullyUpdated: updated,
    pendingUpdates: pending,
    failedUpdates: failed,
    lastSyncTime,
    pcs: db.pcs,
    logs: db.syncLogs.slice(0, 50) // Return last 50 logs
  });
});

// API: Register or update PC client registry
app.post("/api/sync/register-pc", (req, res) => {
  const db = readDb();
  const newPC = req.body;

  if (!newPC.id) {
    return res.status(400).json({ error: "PC installation ID is required" });
  }

  const index = db.pcs.findIndex(p => p.id === newPC.id);
  if (index !== -1) {
    db.pcs[index] = { ...db.pcs[index], ...newPC };
  } else {
    db.pcs.push(newPC);
  }

  writeDb(db);
  res.json({ status: "ok", pcs: db.pcs });
});

// API: Delete PC client registration
app.post("/api/sync/delete-pc", (req, res) => {
  const db = readDb();
  const { id } = req.body;

  db.pcs = db.pcs.filter(p => p.id !== id);
  writeDb(db);
  res.json({ status: "ok", pcs: db.pcs });
});

// API: Admin sends authorized database schemas (Sync/Send Update)
app.post("/api/sync/send-update", (req, res) => {
  const db = readDb();
  const { locations, salesmen, salesRecords, customerCounts, overallMonthlyTarget } = req.body;

  db.centralData.locations = locations || db.centralData.locations;
  db.centralData.salesmen = salesmen || db.centralData.salesmen;
  db.centralData.salesRecords = salesRecords || db.centralData.salesRecords;
  db.centralData.customerCounts = customerCounts || db.centralData.customerCounts;
  db.centralData.overallMonthlyTarget = overallMonthlyTarget || db.centralData.overallMonthlyTarget;

  // Append Admin Sync Log
  const timestamp = new Date().toLocaleString();
  db.syncLogs.unshift({
    id: "log-" + Math.random().toString(36).substr(2, 9),
    device: "Admin Central PC",
    location: "Colombo Main Showroom",
    dateTime: timestamp,
    recordsSent: (salesRecords?.length || 0) + (salesmen?.length || 0),
    recordsReceived: 0,
    status: "SUCCESS"
  });

  // Mark other location PCs as pending sync so they fetch this updated master configurations
  db.pcs = db.pcs.map(p => p.locationId !== "loc-1" ? { ...p, syncStatus: "pending_sync" } : p);

  writeDb(db);
  res.json({ status: "ok", message: "Authorized central schemas pushed to gateway server successfully!" });
});

// API: Location Terminal pulls authorized configurations & pushes back local branch transactions
app.post("/api/sync/pull-update", (req, res) => {
  const db = readDb();
  const { pcId, locationId, localSalesRecords = [], localCustomerCounts = [], terminalName } = req.body;

  if (!locationId) {
    return res.status(400).json({ error: "Location assignment ID is required" });
  }

  // 1. Conflict-Free Merge: Merge newly pushed local sales records into central master list
  let recordsReceivedCount = 0;
  if (Array.isArray(localSalesRecords)) {
    localSalesRecords.forEach((rec: any) => {
      const exists = db.centralData.salesRecords.some(r => r.id === rec.id);
      if (!exists) {
        db.centralData.salesRecords.push({ ...rec, syncStatus: "synced" });
        recordsReceivedCount++;
      }
    });
  }

  // 2. Merge customer counts
  if (Array.isArray(localCustomerCounts)) {
    localCustomerCounts.forEach((cc: any) => {
      const exists = db.centralData.customerCounts.some(c => c.id === cc.id);
      if (!exists) {
        db.centralData.customerCounts.push({ ...cc, syncStatus: "synced" });
      }
    });
  }

  // 3. Mark the calling PC as successfully updated and online
  const pcIndex = db.pcs.findIndex(p => p.id === pcId);
  const matchedLocName = db.centralData.locations.find(l => l.id === locationId)?.name || "Branch Showroom";
  
  const updatedPCInfo = {
    id: pcId,
    pcName: terminalName || `Counter Node [${locationId}]`,
    locationId,
    locationName: matchedLocName,
    status: "online" as const,
    lastActive: "Just now",
    syncStatus: "synced" as const
  };

  if (pcIndex !== -1) {
    db.pcs[pcIndex] = updatedPCInfo;
  } else {
    db.pcs.push(updatedPCInfo);
  }

  // 4. Log the Pull sync operation
  const timestamp = new Date().toLocaleString();
  db.syncLogs.unshift({
    id: "log-" + Math.random().toString(36).substr(2, 9),
    device: terminalName || `PC [${pcId.substr(0,5)}]`,
    location: matchedLocName,
    dateTime: timestamp,
    recordsSent: localSalesRecords.length,
    recordsReceived: db.centralData.salesRecords.length,
    status: "SUCCESS"
  });

  writeDb(db);

  // Return the master list configurations to the client, filtered where appropriate or returning all
  res.json({
    status: "ok",
    locations: db.centralData.locations.length > 0 ? db.centralData.locations : undefined,
    salesmen: db.centralData.salesmen.length > 0 ? db.centralData.salesmen : undefined,
    salesRecords: db.centralData.salesRecords, // Return merged sales records back
    customerCounts: db.centralData.customerCounts,
    overallMonthlyTarget: db.centralData.overallMonthlyTarget
  });
});

// API: Log custom synchronization failures or events
app.post("/api/sync/add-log", (req, res) => {
  const db = readDb();
  const { log } = req.body;
  if (log) {
    db.syncLogs.unshift(log);
    writeDb(db);
  }
  res.json({ status: "ok" });
});

// API: Clear Logs
app.post("/api/sync/clear-logs", (req, res) => {
  const db = readDb();
  db.syncLogs = [];
  writeDb(db);
  res.json({ status: "ok" });
});

// API: Get Accurate Online Date and Time with Colombo Timezone and Fallback
app.get("/api/time", async (req, res) => {
  let datetime = "";
  
  // Try WorldTimeAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Colombo", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data && data.datetime) {
        datetime = data.datetime;
      }
    }
  } catch (err: any) {
    // Silent fallback
  }

  // Try TimeAPI.io if first failed
  if (!datetime) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const response = await fetch("https://timeapi.io/api/time/current/zone?timeZone=Asia/Colombo", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && data.dateTime) {
          datetime = data.dateTime;
        }
      }
    } catch (err: any) {
      // Silent fallback
    }
  }

  // Fallback to local server time
  if (!datetime) {
    datetime = new Date().toISOString();
  }

  // Format to YYYY-MM-DD in Colombo timezone
  let formattedDate = "";
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    formattedDate = formatter.format(new Date(datetime));
  } catch (e) {
    formattedDate = new Date(datetime).toISOString().split("T")[0];
  }

  res.json({
    datetime,
    date: formattedDate,
    source: datetime ? "online" : "fallback"
  });
});

// API: Full Central DB State Pull
app.get("/api/db/get", (req, res) => {
  const db = readDb();
  res.json(db);
});

// API: Transactional DB Save (Auto-Save Endpoint)
app.post("/api/db/save", (req, res) => {
  const db = readDb();
  const { locations, salesmen, salesRecords, customerCounts, overallMonthlyTarget, stockItems, stockTransfers, excelImportHistory, pcs, syncLogs } = req.body;

  if (locations) db.centralData.locations = locations;
  if (salesmen) db.centralData.salesmen = salesmen;
  if (salesRecords) db.centralData.salesRecords = salesRecords;
  if (customerCounts) db.centralData.customerCounts = customerCounts;
  if (overallMonthlyTarget !== undefined) db.centralData.overallMonthlyTarget = overallMonthlyTarget;
  if (stockItems) db.centralData.stockItems = stockItems;
  if (stockTransfers) db.centralData.stockTransfers = stockTransfers;
  if (excelImportHistory) db.centralData.excelImportHistory = excelImportHistory;
  if (pcs) db.pcs = pcs;
  if (syncLogs) db.syncLogs = syncLogs;

  writeDb(db);
  res.json({ status: "ok", lastAutoSaved: new Date().toLocaleTimeString(), recordsCount: (db.centralData.salesRecords?.length || 0) });
});

// API: Clear Temporary / Demo Sample Data
app.post("/api/db/clear-sample", (req, res) => {
  const db = readDb();
  db.centralData.salesRecords = [];
  db.centralData.customerCounts = [];
  db.centralData.stockTransfers = [];
  db.centralData.excelImportHistory = [];
  db.sampleDataCleared = true;
  writeDb(db);
  res.json({ status: "ok", message: "Sample data cleared successfully", db });
});

// API: Clear ALL Database Data (Hard Reset keeping core schemas)
app.post("/api/db/clear-all", (req, res) => {
  const db = readDb();
  db.centralData.salesRecords = [];
  db.centralData.customerCounts = [];
  db.centralData.stockTransfers = [];
  db.centralData.excelImportHistory = [];
  if (db.centralData.stockItems) {
    db.centralData.stockItems = db.centralData.stockItems.map((item: any) => ({
      ...item,
      openingStock: 0,
      stockIn: 0,
      stockOut: 0,
      physicalStock: 0
    }));
  }
  db.sampleDataCleared = true;
  writeDb(db);
  res.json({ status: "ok", message: "All user sales records cleared successfully", db });
});

// API: Permanently Delete Sample Data from Server
app.post("/api/sync/reset-demo-data", (req, res) => {
  const db = readDb();
  const { type } = req.body;

  if (type === "all") {
    db.centralData = {
      locations: [],
      salesmen: [],
      salesRecords: [],
      customerCounts: [],
      overallMonthlyTarget: 1300000,
      stockItems: [],
      stockTransfers: [],
      excelImportHistory: []
    };
    db.sampleDataCleared = true;
    db.pcs = db.pcs.map(p => ({ ...p, syncStatus: "pending_sync" }));
  } else if (type === "locations") {
    db.centralData.locations = [];
  } else if (type === "salesmen") {
    db.centralData.salesmen = [];
  } else if (type === "sales") {
    db.centralData.salesRecords = [];
  } else if (type === "targets") {
    db.centralData.overallMonthlyTarget = 0;
  } else if (type === "customer_counts") {
    db.centralData.customerCounts = [];
  }

  writeDb(db);
  res.json({ status: "ok" });
});

// Local robust fallback engine helper to handle common Sinhala sales analysis prompts instantly!
function getLocalFallbackReply(prompt: string, context: any, currentDate: string): string {
  const normPrompt = prompt.toLowerCase();
  let reply = "";

  if (normPrompt.includes("අද විකුණුම්") || normPrompt.includes("අද සේල්ස්") || normPrompt.includes("today sales") || normPrompt.includes("today's sales")) {
    reply = `📅 **අද දින (${currentDate}) විකුණුම් සාරාංශය:**\n\n• මුළු දෛනික විකුණුම් එකතුව: **LKR ${(context.totals?.todaySales || 0).toLocaleString()}**\n• මුළු පාරිභෝගික ගමනාගමනය: **${context.totals?.totalCustomers || 0}**\n\nLaksela Smart Sales Log පද්ධතිය තුළ අද දින සාර්ථකව ගනුදෙනු ලියාපදිංචි කර ඇත. 🛍️`;
  } else if (normPrompt.includes("වැඩිපුරම විකුණුම්") || normPrompt.includes("වැඩිපුරම සේල්ස්") || normPrompt.includes("සේල්ස්මන්") || normPrompt.includes("salesman") || normPrompt.includes("best salesman") || normPrompt.includes("who did")) {
    const salesmen = context.salesmen || [];
    if (salesmen.length > 0) {
      const sorted = [...salesmen].sort((a, b) => (b.monthlySales || 0) - (a.monthlySales || 0));
      const top = sorted[0];
      reply = `🏆 **මෙම මාසයේ වැඩිපුරම විකුණුම් සිදුකර ඇති දක්ෂතම සේල්ස්මන් වන්නේ ${top.name} මහතා වේ.**\n\n📊 **සේල්ස්මන්වරුන්ගේ දක්ෂතා (Performance List):**\n\n`;
      sorted.forEach((s, i) => {
        const ach = s.monthlyTarget > 0 ? ((s.monthlySales / s.monthlyTarget) * 100).toFixed(1) : "0";
        reply += `${i + 1}. **${s.name}** - විකුණුම්: *LKR ${(s.monthlySales || 0).toLocaleString()}* (මාසික ඉලක්කය: LKR ${(s.monthlyTarget || 0).toLocaleString()} | ප්‍රගතිය: **${ach}%**)\n`;
      });
    } else {
      reply = "පද්ධතිය තුළ තවමත් සේල්ස්මන්වරුන් ලියාපදිංචි කර නොමැත.";
    }
  } else if (normPrompt.includes("මාසේ ටාගට්") || normPrompt.includes("ටාගට්") || normPrompt.includes("ඉලක්ක") || normPrompt.includes("target") || normPrompt.includes("monthly target")) {
    reply = `🎯 **මාසික විකුණුම් ඉලක්ක විශ්ලේෂණය:**\n\n• මාසික විකුණුම් ඉලක්කය: **LKR ${(context.totals?.monthlyTarget || 0).toLocaleString()}**\n• දැනට ලබාගෙන ඇති විකුණුම් එකතුව: **LKR ${(context.totals?.monthlySales || 0).toLocaleString()}**\n• ඉලක්ක ප්‍රගති ප්‍රතිශතය: **${(context.totals?.achievementRate || 0).toFixed(1)}%**\n\nඉලක්කය සාක්ෂාත් කර ගැනීමට තවත් කැපවීමෙන් කටයුතු කරමු! 💪`;
  } else if (normPrompt.includes("ප්‍රගතිය") || normPrompt.includes("progress") || normPrompt.includes("performance") || normPrompt.includes("compare")) {
    const rate = context.totals?.achievementRate || 0;
    const comment = rate >= 100 
      ? "විශිෂ්ටයි! ඔබ දැනටමත් මාසික විකුණුම් ඉලක්කය සම්පූර්ණයෙන්ම සපුරා ඇත! 🎉" 
      : "මාසික විකුණුම් ඉලක්කය සපුරා ගැනීමට තවත් උත්සාහ කරන්න! 💪";
    reply = `📈 **වත්මන් විකුණුම් ප්‍රගති වාර්තාව:**\n\n• මාසික ඉලක්කය: **LKR ${(context.totals?.monthlyTarget || 0).toLocaleString()}**\n• මේ දක්වා විකුණුම්: **LKR ${(context.totals?.monthlySales || 0).toLocaleString()}**\n• ප්‍රගති ප්‍රතිශතය (Achievement Rate): **${rate.toFixed(1)}%**\n\n${comment}`;
  } else if (normPrompt.includes("electronic") || normPrompt.includes("අංශ දෙකෙහි") || normPrompt.includes("departments") || normPrompt.includes("division")) {
    reply = `🔌 **අංශය අනුව විකුණුම් සැසඳීම (Department Breakdown):**\n\n• **Electronic Sales (විද්‍යුත් අංශය):** LKR ${(context.totals?.electronicSales || 0).toLocaleString()}\n• **Non-Electronic Sales (විද්‍යුත් නොවන අංශය):** LKR ${(context.totals?.nonElectronicSales || 0).toLocaleString()}\n\nපද්ධතිය තුළ දෙපාර්තමේන්තු දෙකෙහිම ගනුදෙනු නිවැරදිව සටහන් වී ඇත.`;
  } else {
    reply = `ආයුබෝවන්! මම **ලක්සෙල සිංහල AI සහකරු** (Laksela Sinhala AI Sahakaru) වෙමි. 

📅 **වත්මන් විකුණුම් සාරාංශ වාර්තාව (Sales Summary Report):**

• **අද දින විකුණුම් (Today's Sales):** LKR ${(context.totals?.todaySales || 0).toLocaleString()}
• **මාසික විකුණුම් (Monthly Sales):** LKR ${(context.totals?.monthlySales || 0).toLocaleString()}
• **මාසික ඉලක්කය (Monthly Target):** LKR ${(context.totals?.monthlyTarget || 0).toLocaleString()}
• **ඉලක්ක ප්‍රගතිය (Achievement Rate):** **${(context.totals?.achievementRate || 0).toFixed(1)}%**
• **පාරිභෝගික ගමනාගමනය (Traffic Logs):** **${context.totals?.totalCustomers || 0} customers**

*සටහන: Gemini API සේවා සන්නිවේදන ගැටලුවක් ඇත (උදා: වැරදි/කල් ඉකුත් වූ API Key). නමුත් මම දේශීයව මෙම දත්ත විශ්ලේෂණය කර ඔබට නිවැරදි පිළිතුරු ලබා දෙමි!*`;
  }
  return reply;
}

// API endpoint for Sinhala AI Agent
app.post("/api/ai/chat", async (req, res) => {
  const { prompt, history = [], context = {}, currentDate = "2026-09-14" } = req.body;
  try {

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey || currentApiKey === "MY_GEMINI_API_KEY" || currentApiKey.trim() === "") {
      const reply = getLocalFallbackReply(prompt, context, currentDate);
      return res.json({ reply });
    }

    // Initialize GoogleGenAI dynamically on each request to prevent stale startup keys
    const ai = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a professional Sinhala-speaking AI sales assistant named exactly "Laksela Sinhala AI Sahakaru" for the PC desktop application "Laksela Smart Sales Log".
Your goal is to help the administrator analyze sales, targets, salesmen performance, and department reports.

Current System Date: ${currentDate}.

REAL-TIME CONTEXT FROM APPLICATION DATABASE:
- Salesmen: ${JSON.stringify(context.salesmen || [])}
- Departments: ${JSON.stringify(context.departments || [])}
- Sales Records (last 100): ${JSON.stringify((context.salesRecords || []).slice(0, 100))}
- Overall Target Configuration: ${JSON.stringify(context.targets || {})}
- Aggregated Metrics:
  * Today's Sales: ${context.totals?.todaySales || 0}
  * Monthly Sales: ${context.totals?.monthlySales || 0}
  * Monthly Target: ${context.totals?.monthlyTarget || 0}
  * Achievement Rate: ${context.totals?.achievementRate || 0}%
  * Total Customers: ${context.totals?.totalCustomers || 0}
  * Number of Salesmen: ${context.totals?.salesmenCount || 0}
  * Electronic Dept Sales: ${context.totals?.electronicSales || 0}
  * Non-Electronic Dept Sales: ${context.totals?.nonElectronicSales || 0}

INSTRUCTIONS FOR GENERATING RESPONSES:
1. Always respond in fluent, professional, clear, and friendly Sinhala (සිංහල) by default when queried in Sinhala.
2. If the user queries in English or asks for English response, answer in English.
3. Be direct, helpful, and concise. Maintain a professional business tone.
4. Calculate and analyze based on the REAL context provided above. Do not hallucinate or make up sales statistics. If data is zero, state that there are no sales records recorded yet.
5. If the user asks for a report, generate a beautifully formatted, clean text-based report with clear lists or bullet points so it is easy to read, print, or share.
6. Common questions in Sinhala:
   - "අද විකුණුම් කොච්චරද?" -> State Today's Sales (${context.totals?.todaySales || 0} LKR).
   - "වැඩිපුරම විකුණුම් කරපු සේල්ස්මන් කවුද?" -> Analyze salesmen list, find the one with the highest total or monthly sales, and state their name, sales, and achievement percentage.
   - "මේ මාසේ ටාගට් එක කොච්චරද?" -> State Monthly Target (${context.totals?.monthlyTarget || 0} LKR).
   - "ටාගට් එකට සාපේක්ෂව විකුණුම් කොහොමද?" -> Compare Monthly Sales with Monthly Target, state achievement % (${context.totals?.achievementRate || 0}%) and say if it is on track or needs improvement.
7. Format the output clearly so it's ready to send to WhatsApp as a professional summary message. Keep the tone helpful, constructive, and accurate to the data provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        ...history.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        })),
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.15,
      }
    });

    const reply = response.text || "නැවත උත්සාහ කරන්න. (Please try again.)";
    res.json({ reply });
  } catch (error: any) {
    console.warn("AI Assistant API error (falling back to offline local engine):", error);
    // Dynamic graceful offline fallback
    try {
      const reply = getLocalFallbackReply(prompt, context, currentDate);
      res.json({ reply });
    } catch (fallbackErr) {
      res.status(500).json({ error: "AI සැකසීමේ දෝෂයක් සිදුවිය." });
    }
  }
});

// Serve Vite assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
