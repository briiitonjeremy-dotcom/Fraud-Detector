"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard", active: false },
  { href: "/upload", icon: "📤", label: "Upload Dataset", active: true },
  { href: "/explain", icon: "🔍", label: "Explain", active: false },
  { href: "/api-test", icon: "🧪", label: "API Test", active: false },
];

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  processingTime?: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check ML service health status on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        // Try /health endpoint first (more reliable)
        let response = await fetch(`${ML_SERVICE_URL}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        // If /health fails, try root endpoint
        if (!response.ok) {
          response = await fetch(`${ML_SERVICE_URL}/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
        }
        
        if (response.ok) {
          setMlStatus("online");
        } else {
          setMlStatus("offline");
        }
      } catch (error) {
        console.error("[Upload] ML service health check failed:", error);
        setMlStatus("offline");
      }
    };

    checkServiceStatus();
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      parseCSV(droppedFile);
    } else {
      setResult({ success: false, message: "Please upload a valid CSV file" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(0, 6).map(line => 
        line.split(",").map(cell => cell.trim())
      );
      setCsvData(lines);
    };
    reader.readAsText(file);
  };

  // Get detected columns from CSV data
  const getDetectedColumns = () => {
    if (csvData.length > 0) {
      return csvData[0].map(col => col.trim());
    }
    return [];
  };

  const handleUpload = async () => {
    if (!file) {
      setResult({ success: false, message: "Please select a CSV file first" });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const startTime = Date.now();

    // Read file content for ML service
    const fileContent = await file.text();

    try {
      // Send to ML service for batch processing
      console.log("[Upload] Sending CSV to ML service...");
      const response = await fetch(`${ML_SERVICE_URL}/process-dataset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csv_content: fileContent,
          file_name: file.name,
        }),
      });

      const processingTime = Date.now() - startTime;
      console.log("[Upload] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Upload] ML response data:", data);
        
        // Extract transactions with fraud scores from ML response
        const mlTransactions = data.predictions || data.transactions || [];
        
        // Store ML-processed results in localStorage for dashboard
        try {
          // Generate transaction IDs if not present and add fraud scores
          const processedTransactions = mlTransactions.map((txn: any, index: number) => ({
            ...txn,
            transaction_id: txn.transaction_id || txn.nameOrig || `TXN_${txn.step || 1}_${index + 1}`,
            fraud_score: txn.fraud_score !== undefined ? txn.fraud_score : 
                        (txn.is_fraud ? 95 : (txn.prediction !== undefined ? txn.prediction * 100 : null)),
            is_fraud: txn.is_fraud !== undefined ? txn.is_fraud : 
                     (txn.prediction !== undefined ? txn.prediction > 0.5 : false),
          }));
          
          // Store processed transactions
          const existingData = localStorage.getItem('fraudguard_transactions');
          let existingTxns = existingData ? JSON.parse(existingData) : [];
          const allTxns = [...processedTransactions, ...existingTxns];
          localStorage.setItem('fraudguard_transactions', JSON.stringify(allTxns));
          
          // Store summary results
          localStorage.setItem('fraudguard_results', JSON.stringify({
            total_transactions: data.total_transactions || processedTransactions.length,
            fraud_detected: data.fraud_detected || processedTransactions.filter((t: any) => t.is_fraud).length,
            fraud_rate: data.fraud_rate || (processedTransactions.filter((t: any) => t.is_fraud).length / processedTransactions.length * 100) || 0,
            predictions: processedTransactions,
            processedAt: new Date().toISOString()
          }));
        } catch (e) {
          console.error("[Upload] localStorage error:", e);
        }
        
        setResult({
          success: true,
          message: `Dataset uploaded and processed successfully!`,
          data: data,
          processingTime: processingTime,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Upload] ML error response:", errorData);
        setResult({
          success: false,
          message: errorData.error || errorData.message || `ML processing failed (${response.status})`,
        });
      }
    } catch (error: any) {
      console.error("[Upload] Network error:", error);
      // ML service is unavailable - show error instead of fake data
      setResult({
        success: false,
        message: `ML Processing Offline - ${error.message || "Unable to connect to the fraud detection service"}. Please try again later.`,
      });
    }

    setIsUploading(false);
  };

  const removeFile = () => {
    setFile(null);
    setCsvData([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          <h1 className="page-title">Upload Transaction Dataset</h1>
          <p className="page-subtitle">Upload CSV files containing transaction data for fraud analysis</p>
        </div>

        {/* Instructions - Dynamic based on uploaded file */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--accent-gold)" }}>📋 CSV Format Requirements</h3>
          {csvData.length > 0 ? (
            <>
              <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Detected columns from your file:
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {getDetectedColumns().map((col, idx) => (
                  <span key={idx} className="badge badge-info">{col}</span>
                ))}
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                💡 Detected {getDetectedColumns().length} columns • {csvData.length - 1} sample rows loaded
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Your CSV file should include transaction data columns such as:
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {["transaction_id", "amount", "vendor_id", "vendor_name", "region", "timestamp"].map(col => (
                  <span key={col} className="badge badge-info">{col}</span>
                ))}
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                💡 Sample: transaction_id,amount,vendor_id,vendor_name,region,timestamp
              </p>
            </>
          )}
        </div>

        {/* Upload Area */}
        <div className="card">
          <div
            className={`upload-area ${isDragging ? "dragover" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            
            {!file ? (
              <>
                <div className="upload-icon">📁</div>
                <p className="upload-text">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="upload-hint">
                  Maximum file size: 50MB
                </p>
              </>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <p className="upload-text">{file.name}</p>
                <p className="upload-hint">
                  {(file.size / 1024).toFixed(2)} KB • Click to change file
                </p>
              </>
            )}
          </div>

          {/* File Preview */}
          {csvData.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ color: "var(--text-secondary)" }}>File Preview</h3>
                <button onClick={removeFile} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                  Remove
                </button>
              </div>
              
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      {csvData[0]?.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(1, 5).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  ... and {csvData.length - 5} more rows
                </p>
              )}
            </div>
          )}

          {/* Upload Button */}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            {/* Offline Warning */}
            {mlStatus === "offline" && (
              <div className="alert alert-error" style={{ width: '100%', marginBottom: '1rem' }}>
                ⚠️ <strong>ML Processing Offline</strong> - Upload and analyze is unavailable because the ML service is not responding.
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading || mlStatus === "offline"}
              className="btn btn-primary"
            >
              {isUploading ? (
                <>
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                  Processing...
                </>
              ) : (
                "🚀 Upload & Analyze"
              )}
            </button>
            {result && (
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setCsvData([]);
                }}
                className="btn btn-secondary"
                title="Clear current result"
              >
                🗑 Clear
              </button>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className={`results-panel ${result.success ? "alert-success" : "alert-error"}`}>
              <div className="results-header">
                <span className="results-title">
                  {result.success ? "✅ Processing Complete" : "❌ Error"}
                </span>
                {result.processingTime && (
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    ⏱️ {result.processingTime}ms
                  </span>
                )}
              </div>
              
              <p style={{ marginBottom: "1rem" }}>{result.message}</p>
              
              {result.data && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Total Transactions
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      {result.data.total_transactions?.toLocaleString() || "N/A"}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Fraud Detected
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--danger)" }}>
                      {result.data.fraud_detected?.toLocaleString() || "N/A"}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Fraud Rate
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-gold)" }}>
                      {result.data.fraud_rate?.toFixed(2) || "N/A"}%
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: "1rem" }}>
                <pre className="results-content">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

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
