import React from 'react';
import { LayoutDashboard, MessageSquareCode, Factory, HelpCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#4A6FA5] shadow-inner transition-all hover:scale-105">
              <Factory className="h-5.5 w-5.5 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">MFGX AI</h1>
              <span className="text-xs font-medium text-slate-500">Manufacturing Copilot</span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 sm:py-2 text-sm font-semibold rounded-lg transition-all duration-250 cursor-pointer min-h-[44px] sm:min-h-[36px] ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center gap-2 px-4 py-3 sm:py-2 text-sm font-semibold rounded-lg transition-all duration-250 cursor-pointer min-h-[44px] sm:min-h-[36px] ${
                activeTab === 'copilot'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquareCode className="h-4.5 w-4.5" />
              <span>Copilot Chat</span>
            </button>
          </nav>

          {/* System status / Help (Desktop only) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </div>
            <a 
              href="#help" 
              onClick={(e) => {
                e.preventDefault();
                alert("MFGX AI Copilot: Monitor machine health on the Dashboard view, or switch to Copilot Chat to query machine telemetry using natural language (e.g., 'Which machine had the most downtime this week?').");
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
