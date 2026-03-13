"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface DataPoint {
  day: string;
  date: string;
  transactions: number;
  fraud: number;
  flagged: number;
}

const mockData: DataPoint[] = [
  { day: "Mon", date: "Mar 1", transactions: 18240, fraud: 42, flagged: 89 },
  { day: "Tue", date: "Mar 2", transactions: 19850, fraud: 38, flagged: 102 },
  { day: "Wed", date: "Mar 3", transactions: 22100, fraud: 67, flagged: 145 },
  { day: "Thu", date: "Mar 4", transactions: 18920, fraud: 51, flagged: 98 },
  { day: "Fri", date: "Mar 5", transactions: 24580, fraud: 89, flagged: 178 },
  { day: "Sat", date: "Mar 6", transactions: 28340, fraud: 112, flagged: 234 },
  { day: "Sun", date: "Mar 7", transactions: 19200, fraud: 45, flagged: 87 },
  { day: "Mon", date: "Mar 8", transactions: 20150, fraud: 52, flagged: 112 },
  { day: "Tue", date: "Mar 9", transactions: 21780, fraud: 71, flagged: 156 },
  { day: "Wed", date: "Mar 10", transactions: 23450, fraud: 85, flagged: 189 },
  { day: "Thu", date: "Mar 11", transactions: 20890, fraud: 58, flagged: 134 },
  { day: "Fri", date: "Mar 12", transactions: 26120, fraud: 98, flagged: 212 },
  { day: "Sat", date: "Mar 13", transactions: 21450, fraud: 63, flagged: 145 },
  { day: "Sun", date: "Mar 14", transactions: 18450, fraud: 41, flagged: 92 },
];

interface FraudTrendChartProps {
  transactionCount?: number;
  fraudCount?: number;
}

export default function FraudTrendChart({ transactionCount, fraudCount }: FraudTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // If no transaction count provided, show empty state
  const hasData = transactionCount !== undefined && transactionCount > 0;
  
  // Use provided data or generate single-bar representation
  const displayData = hasData ? [
    { day: "Today", date: "Now", transactions: transactionCount, fraud: fraudCount || 0, flagged: fraudCount || 0 }
  ] : mockData;
  
  const maxTransactions = Math.max(...displayData.map(d => d.transactions), 1);
  const maxFraud = Math.max(...displayData.map(d => d.fraud));
  
  const totalTransactions = displayData.reduce((sum, d) => sum + d.transactions, 0);
  const totalFraud = displayData.reduce((sum, d) => sum + d.fraud, 0);
  const totalFlagged = displayData.reduce((sum, d) => sum + d.flagged, 0);
  
  const fraudRate = totalTransactions > 0 ? ((totalFraud / totalTransactions) * 100).toFixed(2) : "0.00";
  const flagRate = totalTransactions > 0 ? ((totalFlagged / totalTransactions) * 100).toFixed(2) : "0.00";
  
  const avgDailyFraud = Math.round(totalFraud / Math.max(displayData.length, 1));
  const trend = hasData ? 0 : displayData[13].fraud - displayData[0].fraud;
  const trendPercent = hasData ? "0.0" : ((trend / Math.max(displayData[0].fraud, 1)) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 md:p-5 overflow-visible">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">14-Day Fraud Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Transaction analysis from Mar 1 - Mar 14, 2026</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-xs text-slate-400">Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">Fraud</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">Flagged</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Total Transactions</p>
          <p className="text-lg font-bold text-white">{totalTransactions.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Fraud Detected</p>
          <p className="text-lg font-bold text-red-400">{totalFraud.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Fraud Rate</p>
          <p className="text-lg font-bold text-amber-400">{fraudRate}%</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Trend</p>
          <div className="flex items-center gap-1">
            <p className={`text-lg font-bold ${trend > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {trend > 0 ? "+" : ""}{trendPercent}%
            </p>
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-slate-600">
          <span>30K</span>
          <span>22.5K</span>
          <span>15K</span>
          <span>7.5K</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="ml-12 h-full flex items-end justify-between gap-1.5 pb-8">
          {mockData.map((data, index) => {
            const heightPercent = (data.transactions / maxTransactions) * 100;
            const fraudHeightPercent = (data.fraud / maxTransactions) * 100;
            const flaggedHeightPercent = (data.flagged / maxTransactions) * 100;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={data.day}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                <div className={`
                  absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                  bg-slate-800 border border-slate-700 rounded-lg p-3 opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible transition-all z-10
                  whitespace-nowrap
                `}>
                  <p className="text-xs font-semibold text-white mb-1">{data.date}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Transactions: <span className="text-cyan-400 font-medium">{data.transactions.toLocaleString()}</span></p>
                    <p className="text-xs text-slate-400">Fraud: <span className="text-red-400 font-medium">{data.fraud}</span></p>
                    <p className="text-xs text-slate-400">Flagged: <span className="text-amber-400 font-medium">{data.flagged}</span></p>
                  </div>
                </div>

                {/* Stacked bars */}
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div
                    className={`
                      w-full max-w-8 rounded-t-sm transition-all duration-300
                      ${isHovered ? "bg-amber-400" : "bg-amber-500/60"}
                    `}
                    style={{ height: `${flaggedHeightPercent * 2.2}px` }}
                  />
                  <div
                    className={`
                      w-full max-w-8 transition-all duration-300
                      ${isHovered ? "bg-red-400" : "bg-red-500/70"}
                    `}
                    style={{ height: `${fraudHeightPercent * 2.2}px` }}
                  />
                  <div
                    className={`
                      w-full max-w-8 rounded-b-sm transition-all duration-300
                      ${isHovered ? "bg-cyan-400" : "bg-cyan-500/70"}
                    `}
                    style={{ height: `${(heightPercent - flaggedHeightPercent - fraudHeightPercent) * 2.2}px`, minHeight: "4px" }}
                  />
                </div>

                {/* X-axis label */}
                <span className={`text-[10px] mt-2 ${isHovered ? "text-white" : "text-slate-600"}`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover highlight line */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-0 bottom-8 w-px bg-slate-700/50 pointer-events-none transition-all duration-150"
            style={{ left: `calc(10px + ${(hoveredIndex / 14) * 100}% + ${(hoveredIndex / 14) * 0.5}%)` }}
          />
        )}
      </div>
    </div>
  );
}
