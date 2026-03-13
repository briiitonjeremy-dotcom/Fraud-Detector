"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { isAdmin, logout } from "@/lib/api";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

interface ProcessedTransaction {
  transaction_id?: string;
  nameorig?: string;
  nameDest?: string;
  amount?: number;
  fraud_score?: number | null;
  is_fraud?: boolean;
  step?: number;
  type?: string;
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
  const [fraudTrend, setFraudTrend] = useState<{transactions: number; fraud: number; flagged: number}[]>([]);
  const [channelStats, setChannelStats] = useState<any[]>([]);
  const [highRiskVendors, setHighRiskVendors] = useState<any[]>([]);
  const [suspiciousTxns, setSuspiciousTxns] = useState<ProcessedTransaction[]>([]);
  const [fraudPatterns, setFraudPatterns] = useState<any[]>([]);

  const handleLogout = useCallback(() => {
    logout();
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
      setChannelStats([]);
      setHighRiskVendors([]);
      setSuspiciousTxns([]);
      setSavedFraudCases([]);
      setFraudPatterns([]);
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
    const now = new Date();
    
    newActivities.push({
      id: "1",
      time: "Just now",
      action: "Dataset Processed",
      source: "Data Pipeline",
      details: `${results.total_transactions.toLocaleString()} records analyzed`,
      status: "success",
    });

    if (results.fraud_rate > 10) {
      newAlerts.push({
        id: "alert-1",
        time: "2 min ago",
        severity: "critical",
        title: "High Fraud Rate Detected",
        message: `Fraud rate is ${results.fraud_rate.toFixed(2)}%, significantly above normal thresholds. Immediate investigation recommended.`,
        source: "ML Engine",
        percentage: Math.min(99, results.fraud_rate * 10),
      });
    } else if (results.fraud_rate > 5) {
      newAlerts.push({
        id: "alert-1",
        time: "5 min ago",
        severity: "critical",
        title: "Elevated Fraud Activity",
        message: `Fraud rate is ${results.fraud_rate.toFixed(2)}%, exceeding the 5% threshold.`,
        source: "ML Engine",
        percentage: Math.min(99, results.fraud_rate * 10),
      });
    } else if (results.fraud_rate > 2) {
      newAlerts.push({
        id: "alert-1",
        time: "10 min ago",
        severity: "warning",
        title: "Above Average Fraud Rate",
        message: `Fraud rate is ${results.fraud_rate.toFixed(2)}%, slightly above normal levels.`,
        source: "ML Engine",
        percentage: Math.min(99, results.fraud_rate * 10),
      });
    }

    if (results.fraud_detected > 0) {
      newActivities.unshift({
        id: "2",
        time: "1 min ago",
        action: "Fraud Detected",
        source: "AI Model",
        details: `${results.fraud_detected} fraudulent transactions identified`,
        status: "warning",
      });

      newAlerts.push({
        id: "alert-2",
        time: "1 min ago",
        severity: results.fraud_rate > 5 ? "critical" : "warning",
        title: `${results.fraud_detected} Fraud Cases Found`,
        message: `Out of ${results.total_transactions.toLocaleString()} transactions, ${results.fraud_detected} were flagged as fraudulent (${results.fraud_rate.toFixed(2)}%)`,
        source: "Analysis Engine",
        percentage: Math.round(results.fraud_rate * 10),
      });
    }

    const suspicious = txns.filter(t => (t.fraud_score ?? 0) > 50 || t.is_fraud === true);
    if (suspicious.length > 0) {
      newAlerts.push({
        id: "alert-3",
        time: "3 min ago",
        severity: suspicious.length > 10 ? "critical" : "warning",
        title: "Suspicious Activity Detected",
        message: `${suspicious.length} transactions have fraud scores above 50% and require investigation`,
        source: "Risk Engine",
        percentage: Math.round((suspicious.length / txns.length) * 100),
      });
    }

    setAlerts(newAlerts);
    setActivities(newActivities);

    const batchSize = Math.ceil(txns.length / 14);
    const trendData: {transactions: number; fraud: number; flagged: number}[] = [];
    for (let i = 0; i < 14; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, txns.length);
      const batch = txns.slice(start, end);
      const batchFraud = batch.filter(t => (t.fraud_score ?? 0) > 70 || t.is_fraud === true).length;
      const batchFlagged = batch.filter(t => (t.fraud_score ?? 0) > 50 || t.is_fraud === true).length;
      trendData.push({
        transactions: batch.length,
        fraud: batchFraud,
        flagged: batchFlagged,
      });
    }
    setFraudTrend(trendData);

    const vendorMap = new Map<string, { name: string; transactions: number; fraud: number }>();
    txns.forEach(txn => {
      const vendor = txn.nameDest || txn.nameorig || "Unknown";
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
      .slice(0, 6);
    setHighRiskVendors(vendors);

    setSuspiciousTxns(suspicious.slice(0, 50));

    const patterns: any[] = [];
    const highScoreCount = txns.filter(t => (t.fraud_score ?? 0) > 70).length;
    const velocityCount = txns.filter(t => {
      const amount = t.amount || 0;
      return amount > 100000;
    }).length;
    const newAccounts = txns.filter(t => {
      const step = t.step || 1;
      return step < 5;
    }).length;
    const offHours = txns.filter(t => {
      return false;
    }).length;
    
    if (highScoreCount > 0) {
      patterns.push({
        name: "High-Risk Scores",
        severity: "critical",
        description: "Transactions with fraud scores exceeding 70% threshold",
        frequency: Math.round((highScoreCount / txns.length) * 100),
      });
    }
    if (velocityCount > 0) {
      patterns.push({
        name: "High-Value Transactions",
        severity: "high",
        description: "Transactions exceeding normal value thresholds",
        frequency: Math.round((velocityCount / txns.length) * 100),
      });
    }
    if (newAccounts > 0) {
      patterns.push({
        name: "New Account Activity",
        severity: "high",
        description: "Transactions from newly created accounts",
        frequency: Math.round((newAccounts / txns.length) * 100),
      });
    }
    setFraudPatterns(patterns);

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
      setUserRole(isAdmin() ? "admin" : (localStorage.getItem("userRole") || null));
    };

    fetchData();
    checkAuth();

    const interval = setInterval(fetchData, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkMlServiceHealth, generateAnalytics]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛡</div>
          <h1>FraudGuard</h1>
        </div>
        
        <nav className="sidebar-nav">
          <Link href="/" className="nav-item active">
            <span className="nav-icon">⬡</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/upload" className="nav-item">
            <span className="nav-icon">⇪</span>
            <span>Upload Data</span>
          </Link>
          <Link href="/explain" className="nav-item">
            <span className="nav-icon">⟁</span>
            <span>Explainability</span>
          </Link>
          <Link href="/api-test" className="nav-item">
            <span className="nav-icon">⚡</span>
            <span>API Test</span>
          </Link>
          <Link href="/admin" className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Users & Admin</span>
          </Link>
          {loggedIn ? (
            <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          ) : (
            <Link href="/login" className="nav-item">
              <span className="nav-icon">🔐</span>
              <span>Login</span>
            </Link>
          )}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          {loggedIn && userRole && (
            <div style={{ 
              padding: "1rem", 
              marginBottom: "1rem",
              background: userRole === "admin" ? "rgba(168, 85, 247, 0.1)" : "rgba(59, 130, 246, 0.1)", 
              borderRadius: "12px", 
              border: `1px solid ${userRole === "admin" ? "rgba(168, 85, 247, 0.3)" : "rgba(59, 130, 246, 0.3)"}`
            }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>LOGGED IN AS</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ 
                  fontSize: "0.875rem", 
                  fontWeight: "bold",
                  color: userRole === "admin" ? "#a855f7" : "#3b82f6",
                  textTransform: "capitalize"
                }}>
                  {userRole}
                </span>
                <span style={{ 
                  fontSize: "0.625rem", 
                  padding: "2px 6px", 
                  borderRadius: "4px", 
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#22c55e"
                }}>
                  ACTIVE
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                {localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").email : ""}
              </div>
            </div>
          )}
          <div style={{ 
            padding: "1rem", 
            background: mlStatus === "online" ? "rgba(34, 197, 94, 0.1)" : mlStatus === "loading" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)", 
            borderRadius: "12px", 
            border: `1px solid ${mlStatus === "online" ? "rgba(34, 197, 94, 0.3)" : mlStatus === "loading" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>ML BACKEND</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ 
                width: "8px", 
                height: "8px", 
                borderRadius: "50%", 
                background: mlStatus === "online" ? "var(--success)" : mlStatus === "loading" ? "var(--warning)" : "var(--danger)",
                boxShadow: mlStatus === "online" ? "0 0 8px var(--success)" : "none"
              }} />
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {mlStatus === "online" ? "Connected" : mlStatus === "loading" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          {mlStatus === "offline" && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--danger)' }}>ML Processing Offline</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Fraud detection is unavailable. Please ensure the ML service is running.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <h1 className="page-title">Fraud Detection Center</h1>
              <p className="page-subtitle">Transaction Monitoring Dashboard</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "rgba(39, 39, 42, 0.6)",
                borderRadius: "8px",
                border: "1px solid rgba(63, 63, 70, 0.5)"
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>LIVE</span>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.75rem",
                padding: "0.5rem 1rem",
                background: "rgba(39, 39, 42, 0.6)",
                backdropFilter: "blur(10px)",
                borderRadius: "8px",
                border: "1px solid rgba(63, 63, 70, 0.5)"
              }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          {hasRealData && alerts.length > 0 && alerts.some(a => a.severity === "critical") && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px',
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ 
                  padding: "0.25rem 0.75rem", 
                  fontSize: "0.75rem", 
                  fontWeight: "bold",
                  background: "rgba(239, 68, 68, 0.2)", 
                  color: "#ef4444",
                  borderRadius: "4px"
                }}>
                  CRITICAL
                </span>
                <span style={{ fontSize: "0.875rem", color: "#ef4444" }}>
                  Anomaly Detected
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {alerts.find(a => a.severity === "critical")?.message || "Unusual transaction behavior detected. Investigation required."}
              </p>
            </div>
          )}

          {hasRealData && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: "1.5rem" }}>
              <button 
                onClick={handleSaveToDatabase}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                disabled={saveStatus.saving}
              >
                {saveStatus.saving ? '⏳ Saving...' : '💾 Save Suspicious'}
              </button>
              <button 
                onClick={handleClearData}
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                🗑 Clear Data
              </button>
            </div>
          )}
        </div>

        {saveStatus.message && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem 1rem', 
            background: saveStatus.message.includes('Successfully') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${saveStatus.message.includes('Successfully') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '8px',
            color: saveStatus.message.includes('Successfully') ? 'var(--success)' : 'var(--warning)',
            fontSize: '0.875rem'
          }}>
            {saveStatus.message}
          </div>
        )}

        {hasRealData ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
                <div className="stat-change positive">Processed from dataset</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Fraud Detected</div>
                <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.fraudDetected.toLocaleString()}</div>
                <div className="stat-change negative">Flagged by AI</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Fraud Rate</div>
                <div className="stat-value" style={{ color: stats.fraudRate > 5 ? "var(--danger)" : stats.fraudRate > 2 ? "var(--warning)" : "var(--success)" }}>
                  {stats.fraudRate.toFixed(2)}%
                </div>
                <div className="stat-change" style={{ color: stats.fraudRate > 5 ? "var(--danger-light)" : "var(--text-muted)" }}>
                  {stats.fraudRate > 5 ? "Above threshold" : "Within normal range"}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Risk Score</div>
                <div className="stat-value" style={{ 
                  color: stats.riskScore > 70 ? "var(--danger)" : stats.riskScore > 40 ? "var(--warning)" : "var(--success)" 
                }}>
                  {stats.riskScore}
                </div>
                <div>
                  <span className={stats.riskScore > 70 ? "badge badge-danger" : stats.riskScore > 40 ? "badge badge-warning" : "badge badge-success"}>
                    {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
                  </span>
                </div>
              </div>
            </div>

            {fraudTrend.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-header">
                  <h3 className="card-title">Fraud Trend</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Transaction analysis from processed dataset
                  </span>
                </div>
                <div className="chart-container">
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: "200px", padding: "1rem" }}>
                    {fraudTrend.map((data, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <div style={{ 
                          width: "100%", 
                          maxWidth: "30px",
                          height: `${Math.max((data.transactions / Math.max(...fraudTrend.map(d => d.transactions))) * 180, 4)}px`, 
                          background: "var(--primary)",
                          borderRadius: "4px 4px 0 0",
                          opacity: 0.7
                        }} />
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "2rem", padding: "0 1rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--primary)" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Transactions</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--danger)" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fraud: {fraudTrend.reduce((a, b) => a + b.fraud, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Real-Time Risk Score</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Live</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
                  <div className="risk-gauge">
                    <div className="gauge-bg" />
                    <div className="gauge-cover" />
                    <div className="gauge-value" style={{ 
                      color: stats.riskScore > 70 ? "#ef4444" : stats.riskScore > 40 ? "#f59e0b" : "#10b981"
                    }}>
                      {stats.riskScore}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <span className={stats.riskScore > 70 ? "badge badge-danger" : stats.riskScore > 40 ? "badge badge-warning" : "badge badge-success"}>
                    {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Security Alerts</h3>
                  {alerts.length > 0 && (
                    <span className="badge badge-danger">{alerts.filter(a => a.severity === "critical").length} Critical</span>
                  )}
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {alerts.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem" }}>
                      {alerts.map((alert, i) => (
                        <div key={i} style={{ 
                          padding: "0.75rem", 
                          background: "rgba(0, 0, 0, 0.2)", 
                          borderRadius: "8px",
                          borderLeft: `3px solid ${alert.severity === "critical" ? "#ef4444" : alert.severity === "warning" ? "#f59e0b" : "#3b82f6"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span className={alert.severity === "critical" ? "badge badge-danger" : alert.severity === "warning" ? "badge badge-warning" : "badge badge-info"}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.time}</span>
                          </div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                            {alert.title}
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                      <p style={{ color: "var(--text-muted)" }}>No security alerts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header">
                <h3 className="card-title">Activity Feed</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", marginRight: "0.5rem" }} />
                  Live • {activities.length} events
                </span>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {activities.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {activities.map((item, i) => (
                      <div key={i} style={{ 
                        padding: "0.75rem 1rem", 
                        borderBottom: i < activities.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem"
                      }}>
                        <span style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          background: item.status === "success" ? "var(--success)" : item.status === "warning" ? "var(--danger)" : "var(--primary)",
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{item.action}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.source} • {item.details}</div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)" }}>No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {suspiciousTxns.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div className="card-header">
                  <h3 className="card-title" style={{ color: "var(--danger)" }}>Suspicious Transactions</h3>
                  <span className="badge badge-danger">{suspiciousTxns.length} flagged</span>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Fraud Score</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousTxns.slice(0, 10).map((txn, i) => {
                        const score = txn.fraud_score ?? (txn.is_fraud ? 95 : 0);
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{txn.transaction_id || txn.nameorig || "N/A"}</td>
                            <td>{txn.nameorig || "Unknown"}</td>
                            <td>{txn.nameDest || "Unknown"}</td>
                            <td>${(txn.amount || 0).toLocaleString()}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${score}%`, height: '100%', background: score > 70 ? 'var(--danger)' : 'var(--warning)', borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem' }}>{Math.round(score)}%</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-danger">SUSPICIOUS</span>
                            </td>
                            <td>
                              <Link href={`/explain?id=${txn.transaction_id || txn.nameorig}`} style={{ fontSize: "0.75rem", color: "var(--primary)" }}>
                                Investigate
                              </Link>
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
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-header">
                  <h3 className="card-title">High-Risk Recipients</h3>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Recipient</th>
                        <th>Transactions</th>
                        <th>Fraud Count</th>
                        <th>Fraud Rate</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskVendors.map((vendor, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: i < 3 ? "var(--danger)" : "var(--text-muted)" }}>{i + 1}</td>
                          <td style={{ fontWeight: i < 3 ? 600 : 400 }}>
                            {vendor.name}
                            {i < 3 && <span style={{ marginLeft: "0.5rem", color: "var(--danger)" }}>⚠</span>}
                          </td>
                          <td>{vendor.transactions.toLocaleString()}</td>
                          <td>{vendor.fraud}</td>
                          <td>
                            <span className={vendor.rate > 5 ? "badge badge-danger" : vendor.rate > 3 ? "badge badge-warning" : "badge badge-success"}>
                              {vendor.rate.toFixed(2)}%
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              fontSize: "0.75rem", 
                              fontWeight: 600,
                              color: vendor.rate > 5 ? "#ef4444" : vendor.rate > 3 ? "#f59e0b" : "#10b981"
                            }}>
                              {vendor.rate > 5 ? "CRITICAL" : vendor.rate > 3 ? "HIGH" : "MEDIUM"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {fraudPatterns.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-header">
                  <h3 className="card-title">Fraud Pattern Insights</h3>
                  <span className="badge badge-info">{fraudPatterns.length} Active</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem", padding: "1rem" }}>
                  {fraudPatterns.map((pattern, i) => (
                    <div key={i} style={{ 
                      padding: "1rem", 
                      background: "rgba(0, 0, 0, 0.2)", 
                      borderRadius: "8px",
                      borderLeft: `3px solid ${pattern.severity === "critical" ? "#ef4444" : pattern.severity === "high" ? "#f59e0b" : "#3b82f6"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{pattern.name}</span>
                        <span className={pattern.severity === "critical" ? "badge badge-danger" : pattern.severity === "high" ? "badge badge-warning" : "badge badge-info"}>
                          {pattern.severity.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{pattern.description}</p>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)" }}>
                        {pattern.frequency}% frequency
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedFraudCases.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div className="card-header">
                  <h3 className="card-title" style={{ color: "var(--danger)" }}>Saved Fraud Cases</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {savedFraudCases.length} stored in database
                  </span>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Fraud Score</th>
                        <th>Saved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedFraudCases.slice(0, 10).map((txn, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: "var(--danger)" }}>{txn.transaction_id}</td>
                          <td>{txn.nameorig || "Unknown"}</td>
                          <td>{txn.nameDest || "Unknown"}</td>
                          <td>${txn.amount?.toLocaleString() || "0"}</td>
                          <td>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>{Math.round(txn.fraud_score)}%</span>
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(txn.savedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center", 
            padding: "6rem 2rem",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "16px",
            border: "1px dashed rgba(255, 255, 255, 0.1)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1.5rem", opacity: 0.5 }}>📊</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              No Data Available
            </h2>
            <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "400px", marginBottom: "2rem" }}>
              Upload a dataset to see fraud detection results, risk analysis, and suspicious transactions.
            </p>
            <Link href="/upload" className="btn btn-primary">
              ⇪ Upload Dataset
            </Link>
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>Quick Actions</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/upload" className="btn btn-primary">
              ⇪ Upload Dataset
            </Link>
            <Link href="/explain" className="btn btn-secondary">
              ⟁ Explain Transaction
            </Link>
            <Link href="/api-test" className="btn btn-secondary">
              ⚡ Test API
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
