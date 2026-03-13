"use client";

import { Smartphone, Building2, CreditCard, Wallet, ArrowRightLeft } from "lucide-react";

interface ChannelData {
  name: string;
  icon: "mpesa" | "bank" | "card" | "wallet" | "transfer";
  transactions: number;
  fraud: number;
  percentage: number;
}

const channels: ChannelData[] = [
  { name: "M-PESA", icon: "mpesa", transactions: 142890, fraud: 892, percentage: 0.62 },
  { name: "Bank Transfer", icon: "bank", transactions: 58240, fraud: 423, percentage: 0.73 },
  { name: "Card Payments", icon: "card", transactions: 28450, fraud: 312, percentage: 1.10 },
  { name: "E-Wallet", icon: "wallet", transactions: 12450, fraud: 156, percentage: 1.25 },
  { name: "USSD/ATM", icon: "transfer", transactions: 6532, fraud: 64, percentage: 0.98 },
];

const iconMap = {
  mpesa: Smartphone,
  bank: Building2,
  card: CreditCard,
  wallet: Wallet,
  transfer: ArrowRightLeft,
};

const colorMap: Record<string, string> = {
  mpesa: "from-purple-500 to-pink-500",
  bank: "from-blue-500 to-cyan-500",
  card: "from-amber-500 to-orange-500",
  wallet: "from-emerald-500 to-teal-500",
  transfer: "from-indigo-500 to-violet-500",
};

interface ChannelDistributionProps {
  data?: ChannelData[];
}

export default function ChannelDistribution({ data }: ChannelDistributionProps) {
  const displayChannels = data && data.length > 0 ? data : channels;
  const totalTransactions = displayChannels.reduce((sum, c) => sum + c.transactions, 0);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white">Transaction Channels</h3>
        <p className="text-xs text-slate-500 mt-0.5">Distribution by channel type</p>
      </div>

      <div className="space-y-4">
        {displayChannels.map((channel) => {
          const iconKey = channel.icon as keyof typeof iconMap;
          const Icon = iconMap[iconKey] || ArrowRightLeft;
          const percent = totalTransactions > 0 ? (channel.transactions / totalTransactions) * 100 : 0;
          const isHighRisk = channel.percentage > 0.8;

          return (
            <div
              key={channel.name}
              className="group p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[channel.icon]} opacity-80`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{channel.name}</p>
                    <p className="text-xs text-slate-500">
                      {channel.transactions.toLocaleString()} txns
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isHighRisk ? "text-red-400" : "text-emerald-400"}`}>
                    {channel.percentage}%
                  </p>
                  <p className="text-[10px] text-slate-500">fraud rate</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorMap[channel.icon]} transition-all duration-500 group-hover:opacity-80`}
                  style={{ width: `${percent}%` }}
                />
                {isHighRisk && (
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-red-500/20 to-transparent animate-pulse" />
                )}
              </div>

              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">{percent.toFixed(1)}% of volume</span>
                <span className="text-[10px] text-slate-500">{channel.fraud} fraud cases</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Analyzed</span>
          <span className="text-sm font-semibold text-white">{totalTransactions.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
