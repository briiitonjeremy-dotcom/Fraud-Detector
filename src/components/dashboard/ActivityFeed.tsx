"use client";

import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Database, 
  UserCheck, 
  Shield, 
  Clock,
  ArrowRight,
  Fingerprint,
  Smartphone
} from "lucide-react";

interface ActivityItem {
  id: string;
  time: string;
  action: string;
  source: string;
  status: "success" | "warning" | "error" | "info";
  details?: string;
}

const activities: ActivityItem[] = [
  { id: "1", time: "Just now", action: "Transaction Analyzed", source: "ML Engine", status: "success", details: "TXN_8FK9D2 processed in 0.3s" },
  { id: "2", time: "1 min ago", action: "Fraud Detected", source: "AI Model", status: "warning", details: "Score: 89% - M-PESA Send Money" },
  { id: "3", time: "2 min ago", action: "Threshold Exceeded", source: "Fraud Rules", status: "warning", details: "Daily limit alert - 2547XXXXXXXX" },
  { id: "4", time: "3 min ago", action: "Transaction Analyzed", source: "ML Engine", status: "success", details: "TXN_7JD3K1 processed in 0.2s" },
  { id: "5", time: "5 min ago", action: "Dataset Processed", source: "Data Pipeline", status: "success", details: "2,450 records analyzed" },
  { id: "6", time: "8 min ago", action: "User Login", source: "Auth System", status: "info", details: "Analyst: jane.k@company.co.ke" },
  { id: "7", time: "10 min ago", action: "OTP Verified", source: "Security", status: "success", details: "2FA completed for account review" },
  { id: "8", time: "12 min ago", action: "High Risk Alert", source: "ML Engine", status: "error", details: "Pattern: SIM Swap detected" },
  { id: "9", time: "15 min ago", action: "Model Updated", source: "ML Pipeline", status: "info", details: "FraudGuard v2.4.0 deployed" },
  { id: "10", time: "18 min ago", action: "Transaction Analyzed", source: "ML Engine", status: "success", details: "TXN_5HM7P9 processed in 0.4s" },
  { id: "11", time: "22 min ago", action: "Batch Review Complete", source: "Admin Panel", status: "success", details: "47 cases reviewed and resolved" },
  { id: "12", time: "25 min ago", action: "Anomaly Detected", source: "Pattern Recognition", status: "warning", details: "Unusual geolocation: Westlands" },
];

const statusConfig = {
  success: {
    icon: Shield,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-400",
  },
  error: {
    icon: Activity,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
    text: "text-red-400",
  },
  info: {
    icon: Clock,
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    dot: "bg-cyan-500",
    text: "text-cyan-400",
  },
};

const actionIconMap: Record<string, typeof Activity> = {
  "Transaction Analyzed": Activity,
  "Fraud Detected": AlertTriangle,
  "Threshold Exceeded": TrendingUp,
  "Dataset Processed": Database,
  "User Login": UserCheck,
  "OTP Verified": Fingerprint,
  "High Risk Alert": Shield,
  "Model Updated": Smartphone,
  "Batch Review Complete": Database,
  "Anomaly Detected": AlertTriangle,
};

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

export default function ActivityFeed({ activities: providedActivities }: ActivityFeedProps) {
  const displayActivities = providedActivities && providedActivities.length > 0 ? providedActivities : activities;
  
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Activity Feed</h3>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <span className="text-xs text-slate-500">{displayActivities.length} events</span>
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {displayActivities.map((item, index) => {
          const config = statusConfig[item.status];
          const StatusIcon = config.icon;
          const ActionIcon = actionIconMap[item.action] || Activity;

          return (
            <div
              key={item.id}
              className="relative pl-6 pr-4 py-3 hover:bg-slate-800/20 transition-colors group"
            >
              {/* Timeline Line */}
              {index < activities.length - 1 && (
                <div className="absolute left-[11px] top-10 bottom-0 w-px bg-slate-800/50" />
              )}

              {/* Timeline Dot */}
              <div className={`
                absolute left-2 top-3.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10
                ${config.dot}
                ${item.status === "warning" || item.status === "error" ? "animate-pulse" : ""}
              `} />

              <div className="flex items-start gap-3">
                <div className={`
                  p-1.5 rounded-lg mt-0.5
                  ${config.bg} border ${config.border}
                `}>
                  <ActionIcon className={`w-3 h-3 ${config.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{item.action}</p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{item.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{item.source}</span>
                    {item.details && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="text-xs text-slate-400 truncate">{item.details}</span>
                      </>
                    )}
                  </div>
                </div>

                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/50 transition-all">
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50">
        <button className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          View All Activity →
        </button>
      </div>
    </div>
  );
}
