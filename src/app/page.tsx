"use client";

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

const ML_SERVICE_URL = "https://ml-file-for-url.onrender.com";

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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <Sidebar userRole={userRole} loggedIn={loggedIn} />

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <div className="px-6 pt-6">
          <Header mlStatus={mlStatus} />
        </div>

        {/* Main Dashboard Content */}
        <main className="px-6 pb-8">
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

          {/* Hero Alert Banner */}
          <AlertBanner 
            active={true} 
            region="Nairobi Region" 
            trend={12.5} 
            severity="critical" 
          />

          {/* KPI Grid */}
          <KPIGrid />

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Fraud Trend Chart - 2 columns */}
            <div className="xl:col-span-2">
              <FraudTrendChart />
            </div>

            {/* Transaction Channel Distribution */}
            <div>
              <ChannelDistribution />
            </div>
          </div>

          {/* Risk Gauge & Alerts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Risk Score Gauge */}
            <div>
              <RiskGauge score={72} showDetails={true} />
            </div>

            {/* Security Alerts */}
            <div>
              <SecurityAlertsPanel />
            </div>

            {/* Activity Feed */}
            <div>
              <ActivityFeed />
            </div>
          </div>

          {/* Suspicious Transactions Table */}
          <div className="mb-6">
            <SuspiciousTransactionsTable />
          </div>

          {/* Bottom Row - Risk Distribution & Patterns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Geographic Risk & High Risk Recipients */}
            <div className="space-y-6">
              <GeographicRisk />
              <HighRiskRecipients />
            </div>

            {/* Fraud Pattern Insights */}
            <FraudPatternInsights />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white mb-1">Quick Actions</p>
                <p className="text-xs text-slate-500">Perform common tasks quickly</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/upload"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                >
                  Upload Dataset
                </a>
                <a
                  href="/explain"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Explain Transaction
                </a>
                <a
                  href="/api-test"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Test API
                </a>
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
