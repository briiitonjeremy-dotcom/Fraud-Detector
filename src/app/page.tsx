"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, BrainCircuit, Zap, Settings, Database, AlertTriangle, Shield, Calendar, TrendingUp, Activity, LayoutGrid, LogIn, LogOut as LogOutIcon, User as UserIcon } from "lucide-react";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

interface ProcessedTransaction {
  transaction_id?: string;
  nameorig?: string;
  nameDest?: string;
  amount?: number;
  fraud_score?: number | null;
  is_fraud?: boolean;
  step?: number;
  [key: string]: any;
}

interface ProcessedResults {
  total_transactions: number;
  fraud_detected: number;
  fraud_rate: number;
  processedAt?: string;
}

interface FraudCase {
  transaction_id: string;
  amount: number;
  fraud_score: number;
  savedAt: string;
  nameorig?: string;
  nameDest?: string;
}

const defaultStats = {
  totalTransactions: 0,
  fraudDetected: 0,
  fraudRate: 0,
  riskScore: 0,
};

export default function Dashboard() {
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const [hasRealData, setHasRealData] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [savedFraudCases, setSavedFraudCases] = useState<FraudCase[]>([]);
  const [saveStatus, setSaveStatus] = useState<{saving: boolean; message: string}>({saving: false, message: ""});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [fraudTrend, setFraudTrend] = useState<number[]>([]);
  const [highRiskVendors, setHighRiskVendors] = useState<any[]>([]);
  const [suspiciousTxns, setSuspiciousTxns] = useState<ProcessedTransaction[]>([]);

  const navItems: { href: string; icon: any; label: string; active?: boolean; onClick?: () => void }[] = [
    { href: "/", icon: LayoutGrid, label: "Dashboard", active: true },
    { href: "/upload", icon: Upload, label: "Upload Dataset", active: false },
    { href: "/explain", icon: BrainCircuit, label: "Explain", active: false },
    { href: "/api-test", icon: Zap, label: "API Test", active: false },
    { href: "/admin", icon: Settings, label: "Admin", active: false },
    loggedIn 
      ? { href: "#", icon: LogOutIcon, label: "Logout", active: false, onClick: () => { localStorage.clear(); window.location.href = "/"; } }
      : { href: "/login", icon: LogIn, label: "Login", active: false },
  ];

  const handleLogout = useCallback(() => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("isActive");
    window.location.href = "/";
  }, []);

  const handleClearData = useCallback(() => {
    if (confirm("Are you sure you want to clear all stored data?")) {
      localStorage.removeItem('fraudguard_results');
      localStorage.removeItem('fraudguard_transactions');
      localStorage.removeItem('fraudguard_fraud_cases');
      setStats(defaultStats);
      setTransactions([]);
      setAlerts([]);
      setActivities([]);
      setHasRealData(false);
      setFraudTrend([]);
      setHighRiskVendors([]);
      setSuspiciousTxns([]);
      setSavedFraudCases([]);
    }
  }, []);

  const handleSaveToDatabase = useCallback(async () => {
    if (transactions.length === 0) {
      setSaveStatus({ saving: false, message: "No transactions to save" });
      return;
    }

    setSaveStatus({ saving: true, message: "" });

    try {
      const highRiskTransactions = transactions.filter(txn => 
        (txn.fraud_score !== null && txn.fraud_score !== undefined && txn.fraud_score > 50) || 
        txn.is_fraud === true
      );
      
      if (highRiskTransactions.length === 0) {
        setSaveStatus({ saving: false, message: "No high-risk transactions (>50% fraud probability) found" });
        return;
      }
      
      const existingCases = localStorage.getItem('fraudguard_fraud_cases');
      const existingCasesArray: FraudCase[] = existingCases ? JSON.parse(existingCases) : [];
      
      const newFraudCases = highRiskTransactions.map(txn => ({
        transaction_id: txn.transaction_id || txn.nameorig || `TXN_${Date.now()}_${Math.random()}`,
        amount: txn.amount || 0,
        fraud_score: txn.fraud_score || (txn.is_fraud ? 95 : 0),
        savedAt: new Date().toISOString(),
        nameorig: txn.nameorig,
        nameDest: txn.nameDest
      }));
      
      const existingIds = new Set(existingCasesArray.map(c => c.transaction_id));
      const uniqueNewCases = newFraudCases.filter(c => !existingIds.has(c.transaction_id));
      const allCases = [...existingCasesArray, ...uniqueNewCases];
      
      localStorage.setItem('fraudguard_fraud_cases', JSON.stringify(allCases));
      setSavedFraudCases(allCases);
      
      setSaveStatus({ saving: false, message: `Successfully saved ${uniqueNewCases.length} high-risk transaction(s) to database!` });
    } catch (error) {
      setSaveStatus({ saving: false, message: "Error saving transactions to database" });
    }
  }, [transactions]);

  const generateAnalytics = useCallback((txns: ProcessedTransaction[], results: ProcessedResults) => {
    const newAlerts: any[] = [];
    const newActivities: any[] = [];
    
    newActivities.push({
      id: "1",
      time: new Date().toLocaleTimeString(),
      action: "Dataset Uploaded",
      source: "Upload System",
      status: "success" as const,
      details: `${results.total_transactions} transactions loaded`,
    });

    if (results.fraud_rate > 5) {
      newAlerts.push({
        id: "alert-1",
        time: new Date().toLocaleTimeString(),
        severity: "critical" as const,
        title: "High Fraud Rate Detected",
        message: `Fraud rate is ${results.fraud_rate.toFixed(2)}%, exceeding the 5% threshold`,
        source: "ML Engine",
        percentage: results.fraud_rate,
      });
    } else if (results.fraud_rate > 2) {
      newAlerts.push({
        id: "alert-1",
        time: new Date().toLocaleTimeString(),
        severity: "warning" as const,
        title: "Elevated Fraud Rate",
        message: `Fraud rate is ${results.fraud_rate.toFixed(2)}%, above normal levels`,
        source: "ML Engine",
        percentage: results.fraud_rate,
      });
    }

    if (results.fraud_detected > 0) {
      newActivities.push({
        id: "2",
        time: new Date().toLocaleTimeString(),
        action: "Fraud Detected",
        source: "ML Model",
        status: "warning" as const,
        details: `${results.fraud_detected} fraudulent transactions identified`,
      });

      newAlerts.push({
        id: "alert-2",
        time: new Date().toLocaleTimeString(),
        severity: results.fraud_rate > 5 ? "critical" as const : "warning" as const,
        title: `${results.fraud_detected} Fraud Cases Found`,
        message: `Out of ${results.total_transactions} transactions, ${results.fraud_detected} were flagged as fraudulent`,
        source: "Analysis Engine",
        percentage: results.fraud_rate,
      });
    }

    const suspicious = txns.filter(t => (t.fraud_score ?? 0) > 50 || t.is_fraud === true);
    if (suspicious.length > 10) {
      newAlerts.push({
        id: "alert-3",
        time: new Date().toLocaleTimeString(),
        severity: "warning" as const,
        title: "High Volume of Suspicious Activity",
        message: `${suspicious.length} transactions have fraud scores above 50%`,
        source: "Risk Engine",
        percentage: Math.round((suspicious.length / txns.length) * 100),
      });
    }

    setAlerts(newAlerts);
    setActivities(newActivities);

    const fraudCount = txns.filter(t => (t.fraud_score ?? 0) > 50 || t.is_fraud === true).length;
    const batchSize = Math.ceil(txns.length / 14);
    const trendData: number[] = [];
    for (let i = 0; i < 14; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, txns.length);
      const batch = txns.slice(start, end);
      const batchFraud = batch.filter(t => (t.fraud_score ?? 0) > 50 || t.is_fraud === true).length;
      trendData.push(batchFraud);
    }
    setFraudTrend(trendData);

    const vendorMap = new Map<string, { name: string; transactions: number; fraud: number }>();
    txns.forEach(txn => {
      const vendor = txn.nameorig || txn.nameDest || "Unknown";
      const existing = vendorMap.get(vendor) || { name: vendor, transactions: 0, fraud: 0 };
      existing.transactions++;
      if ((txn.fraud_score ?? 0) > 50 || txn.is_fraud === true) {
        existing.fraud++;
      }
      vendorMap.set(vendor, existing);
    });
    const vendors = Array.from(vendorMap.values())
      .map(v => ({ ...v, rate: v.transactions > 0 ? (v.fraud / v.transactions) * 100 : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
    setHighRiskVendors(vendors);

    setSuspiciousTxns(suspicious.slice(0, 50));
  }, []);

  const checkMlServiceHealth = useCallback(async () => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`, { method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const storedResults = localStorage.getItem('fraudguard_results');
        const storedTransactions = localStorage.getItem('fraudguard_transactions');
        const savedCasesData = localStorage.getItem('fraudguard_fraud_cases');

        if (storedResults && storedTransactions && mounted) {
          const results: ProcessedResults = JSON.parse(storedResults);
          const txns: ProcessedTransaction[] = JSON.parse(storedTransactions);

          setStats({
            totalTransactions: results.total_transactions || 0,
            fraudDetected: results.fraud_detected || 0,
            fraudRate: results.fraud_rate || 0,
            riskScore: Math.round((results.fraud_rate || 0) * 10),
          });
          
          setTransactions(txns);
          setHasRealData(true);

          generateAnalytics(txns, results);
        }

        if (savedCasesData && mounted) {
          const cases = JSON.parse(savedCasesData);
          setSavedFraudCases(cases);
        }
      } catch (e) {
        console.error("[Dashboard] Error reading localStorage:", e);
      }

      const isMlOnline = await checkMlServiceHealth();
      if (mounted) {
        setMlStatus(isMlOnline ? "online" : "offline");
      }
    };

    const checkAuth = () => {
      const token = localStorage.getItem("session_token");
      const role = localStorage.getItem("userRole");
      setLoggedIn(!!token);
      setUserRole(role);
    };

    fetchData();
    checkAuth();

    const interval = setInterval(fetchData, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkMlServiceHealth, generateAnalytics]);

  const LayoutDashboard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
  const LogOut = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
  const User = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-64 min-h-screen bg-slate-900/95 border-r border-slate-800/60 flex flex-col">
        <div className="p-5 border-b border-slate-800/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FraudGuard</h1>
              <p className="text-xs text-slate-500">Fraud Detection</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              item.onClick ? (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-200 w-full"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.active ? "text-cyan-400" : ""}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-slate-800/50">
          {loggedIn && userRole && (
            <div className={`p-3 rounded-xl border ${userRole === "admin" ? "bg-purple-500/10 border-purple-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className={`w-4 h-4 ${userRole === "admin" ? "text-purple-400" : "text-blue-400"}`} />
                <span className={`text-sm font-semibold capitalize ${userRole === "admin" ? "text-purple-400" : "text-blue-400"}`}>{userRole}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").email : ""}
              </p>
            </div>
          )}

          <div className={`p-3 rounded-xl border ${mlStatus === "online" ? "bg-emerald-500/10 border-emerald-500/30" : mlStatus === "loading" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`w-4 h-4 ${mlStatus === "online" ? "text-emerald-400" : mlStatus === "loading" ? "text-amber-400" : "text-red-400"}`} />
              <span className="text-xs font-medium text-slate-400">ML Backend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                mlStatus === "online" ? "bg-emerald-500 animate-pulse" : mlStatus === "loading" ? "bg-amber-500 animate-pulse" : "bg-red-500"
              }`} />
              <span className="text-xs text-slate-500">
                {mlStatus === "online" ? "Connected" : mlStatus === "loading" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
          </div>

          {loggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {mlStatus === "offline" && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">ML Processing Offline</p>
              <p className="text-xs text-slate-400">Fraud detection is unavailable. Please ensure the ML service is running.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Fraud Detection Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time monitoring and analytics for financial transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            {hasRealData && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToDatabase}
                  disabled={saveStatus.saving}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">{saveStatus.saving ? "Saving..." : "Save Suspicious"}</span>
                </button>
                <button
                  onClick={handleClearData}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-700/50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Data</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {saveStatus.message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            saveStatus.message.includes("Successfully") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {saveStatus.message}
          </div>
        )}

        {hasRealData ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-transparent blur-2xl" />
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{stats.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">Analyzed transactions</p>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-600/5 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-transparent blur-2xl" />
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fraud Detected</p>
                <p className="text-2xl font-bold text-white">{stats.fraudDetected.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">Flagged transactions</p>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-transparent blur-2xl" />
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fraud Rate</p>
                <p className="text-2xl font-bold text-white">{stats.fraudRate.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-2">Fraud percentage</p>
              </div>

              <div className={`relative overflow-hidden rounded-xl border ${stats.riskScore > 70 ? "border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-600/5" : stats.riskScore > 40 ? "border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/5" : "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-600/5"} p-5`}>
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 transform translate-x-8 -translate-y-8">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${stats.riskScore > 70 ? "from-red-400" : stats.riskScore > 40 ? "from-amber-400" : "from-emerald-400"} to-transparent blur-2xl`} />
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Risk Score</p>
                <p className={`text-2xl font-bold ${stats.riskScore > 70 ? "text-red-400" : stats.riskScore > 40 ? "text-amber-400" : "text-emerald-400"}`}>{stats.riskScore}</p>
                <p className={`text-xs mt-2 ${stats.riskScore > 70 ? "text-red-400" : stats.riskScore > 40 ? "text-amber-400" : "text-emerald-400"}`}>
                  {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5">
                <h3 className="text-base font-semibold text-white mb-4">Risk Score</h3>
                <div className="relative flex justify-center py-4">
                  <div className="relative w-40 h-20 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(stats.riskScore / 100) * 251.2} 251.2`} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-14 bg-white origin-bottom transition-all duration-1000" style={{ transform: `translateX(-50%) rotate(${-90 + (stats.riskScore / 100) * 180}deg)` }} />
                  </div>
                </div>
                <div className="text-center -mt-2">
                  <span className="text-4xl font-bold text-white">{stats.riskScore}</span>
                  <span className="text-lg text-slate-500">/100</span>
                </div>
                <div className="text-center mt-3">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    stats.riskScore > 70 ? "bg-red-500/20 text-red-400 border border-red-500/30" : stats.riskScore > 40 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-xl border border-slate-800/60 bg-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Fraud Trend</h3>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Fraud Count
                  </span>
                </div>
                <div className="h-40 flex items-end justify-between gap-2">
                  {fraudTrend.length > 0 ? fraudTrend.map((val, i) => {
                    const max = Math.max(...fraudTrend);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full h-32 flex items-end">
                          <div 
                            className="w-full rounded-t-sm bg-gradient-to-t from-red-500/80 to-red-300/60"
                            style={{ height: `${max > 0 ? (val / max) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{i + 1}</span>
                      </div>
                    );
                  }) : (
                    <div className="flex-1 h-32 flex items-end justify-center gap-1">
                      {[65, 45, 78, 52, 90, 68, 42, 55, 73, 48, 82, 61, 38, 70].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full h-32 flex items-end">
                            <div 
                              className="w-full rounded-t-sm bg-gradient-to-t from-red-500/40 to-red-300/20"
                              style={{ height: `${val}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
                <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                  <h3 className="text-base font-semibold text-white">Security Alerts</h3>
                  {alerts.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                      {alerts.length} Alerts
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length > 0 ? alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border-b border-slate-800/30 hover:bg-slate-800/20 ${
                      alert.severity === "critical" ? "bg-red-500/5" : alert.severity === "warning" ? "bg-amber-500/5" : "bg-cyan-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          alert.severity === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : alert.severity === "warning" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-slate-500">{alert.time}</span>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{alert.title}</h4>
                      <p className="text-xs text-slate-400">{alert.message}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500">No security alerts</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
                <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                  <h3 className="text-base font-semibold text-white">Activity Feed</h3>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {activities.length > 0 ? activities.map((item, i) => (
                    <div key={item.id} className="relative pl-6 pr-4 py-3 hover:bg-slate-800/20">
                      {i < activities.length - 1 && <div className="absolute left-[11px] top-10 bottom-0 w-px bg-slate-800/50" />}
                      <div className={`absolute left-2 top-3.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 ${
                        item.status === "success" ? "bg-emerald-500" : item.status === "warning" ? "bg-amber-500" : "bg-cyan-500"
                      } ${item.status === "warning" ? "animate-pulse" : ""}`} />
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{item.action}</p>
                          <p className="text-xs text-slate-500">{item.source} • {item.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{item.time}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {suspiciousTxns.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 mb-6 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-base font-semibold text-white">Suspicious Transactions</h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                    {suspiciousTxns.length} Found
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-red-500/20 bg-red-500/5">
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">Transaction ID</th>
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">From</th>
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">To</th>
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">Amount</th>
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">Fraud Score</th>
                        <th className="text-left p-4 text-xs font-semibold text-red-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousTxns.slice(0, 15).map((txn, i) => {
                        const score = txn.fraud_score ?? (txn.is_fraud ? 95 : 0);
                        return (
                          <tr key={i} className="border-b border-red-500/10 hover:bg-red-500/5">
                            <td className="p-4 text-sm font-medium text-white">{txn.transaction_id || txn.nameorig || "N/A"}</td>
                            <td className="p-4 text-sm text-slate-300">{txn.nameorig || "Unknown"}</td>
                            <td className="p-4 text-sm text-slate-300">{txn.nameDest || "Unknown"}</td>
                            <td className="p-4 text-sm font-semibold text-white">${(txn.amount || 0).toLocaleString()}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${score}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-red-400">{Math.round(score)}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                <AlertTriangle className="w-3 h-3" /> Fraud
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {highRiskVendors.length > 0 && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 mb-6 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                  <h3 className="text-base font-semibold text-white">High-Risk Vendors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/50 bg-slate-800/30">
                        <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Vendor</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Transactions</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Fraud</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskVendors.map((vendor, i) => (
                        <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                          <td className="p-4">
                            <span className="text-sm font-medium text-white">
                              {vendor.name}
                              {i < 2 && <span className="ml-2 text-red-400">⚠</span>}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-300">{vendor.transactions.toLocaleString()}</td>
                          <td className="p-4 text-sm text-slate-300">{vendor.fraud}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              vendor.rate > 5 ? "bg-red-500/20 text-red-400" : vendor.rate > 3 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                            }`}>
                              {vendor.rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {savedFraudCases.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400">Saved Fraud Cases (Database)</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                    {savedFraudCases.length} stored
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-red-500/20">
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">Transaction ID</th>
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">From</th>
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">To</th>
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">Amount</th>
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">Fraud Score</th>
                        <th className="text-left pb-3 text-xs font-semibold text-red-400 uppercase">Saved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedFraudCases.slice(0, 10).map((txn, i) => (
                        <tr key={i} className="border-b border-red-500/10">
                          <td className="py-3 text-sm font-semibold text-red-400">{txn.transaction_id}</td>
                          <td className="py-3 text-sm text-slate-300">{txn.nameorig || "Unknown"}</td>
                          <td className="py-3 text-sm text-slate-300">{txn.nameDest || "Unknown"}</td>
                          <td className="py-3 text-sm text-white">${(txn.amount || 0).toLocaleString()}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${txn.fraud_score}%` }} />
                              </div>
                              <span className="text-sm text-red-400">{Math.round(txn.fraud_score)}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-xs text-slate-500">{new Date(txn.savedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Data Available</h2>
            <p className="text-sm text-slate-400 mb-6 text-center max-w-md">
              Upload a dataset to see fraud detection results, risk analysis, and suspicious transactions.
            </p>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Dataset</span>
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Dataset</span>
            </Link>
            <Link
              href="/explain"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="text-sm">Explain Transaction</span>
            </Link>
            <Link
              href="/api-test"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm">Test API</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
