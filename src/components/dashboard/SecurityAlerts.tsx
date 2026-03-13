"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";

interface Alert {
  id: string;
  time: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  percentage?: number;
}

const alerts: Alert[] = [
  {
    id: "1",
    time: "2 min ago",
    severity: "critical",
    title: "Multiple Failed OTP Attempts",
    message: "User attempted 5+ failed OTP verifications from IP 197.232.XX.XX",
    source: "Auth System",
    percentage: 94,
  },
  {
    id: "2",
    time: "8 min ago",
    severity: "critical",
    title: "Unusual Transaction Spike",
    message: "Nairobi CBD area showing 340% increase in high-value M-PESA transfers",
    source: "ML Model",
    percentage: 87,
  },
  {
    id: "3",
    time: "15 min ago",
    severity: "warning",
    title: "New Device Login Detected",
    message: "First-time device accessing account 2547XXXXXXXX from Mombasa",
    source: "Security",
    percentage: 62,
  },
  {
    id: "4",
    time: "32 min ago",
    severity: "warning",
    title: "Paybill Velocity Alert",
    message: "Paybill 522XXX receiving unusual transaction volume in last hour",
    source: "Fraud Rules",
    percentage: 58,
  },
  {
    id: "5",
    time: "45 min ago",
    severity: "info",
    title: "Daily Limit Reminder",
    message: "85% of daily transaction limit reached for several high-risk accounts",
    source: "Monitoring",
    percentage: 34,
  },
  {
    id: "6",
    time: "1 hr ago",
    severity: "info",
    title: "Model Retraining Complete",
    message: "Fraud detection model v2.3.1 successfully retrained on new dataset",
    source: "ML Pipeline",
    percentage: 12,
  },
];

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  info: {
    icon: Info,
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
};

interface SecurityAlertsProps {
  alerts?: Alert[];
}

export default function SecurityAlertsPanel({ alerts: providedAlerts }: SecurityAlertsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [minimized, setMinimized] = useState<Set<string>>(new Set());

  const displayAlerts = providedAlerts && providedAlerts.length > 0 ? providedAlerts : alerts;

  const toggleMinimize = (id: string) => {
    const newMinimized = new Set(minimized);
    if (newMinimized.has(id)) {
      newMinimized.delete(id);
    } else {
      newMinimized.add(id);
    }
    setMinimized(newMinimized);
  };

  const criticalCount = displayAlerts.filter(a => a.severity === "critical").length;

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Security Alerts</h3>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full animate-pulse">
              {criticalCount} Critical
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Alerts List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {displayAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            const isMinimized = minimized.has(alert.id);

            return (
              <div
                key={alert.id}
                className={`
                  p-4 border-b border-slate-800/30 hover:bg-slate-800/20 transition-all
                  ${config.bg}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.iconBg}`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.badge}`}>
                          {alert.severity}
                        </span>
                        {alert.percentage && (
                          <span className="text-xs text-slate-500">{alert.percentage}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </div>
                    </div>

                    <h4 className="text-sm font-medium text-white mb-0.5">{alert.title}</h4>
                    
                    {!isMinimized && (
                      <>
                        <p className="text-xs text-slate-400 mb-2">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Source: {alert.source}</span>
                          <button className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            Investigate <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => toggleMinimize(alert.id)}
                    className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMinimized ? "-rotate-90" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-800/50">
          <button className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            View All Alerts →
          </button>
        </div>
      )}
    </div>
  );
}
