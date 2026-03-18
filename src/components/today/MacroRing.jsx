import React from 'react';

export default function MacroRing({ value, max, label, color, unit = 'g', size = 72 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{Math.round(value)}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-muted-foreground">{Math.round(value)}/{max}{unit}</div>
      </div>
    </div>
  );
}