import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle } from 'lucide-react';

export default function KPICard({ title, value, unit, change, changeType, icon: Icon, description }) {
  // Determine color theme based on metric type / state
  const isPositive = changeType === 'positive'; // positive means "good" (e.g. OEE up or scrap down)
  const isNeutral = changeType === 'neutral';
  
  let badgeColor = 'bg-slate-100 text-slate-700';
  let ArrowIcon = TrendingUp;

  if (isPositive) {
    badgeColor = 'bg-[var(--color-success-light)] text-[var(--color-success)]';
    ArrowIcon = ArrowUpRight;
  } else if (!isNeutral) {
    badgeColor = 'bg-[var(--color-danger-light)] text-[var(--color-danger)]';
    ArrowIcon = ArrowDownRight;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-lg font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400 font-medium truncate max-w-[70%]">
          {description}
        </span>
        {change && (
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
            {!isNeutral && <ArrowIcon className="h-3 w-3 stroke-[2.5]" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
