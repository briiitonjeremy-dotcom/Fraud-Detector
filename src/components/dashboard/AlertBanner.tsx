"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, MapPin, X, ChevronDown } from "lucide-react";

interface AlertBannerProps {
  active?: boolean;
  region?: string;
  trend?: number;
  severity?: "critical" | "warning" | "attention";
}

export default function AlertBanner({ 
  active = true, 
  region = "Nairobi Region", 
  trend = 12.5,
  severity = "critical" 
}: AlertBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(active);

  const severityConfig = {
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      icon: "text-red-400",
      badge: "bg-red-500/20 text-red-400 border-red-500/30",
      pulse: "animate-pulse",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      icon: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      pulse: "",
    },
    attention: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/40",
      icon: "text-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      pulse: "",
    },
  };

  const config = severityConfig[severity];

  if (!isVisible) return null;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border ${config.bg} ${config.border} mb-6
      ${config.pulse}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`
              p-2.5 rounded-lg ${config.bg} border ${config.border}
            `}>
              <AlertTriangle className={`w-5 h-5 ${config.icon}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-base font-semibold text-white">Anomaly Spike Detected</h3>
                <span className={`
                  px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border
                  ${config.badge}
                `}>
                  {severity}
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Unusual transaction behavior detected in <span className="text-white font-medium">{region}</span>. 
                Fraud attempts have increased by <span className="text-red-400 font-semibold">+{trend}%</span> in the last hour.
              </p>
              
              {!isMinimized && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Nairobi CBD, Westlands, Kilimani</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>M-PESA Send Money transactions</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMinimized ? "-rotate-90" : ""}`} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
