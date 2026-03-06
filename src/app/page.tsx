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
const demoStats = {
  totalTransactions: 24589,
  fraudDetected: 1247,
  fraudRate: 5.07,
  riskScore: 72,
};

const demoVendors = [
  { name: "TechStore Inc", transactions: 4521, fraud: 312, rate: 6.9 },
  { name: "Global Payments", transactions: 3892, fraud: 201, rate: 5.2 },
  { name: "QuickBuy Online", transactions: 3102, fraud: 142, rate: 4.6 },
  { name: "SecurePay Ltd", transactions: 2847, fraud: 98, rate: 3.4 },
  { name: "FastCheckout", transactions: 2103, fraud: 67, rate: 3.2 },
];

const demoAlerts = [
  { time: "2 min ago", severity: "high", message: "Unusual transaction pattern detected from IP 192.168.1.1" },
  { time: "15 min ago", severity: "medium", message: "Multiple failed authentication attempts" },
  { time: "1 hour ago", severity: "low", message: "New vendor registered: QuickShop" },
  { time: "2 hours ago", severity: "high", message: "High-value transaction flagged: $45,000" },
];

export default function Dashboard() {
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [stats, setStats] = useState(demoStats);
  const [vendors, setVendors] = useState(demoVendors);
  const [alerts, setAlerts] = useState(demoAlerts);
  const isMounted = useCallback(() => { let mounted = true; return () => { mounted = false; }; }, []);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const response = await fetch(`${ML_SERVICE_URL}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (mounted && response.ok) {
          setMlStatus("online");
          setLastUpdate(new Date().toLocaleTimeString());
          
          try {
            const data = await response.json();
            if (mounted && data.stats) {
              setStats(prev => ({
                ...prev,
                ...data.stats
              }));
            }
          } catch (e) {
            // Use demo data
          }
        } else if (mounted) {
          setMlStatus("offline");
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
            background: "rgba(6, 182, 212, 0.1)", 
            borderRadius: "12px", 
            border: "1px solid rgba(6, 182, 212, 0.2)"
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
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">⬡</div>
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
            <div className="stat-change positive" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--success-light)" }}>
              ▲ 12.5% from last week
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon red">⚠</div>
            <div className="stat-label">Fraud Detected</div>
            <div className="stat-value">{stats.fraudDetected.toLocaleString()}</div>
            <div className="stat-change negative" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--danger-light)" }}>
              ▼ 3.2% from last week
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon gold">◧</div>
            <div className="stat-label">Fraud Rate</div>
            <div className="stat-value">{stats.fraudRate}%</div>
            <div className="stat-change negative" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--warning-light)" }}>
              ▼ 0.8% from last week
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">◎</div>
            <div className="stat-label">Risk Score</div>
            <div className="stat-value">{stats.riskScore}</div>
            <div style={{ marginTop: "0.75rem" }}>
              <span className={stats.riskScore > 70 ? "badge badge-danger" : stats.riskScore > 40 ? "badge badge-warning" : "badge badge-success"}>
                {stats.riskScore > 70 ? "HIGH RISK" : stats.riskScore > 40 ? "MEDIUM RISK" : "LOW RISK"}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          {/* Risk Gauge */}
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

          {/* Fraud Trend */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Fraud Trend (Last 14 Days)</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--danger)" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fraud Count</span>
              </div>
            </div>
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
          </div>
        </div>

        {/* High Risk Vendors & Alerts */}
        <div className="grid-2">
          {/* High Risk Vendors */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">High-Risk Vendors</h3>
              <Link href="/upload" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
                View All
              </Link>
            </div>
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
          </div>

          {/* Security Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Alerts</h3>
              <span className="badge badge-danger">4 new</span>
            </div>
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
