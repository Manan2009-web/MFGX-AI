import React, { useState } from 'react';
import { 
  Percent, 
  Clock, 
  Trash2, 
  Layers, 
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import KPICard from './KPICard';
import { 
  OverallTrendChart, 
  MachineComparisonChart, 
  DowntimeReasonChart 
} from './KPITrendChart';

export default function DashboardView({ kpiData, isLoading, onRefresh }) {
  const [selectedMachine, setSelectedMachine] = useState('All');

  if (isLoading && !kpiData) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner skeleton */}
        <div className="h-28 rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-center gap-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
        </div>

        {/* Filter pills skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 5].map(i => (
            <div key={i} className="h-9 bg-slate-200 rounded-lg w-20"></div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-6"></div>
          ))}
        </div>
      </div>
    );
  }

  const { summary = {}, machines = {}, trends = [], downtimeSummary = {} } = kpiData || {};

  // Find target stats based on filter
  const isAll = selectedMachine === 'All';
  const displayOee = isAll ? summary.factoryOee : machines[selectedMachine]?.oee || 0;
  const displayDowntime = isAll ? summary.totalDowntime : machines[selectedMachine]?.downtime || 0;
  const displayScrap = isAll ? summary.averageScrapRate : machines[selectedMachine]?.scrapRate || 0;
  const displayInventory = isAll ? summary.averageInventory : machines[selectedMachine]?.inventory || 0;

  // Set up mock/dynamic comparison helpers
  const getOeeStatus = (oee) => {
    if (oee >= 85) return { change: '+1.4%', type: 'positive', desc: 'Exceeding target of 85%' };
    if (oee >= 78) return { change: '-0.8%', type: 'neutral', desc: 'Acceptable efficiency' };
    return { change: '-4.2%', type: 'negative', desc: 'Requires attention' };
  };

  const getDowntimeStatus = (dt, machine) => {
    if (machine === 'Line 3') return { change: '+3.5h', type: 'negative', desc: 'High downtime due to breakdown' };
    if (machine === 'Line 4') return { change: '+1.8h', type: 'negative', desc: 'Material shortage halt' };
    if (dt > 3) return { change: '+1.2h', type: 'negative', desc: 'Slightly above normal' };
    return { change: 'Stable', type: 'positive', desc: 'Minimal production stops' };
  };

  const getScrapStatus = (scrap) => {
    if (scrap <= 1.5) return { change: 'Optimal', type: 'positive', desc: 'Excellent quality control' };
    if (scrap <= 2.2) return { change: '+0.1%', type: 'neutral', desc: 'Within target limits' };
    return { change: '+1.8%', type: 'negative', desc: 'Spike in defect rates' };
  };

  const getInventoryStatus = (inv) => {
    if (inv < 350) return { change: 'Low Stock', type: 'negative', desc: 'Running thin on buffer' };
    if (inv > 800) return { change: 'Buffer Full', type: 'neutral', desc: 'Ample distribution stocks' };
    return { change: 'Nominal', type: 'positive', desc: 'Balanced queue and shipping' };
  };

  const oeeStatus = getOeeStatus(displayOee);
  const downtimeStatus = getDowntimeStatus(displayDowntime, selectedMachine);
  const scrapStatus = getScrapStatus(displayScrap);
  const inventoryStatus = getInventoryStatus(displayInventory);

  return (
    <div className="space-y-6">
      
      {/* 1. AI Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-sm">
        {/* Subtle decorative background tint */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-slate-50 opacity-50 blur-xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-40 w-40 rounded-full bg-emerald-50/30 opacity-40 blur-xl"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#4A6FA5] shadow-xs">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-[#4A6FA5] uppercase">AI Executive Summary</h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Gemini 2.5 Flash
              </span>
            </div>
            {isLoading ? (
              <div className="space-y-2 mt-2">
                <div className="h-3.5 bg-slate-200 rounded w-full"></div>
                <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
              </div>
            ) : (
              <p className="text-[14px] leading-relaxed font-medium text-slate-700">
                {summary.aiSummary || "No operational summary generated yet."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filters & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Horizontal filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl w-fit">
          {['All', 'Line 1', 'Line 2', 'Line 3', 'Line 4'].map((machine) => (
            <button
              key={machine}
              onClick={() => setSelectedMachine(machine)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                selectedMachine === machine
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              {machine === 'All' ? 'All Lines' : machine}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-98 transition-all duration-150 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-400' : 'text-slate-500'}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>

      {/* 3. KPI Card Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Overall OEE"
          value={displayOee}
          unit="%"
          change={oeeStatus.change}
          changeType={oeeStatus.type}
          icon={Percent}
          description={oeeStatus.desc}
        />
        <KPICard
          title="Total Downtime"
          value={displayDowntime}
          unit="hrs"
          change={downtimeStatus.change}
          changeType={downtimeStatus.type}
          icon={Clock}
          description={downtimeStatus.desc}
        />
        <KPICard
          title="Scrap Rate"
          value={displayScrap}
          unit="%"
          change={scrapStatus.change}
          changeType={scrapStatus.type}
          icon={Trash2}
          description={scrapStatus.desc}
        />
        <KPICard
          title="Current Inventory"
          value={displayInventory}
          unit="units"
          change={inventoryStatus.change}
          changeType={inventoryStatus.type}
          icon={Layers}
          description={inventoryStatus.desc}
        />
      </div>

      {/* 4. Charts Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle: Trends */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">7-Day Operational Trends</h3>
            <p className="text-xs font-medium text-slate-400">Hourly aggregates compiled daily</p>
          </div>
          {isAll ? (
            <OverallTrendChart data={trends} />
          ) : (
            // Show machine comparison chart highlighting the active line or a customized single view
            // Here we show comparison chart, which is highly informative
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-100">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                Showing machine comparisons. Highlighted: <strong>{selectedMachine}</strong>
              </div>
              <MachineComparisonChart data={trends} />
            </div>
          )}
        </div>

        {/* Right: Downtime breakdown / Machine breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Downtime Allocation</h3>
            <p className="text-xs font-medium text-slate-400">Total duration by operational failure modes</p>
          </div>
          {isAll ? (
            <DowntimeReasonChart data={downtimeSummary} />
          ) : (
            // For single machine, show explanation of that machine's downtime
            <div className="flex flex-col justify-between h-[300px]">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Total Stops Duration</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{displayDowntime} hours</p>
                </div>
                <div className="text-sm space-y-2 text-slate-600">
                  <p><strong>Primary Causes:</strong></p>
                  {selectedMachine === 'Line 3' && (
                    <p className="text-xs bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 leading-relaxed">
                      Mechanical breakdown accounted for over 90% of total downtime (4.5 hrs) on Day 5, affecting the drive motor assembly.
                    </p>
                  )}
                  {selectedMachine === 'Line 4' && (
                    <p className="text-xs bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 leading-relaxed">
                      Material shortage accounted for 3.8 hrs of idle time on Day 3 due to upstream supplier logistics delays.
                    </p>
                  )}
                  {selectedMachine !== 'Line 3' && selectedMachine !== 'Line 4' && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100 leading-relaxed">
                      Excellent availability. All stops were minor changeovers (under 30 minutes) within standard operational tolerances.
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                * Data sourced from PLC machine triggers
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
