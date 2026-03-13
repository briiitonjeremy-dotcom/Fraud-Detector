"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Flag, 
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: "activity" | "incoming" | "outgoing" | "bills" | "fraud" | "highRisk";
  format?: "number" | "currency" | "percentage";
  color?: "cyan" | "emerald" | "amber" | "red" | "purple";
}

const iconMap = {
  activity: Activity,
  incoming: ArrowDownLeft,
  outgoing: ArrowUpRight,
  bills: Receipt,
  fraud: Flag,
  highRisk: Users,
};

const colorMap = {
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    icon: "text-cyan-400",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/20 to-blue-600/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/20 to-teal-600/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-500/20 to-orange-600/10",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
    glow: "shadow-red-500/20",
    gradient: "from-red-500/20 to-rose-600/10",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: "text-purple-400",
    glow: "shadow-purple-500/20",
    gradient: "from-purple-500/20 to-violet-600/10",
  },
};

function AnimatedNumber({ value, format }: { value: number; format: "number" | "currency" | "percentage" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val: number) => {
    if (format === "currency") return `KES ${val.toLocaleString()}`;
    if (format === "percentage") return `${val.toFixed(2)}%`;
    return val.toLocaleString();
  };

  return <span>{formatValue(displayValue)}</span>;
}

function KPICard({ title, value, change, changeLabel, icon, format = "number", color = "cyan" }: KPICardProps) {
  const Icon = iconMap[icon];
  const colorConfig = colorMap[color];
  const isPositive = change !== undefined && change >= 0;

  const displayValue = typeof value === "number" ? (
    <AnimatedNumber value={value} format={format} />
  ) : value;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border ${colorConfig.bg} ${colorConfig.border}
      bg-gradient-to-br ${colorConfig.gradient} p-5
      hover:border-slate-500/50 transition-all duration-300 hover:shadow-lg ${colorConfig.glow}
      group
    `}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${color === "cyan" ? "from-cyan-400" : color === "emerald" ? "from-emerald-400" : color === "amber" ? "from-amber-400" : color === "red" ? "from-red-400" : "from-purple-400"} to-transparent blur-2xl`} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-lg ${colorConfig.bg} border ${colorConfig.border}`}>
            <Icon className={`w-5 h-5 ${colorConfig.icon}`} />
          </div>
          
          {change !== undefined && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${isPositive 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : "bg-red-500/20 text-red-400 border border-red-500/30"
              }
            `}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{displayValue}</p>
          
          {changeLabel && (
            <p className="text-xs text-slate-500 mt-2">{changeLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface KPIGridProps {
  data?: {
    totalTransactions: number;
    incomingTransfers: number;
    outgoingTransfers: number;
    billPayments: number;
    fraudFlags: number;
    highRiskRecipients: number;
  };
}

export default function KPIGrid({ data }: KPIGridProps) {
  const defaultData = {
    totalTransactions: 248562,
    incomingTransfers: 142890,
    outgoingTransfers: 89540,
    billPayments: 16132,
    fraudFlags: 1847,
    highRiskRecipients: 342,
  };

  const stats = data || defaultData;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <KPICard
        title="Total Transactions"
        value={stats.totalTransactions}
        change={8.2}
        changeLabel="vs last 14 days"
        icon="activity"
        color="cyan"
      />
      <KPICard
        title="Incoming Transfers"
        value={stats.incomingTransfers}
        change={5.4}
        changeLabel="M-PESA & Bank"
        icon="incoming"
        color="emerald"
      />
      <KPICard
        title="Outgoing Transfers"
        value={stats.outgoingTransfers}
        change={-2.1}
        changeLabel="M-PESA & Bank"
        icon="outgoing"
        color="purple"
      />
      <KPICard
        title="Bill Payments"
        value={stats.billPayments}
        change={12.8}
        changeLabel="Paybill & Utilities"
        icon="bills"
        color="amber"
      />
      <KPICard
        title="Fraud Flags"
        value={stats.fraudFlags}
        change={-15.3}
        changeLabel="Flagged by AI"
        icon="fraud"
        color="red"
      />
      <KPICard
        title="High-Risk Recipients"
        value={stats.highRiskRecipients}
        change={3.7}
        changeLabel="Under review"
        icon="highRisk"
        color="purple"
      />
    </div>
  );
}
