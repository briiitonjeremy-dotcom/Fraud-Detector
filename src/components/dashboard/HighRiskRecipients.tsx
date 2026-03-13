"use client";

import { useState } from "react";
import { 
  Users, 
  Building2, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  ArrowRight,
  MapPin
} from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  type: "merchant" | "paybill" | "individual";
  transactions: number;
  fraudCount: number;
  riskPercentage: number;
  region: string;
  lastActivity: string;
}

const recipients: Recipient[] = [
  {
    id: "1",
    name: "QUICKMART SUPERMARKET",
    type: "merchant",
    transactions: 2450,
    fraudCount: 89,
    riskPercentage: 3.63,
    region: "Nairobi",
    lastActivity: "2 min ago",
  },
  {
    id: "2",
    name: "SAFEBODA LTD",
    type: "merchant",
    transactions: 18920,
    fraudCount: 412,
    riskPercentage: 2.18,
    region: "Kampala",
    lastActivity: "5 min ago",
  },
  {
    id: "3",
    name: "KENYA POWER",
    type: "paybill",
    transactions: 128450,
    fraudCount: 1856,
    riskPercentage: 1.44,
    region: "Nairobi",
    lastActivity: "12 min ago",
  },
  {
    id: "4",
    name: "HELB LOANS",
    type: "paybill",
    transactions: 89450,
    fraudCount: 1245,
    riskPercentage: 1.39,
    region: "Nairobi",
    lastActivity: "18 min ago",
  },
  {
    id: "5",
    name: "JULA SUPERMARKET",
    type: "merchant",
    transactions: 1890,
    fraudCount: 42,
    riskPercentage: 2.22,
    region: "Mombasa",
    lastActivity: "25 min ago",
  },
  {
    id: "6",
    name: "KPLC PREPAID",
    type: "paybill",
    transactions: 245680,
    fraudCount: 2678,
    riskPercentage: 1.09,
    region: "Nationwide",
    lastActivity: "8 min ago",
  },
  {
    id: "7",
    name: "NAKUMATT LTD",
    type: "merchant",
    transactions: 3240,
    fraudCount: 56,
    riskPercentage: 1.73,
    region: "Nairobi",
    lastActivity: "1 hr ago",
  },
  {
    id: "8",
    name: "TUSKY'S SUPERMARKET",
    type: "merchant",
    transactions: 1560,
    fraudCount: 28,
    riskPercentage: 1.79,
    region: "Kisumu",
    lastActivity: "45 min ago",
  },
];

const typeConfig = {
  merchant: {
    icon: Building2,
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    label: "Merchant",
  },
  paybill: {
    icon: Receipt,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    label: "Paybill",
  },
  individual: {
    icon: Users,
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    label: "Individual",
  },
};

function getRiskBadge(percentage: number): { text: string; bg: string; border: string; color: string } {
  if (percentage >= 3) return { text: "CRITICAL", bg: "bg-red-500/20", border: "border-red-500/30", color: "text-red-400" };
  if (percentage >= 2) return { text: "HIGH", bg: "bg-orange-500/20", border: "border-orange-500/30", color: "text-orange-400" };
  if (percentage >= 1) return { text: "MEDIUM", bg: "bg-amber-500/20", border: "border-amber-500/30", color: "text-amber-400" };
  return { text: "LOW", bg: "bg-emerald-500/20", border: "border-emerald-500/30", color: "text-emerald-400" };
}

export default function HighRiskRecipients() {
  const [filter, setFilter] = useState<"all" | "merchant" | "paybill" | "individual">("all");

  const filteredRecipients = filter === "all" 
    ? recipients 
    : recipients.filter(r => r.type === filter);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">High-Risk Recipients</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
            Top Risk
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
          {(["all", "merchant", "paybill", "individual"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`
                px-2.5 py-1 text-[10px] font-medium rounded-md transition-all
                ${filter === type 
                  ? "bg-slate-700 text-white" 
                  : "text-slate-500 hover:text-slate-300"
                }
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-800/30">
        {filteredRecipients.slice(0, 6).map((recipient, index) => {
          const config = typeConfig[recipient.type];
          const Icon = config.icon;
          const riskBadge = getRiskBadge(recipient.riskPercentage);

          return (
            <div 
              key={recipient.id} 
              className="p-4 hover:bg-slate-800/20 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index < 3 ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-400"}
                  `}>
                    {index + 1}
                  </span>

                  {/* Icon & Info */}
                  <div className={`p-2 rounded-lg ${config.iconBg}`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">{recipient.name}</p>
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded border ${riskBadge.bg} ${riskBadge.border} ${riskBadge.color}`}>
                        {riskBadge.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{recipient.transactions.toLocaleString()} txns</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-red-400">{recipient.fraudCount} fraud</span>
                      <span className="text-slate-700">•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {recipient.region}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-sm font-bold text-red-400">{recipient.riskPercentage}%</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{recipient.lastActivity}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`
                      h-full rounded-full transition-all duration-500
                      ${recipient.riskPercentage >= 3 ? "bg-red-500" : recipient.riskPercentage >= 2 ? "bg-orange-500" : "bg-amber-500"}
                    `}
                    style={{ width: `${Math.min(recipient.riskPercentage * 20, 100)}%` }}
                  />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50">
        <button className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center justify-center gap-1">
          View All Recipients <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
