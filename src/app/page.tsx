"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ML Service URL - from Render
const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

// Navigation items
const navItems = [
  { href: "/", icon: "⬡", label: "Dashboard", active: true },
  { href: "/upload", icon: "⇪", label: "Upload Dataset", active: false },
  { href: "/explain", icon: "⟁", label: "Explain", active: false },
  { href: "/api-test", icon: "⚡", label: "API Test", active: false },
];

// Demo data for when ML service is unavailable
const defaultStats = {
  totalTransactions: 0,
  fraudDetected: 0,
  fraudRate: 0,
  riskScore: 0,
};

export default function Dashboard() {
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [hasRealData, setHasRealData] = useState(false);
  const [processedAt, setProcessedAt] = useState<string>("");
  const [stats, setStats] = useState(defaultStats);
  const [vendors, setVendors] = useState<{name: string, transactions: number, fraud: number, rate: number}[]>([]);
  const [alerts, setAlerts] = useState<{time: string, severity: string, message: string}[]>([]);
  const [recentTransaction, setRecentTransaction] = useState<{id: string, score: number, isFraud: boolean, amount?: number, vendor?: string} | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<{transaction_id: string, amount: number, vendor_name?: string, fraud_score?: number | null, is_fraud?: boolean, nameorig?: string, nameDest?: string}[]>([]);
  const [savedFraudCases, setSavedFraudCases] = useState<{transaction_id: string, amount: number, fraud_score: number, savedAt: string, nameorig?: string, nameDest?: string}[]>([]);
  const [saveStatus, setSaveStatus] = useState<{saving: boolean, message: string}>({saving: false, message: ""});
  const isMounted = useCallback(() => { let mounted = true; return () => { mounted = false; }; }, []);

  // Handle clearing all data
  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all stored data? This will remove all processed datasets and transaction history.")) {
      localStorage.removeItem('fraudguard_results');
      localStorage.removeItem('fraudguard_transactions');
      localStorage.removeItem('fraudguard_fraud_cases');
      setStats(defaultStats);
      setVendors([]);
      setAlerts([]);
      setHasRealData(false);
      setProcessedAt("");
      setRecentTransaction(null);
      setRecentTransactions([]);
      setSavedFraudCases([]);
    }
  };

  // Save high-risk transactions (fraud probability > 50%) to database
  const handleSaveToDatabase = async () => {
    if (recentTransactions.length === 0) {
      setSaveStatus({saving: false, message: "No transactions to save"});
      return;
    }
    
    setSaveStatus({saving: true, message: ""});
    
    try {
      // Filter transactions with fraud probability > 50%
      const highRiskTransactions = recentTransactions.filter(txn => 
        (txn.fraud_score !== null && txn.fraud_score !== undefined && txn.fraud_score > 50) || 
        txn.is_fraud === true
      );
      
      if (highRiskTransactions.length === 0) {
        setSaveStatus({saving: false, message: "No high-risk transactions (>50% fraud probability) found"});
        return;
      }
      
      // Get existing saved cases
      const existingCases = localStorage.getItem('fraudguard_fraud_cases');
      const existingCasesArray = existingCases ? JSON.parse(existingCases) : [];
      
      // Create new fraud cases with timestamp
      const newFraudCases = highRiskTransactions.map(txn => ({
        transaction_id: txn.transaction_id || txn.nameorig || `TXN_${Date.now()}`,
        amount: txn.amount || 0,
        fraud_score: txn.fraud_score || (txn.is_fraud ? 95 : 0),
        savedAt: new Date().toISOString(),
        nameorig: txn.nameorig,
        nameDest: txn.nameDest
      }));
      
      // Merge with existing cases (avoid duplicates)
      const existingIds = new Set(existingCasesArray.map((c: any) => c.transaction_id));
      const uniqueNewCases = newFraudCases.filter((c: any) => !existingIds.has(c.transaction_id));
      const allCases = [...existingCasesArray, ...uniqueNewCases];
      
      // Save to localStorage (acts as our database)
      localStorage.setItem('fraudguard_fraud_cases', JSON.stringify(allCases));
      setSavedFraudCases(allCases);
      
      setSaveStatus({saving: false, message: `Successfully saved ${uniqueNewCases.length} high-risk transaction(s) to database!`});
    } catch (error) {
      setSaveStatus({saving: false, message: "Error saving transactions to database"});
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      // First, check localStorage for processed data
      try {
        const storedData = localStorage.getItem('fraudguard_results');
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
          setLastUpdate(new Date().toLocaleTimeString());
        }
        
        // Also check for stored transactions (from Explain page or Upload)
        const storedTransactions = localStorage.getItem('fraudguard_transactions');
        if (storedTransactions && mounted) {
          const txns = JSON.parse(storedTransactions);
          if (txns.length > 0) {
            // Get the most recent transaction (first one is most recent)
            const latestTxn = txns[0];
            setRecentTransaction({
              id: latestTxn.transaction_id || latestTxn.nameorig || 'Unknown',
              score: latestTxn.fraud_score !== null ? (latestTxn.fraud_score || (latestTxn.is_fraud ? 95 : Math.random() * 20)) : 0,
              isFraud: latestTxn.is_fraud || false,
              amount: latestTxn.amount,
              vendor: latestTxn.nameorig || latestTxn.vendor_name
            });
            // Store all recent transactions for display (up to 50)
            setRecentTransactions(txns.slice(0, 50));
            setHasRealData(true);
          }
        }
        
        // Load saved fraud cases from database
        const savedFraudCasesData = localStorage.getItem('fraudguard_fraud_cases');
        if (savedFraudCasesData && mounted) {
          const cases = JSON.parse(savedFraudCasesData);
          setSavedFraudCases(cases);
        }
      } catch (e) {
        // localStorage not available or parse error
      }
      
      // Then check ML service health
      try {
        const response = await fetch(`${ML_SERVICE_URL}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (mounted) {
          if (response.ok) {
            setMlStatus("online");
          } else {
            setMlStatus("offline");
          }
        }
      } catch (error) {
        if (mounted) setMlStatus("offline");
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛡</div>
          <h1>FraudGuard</h1>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${item.active ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          <div style={{ 
            padding: "1rem", 
            background: "rgba(59, 130, 246, 0.1)", 
            borderRadius: "12px", 
            border: "1px solid rgba(59, 130, 246, 0.2)"
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

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          {/* Offline Warning Banner */}
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
                  Fraud detection is unavailable. Please ensure the ML service is running at {ML_SERVICE_URL}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="page-title">Fraud Detection Dashboard</h1>
              <p className="page-subtitle">Real-time monitoring and analytics for financial transactions</p>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              padding: "0.5rem 1rem",
              background: "rgba(39, 39, 42, 0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(63, 63, 70, 0.5)"
            }}>
              <span style={{ fontSize: "1.25rem" }}>◷</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            {hasRealData && mlStatus === "online" && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleSaveToDatabase}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                  disabled={saveStatus.saving}
                  title="Save high-risk transactions (>50% fraud probability) to database"
                >
                  {saveStatus.saving ? '⏳ Saving...' : '💾 Save to Database'}
                </button>
                <button 
                  onClick={handleClearData}
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                  title="Clear all stored data"
                >
                  🗑 Clear Data
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Save Status Message */}
        {saveStatus.message && (
          <div style={{ 
            marginTop: '1rem', 
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

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Recent Transaction Card */}
          {recentTransaction && (
            <div className="stat-card" style={{ gridColumn: "span 2" }}>
              <div className="stat-icon blue">⟁</div>
              <div className="stat-label">Latest Analyzed Transaction</div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {recentTransaction.id}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {recentTransaction.vendor || "Unknown Vendor"} • ${recentTransaction.amount?.toLocaleString() || "—"}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, 
                    color: recentTransaction.isFraud ? "var(--danger)" : "var(--success)" 
                  }}>
                    {Math.round(recentTransaction.score * 100)}%
                  </div>
                  <span className={recentTransaction.isFraud ? "badge badge-danger" : "badge badge-success"}>
                    {recentTransaction.isFraud ? "FRAUD" : "LEGITIMATE"}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="stat-card">
            <div className="stat-icon blue">⬡</div>
            <div className="stat-label">Total Transactions</div>
            {hasRealData ? (
              <>
                <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
                <div className="stat-change positive" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--success-light)" }}>
                  ▲ Processed from dataset
                </div>
              </>
            ) : (
              <>
                <div className="stat-value" style={{ opacity: 0.5 }}>—</div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Upload a dataset to see results
                </div>
              </>
            )}
          </div>
          
          <div className="stat-card">
            <div className="stat-icon red">⚠</div>
            <div className="stat-label">Fraud Detected</div>
            {hasRealData ? (
              <>
                <div className="stat-value">{stats.fraudDetected.toLocaleString()}</div>
                <div className="stat-change negative" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--danger-light)" }}>
                  Flagged transactions
                </div>
              </>
            ) : (
              <>
                <div className="stat-value" style={{ opacity: 0.5 }}>—</div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  No fraud detected yet
                </div>
              </>
            )}
          </div>
          
          <div className="stat-card">
            <div className="stat-icon gold">◧</div>
            <div className="stat-label">Fraud Rate</div>
            {hasRealData ? (
              <>
                <div className="stat-value">{stats.fraudRate.toFixed(2)}%</div>
                <div className="stat-change negative" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--warning-light)" }}>
                  Based on processed data
                </div>
              </>
            ) : (
              <>
                <div className="stat-value" style={{ opacity: 0.5 }}>—</div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Awaiting dataset
                </div>
              </>
            )}
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">◎</div>
            <div className="stat-label">Risk Score</div>
            {hasRealData ? (
              <>
                <div className="stat-value">{stats.riskScore}</div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span className={stats.riskScore > 70 ? "badge badge-danger" : stats.riskScore > 40 ? "badge badge-warning" : "badge badge-success"}>
                    {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-value" style={{ opacity: 0.5 }}>—</div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span className="badge badge-info">NO DATA</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        {recentTransactions.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {recentTransactions.length} transactions from dataset
              </span>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Fraud Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.slice(0, 20).map((txn, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{txn.transaction_id || txn.nameorig || 'N/A'}</td>
                      <td>{txn.nameorig || txn.vendor_name || 'Unknown'}</td>
                      <td>${txn.amount?.toLocaleString() || '0'}</td>
                      <td>
                        {txn.fraud_score !== null && txn.fraud_score !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '60px', 
                              height: '6px', 
                              background: 'rgba(255,255,255,0.1)', 
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${txn.fraud_score}%`, 
                                height: '100%', 
                                background: (txn.fraud_score || 0) > 70 ? 'var(--danger)' : (txn.fraud_score || 0) > 40 ? 'var(--warning)' : 'var(--success)',
                                borderRadius: '3px'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem' }}>{Math.round(txn.fraud_score)}%</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {(txn.is_fraud || ((txn.fraud_score || 0) > 70)) ? (
                          <span className="badge badge-danger">FRAUD</span>
                        ) : (
                          <span className="badge badge-success">LEGITIMATE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Saved Fraud Cases (Database) */}
        {savedFraudCases.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem", border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--danger)' }}>🚫 Saved Fraud Cases (Database)</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {savedFraudCases.length} high-risk transaction(s) stored
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
                  {savedFraudCases.slice(0, 20).map((txn, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{txn.transaction_id}</td>
                      <td>{txn.nameorig || 'Unknown'}</td>
                      <td>{txn.nameDest || 'Unknown'}</td>
                      <td>${txn.amount?.toLocaleString() || '0'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '6px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${txn.fraud_score}%`, 
                              height: '100%', 
                              background: 'var(--danger)',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{Math.round(txn.fraud_score)}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(txn.savedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          {/* Risk Gauge */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Real-Time Risk Score</h3>
              {hasRealData && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Live</span>}
            </div>
            {hasRealData ? (
              <>
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
              </>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                padding: "3rem 1rem" 
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📊</div>
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                  Upload a dataset to see your risk analysis
                </p>
                <Link href="/upload" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                  Upload Dataset
                </Link>
              </div>
            )}
          </div>

          {/* Fraud Trend */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Fraud Trend</h3>
              {hasRealData && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--danger)" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fraud Count</span>
                </div>
              )}
            </div>
            {hasRealData ? (
              <div className="chart-container">
                <div style={{ 
                  display: "flex", 
                  alignItems: "flex-end", 
                  justifyContent: "space-around", 
                  height: "100%",
                  padding: "1rem"
                }}>
                  {[65, 45, 78, 52, 90, 68, 42, 55, 73, 48, 82, 61, 38, 70].map((val, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ 
                        width: "20px", 
                        height: `${val * 2.5}px`, 
                        background: `linear-gradient(180deg, #ef4444 0%, #f87171 100%)`,
                        borderRadius: "4px 4px 0 0",
                        boxShadow: "0 -4px 12px rgba(239, 68, 68, 0.3)"
                      }} />
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                padding: "3rem 1rem" 
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📈</div>
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                  Fraud trend data will appear here after processing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* High Risk Vendors & Alerts */}
        <div className="grid-2">
          {/* High Risk Vendors */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">High-Risk Vendors</h3>
              <Link href="/upload" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
                Upload Dataset
              </Link>
            </div>
            {vendors.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Transactions</th>
                      <th>Fraud</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{ fontWeight: i < 3 ? 600 : 400 }}>
                            {vendor.name}
                            {i < 3 && <span style={{ marginLeft: "0.5rem", color: "var(--danger)" }}>⚠</span>}
                          </span>
                        </td>
                        <td>{vendor.transactions.toLocaleString()}</td>
                        <td>{vendor.fraud}</td>
                        <td>
                          <span className={vendor.rate > 5 ? "badge badge-danger" : vendor.rate > 3 ? "badge badge-warning" : "badge badge-success"}>
                            {vendor.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                padding: "3rem 1rem" 
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🏪</div>
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                  Vendor analysis will appear after uploading a dataset
                </p>
              </div>
            )}
          </div>

          {/* Security Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Alerts</h3>
              {alerts.length > 0 && <span className="badge badge-danger">{alerts.length} new</span>}
            </div>
            {alerts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {alerts.map((alert, i) => (
                  <div key={i} style={{ 
                    padding: "1rem", 
                    background: "rgba(0, 0, 0, 0.2)", 
                    borderRadius: "8px",
                    borderLeft: `3px solid ${alert.severity === "high" ? "#ef4444" : alert.severity === "medium" ? "#f59e0b" : "#3b82f6"}`,
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span className={alert.severity === "high" ? "badge badge-danger" : alert.severity === "medium" ? "badge badge-warning" : "badge badge-info"}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.time}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                padding: "3rem 1rem" 
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🔔</div>
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                  Security alerts will appear here after processing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
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
