"use client";

import { useState, useEffect } from "react";
import { Search, Bell, RefreshCw, User, Calendar, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  mlStatus?: "loading" | "online" | "offline";
  hasRealData?: boolean;
}

export default function Header({ mlStatus = "online", hasRealData = false }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <header className="flex items-center justify-between py-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Fraud Detection Center</h1>
        <p className="text-sm text-slate-400 mt-0.5">Kenyan Mobile Money Transaction Monitoring</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className={`w-2 h-2 rounded-full ${mlStatus === "online" ? "bg-emerald-500 animate-pulse" : mlStatus === "loading" ? "bg-amber-500" : "bg-red-500"}`} />
          <span className="text-xs font-medium text-slate-300">
            {mlStatus === "online" ? "LIVE" : mlStatus === "loading" ? "CONNECTING" : "OFFLINE"}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-mono text-slate-300">{currentTime}</span>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all group"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all relative group">
          <Bell className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
        </button>

        {/* Profile */}
        <button className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all">
          <User className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
