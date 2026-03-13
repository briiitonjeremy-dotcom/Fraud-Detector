"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AlertBanner from "@/components/dashboard/AlertBanner";
import KPIGrid from "@/components/dashboard/KPIGrid";
import FraudTrendChart from "@/components/dashboard/FraudTrendChart";
import ChannelDistribution from "@/components/dashboard/ChannelDistribution";
import RiskGauge from "@/components/dashboard/RiskGauge";
import SecurityAlertsPanel from "@/components/dashboard/SecurityAlerts";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import SuspiciousTransactionsTable from "@/components/dashboard/SuspiciousTransactionsTable";
import HighRiskRecipients from "@/components/dashboard/HighRiskRecipients";
import GeographicRisk from "@/components/dashboard/GeographicRisk";
import FraudPatternInsights from "@/components/dashboard/FraudPatternInsights";
import { Trash2, Save, Upload, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

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
  oldbalanceOrg?: number;
  newbalanceOrig?: number;
  oldbalanceDest?: number;
  newbalanceDest?: number;
  [key: string]: unknown;
}

interface ProcessedResults {
  total_transactions?: number;
  fraud_detected?: number;
  fraud_rate?: number;
  processedAt?: string;
}

interface Alert {
  id: string;
  time: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  percentage?: number;
}

interface ActivityItem {
  id: string;
  time: string;
  action: string;
  source: string;
  status: "success" | "warning" | "error" | "info";
  details?: string;
}

interface ChannelData {
  name: string;
  icon: "mpesa" | "bank" | "card" | "wallet" | "transfer";
  transactions: number;
  fraud: number;
  percentage: number;
}

interface GeoRiskData {
  region: string;
  transactions: number;
  fraud: number;
  riskPercentage: number;
  riskLevel: "critical" | "high" | "medium" | "low";
}

export default function Dashboard() {
  const [mlStatus, setMlStatus] = useState<"loading" | "online" | "offline">("loading");
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem("userRole") || null;
  });
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem("session_token");
  });

  // Processed data state
  const [hasProcessedData, setHasProcessedData] = useState(false);
  const [processedResults, setProcessedResults] = useState<ProcessedResults | null>(null);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [savingStatus, setSavingStatus] = useState<{ saving: boolean; message: string }>({ saving: false, message: "" });
  const [clearingStatus, setClearingStatus] = useState<{ clearing: boolean; message: string }>({ clearing: false, message: "" });

  // Load processed data from localStorage on mount
  useEffect(() => {
    let hasData = false;
    try {
      // Load results summary
      const storedResults = localStorage.getItem('fraudguard_results');
      if (storedResults) {
        const parsed = JSON.parse(storedResults);
        setProcessedResults(parsed);
        hasData = true;
      }

      // Load transactions
      const storedTransactions = localStorage.getItem('fraudguard_transactions');
      if (storedTransactions) {
        const txns = JSON.parse(storedTransactions);
        setTransactions(txns);
        hasData = txns.length > 0 || hasData;
      }
    } catch (e) {
      console.error("[Dashboard] Error loading processed data:", e);
    }
    setHasProcessedData(hasData);
  }, []);

  // Check ML service health
  useEffect(() => {
    const checkMlServiceHealth = async () => {
      try {
        let response = await fetch(`${ML_SERVICE_URL}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!response.ok) {
          response = await fetch(`${ML_SERVICE_URL}/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
        }
        
        return response.ok;
      } catch (error) {
        console.error("[Dashboard] ML service health check failed:", error);
        return false;
      }
    };

    const fetchData = async () => {
      const isMlOnline = await checkMlServiceHealth();
      setMlStatus(isMlOnline ? "online" : "offline");
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save suspicious transactions (fraud_score >= 50%)
  const handleSaveSuspicious = async () => {
    if (transactions.length === 0) {
      setSavingStatus({ saving: false, message: "No transactions to save" });
      return;
    }

    setSavingStatus({ saving: true, message: "" });

    try {
      const suspiciousTxns = transactions.filter(txn => 
        (txn.fraud_score !== null && txn.fraud_score !== undefined && txn.fraud_score >= 50) || 
        txn.is_fraud === true
      );

      if (suspiciousTxns.length === 0) {
        setSavingStatus({ saving: false, message: "No suspicious transactions (fraud score >= 50%) found" });
        return;
      }

      // Get existing saved cases
      const existingCases = localStorage.getItem('fraudguard_fraud_cases');
      const existingCasesArray = existingCases ? JSON.parse(existingCases) : [];

      // Create new fraud cases with timestamp
      const newFraudCases = suspiciousTxns.map(txn => ({
        transaction_id: txn.transaction_id || txn.nameorig || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: txn.amount || 0,
        fraud_score: txn.fraud_score || (txn.is_fraud ? 95 : 0),
        savedAt: new Date().toISOString(),
        nameorig: txn.nameorig,
        nameDest: txn.nameDest,
        type: txn.type,
      }));

      // Merge with existing cases (avoid duplicates)
      const existingIds = new Set(existingCasesArray.map((c: { transaction_id: string }) => c.transaction_id));
      const uniqueNewCases = newFraudCases.filter((c: { transaction_id: string }) => !existingIds.has(c.transaction_id));
      const allCases = [...existingCasesArray, ...uniqueNewCases];

      // Save to localStorage
      localStorage.setItem('fraudguard_fraud_cases', JSON.stringify(allCases));
      
      setSavingStatus({ saving: false, message: `Successfully saved ${uniqueNewCases.length} suspicious transaction(s)!` });
    } catch (error) {
      setSavingStatus({ saving: false, message: "Error saving transactions" });
    }
  };

  // Clear displayed data
  const handleClearData = async () => {
    setClearingStatus({ clearing: true, message: "" });

    try {
      localStorage.removeItem('fraudguard_results');
      localStorage.removeItem('fraudguard_transactions');
      
      setProcessedResults(null);
      setTransactions([]);
      setHasProcessedData(false);
      setClearingStatus({ clearing: false, message: "Displayed data cleared successfully" });
      
      // Clear message after 3 seconds
      setTimeout(() => setClearingStatus({ clearing: false, message: "" }), 3000);
    } catch (error) {
      setClearingStatus({ clearing: false, message: "Error clearing data" });
    }
  };

  // Derive analytics from processed transactions
  const getKPIData = () => {
    if (!hasProcessedData || transactions.length === 0) {
      return null;
    }

    const totalTransactions = transactions.length;
    const fraudDetected = transactions.filter(t => t.is_fraud === true || (t.fraud_score !== null && t.fraud_score !== undefined && t.fraud_score >= 50)).length;
    const fraudRate = totalTransactions > 0 ? ((fraudDetected / totalTransactions) * 100) : 0;
    
    // Count by transaction type (mapped to channels)
    const mpesaCount = transactions.filter(t => t.type?.includes('TRANSFER') || t.type?.includes('CASH')).length;
    const bankCount = transactions.filter(t => t.type?.includes('PAYMENT') || t.type?.includes('DEBIT')).length;
    const billCount = transactions.filter(t => t.type === 'PAYMENT').length;
    const otherCount = totalTransactions - mpesaCount - bankCount - billCount;

    // Calculate risk score (average fraud score * 10, capped at 100)
    const avgFraudScore = transactions.reduce((sum, t) => sum + (t.fraud_score || 0), 0) / totalTransactions;
    const riskScore = Math.min(100, Math.round(avgFraudScore * 10));

    return {
      totalTransactions,
      incomingTransfers: Math.round(totalTransactions * 0.58),
      outgoingTransfers: Math.round(totalTransactions * 0.36),
      billPayments: billCount || Math.round(totalTransactions * 0.06),
      fraudFlags: fraudDetected,
      highRiskRecipients: Math.round(fraudDetected * 0.5),
      fraudRate: fraudRate.toFixed(2),
      riskScore,
      mpesaCount,
      bankCount,
      otherCount,
    };
  };

  // Get suspicious transactions (fraud_score >= 50%)
  const getSuspiciousTransactions = () => {
    if (!hasProcessedData || transactions.length === 0) {
      return [];
    }

    return transactions
      .filter(t => t.fraud_score !== null && t.fraud_score !== undefined && t.fraud_score >= 50)
      .map(t => ({
        refCode: t.transaction_id || t.nameorig || `TXN_${Date.now()}`,
        channel: t.type?.includes('TRANSFER') || t.type?.includes('CASH') ? 'M-PESA' : t.type?.includes('PAYMENT') ? 'Bank' : 'Other',
        type: t.type || 'Transfer',
        sender: t.nameorig || 'Unknown',
        recipient: t.nameDest || 'Unknown',
        phone: 'N/A',
        amount: t.amount || 0,
        fee: 0,
        dateTime: new Date().toISOString(),
        riskScore: Math.round(t.fraud_score || 0),
        alertReason: t.fraud_score && t.fraud_score >= 80 ? 'High fraud probability' : 'Suspicious activity detected',
      }))
      .slice(0, 50);
  };

  // Generate alerts from processed data
  const getAlerts = (): Alert[] => {
    if (!hasProcessedData || transactions.length === 0) {
      return [];
    }

    const alerts: Alert[] = [];
    const highRiskCount = transactions.filter(t => t.fraud_score && t.fraud_score >= 80).length;
    const mediumRiskCount = transactions.filter(t => t.fraud_score && t.fraud_score >= 50 && t.fraud_score < 80).length;

    if (highRiskCount > 0) {
      alerts.push({
        id: "1",
        time: "Just now",
        severity: "critical",
        title: "High Risk Transactions Detected",
        message: `${highRiskCount} transaction(s) with fraud score >= 80% detected in processed dataset`,
        source: "ML Model",
        percentage: Math.round((highRiskCount / transactions.length) * 100),
      });
    }

    if (mediumRiskCount > 0) {
      alerts.push({
        id: "2",
        time: "5 min ago",
        severity: "warning",
        title: "Medium Risk Transactions",
        message: `${mediumRiskCount} transaction(s) with fraud score between 50-80% require review`,
        source: "Fraud Rules",
        percentage: Math.round((mediumRiskCount / transactions.length) * 100),
      });
    }

    // Add summary alert
    const fraudRate = ((transactions.filter(t => t.is_fraud || (t.fraud_score && t.fraud_score >= 50)).length / transactions.length) * 100).toFixed(2);
    alerts.push({
      id: "3",
      time: "Analysis complete",
      severity: "info",
      title: "Dataset Processing Complete",
      message: `Analyzed ${transactions.length} transactions. Fraud rate: ${fraudRate}%`,
      source: "System",
      percentage: parseFloat(fraudRate),
    });

    return alerts;
  };

  // Generate activity from processed data
  const getActivity = (): ActivityItem[] => {
    if (!hasProcessedData || transactions.length === 0) {
      return [];
    }

    const activities: ActivityItem[] = [];
    const fraudCount = transactions.filter(t => t.is_fraud || (t.fraud_score && t.fraud_score >= 50)).length;
    const processedAt = processedResults?.processedAt || new Date().toISOString();

    activities.push({
      id: "1",
      time: "Just now",
      action: "Dataset Processed",
      source: "Data Pipeline",
      status: "success",
      details: `${transactions.length.toLocaleString()} transactions analyzed`,
    });

    activities.push({
      id: "2",
      time: "Analysis",
      action: "Fraud Detected",
      source: "ML Engine",
      status: fraudCount > 0 ? "warning" : "success",
      details: `${fraudCount} suspicious transaction(s) identified`,
    });

    activities.push({
      id: "3",
      time: "Processing",
      action: "Risk Analysis",
      source: "ML Model",
      status: "info",
      details: `Average fraud score: ${(transactions.reduce((s, t) => s + (t.fraud_score || 0), 0) / transactions.length).toFixed(1)}%`,
    });

    return activities;
  };

  // Generate channel data from processed transactions
  const getChannelData = (): ChannelData[] => {
    if (!hasProcessedData || transactions.length === 0) {
      return [];
    }

    const channelMap = new Map<string, { total: number; fraud: number }>();
    
    transactions.forEach(t => {
      const channel = t.type || 'Other';
      const existing = channelMap.get(channel) || { total: 0, fraud: 0 };
      existing.total++;
      if (t.fraud_score && t.fraud_score >= 50) {
        existing.fraud++;
      }
      channelMap.set(channel, existing);
    });

    return Array.from(channelMap.entries()).map(([name, data]) => ({
      name,
      icon: 'transfer',
      transactions: data.total,
      fraud: data.fraud,
      percentage: data.total > 0 ? ((data.fraud / data.total) * 100) : 0,
    }));
  };

  // Generate geo risk data (simulated from transactions)
  const getGeoRiskData = (): GeoRiskData[] => {
    if (!hasProcessedData || transactions.length === 0) {
      return [];
    }

    // Group by a pseudo-region based on transaction characteristics
    // In real app, this would come from transaction location data
    const regions = [
      { region: "Nairobi", factor: 0.4 },
      { region: "Mombasa", factor: 0.25 },
      { region: "Kisumu", factor: 0.15 },
      { region: "Nakuru", factor: 0.1 },
      { region: "Other", factor: 0.1 },
    ];

    return regions.map(r => {
      const regionTxns = Math.round(transactions.length * r.factor);
      const regionFraud = Math.round(regionTxns * (Math.random() * 0.03 + 0.005));
      const riskPct = regionTxns > 0 ? ((regionFraud / regionTxns) * 100) : 0;
      
      let riskLevel: "critical" | "high" | "medium" | "low" = "low";
      if (riskPct > 2) riskLevel = "critical";
      else if (riskPct > 1) riskLevel = "high";
      else if (riskPct > 0.5) riskLevel = "medium";

      return {
        region: r.region,
        transactions: regionTxns,
        fraud: regionFraud,
        riskPercentage: parseFloat(riskPct.toFixed(2)),
        riskLevel,
      };
    });
  };

  const kpiData = getKPIData();
  const suspiciousTxns = getSuspiciousTransactions();
  const alerts = getAlerts();
  const activity = getActivity();
  const channelData = getChannelData();
  const geoRiskData = getGeoRiskData();

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar userRole={userRole} loggedIn={loggedIn} />

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <div className="px-6 pt-6">
          <Header mlStatus={mlStatus} hasData={hasProcessedData} />
        </div>

        {/* Main Dashboard Content */}
        <main className="px-4 md:px-6 pb-8 overflow-x-visible">
          {/* Offline Warning */}
          {mlStatus === "offline" && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-400">ML Processing Offline</p>
                <p className="text-xs text-slate-400">Fraud detection is unavailable. Please ensure the ML service is running.</p>
              </div>
            </div>
          )}

          {/* Data Action Buttons */}
          {hasProcessedData && (
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={handleSaveSuspicious}
                disabled={savingStatus.saving}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingStatus.saving ? "Saving..." : "Save Suspicious"}
              </button>
              <button
                onClick={handleClearData}
                disabled={clearingStatus.clearing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearingStatus.clearing ? "Clearing..." : "Clear Displayed Data"}
              </button>
              {savingStatus.message && (
                <span className={`text-xs ${savingStatus.message.includes('Successfully') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {savingStatus.message}
                </span>
              )}
              {clearingStatus.message && (
                <span className="text-xs text-emerald-400">{clearingStatus.message}</span>
              )}
            </div>
          )}

          {/* Empty State - No Processed Data */}
          {!hasProcessedData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Processed Data</h2>
              <p className="text-sm text-slate-400 mb-6 text-center max-w-md">
                Upload and process a transaction dataset to see fraud analysis results on the dashboard.
              </p>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Dataset
              </Link>
            </div>
          ) : (
            <>
              {/* Hero Alert Banner - Show if high fraud detected */}
              {kpiData && kpiData.fraudFlags > 0 && (
                <AlertBanner 
                  active={true} 
                  region="Processed Dataset" 
                  trend={parseFloat(kpiData.fraudRate)} 
                  severity={parseFloat(kpiData.fraudRate) > 2 ? "critical" : parseFloat(kpiData.fraudRate) > 1 ? "warning" : "attention"}
                />
              )}

              {/* KPI Grid - Bound to processed data */}
              {kpiData && <KPIGrid data={kpiData} />}

              {/* Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6 overflow-x-visible">
                {/* Fraud Trend Chart - 2 columns */}
                <div className="xl:col-span-2 overflow-visible">
                  {kpiData && <FraudTrendChart transactionCount={kpiData.totalTransactions} fraudCount={kpiData.fraudFlags} />}
                </div>

                {/* Transaction Channel Distribution */}
                <div className="overflow-visible">
                  <ChannelDistribution data={channelData.length > 0 ? channelData : undefined} />
                </div>
              </div>

              {/* Risk Gauge & Alerts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
                {/* Risk Score Gauge */}
                <div>
                  {kpiData && <RiskGauge score={kpiData.riskScore} showDetails={true} />}
                </div>

                {/* Security Alerts - Bound to processed data */}
                <div>
                  <SecurityAlertsPanel alerts={alerts.length > 0 ? alerts : undefined} />
                </div>

                {/* Activity Feed - Bound to processed data */}
                <div>
                  <ActivityFeed activities={activity.length > 0 ? activity : undefined} />
                </div>
              </div>

              {/* Suspicious Transactions Table - Bound to processed data */}
              <div className="mb-6">
                <SuspiciousTransactionsTable transactions={suspiciousTxns.length > 0 ? suspiciousTxns : undefined} />
              </div>

              {/* Bottom Row - Risk Distribution & Patterns */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                {/* Geographic Risk & High Risk Recipients */}
                <div className="space-y-4 md:space-y-6">
                  <GeographicRisk data={geoRiskData.length > 0 ? geoRiskData : undefined} />
                  <HighRiskRecipients />
                </div>

                {/* Fraud Pattern Insights */}
                {kpiData && <FraudPatternInsights fraudCount={kpiData.fraudFlags} totalCount={kpiData.totalTransactions} />}
              </div>
            </>
          )}

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white mb-1">Quick Actions</p>
                <p className="text-xs text-slate-500">Perform common tasks quickly</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/upload"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                >
                  Upload Dataset
                </Link>
                <Link
                  href="/explain"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Explain Transaction
                </Link>
                <Link
                  href="/api-test"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Test API
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600">
              FraudGuard AI - Kenyan Digital Transaction Protection System
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
