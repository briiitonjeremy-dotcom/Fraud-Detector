"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getUsers, 
  addUser, 
  updateUserRole, 
  toggleUserStatus, 
  deleteUser,
  getTransactions,
  markTransactionReviewed,
  escalateTransaction,
  getAdminLogs,
  getDashboardStats,
  getVendorStats,
  clearAllData
} from "./actions";

// ML API Base URL
const ML_API_URL = "https://ml-file-for-url.onrender.com";

type TabType = "dashboard" | "users" | "transactions" | "explainability" | "reports" | "settings";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  loginAttempts: number;
  createdAt: Date | null;
}

interface Transaction {
  id: number;
  transactionId: string;
  step: number;
  amount: number;
  nameOrig: string | null;
  oldBalanceOrig: number | null;
  newBalanceOrig: number | null;
  nameDest: string | null;
  oldBalanceDest: number | null;
  newBalanceDest: number | null;
  type: string | null;
  isFraud: boolean | null;
  fraudScore: number | null;
  riskLevel: string | null;
  vendor: string | null;
  region: string | null;
  isReviewed: boolean;
  isEscalated: boolean;
  processedAt: Date | null;
  createdAt: Date | null;
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: Date | null;
}

interface ApiStatus {
  status: "online" | "offline";
  latency: number;
  lastChecked: Date;
}

interface DashboardStats {
  userCount: number;
  transactionCount: number;
  highRiskCount: number;
  recentLogs: AdminLog[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: "offline", latency: 0, lastChecked: new Date() });
  
  // User management state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; target: any; message: string } | null>(null);
  
  // Transaction management state
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [fraudFilter, setFraudFilter] = useState<number>(50);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Explainability state
  const [explainTransactionId, setExplainTransactionId] = useState("");
  const [explainResult, setExplainResult] = useState<any>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  
  // Reports state
  const [vendorRiskData, setVendorRiskData] = useState<{ vendor: string; risk: number; count: number }[]>([]);
  const [geoRiskData, setGeoRiskData] = useState<{ region: string; risk: number; count: number }[]>([]);
  const [fraudTrendData, setFraudTrendData] = useState<{ date: string; count: number }[]>([]);
  
  // Activity log
  const [activityLog, setActivityLog] = useState<AdminLog[]>([]);
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({ userCount: 0, transactionCount: 0, highRiskCount: 0, recentLogs: [] });
  
  // New user form
  const [newUserForm, setNewUserForm] = useState({ email: "", name: "", role: "user", password: "" });

  // Check API status
  const checkApiStatus = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${ML_API_URL}/health`, { method: "GET" });
      const latency = Date.now() - start;
      setApiStatus({
        status: res.ok ? "online" : "offline",
        latency,
        lastChecked: new Date(),
      });
    } catch {
      setApiStatus({
        status: "offline",
        latency: Date.now() - start,
        lastChecked: new Date(),
      });
    }
  }, []);

  // Load users from database
  const loadUsers = useCallback(async () => {
    try {
      const result = await getUsers();
      setUsersList(result as User[]);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, []);

  // Load transactions from database
  const loadTransactions = useCallback(async () => {
    try {
      const minScore = fraudFilter / 100;
      const result = await getTransactions(minScore > 0 ? Math.ceil(minScore * 100) : undefined);
      setTransactionsList(result as Transaction[]);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }, [fraudFilter]);

  // Load admin logs
  const loadAdminLogs = useCallback(async () => {
    try {
      const result = await getAdminLogs();
      setActivityLog(result as AdminLog[]);
    } catch (error) {
      console.error("Failed to load admin logs:", error);
    }
  }, []);

  // Load dashboard stats
  const loadDashboardStats = useCallback(async () => {
    try {
      const result = await getDashboardStats();
      setStats(result);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }, []);

  // Generate vendor risk report
  const generateVendorReport = useCallback(async () => {
    try {
      const result = await getVendorStats();
      const vendorData = result.map((v: any) => ({
        vendor: v.name || "Unknown",
        risk: v.avgFraudScore || 0,
        count: v.count || 0,
      }));
      setVendorRiskData(vendorData);
    } catch (error) {
      console.error("Failed to generate vendor report:", error);
    }
  }, []);

  // Generate geo risk report (using transactions)
  const generateGeoReport = useCallback(async () => {
    try {
      const txs = await getTransactions();
      const regions = new Map();
      (txs as Transaction[]).forEach(tx => {
        const region = tx.region || "Unknown";
        const existing = regions.get(region) || { count: 0, fraudCount: 0 };
        regions.set(region, {
          count: existing.count + 1,
          fraudCount: existing.fraudCount + ((tx.fraudScore || 0) >= 0.5 ? 1 : 0),
        });
      });
      
      const geoData = Array.from(regions.entries()).map(([region, data]) => ({
        region,
        risk: data.count > 0 ? data.fraudCount / data.count : 0,
        count: data.count,
      }));
      
      setGeoRiskData(geoData.sort((a, b) => b.risk - a.risk));
    } catch (error) {
      console.error("Failed to generate geo report:", error);
    }
  }, []);

  // Generate fraud trend report
  const generateFraudTrendReport = useCallback(async () => {
    // Generate last 14 days data
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({ date: dateStr, count: Math.floor(Math.random() * 10) }); // Mock data
    }
    setFraudTrendData(days);
  }, []);

  // Add new user
  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.name || !newUserForm.password) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      await addUser(newUserForm.email, newUserForm.name, newUserForm.role, newUserForm.password);
      await loadUsers();
      setShowAddUserModal(false);
      setNewUserForm({ email: "", name: "", role: "user", password: "" });
    } catch (error) {
      console.error("Failed to add user:", error);
      alert("Failed to add user. Email may already exist.");
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  // Deactivate/Activate user
  const handleToggleUserActive = async (user: User) => {
    try {
      await toggleUserStatus(user.id, !user.isActive);
      await loadUsers();
      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to toggle user active:", error);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      await loadUsers();
      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  // Mark transaction as reviewed
  const handleMarkReviewed = async (txId: number) => {
    try {
      await markTransactionReviewed(txId);
      await loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
    }
  };

  // Escalate transaction
  const handleEscalate = async (txId: number) => {
    try {
      await escalateTransaction(txId);
      await loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to escalate:", error);
    }
  };

  // Export transactions to CSV
  const handleExportTransactions = () => {
    const headers = ["Transaction ID", "Amount", "Type", "Vendor", "Region", "Fraud Score", "Risk Level", "Reviewed", "Escalated"];
    const rows = transactionsList.map(t => [
      t.transactionId,
      t.amount?.toString() || "",
      t.type || "",
      t.vendor || "",
      t.region || "",
      (t.fraudScore || 0).toFixed(2),
      t.riskLevel || "unknown",
      t.isReviewed ? "Yes" : "No",
      t.isEscalated ? "Yes" : "No",
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Explain transaction
  const handleExplain = async () => {
    if (!explainTransactionId) return;
    
    setExplainLoading(true);
    setExplainError(null);
    setExplainResult(null);
    
    try {
      const res = await fetch(`${ML_API_URL}/explain/${explainTransactionId}`);
      if (!res.ok) {
        throw new Error("Failed to get explanation");
      }
      const data = await res.json();
      setExplainResult(data);
    } catch (error) {
      setExplainError("Could not fetch explanation. Transaction may not exist or API is offline.");
    } finally {
      setExplainLoading(false);
    }
  };

  // Trigger manual fraud detection
  const handleManualFraudDetection = async () => {
    if (apiStatus.status === "offline") {
      alert("ML API is offline. Please try again later.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Get unreviewed transactions from localStorage as fallback
      const storedData = localStorage.getItem("fraudResults");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        alert(`Fraud detection would process ${parsed.length || 0} transactions (using stored data)`);
      } else {
        alert("No transactions found to process");
      }
    } catch (error) {
      console.error("Failed to run fraud detection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract suspicious transactions
  const handleExtractSuspicious = () => {
    const suspicious = transactionsList.filter(t => (t.fraudScore || 0) >= 0.5);
    
    if (suspicious.length === 0) {
      alert("No suspicious transactions found");
      return;
    }
    
    const headers = ["Transaction ID", "Amount", "Type", "Vendor", "Region", "Fraud Score", "Risk Level"];
    const rows = suspicious.map(t => [
      t.transactionId,
      t.amount?.toString() || "",
      t.type || "",
      t.vendor || "",
      t.region || "",
      (t.fraudScore || 0).toFixed(2),
      t.riskLevel || "unknown",
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suspicious_transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`Extracted ${suspicious.length} suspicious transactions`);
  };

  // Clear all data
  const handleClearData = async () => {
    try {
      await clearAllData();
      await loadUsers();
      await loadTransactions();
      await loadAdminLogs();
      await loadDashboardStats();
      alert("All data cleared successfully");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    checkApiStatus();
    loadUsers();
    loadTransactions();
    loadAdminLogs();
    loadDashboardStats();
    
    // Refresh API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, [checkApiStatus, loadUsers, loadTransactions, loadAdminLogs, loadDashboardStats]);

  // Load reports data when on reports tab
  useEffect(() => {
    if (activeTab === "reports") {
      generateVendorReport();
      generateGeoReport();
      generateFraudTrendReport();
    }
  }, [activeTab, generateVendorReport, generateGeoReport, generateFraudTrendReport]);

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "users", label: "👥 Users" },
    { id: "transactions", label: "💳 Transactions" },
    { id: "explainability", label: "🔍 Explainability" },
    { id: "reports", label: "📈 Reports" },
    { id: "settings", label: "⚙️ Settings" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                🛡️ FraudGuard Admin
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                apiStatus.status === "online" 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {apiStatus.status === "online" ? `🟢 API Online (${apiStatus.latency}ms)` : "🔴 API Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                Last updated: {apiStatus.lastChecked.toLocaleTimeString()}
              </span>
              <button
                onClick={checkApiStatus}
                className="ml-2 px-3 py-1 text-sm bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/30 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">API Status</p>
                    <p className={`text-2xl font-bold ${apiStatus.status === "online" ? "text-green-400" : "text-red-400"}`}>
                      {apiStatus.status === "online" ? "🟢 Online" : "🔴 Offline"}
                    </p>
                  </div>
                  <span className="text-4xl">🌐</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Latency: {apiStatus.latency}ms</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.userCount}</p>
                  </div>
                  <span className="text-4xl">👥</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">{stats.transactionCount}</p>
                  </div>
                  <span className="text-4xl">💳</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">High Risk Transactions</p>
                    <p className="text-2xl font-bold text-red-400">
                      {stats.highRiskCount}
                    </p>
                  </div>
                  <span className="text-4xl">⚠️</span>
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">🚨 Security Alerts</h3>
              {transactionsList.filter(t => (t.fraudScore || 0) >= 0.7).length > 0 ? (
                <div className="space-y-2">
                  {transactionsList
                    .filter(t => (t.fraudScore || 0) >= 0.7)
                    .slice(0, 5)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div>
                          <p className="text-red-400 font-medium">High fraud risk detected</p>
                          <p className="text-sm text-slate-400">ID: {t.transactionId} | Score: {(t.fraudScore || 0).toFixed(2)}</p>
                        </div>
                        <span className="text-red-400">🚨</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-400">No high-risk alerts at this time.</p>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">📝 Activity Log</h3>
              {activityLog.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activityLog.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white">{log.action}</p>
                        <p className="text-xs text-slate-400">
                          {log.targetType && `${log.targetType}`}
                          {log.targetId && ` #${log.targetId}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No recent activity.</p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                + Add User
              </button>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/20">
                      <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                          user.role === "investigator" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-500/20 text-slate-400"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              type: "toggleActive",
                              target: user,
                              message: `Are you sure you want to ${user.isActive ? "deactivate" : "activate"} this user?`
                            })}
                            className={`px-2 py-1 text-xs rounded ${user.isActive ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "bg-green-600/20 text-green-400 hover:bg-green-600/30"}`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              type: "deleteUser",
                              target: user,
                              message: "Are you sure you want to delete this user? This action cannot be undone."
                            })}
                            className="px-2 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersList.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No users found. Add a user to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Transaction Management</h2>
              <div className="flex gap-2">
                <select
                  value={fraudFilter}
                  onChange={(e) => setFraudFilter(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value={0}>All Transactions</option>
                  <option value={30}>Risk ≥ 30%</option>
                  <option value={50}>Risk ≥ 50%</option>
                  <option value={70}>Risk ≥ 70%</option>
                  <option value={90}>Risk ≥ 90%</option>
                </select>
                <button
                  onClick={handleExportTransactions}
                  disabled={transactionsList.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  📥 Export CSV
                </button>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Fraud Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Risk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {transactionsList.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-700/20 cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <td className="px-4 py-4 text-sm text-white font-mono">{tx.transactionId?.slice(0, 12)}...</td>
                      <td className="px-4 py-4 text-sm text-white">${tx.amount?.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{tx.type || "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{tx.vendor || "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{tx.region || "-"}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`font-medium ${
                          (tx.fraudScore || 0) >= 0.7 ? "text-red-400" :
                          (tx.fraudScore || 0) >= 0.5 ? "text-orange-400" :
                          "text-slate-400"
                        }`}>
                          {((tx.fraudScore || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.riskLevel === "critical" ? "bg-red-500/20 text-red-400" :
                          tx.riskLevel === "high" ? "bg-orange-500/20 text-orange-400" :
                          tx.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-slate-500/20 text-slate-400"
                        }`}>
                          {tx.riskLevel || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="text-slate-400">
                          {tx.isReviewed ? "✅" : "⏳"} {tx.isEscalated ? "🚨" : ""}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactionsList.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No transactions found. Upload a dataset to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Explainability Tab */}
        {activeTab === "explainability" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Transaction Explainability</h2>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={explainTransactionId}
                  onChange={(e) => setExplainTransactionId(e.target.value)}
                  placeholder="Enter transaction ID..."
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                />
                <button
                  onClick={handleExplain}
                  disabled={explainLoading || !explainTransactionId || apiStatus.status === "offline"}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {explainLoading ? "⏳ Analyzing..." : "🔍 Explain"}
                </button>
              </div>
              
              {apiStatus.status === "offline" && (
                <p className="mt-2 text-sm text-red-400">⚠️ ML API is offline. Cannot fetch explanations.</p>
              )}
              
              {explainError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400">{explainError}</p>
                </div>
              )}
              
              {explainResult && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">📊 Analysis Result</h3>
                    <p className="text-slate-300">
                      <strong>Fraud Probability:</strong> {((explainResult.fraud_probability || explainResult.prediction || 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-slate-300 mt-2">
                      <strong>Classification:</strong>{" "}
                      <span className={explainResult.fraud_probability >= 0.5 ? "text-red-400" : "text-green-400"}>
                        {explainResult.fraud_probability >= 0.5 ? "🚨 FRAUD DETECTED" : "✅ LEGITIMATE"}
                      </span>
                    </p>
                  </div>
                  
                  {explainResult.shap_values && (
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">🔍 Top Contributing Features</h3>
                      <div className="space-y-2">
                        {Object.entries(explainResult.shap_values)
                          .sort(([, a], [, b]) => Math.abs(Number(b)) - Math.abs(Number(a)))
                          .slice(0, 5)
                          .map(([feature, value], index) => (
                            <div key={feature} className="flex items-center gap-4">
                              <span className="text-sm text-slate-400 w-32">{feature}</span>
                              <div className="flex-1 h-4 bg-slate-600 rounded overflow-hidden">
                                <div 
                                  className={`h-full ${Number(value) > 0 ? "bg-red-500" : "bg-green-500"}`}
                                  style={{ width: `${Math.min(Math.abs(Number(value)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-400 w-16 text-right">
                                {Number(value).toFixed(3)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {explainResult.explanation && (
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">📝 Human-Readable Explanation</h3>
                      <p className="text-slate-300">{explainResult.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Reports & Analytics</h2>
            
            {/* Vendor Risk Ranking */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">🏢 Vendor Risk Ranking</h3>
              {vendorRiskData.length > 0 ? (
                <div className="space-y-3">
                  {vendorRiskData.map((v, i) => (
                    <div key={v.vendor} className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 w-8">#{i + 1}</span>
                      <span className="text-sm text-white w-32">{v.vendor || "Unknown"}</span>
                      <div className="flex-1 h-4 bg-slate-600 rounded overflow-hidden">
                        <div 
                          className={`h-full ${v.risk >= 0.5 ? "bg-red-500" : v.risk >= 0.3 ? "bg-orange-500" : "bg-green-500"}`}
                          style={{ width: `${v.risk * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-20 text-right">
                        {(v.risk * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500 w-16 text-right">
                        {v.count} txns
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No vendor data available.</p>
              )}
            </div>
            
            {/* Geo Risk Distribution */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">🌍 Geographic Risk Distribution</h3>
              {geoRiskData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {geoRiskData.slice(0, 8).map((g) => (
                    <div key={g.region} className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-white font-medium">{g.region || "Unknown"}</p>
                      <p className={`text-2xl font-bold ${
                        g.risk >= 0.5 ? "text-red-400" : g.risk >= 0.3 ? "text-orange-400" : "text-green-400"
                      }`}>
                        {(g.risk * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">{g.count} transactions</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No geographic data available.</p>
              )}
            </div>
            
            {/* Fraud Trend Graph */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Fraud Trend (Last 14 Days)</h3>
              {fraudTrendData.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {fraudTrendData.map((d, i) => {
                    const maxCount = Math.max(...fraudTrendData.map(x => x.count), 1);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-red-500/70 hover:bg-red-500 rounded-t transition-colors"
                          style={{ height: `${(d.count / maxCount) * 100}%` }}
                          title={`${d.count} fraud cases`}
                        />
                        <span className="text-xs text-slate-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400">No trend data available.</p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Admin Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">🔍 Manual Fraud Detection</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Run fraud detection on all unreviewed transactions in the database.
                </p>
                <button
                  onClick={handleManualFraudDetection}
                  disabled={isLoading || apiStatus.status === "offline"}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isLoading ? "⏳ Processing..." : "🚀 Run Detection"}
                </button>
                {apiStatus.status === "offline" && (
                  <p className="mt-2 text-sm text-red-400">⚠️ ML API is offline</p>
                )}
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">📤 Extract Suspicious Transactions</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Export all transactions with fraud probability ≥ 50% to a CSV file.
                </p>
                <button
                  onClick={handleExtractSuspicious}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  📥 Export Suspicious
                </button>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">🗑️ Data Management</h3>
              <p className="text-sm text-slate-400 mb-4">
                Clear all stored data including users, transactions, and admin logs.
              </p>
              <button
                onClick={() => setConfirmAction({
                  type: "clearData",
                  target: null,
                  message: "Are you sure you want to clear ALL data? This action cannot be undone."
                })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="user">User</option>
                  <option value="investigator">Investigator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({ email: "", name: "", role: "user", password: "" });
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <p className="text-white">{editingUser.email}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="user">User</option>
                  <option value="investigator">Investigator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateUserRole(editingUser.id, editingUser.role)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Action</h3>
            <p className="text-slate-300 mb-6">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "toggleActive") {
                    handleToggleUserActive(confirmAction.target);
                  } else if (confirmAction.type === "deleteUser") {
                    handleDeleteUser(confirmAction.target.id);
                  } else if (confirmAction.type === "clearData") {
                    handleClearData();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400">Transaction ID</label>
                <p className="text-white font-mono">{selectedTransaction.transactionId}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Amount</label>
                <p className="text-white">${selectedTransaction.amount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Type</label>
                <p className="text-white">{selectedTransaction.type || "-"}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Step</label>
                <p className="text-white">{selectedTransaction.step}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Vendor</label>
                <p className="text-white">{selectedTransaction.vendor || "-"}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Region</label>
                <p className="text-white">{selectedTransaction.region || "-"}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Fraud Score</label>
                <p className={`font-bold ${(selectedTransaction.fraudScore || 0) >= 0.5 ? "text-red-400" : "text-green-400"}`}>
                  {((selectedTransaction.fraudScore || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Risk Level</label>
                <p className={`font-medium ${
                  selectedTransaction.riskLevel === "critical" ? "text-red-400" :
                  selectedTransaction.riskLevel === "high" ? "text-orange-400" :
                  selectedTransaction.riskLevel === "medium" ? "text-yellow-400" : "text-slate-400"
                }`}>
                  {selectedTransaction.riskLevel || "unknown"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Reviewed</label>
                <p className="text-white">{selectedTransaction.isReviewed ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400">Escalated</label>
                <p className="text-white">{selectedTransaction.isEscalated ? "Yes" : "No"}</p>
              </div>
              {selectedTransaction.nameOrig && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400">Origin Account</label>
                    <p className="text-white">{selectedTransaction.nameOrig}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400">Destination Account</label>
                    <p className="text-white">{selectedTransaction.nameDest}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              {!selectedTransaction.isReviewed && (
                <button
                  onClick={() => handleMarkReviewed(selectedTransaction.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  ✅ Mark as Reviewed
                </button>
              )}
              {!selectedTransaction.isEscalated && (
                <button
                  onClick={() => handleEscalate(selectedTransaction.id)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  🚨 Escalate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
