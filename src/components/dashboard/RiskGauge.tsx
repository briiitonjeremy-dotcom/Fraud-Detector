"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface RiskGaugeProps {
  score?: number;
  showDetails?: boolean;
}

export default function RiskGauge({ score = 72, showDetails = true }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getRiskLevel = (s: number) => {
    if (s >= 70) return { level: "HIGH RISK", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", icon: AlertTriangle };
    if (s >= 40) return { level: "MEDIUM RISK", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", icon: Shield };
    return { level: "LOW RISK", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", icon: CheckCircle };
  };

  const risk = getRiskLevel(animatedScore);
  const Icon = risk.icon;

  // Calculate needle rotation (-90 to 90 degrees for semicircle)
  const rotation = -90 + (animatedScore / 100) * 180;

  // Color gradient based on score
  const getGradientColor = (s: number) => {
    if (s >= 70) return "#ef4444";
    if (s >= 40) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Real-Time Risk Score</h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Gauge */}
      <div className="relative flex justify-center py-4">
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-20" />
          
          {/* Gradient arc */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 251.2} 251.2`}
              className="transition-all duration-1000"
            />
          </svg>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-white origin-bottom transition-all duration-1000 ease-out"
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              boxShadow: "0 0 10px rgba(255,255,255,0.5)"
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-lg"
          />
        </div>
      </div>

      {/* Score Display */}
      <div className="text-center -mt-2 mb-4">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-5xl font-bold text-white">{animatedScore}</span>
          <span className="text-lg text-slate-500">/100</span>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-center mb-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${risk.bg} ${risk.border}`}>
          <Icon className={`w-4 h-4 ${risk.color}`} />
          <span className={`text-sm font-semibold ${risk.color}`}>{risk.level}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/50">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Low (&lt;40)</p>
            <p className="text-sm font-medium text-emerald-400">Safe</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Medium (40-70)</p>
            <p className="text-sm font-medium text-amber-400">Monitor</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">High (&gt;70)</p>
            <p className="text-sm font-medium text-red-400">Alert</p>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <p className="text-xs text-slate-500 mb-2">Top Risk Factors</p>
        <div className="space-y-2">
          {[
            { factor: "Unusual transaction patterns", weight: 28, level: "high" },
            { factor: "High-risk recipient history", weight: 22, level: "high" },
            { factor: "Velocity anomaly detected", weight: 18, level: "medium" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.factor}</span>
              <span className={`
                font-medium
                ${item.level === "high" ? "text-red-400" : "text-amber-400"}
              `}>
                +{item.weight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
