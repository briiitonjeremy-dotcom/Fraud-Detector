"use client";

import { useState } from "react";
import { 
  BrainCircuit, 
  AlertTriangle, 
  Smartphone, 
  Clock, 
  DollarSign,
  UserX,
  ArrowRight,
  ChevronRight,
  Zap
} from "lucide-react";

interface Pattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  severity: "critical" | "high" | "medium";
  icon: "sim" | "velocity" | "amount" | "identity" | "time";
  detected: string;
}

const patterns: Pattern[] = [
  {
    id: "1",
    name: "SIM Swap Fraud",
    description: "Fraudsters swap victim SIM to intercept OTPs and authorize unauthorized transfers",
    frequency: 34,
    severity: "critical",
    icon: "sim",
    detected: "2 hrs ago",
  },
  {
    id: "2",
    name: "Velocity Attack",
    description: "Multiple rapid transactions exceeding normal user behavior thresholds",
    frequency: 28,
    severity: "critical",
    icon: "velocity",
    detected: "45 min ago",
  },
  {
    id: "3",
    name: "High-Value Split",
    description: "Large transaction split into smaller amounts to avoid detection limits",
    frequency: 22,
    severity: "high",
    icon: "amount",
    detected: "1 hr ago",
  },
  {
    id: "4",
    name: "Identity Mismatch",
    description: "Sender details don't match registered account holder information",
    frequency: 18,
    severity: "high",
    icon: "identity",
    detected: "30 min ago",
  },
  {
    id: "5",
    name: "Off-Hours Activity",
    description: "Transactions occurring outside normal business hours (2AM - 5AM)",
    frequency: 12,
    severity: "medium",
    icon: "time",
    detected: "3 hrs ago",
  },
  {
    id: "6",
    name: "New Account Abuse",
    description: "Fresh accounts used for high-risk transactions within 24 hours of creation",
    frequency: 8,
    severity: "high",
    icon: "identity",
    detected: "5 hrs ago",
  },
];

const severityConfig = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    bar: "bg-red-500",
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    bar: "bg-orange-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    bar: "bg-amber-500",
  },
};

const iconMap = {
  sim: Smartphone,
  velocity: Zap,
  amount: DollarSign,
  identity: UserX,
  time: Clock,
};

interface FraudPatternInsightsProps {
  fraudCount?: number;
  totalCount?: number;
}

export default function FraudPatternInsights({ fraudCount = 0, totalCount = 0 }: FraudPatternInsightsProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Fraud Pattern Insights</h3>
            <p className="text-xs text-slate-500">AI-detected fraud patterns</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full">
          {fraudCount > 0 ? "Active" : patterns.length + " Active"}
        </span>
      </div>

      {/* Pattern List */}
      <div className="divide-y divide-slate-800/30">
        {patterns.map((pattern) => {
          const config = severityConfig[pattern.severity];
          const Icon = iconMap[pattern.icon];
          const isExpanded = selectedPattern === pattern.id;

          return (
            <div
              key={pattern.id}
              className={`
                ${isExpanded ? config.bg : ""}
                transition-all duration-200
              `}
            >
              <button
                onClick={() => setSelectedPattern(isExpanded ? null : pattern.id)}
                className="w-full p-4 hover:bg-slate-800/20 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.iconBg}`}>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{pattern.name}</h4>
                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded border ${config.badge}`}>
                          {pattern.severity}
                        </span>
                      </div>
                      
                      {!isExpanded && (
                        <p className="text-xs text-slate-500 line-clamp-1">{pattern.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white">{pattern.frequency}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500">frequency</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/30">
                    <p className="text-xs text-slate-400 mb-3">{pattern.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Last detected: {pattern.detected}
                      </div>
                      
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                        View Cases <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Frequency Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Pattern Frequency</span>
                        <span className="text-white font-medium">{pattern.frequency}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${pattern.frequency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50">
        <button className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center justify-center gap-1">
          View All Patterns <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
