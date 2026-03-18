import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

function MacroBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value)}<span className="text-muted-foreground">/{max}g</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TodayNutrition({ meals, profile }) {
  const t = (meals || []).reduce((a, m) => ({
    cal: a.cal + (m.total_calories || 0),
    pro: a.pro + (m.total_protein || 0),
    carb: a.carb + (m.total_carbs || 0),
    fat: a.fat + (m.total_fat || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const targets = {
    cal: profile?.calories_target || 2200,
    pro: profile?.protein_target || 160,
    carb: profile?.carbs_target || 250,
    fat: profile?.fat_target || 70,
  };

  const calPct = Math.min((t.cal / targets.cal) * 100, 100);

  return (
    <Link to="/Nutrition" className="block p-5 rounded-2xl bg-card border border-border hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Nutrição</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" strokeWidth={2} />
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-2xl font-bold">{Math.round(t.cal)}</span>
          <span className="text-[13px] text-muted-foreground">/ {targets.cal} kcal</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-700" style={{ width: `${calPct}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        <MacroBar label="Proteína" value={t.pro} max={targets.pro} color="#3b82f6" />
        <MacroBar label="Carboidratos" value={t.carb} max={targets.carb} color="#a78bfa" />
        <MacroBar label="Gordura" value={t.fat} max={targets.fat} color="#f59e0b" />
      </div>
    </Link>
  );
}