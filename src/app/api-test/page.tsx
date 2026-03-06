"use client";

import { useState } from "react";
import Link from "next/link";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard", active: false },
  { href: "/upload", icon: "📤", label: "Upload Dataset", active: false },
  { href: "/explain", icon: "🔍", label: "Explain", active: false },
  { href: "/api-test", icon: "🧪", label: "API Test", active: true },
];

interface EndpointTest {
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  requestBody?: object;
}

const endpoints: EndpointTest[] = [
  {
    name: "Health Check",
    method: "GET",
    path: "/health",
    description: "Check if the ML service is running and healthy",
  },
  {
    name: "Fraud Prediction",
    method: "POST",
    path: "/predict",
    description: "Predict fraud for a single transaction",
    requestBody: {
      transaction_id: "TXN_001",
      amount: 5000,
      vendor_id: "V123",
      vendor_name: "TechStore",
      region: "US",
      timestamp: "2024-01-15T10:30:00Z",
    },
  },
  {
    name: "Process Dataset",
    method: "POST",
    path: "/process-dataset",
    description: "Process a CSV dataset for batch fraud detection",
    requestBody: {
      csv_content: "transaction_id,amount,vendor_id,vendor_name,region,timestamp\nTXN_001,5000,V123,TechStore,US,2024-01-15T10:30:00Z",
      file_name: "transactions.csv",
    },
  },
  {
    name: "Explain Transaction",
    method: "GET",
    path: "/explain/{transaction_id}",
    description: "Get SHAP-based explanation for a transaction",
  },
];

interface TestResult {
  endpoint: string;
  status: number;
  duration: number;
  success: boolean;
  response: any;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState<{ [key: string]: boolean }>({});

  const runTest = async (endpoint: EndpointTest) => {
    setIsRunning((prev) => ({ ...prev, [endpoint.name]: true }));

    const startTime = Date.now();

    try {
      let url = `${ML_SERVICE_URL}${endpoint.path}`;
      let options: RequestInit = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (endpoint.method === "POST" && endpoint.requestBody) {
        options.body = JSON.stringify(endpoint.requestBody);
      }

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      let responseData;

      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      const result: TestResult = {
        endpoint: endpoint.name,
        status: response.status,
        duration,
        success: response.ok,
        response: responseData,
      };

      setResults((prev) => {
        const filtered = prev.filter((r) => r.endpoint !== endpoint.name);
        return [...filtered, result];
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        endpoint: endpoint.name,
        status: 0,
        duration,
        success: false,
        response: { error: error.message || "Network error" },
      };

      setResults((prev) => {
        const filtered = prev.filter((r) => r.endpoint !== endpoint.name);
        return [...filtered, result];
      });
    }

    setIsRunning((prev) => ({ ...prev, [endpoint.name]: false }));
  };

  const runAllTests = async () => {
    for (const endpoint of endpoints) {
      await runTest(endpoint);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getResult = (endpointName: string) => results.find((r) => r.endpoint === endpointName);

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
          <h1 className="page-title">ML API Test Console</h1>
          <p className="page-subtitle">Test the fraud detection ML service endpoints directly</p>
        </div>

        {/* Service Info */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>🔌 ML Service Endpoint</h3>
              <code style={{ 
                background: "var(--bg-secondary)", 
                padding: "0.5rem 1rem", 
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}>
                {ML_SERVICE_URL}
              </code>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={runAllTests} className="btn btn-primary">
                🚀 Run All Tests
              </button>
              <button onClick={clearResults} className="btn btn-secondary">
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        {endpoints.map((endpoint) => {
          const result = getResult(endpoint.name);
          
          return (
            <div key={endpoint.name} className="endpoint-card">
              <div className="endpoint-header">
                <span className={`method-badge method-${endpoint.method.toLowerCase()}`}>
                  {endpoint.method}
                </span>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{endpoint.name}</h3>
                  <code className="endpoint-path">{endpoint.path}</code>
                </div>
                <button
                  onClick={() => runTest(endpoint)}
                  disabled={isRunning[endpoint.name]}
                  className="btn btn-primary"
                  style={{ marginLeft: "auto" }}
                >
                  {isRunning[endpoint.name] ? (
                    <>
                      <span className="spinner" style={{ width: "14px", height: "14px" }} />
                      Running...
                    </>
                  ) : (
                    "▶️ Test"
                  )}
                </button>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {endpoint.description}
              </p>

              {endpoint.requestBody && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    REQUEST BODY:
                  </div>
                  <pre style={{ 
                    background: "var(--bg-secondary)", 
                    padding: "1rem", 
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {JSON.stringify(endpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {result && (
                <div style={{ 
                  marginTop: "1rem",
                  padding: "1rem",
                  borderRadius: "8px",
                  background: result.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${result.success ? "#10b981" : "#ef4444"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ 
                      color: result.success ? "#10b981" : "#ef4444",
                      fontWeight: 600
                    }}>
                      {result.success ? "✅ Success" : "❌ Failed"}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      Status: <strong>{result.status || "N/A"}</strong> • Duration: <strong>{result.duration}ms</strong>
                    </span>
                  </div>
                  <pre style={{ 
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {typeof result.response === "object" 
                      ? JSON.stringify(result.response, null, 2) 
                      : result.response}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {/* Quick Links */}
        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
