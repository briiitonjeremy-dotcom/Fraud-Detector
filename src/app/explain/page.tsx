"use client";

import { useState } from "react";
import Link from "next/link";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard", active: false },
  { href: "/upload", icon: "📤", label: "Upload Dataset", active: false },
  { href: "/explain", icon: "🔍", label: "Explain", active: true },
  { href: "/api-test", icon: "🧪", label: "API Test", active: false },
];

interface ExplainResult {
  success: boolean;
  transaction_id: string;
  fraud_score: number;
  is_fraud: boolean;
  narrative: string;
  features: { name: string; value: number; impact: number }[];
  base_value: number;
}

// Demo data for offline mode
const demoResult: ExplainResult = {
  success: true,
  transaction_id: "TXN_12345",
  fraud_score: 0.87,
  is_fraud: true,
  narrative: "This transaction has been flagged as HIGH RISK due to several factors: unusually high transaction amount ($12,500), transaction from a new vendor (TechGadgets Inc), location mismatch (transaction from US but user typically from EU), and time of transaction outside normal business hours. The combination of these factors significantly increases the fraud probability.",
  base_value: 0.15,
  features: [
    { name: "Transaction Amount", value: 12500, impact: 0.42 },
    { name: "Vendor Age (days)", value: 3, impact: 0.28 },
    { name: "Location Mismatch", value: 1, impact: 0.19 },
    { name: "Time Anomaly", value: 1, impact: 0.08 },
    { name: "User History Score", value: 0.2, impact: -0.05 },
    { name: "Device Trust Score", value: 0.7, impact: -0.02 },
  ],
};

export default function ExplainPage() {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  const handleExplain = async () => {
    if (!transactionId.trim()) {
      setError("Please enter a transaction ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSavedToDb(false);

    try {
      const response = await fetch(`${ML_SERVICE_URL}/explain/${transactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        // Try with predict endpoint as fallback
        const predictResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_id: transactionId,
            amount: 5000,
            vendor_id: "V001",
            vendor_name: "Demo Vendor",
            region: "US",
            timestamp: new Date().toISOString(),
          }),
        });

        if (predictResponse.ok) {
          const predictData = await predictResponse.json();
          setResult({
            success: true,
            transaction_id: transactionId,
            fraud_score: predictData.fraud_score || 0.5,
            is_fraud: (predictData.fraud_score || 0.5) > 0.5,
            narrative: "This is a demo explanation. Connect to the ML service for real-time analysis.",
            base_value: 0.15,
            features: [
              { name: "Transaction Amount", value: 5000, impact: 0.25 },
              { name: "Vendor Risk Score", value: 0.6, impact: 0.15 },
              { name: "Region Factor", value: 1, impact: 0.1 },
            ],
          });
        } else {
          setError("Transaction not found or ML service unavailable");
        }
      }
    } catch (err) {
      // Use demo data if ML service is offline
      setResult({
        ...demoResult,
        transaction_id: transactionId,
      });
    }

    setIsLoading(false);
  };

  const handleDemo = () => {
    setTransactionId("TXN_12345");
    setResult(demoResult);
    setError(null);
    setSavedToDb(false);
  };

  // Save transaction to local storage (simulating database)
  const handleSaveToDatabase = () => {
    if (!result) return;
    
    try {
      // Get existing transactions
      const existingData = localStorage.getItem('fraudguard_transactions');
      const transactions = existingData ? JSON.parse(existingData) : [];
      
      // Add new transaction
      const newTransaction = {
        transaction_id: result.transaction_id,
        fraud_score: result.fraud_score,
        is_fraud: result.is_fraud,
        amount: 5000, // Default amount for demo
        vendor_name: "Demo Vendor",
        analyzed_at: new Date().toISOString()
      };
      
      transactions.push(newTransaction);
      
      // Save back to localStorage
      localStorage.setItem('fraudguard_transactions', JSON.stringify(transactions));
      
      // Update results storage too
      const storedResults = localStorage.getItem('fraudguard_results');
      const results = storedResults ? JSON.parse(storedResults) : {
        total_transactions: 0,
        fraud_detected: 0,
        fraud_rate: 0
      };
      
      results.total_transactions += 1;
      if (newTransaction.is_fraud) {
        results.fraud_detected += 1;
      }
      results.fraud_rate = results.total_transactions > 0 
        ? (results.fraud_detected / results.total_transactions) * 100 
        : 0;
      results.processedAt = new Date().toISOString();
      
      localStorage.setItem('fraudguard_results', JSON.stringify(results));
      
      setSavedToDb(true);
      alert(`Transaction ${result.transaction_id} saved to database successfully!`);
    } catch (err) {
      alert("Failed to save transaction to database");
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛡️</div>
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Transaction Explainability</h1>
          <p className="page-subtitle">Get detailed SHAP-based explanations for flagged transactions</p>
        </div>

        {/* Search Form */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter transaction ID (e.g., TXN_12345)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleExplain()}
              />
              <button
                onClick={handleExplain}
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="spinner" style={{ width: "16px", height: "16px" }} />
                    Analyzing...
                  </>
                ) : (
                  "🔍 Explain"
                )}
              </button>
              <button
                onClick={handleDemo}
                className="btn btn-gold"
              >
                🎯 Demo
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Fraud Score Header */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                    Transaction: {result.transaction_id}
                  </h2>
                  <span className={result.is_fraud ? "badge badge-danger" : "badge badge-success"}>
                    {result.is_fraud ? "🚨 FRAUD DETECTED" : "✅ LEGITIMATE"}
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", fontWeight: 700, 
                    color: result.fraud_score > 0.7 ? "#ef4444" : result.fraud_score > 0.4 ? "#f59e0b" : "#10b981" 
                  }}>
                    {Math.round(result.fraud_score * 100)}%
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Fraud Score</div>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
              {/* Narrative */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📖 Explanation</h3>
                </div>
                <p style={{ lineHeight: 1.7, color: "var(--text-secondary)" }}>
                  {result.narrative}
                </p>
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    Base Value: <strong>{result.base_value}</strong>
                  </span>
                </div>
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                  <button
                    onClick={handleSaveToDatabase}
                    className="btn btn-primary"
                    disabled={savedToDb}
                  >
                    {savedToDb ? "✓ Saved to Database" : "💾 Save to Database"}
                  </button>
                  <Link href="/" className="btn btn-secondary">
                    📊 View on Dashboard
                  </Link>
                </div>
              </div>

              {/* Feature Importance */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📊 Feature Importance</h3>
                </div>
                <div>
                  {result.features?.map((feature, i) => (
                    <div key={i} className="feature-bar">
                      <div className="feature-name">{feature.name}</div>
                      <div className="feature-track">
                        <div
                          className={`feature-fill ${feature.impact >= 0 ? "positive" : "negative"}`}
                          style={{ width: `${Math.abs(feature.impact) * 100}%` }}
                        />
                      </div>
                      <div className="feature-value">
                        {feature.impact >= 0 ? "+" : ""}{(feature.impact * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔧 Raw Response</h3>
              </div>
              <pre className="results-content">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Quick Links */}
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <Link href="/" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
          <Link href="/api-test" className="btn btn-secondary">
            Test API →
          </Link>
        </div>
      </main>
    </div>
  );
}
