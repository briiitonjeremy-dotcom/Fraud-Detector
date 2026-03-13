"use client";

import { MapPin, TrendingUp, AlertTriangle, Activity } from "lucide-react";

interface GeoRisk {
  region: string;
  transactions: number;
  fraud: number;
  riskPercentage: number;
  riskLevel: "critical" | "high" | "medium" | "low";
}

const geoData: GeoRisk[] = [
  { region: "Nairobi", transactions: 89450, fraud: 1245, riskPercentage: 1.39, riskLevel: "high" },
  { region: "Mombasa", transactions: 42180, fraud: 412, riskPercentage: 0.98, riskLevel: "medium" },
  { region: "Kisumu", transactions: 28450, fraud: 156, riskPercentage: 0.55, riskLevel: "low" },
  { region: "Nakuru", transactions: 18920, fraud: 89, riskPercentage: 0.47, riskLevel: "low" },
  { region: "Eldoret", transactions: 12450, fraud: 78, riskPercentage: 0.63, riskLevel: "medium" },
  { region: "Unknown", transactions: 8450, fraud: 234, riskPercentage: 2.77, riskLevel: "critical" },
];

const riskConfig = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    bar: "bg-red-500",
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    icon: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    bar: "bg-orange-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    icon: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    bar: "bg-amber-500",
  },
  low: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    bar: "bg-emerald-500",
  },
};

interface GeographicRiskProps {
  data?: GeoRisk[];
}

export default function GeographicRisk({ data }: GeographicRiskProps) {
  const displayData = data && data.length > 0 ? data : geoData;
  const maxTransactions = Math.max(...displayData.map(d => d.transactions), 1);

  const totalTransactions = displayData.reduce((sum, d) => sum + d.transactions, 0);
  const totalFraud = displayData.reduce((sum, d) => sum + d.fraud, 0);
  const unknownRisk = displayData.find(d => d.region === "Unknown");

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Geographic Risk Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">Risk by region in Kenya</p>
        </div>
        
        {unknownRisk && unknownRisk.riskPercentage > 2 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">Unknown Region Alert</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Total Transactions</p>
          <p className="text-lg font-bold text-white">{totalTransactions.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Total Fraud</p>
          <p className="text-lg font-bold text-red-400">{totalFraud.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Unknown Location</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold text-amber-400">{unknownRisk?.riskPercentage}%</p>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Regional Bars */}
      <div className="space-y-3">
        {displayData.map((region) => {
          const config = riskConfig[region.riskLevel];
          const percent = (region.transactions / totalTransactions) * 100;
          const fraudPercent = (region.fraud / region.transactions) * 100;

          return (
            <div
              key={region.region}
              className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${config.icon}`} />
                  <span className="text-sm font-medium text-white">{region.region}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded border ${config.badge}`}>
                    {region.riskLevel}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{region.transactions.toLocaleString()} txns</span>
                  <span className="text-red-400 font-medium">{region.fraud} fraud</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-1.5">
                {/* Volume Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-10">Vol</span>
                  <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500/50 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-12 text-right">{percent.toFixed(1)}%</span>
                </div>
                
                {/* Risk Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-10">Risk</span>
                  <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${region.riskPercentage * 30}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${config.icon} w-12 text-right`}>{region.riskPercentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
