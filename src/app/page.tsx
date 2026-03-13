"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, BrainCircuit, Zap, Settings, Calendar, Database, AlertTriangle, TrendingUp } from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import KPIGrid from "@/components/dashboard/KPIGrid";
import RiskGauge from "@/components/dashboard/RiskGauge";
import SecurityAlertsPanel from "@/components/dashboard/SecurityAlerts";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import FraudTrendChart from "@/components/dashboard/FraudTrendChart";
import SuspiciousTransactionsTable from "@/components/dashboard/SuspiciousTransactionsTable";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

const defaultStats = {
  totalTransactions: 0,
  fraudDetected: 0,
  fraudRate: 0,
  riskScore: 0,
};

export default function Dashboard() {
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const [hasRealData, setHasRealData] = useState(false);
  const [processedAt, setProcessedAt] = useState<string>("");
  const [stats, setStats] = useState(defaultStats);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [savedFraudCases, setSavedFraudCases] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<{saving: boolean; message: string}>({saving: false, message: ""});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [fraudTrendData, setFraudTrendData] = useState<number[] | null>(null);

  const checkMlServiceHealth = useCallback(async () => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`, { method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("isActive");
    window.location.href = "/";
  }, []);

  const handleClearData = useCallback(() => {
    if (confirm("Are you sure you want to clear all stored data?")) {
      localStorage.removeItem("fraudguard_results");
      localStorage.removeItem("fraudguard_transactions");
      localStorage.removeItem("fraudguard_fraud_cases");
      setStats(defaultStats);
      setAlerts([]);
      setActivities([]);
      setHasRealData(false);
      setProcessedAt("");
      setRecentTransactions([]);
      setSavedFraudCases([]);
      setFraudTrendData(null);
    }
  }, []);

  const handleSaveToDatabase = useCallback(async () => {
    if (recentTransactions.length === 0) {
      setSaveStatus({ saving: false, message: "No transactions to save" });
      return;
    }

    setSaveStatus({ saving: true, message: "" });

    try {
      const highRiskTransactions = recentTransactions.filter(
        (txn) => (txn.fraud_score !== null && txn.fraud_score > 50) || txn.is_fraud === true
      );

      if (highRiskTransactions.length === 0) {
        setSaveStatus({ saving: false, message: "No high-risk transactions (>50% fraud probability) found" });
        return;
      }

      const existingCases = localStorage.getItem("fraudguard_fraud_cases");
      const existingCasesArray = existingCases ? JSON.parse(existingCases) : [];

      const newFraudCases = highRiskTransactions.map((txn) => ({
        transaction_id: txn.transaction_id || txn.nameorig || `TXN_${Date.now()}`,
        amount: txn.amount || 0,
        fraud_score: txn.fraud_score || (txn.is_fraud ? 95 : 0),
        savedAt: new Date().toISOString(),
        nameorig: txn.nameorig,
        nameDest: txn.nameDest,
      }));

      const existingIds = new Set(existingCasesArray.map((c: any) => c.transaction_id));
      const uniqueNewCases = newFraudCases.filter((c: any) => !existingIds.has(c.transaction_id));
      const allCases = [...existingCasesArray, ...uniqueNewCases];

      localStorage.setItem("fraudguard_fraud_cases", JSON.stringify(allCases));
      setSavedFraudCases(allCases);

      setSaveStatus({ saving: false, message: `Successfully saved ${uniqueNewCases.length} high-risk transaction(s) to database!` });
    } catch (error) {
      setSaveStatus({ saving: false, message: "Error saving transactions to database" });
    }
  }, [recentTransactions]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const storedData = localStorage.getItem("fraudguard_results");
        if (storedData && mounted) {
          const parsed = JSON.parse(storedData);
          setStats({
            totalTransactions: parsed.total_transactions || 0,
            fraudDetected: parsed.fraud_detected || 0,
            fraudRate: parsed.fraud_rate || 0,
            riskScore: Math.round((parsed.fraud_rate || 0) * 10),
          });
          setProcessedAt(parsed.processedAt || "");
          setHasRealData(true);

          const mockTrend = Array.from({ length: 14 }, () => Math.floor(Math.random() * 70) + 20);
          setFraudTrendData(mockTrend);

          const fraudRate = parsed.fraud_rate || 0;
          const newAlerts = [];
          
          if (fraudRate > 10) {
            newAlerts.push({
              id: "1",
              time: new Date().toLocaleTimeString(),
              severity: "critical" as const,
              title: "High Fraud Rate Detected",
              message: `Fraud rate has exceeded 10% threshold. Current rate: ${fraudRate.toFixed(2)}%`,
              source: "ML Engine",
              percentage: fraudRate,
            });
          }
          
          if (parsed.fraud_detected > 0) {
            newAlerts.push({
              id: "2",
              time: new Date().toLocaleTimeString(),
              severity: "warning" as const,
              title: "Fraud Cases Identified",
              message: `${parsed.fraud_detected} fraudulent transactions identified in dataset`,
              source: "Analysis Engine",
              percentage: Math.round((parsed.fraud_detected / parsed.total_transactions) * 100),
            });
          }

          setAlerts(newAlerts);

          const newActivities = [];
          newActivities.push({
            id: "1",
            time: new Date().toLocaleTimeString(),
            action: "Dataset Processed",
            source: "Upload System",
            status: "success" as const,
            details: `${parsed.total_transactions} transactions analyzed`,
          });

          if (parsed.fraud_detected > 0) {
            newActivities.push({
              id: "2",
              time: new Date().toLocaleTimeString(),
              action: "Fraud Detected",
              source: "ML Model",
              status: "warning" as const,
              details: `${parsed.fraud_detected} fraud cases found`,
            });
          }

          setActivities(newActivities);
        }

        const storedTransactions = localStorage.getItem("fraudguard_transactions");
        if (storedTransactions && mounted) {
          const txns = JSON.parse(storedTransactions);
          if (txns.length > 0) {
            setRecentTransactions(txns.slice(0, 50));
            setHasRealData(true);
          }
        }

        const savedFraudCasesData = localStorage.getItem("fraudguard_fraud_cases");
        if (savedFraudCasesData && mounted) {
          const cases = JSON.parse(savedFraudCasesData);
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
  }, [checkMlServiceHealth]);

  const suspiciousTransactions = recentTransactions.filter(
    (txn) => (txn.fraud_score !== null && txn.fraud_score > 50) || txn.is_fraud === true
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar mlStatus={mlStatus} loggedIn={loggedIn} userRole={userRole} onLogout={handleLogout} />

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
          <div
            className={`mb-6 p-4 rounded-xl border ${
              saveStatus.message.includes("Successfully")
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {saveStatus.message}
          </div>
        )}

        {hasRealData ? (
          <>
            <KPIGrid data={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <RiskGauge score={stats.riskScore} />
              </div>
              <div className="lg:col-span-2">
                <FraudTrendChart data={fraudTrendData} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <SecurityAlertsPanel alerts={alerts} />
              <ActivityFeed activities={activities} />
            </div>

            {suspiciousTransactions.length > 0 && (
              <div className="mb-6">
                <SuspiciousTransactionsTable
                  transactions={suspiciousTransactions}
                  onInvestigate={(txn) => console.log("Investigating:", txn)}
                />
              </div>
            )}

            {savedFraudCases.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
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
              <AlertTriangle className="w-10 h-10 text-slate-600" />
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
