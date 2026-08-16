import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Custom tooltip styled to match the dashboard aesthetics
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }}></span>
                {item.name}
              </span>
              <span className="text-slate-900">
                {formatter ? formatter(item.value, item.name) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 1. Overall Trend Chart (OEE Area & Downtime Line)
export function OverallTrendChart({ data }) {
  const formatTooltip = (val, name) => {
    if (name === 'Factory OEE') return `${val}%`;
    if (name === 'Downtime') return `${val} hrs`;
    return val;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A6FA5" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#4A6FA5" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="date" 
            stroke="#94A3B8" 
            fontSize={11}
            tickLine={false}
            axisLine={false} 
          />
          <YAxis 
            yAxisId="left"
            stroke="#94A3B8" 
            fontSize={11}
            domain={[40, 100]}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#94A3B8" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="oee" 
            name="Factory OEE" 
            stroke="#4A6FA5" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorOee)" 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="downtime" 
            name="Downtime" 
            stroke="#F59E0B" 
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 1.5 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Machine Performance Comparison (OEE line chart per machine)
export function MachineComparisonChart({ data }) {
  const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
  const colors = ['#4A6FA5', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="date" 
            stroke="#94A3B8" 
            fontSize={11}
            tickLine={false}
            axisLine={false} 
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={11}
            domain={[30, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip formatter={(val) => `${val}% OEE`} />} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
          />
          {lines.map((line, idx) => (
            <Line
              key={line}
              type="monotone"
              dataKey={`${line} OEE`}
              name={line}
              stroke={colors[idx]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Downtime Reason Summary (Bar Chart)
export function DowntimeReasonChart({ data }) {
  // data should be like: { 'changeover': 3, 'breakdown': 4.5, ... }
  const formattedData = Object.entries(data).map(([reason, duration]) => ({
    reason: reason.charAt(0).toUpperCase() + reason.slice(1),
    duration: Math.round(duration * 10) / 10
  })).sort((a, b) => b.duration - a.duration);

  return (
    <div className="h-[300px] w-full">
      {formattedData.length === 0 || formattedData.every(d => d.duration === 0) ? (
        <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
          No downtime recorded in this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={formattedData} 
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis 
              type="number" 
              stroke="#94A3B8" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 11 }}
            />
            <YAxis 
              type="category" 
              dataKey="reason" 
              stroke="#475569" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip formatter={(val) => `${val} hours`} />} />
            <Bar 
              dataKey="duration" 
              name="Downtime Duration" 
              fill="#4A6FA5" 
              radius={[0, 8, 8, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
