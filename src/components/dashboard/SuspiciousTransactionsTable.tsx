"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  AlertTriangle, 
  Phone, 
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface Transaction {
  refCode: string;
  channel: string;
  type: string;
  sender: string;
  recipient: string;
  phone: string;
  amount: number;
  fee: number;
  dateTime: string;
  riskScore: number;
  alertReason: string;
}

const transactions: Transaction[] = [
  {
    refCode: "MPE8FK9D2J3",
    channel: "M-PESA",
    type: "Send Money",
    sender: "John Mwangi",
    recipient: "Faith Nekesa",
    phone: "2547XX847XXX",
    amount: 45000,
    fee: 450,
    dateTime: "2026-03-13 14:32:15",
    riskScore: 94,
    alertReason: "Unusual transaction amount for recipient",
  },
  {
    refCode: "MPE7JD3K1L4",
    channel: "M-PESA",
    type: "Paybill",
    sender: "Sarah Wanjiku",
    recipient: "SAFEBODA LTD",
    phone: "522XXX",
    amount: 12500,
    fee: 125,
    dateTime: "2026-03-13 14:28:42",
    riskScore: 87,
    alertReason: "Paybill velocity anomaly",
  },
  {
    refCode: "BKTR5HM7P9Q",
    channel: "Bank",
    type: "Transfer",
    sender: "David Otieno",
    recipient: "Equity Bank",
    phone: "ACCXXXX8921",
    amount: 250000,
    fee: 250,
    dateTime: "2026-03-13 14:25:33",
    riskScore: 82,
    alertReason: "First-time large transfer to new account",
  },
  {
    refCode: "MPE2NP4R6S8",
    channel: "M-PESA",
    type: "Buy Goods",
    sender: "Mary Akinyi",
    recipient: "QUICKMART",
    phone: "8XXXX",
    amount: 8200,
    fee: 0,
    dateTime: "2026-03-13 14:22:18",
    riskScore: 78,
    alertReason: "Merchant flagged in suspicious database",
  },
  {
    refCode: "MPE1TQ3W5X7",
    channel: "M-PESA",
    type: "Receive Money",
    sender: "Unknown",
    recipient: "Peter Ochieng",
    phone: "2547XX215XXX",
    amount: 89000,
    fee: 0,
    dateTime: "2026-03-13 14:18:55",
    riskScore: 91,
    alertReason: "Sender identity unverified",
  },
  {
    refCode: "BKTR9AB2C4D",
    channel: "Bank",
    type: "Airtime",
    sender: "James Kiprop",
    recipient: "Self",
    phone: "2547XXXXX",
    amount: 5000,
    fee: 50,
    dateTime: "2026-03-13 14:15:27",
    riskScore: 65,
    alertReason: "High frequency of airtime purchases",
  },
];

const channelIcons: Record<string, typeof Phone> = {
  "M-PESA": Phone,
  "Bank": Building2,
};

const channelColors: Record<string, string> = {
  "M-PESA": "from-purple-500 to-pink-500",
  "Bank": "from-blue-500 to-cyan-500",
};

function getRiskColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 80) return { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" };
  if (score >= 60) return { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" };
}

function getRiskLabel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  return "MEDIUM";
}

interface SortIconProps {
  field: keyof Transaction;
  sortField: keyof Transaction;
  sortDirection: "asc" | "desc";
}

function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field) return null;
  return sortDirection === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1" />
  );
}

interface SuspiciousTransactionsTableProps {
  transactions?: Transaction[];
}

export default function SuspiciousTransactionsTable({ transactions: providedTransactions }: SuspiciousTransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Transaction>("riskScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const displayTransactions = providedTransactions && providedTransactions.length > 0 ? providedTransactions : transactions;

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredTransactions = displayTransactions
    .filter(txn => 
      txn.refCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc" 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Suspicious Transactions</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
            {displayTransactions.length} flagged
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          {/* Filter */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/30">
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("refCode")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Ref Code <SortIcon field="refCode" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("channel")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Channel <SortIcon field="channel" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("type")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Type <SortIcon field="type" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sender</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("amount")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Amount (KES) <SortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("dateTime")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Date & Time <SortIcon field="dateTime" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort("riskScore")}
                  className="flex items-center hover:text-white transition-colors"
                >
                  Risk Score <SortIcon field="riskScore" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Alert Reason</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredTransactions.map((txn) => {
              const risk = getRiskColor(txn.riskScore);
              const ChannelIcon = channelIcons[txn.channel] || Phone;
              
              return (
                <tr key={txn.refCode} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-cyan-400 font-medium">{txn.refCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${channelColors[txn.channel]} opacity-80`}>
                        <ChannelIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-300">{txn.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-300">{txn.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white">{txn.sender}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white">{txn.recipient}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-white">{txn.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">(+{txn.fee})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-slate-400 font-mono">{txn.dateTime}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${risk.bg.replace('/20', '/60')}`}
                          style={{ width: `${txn.riskScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${risk.text}`}>{txn.riskScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-slate-400 max-w-[150px] truncate block" title={txn.alertReason}>
                      {txn.alertReason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-all">
                      <Eye className="w-3 h-3" />
                      Investigate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing {filteredTransactions.length} of {displayTransactions.length} transactions
        </span>
        <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1">
          View All Transactions <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
