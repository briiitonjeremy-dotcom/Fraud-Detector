"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  BrainCircuit,
  Bot,
  Code2,
  Users,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
} from "lucide-react";
import { logout } from "@/lib/api";

interface SidebarProps {
  userRole?: string | null;
  loggedIn?: boolean;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", active: true },
  { href: "/upload", icon: Upload, label: "Upload Data", active: false },
  { href: "/explain", icon: BrainCircuit, label: "Explainability", active: false },
  { href: "/api-test", icon: Code2, label: "API Test", active: false },
  { href: "/admin", icon: Users, label: "Users & Admin", active: false },
  { href: "/login", icon: Bot, label: "AI Assistant", active: false },
];

export default function Sidebar({ userRole, loggedIn }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/60 flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">FraudGuard</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Protection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 group relative
                ${isActive 
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full" />
              )}
              <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span className={`text-sm font-medium ${isActive ? "text-cyan-400" : ""}`}>{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-500/60 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-slate-800/50 space-y-1.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200 border border-transparent"
        >
          <Settings className="w-4.5 h-4.5 text-slate-500" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent"
          >
            <LogOut className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200 border border-transparent"
          >
            <LogOut className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-sm font-medium">Login</span>
          </Link>
        )}
      </div>

      {/* User Info */}
      {loggedIn && userRole && (
        <div className="p-4 border-t border-slate-800/50">
          <div className={`
            p-3 rounded-lg border
            ${userRole === "admin" 
              ? "bg-purple-500/10 border-purple-500/30" 
              : userRole === "analyst"
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-emerald-500/10 border-emerald-500/30"
            }
          `}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`
                text-xs font-semibold uppercase tracking-wider
                ${userRole === "admin" ? "text-purple-400" : userRole === "analyst" ? "text-blue-400" : "text-emerald-400"}
              `}>
                {userRole}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${localStorage.getItem("isActive") !== "false" ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="text-[10px] text-slate-500">
                  {localStorage.getItem("isActive") !== "false" ? "ACTIVE" : "INACTIVE"}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").email : "user@example.com"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
