/**
 * NutritionComparison — show target vs logged macros + prescribed diet
 */
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const MACRO_COLORS = { protein: '#4F8CFF', carbs: '#8B7CFF', fat: '#F5A83A' };

function MacroBar({ label, logged, target, color }) {
  const pct = Math.min((logged / target) * 100, 100);
  const status = logged >= target * 0.9 ? 'ok' : 'warn';
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${status === 'ok' ? 'text-[hsl(var(--ok))]' : 'text-muted-foreground'}`}>
          {Math.round(logged)}<span className="text-muted-foreground font-normal">/{target}g</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function NutritionComparison({ profile, logged, prescribed }) {
  const targets = {
    cal: profile?.calories_target || 2200,
    pro: profile?.protein_target || 160,
    carb: profile?.carbs_target || 250,
    fat: profile?.fat_target || 70,
  };

  const t = logged.reduce((a, m) => ({
    cal: a.cal + (m.total_calories || 0),
    pro: a.pro + (m.total_protein || 0),
    carb: a.carb + (m.total_carbs || 0),
    fat: a.fat + (m.total_fat || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const calPct = Math.min((t.cal / targets.cal) * 100, 100);
  const remaining = Math.max(0, targets.cal - Math.round(t.cal));

  return (
    <div className="space-y-6">
      {/* Current Macros (Logged) */}
      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ok))]" strokeWidth={2} />
          <h3 className="text-[14px] font-semibold">Registrado hoje</h3>
          <span className="ml-auto text-[13px] text-muted-foreground">{Math.round(t.cal)} kcal</span>
        </div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="kpi-sm">{Math.round(t.cal)}</span>
            <span className="text-[13px] text-muted-foreground">/ {targets.cal} kcal</span>
          </div>
          <span className="text-[12px] text-muted-foreground">{remaining > 0 ? `${remaining} restam` : '✓ Meta atingida'}</span>
        </div>
        <div className="h-2 rounded-full bg-[hsl(var(--secondary))] overflow-hidden mb-5">
          <div className="h-full rounded-full transition-all duration-700 bg-[hsl(var(--brand))]" style={{ width: `${calPct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MacroBar label="Proteína" logged={t.pro} target={targets.pro} color={MACRO_COLORS.protein} />
          <MacroBar label="Carboidratos" logged={t.carb} target={targets.carb} color={MACRO_COLORS.carbs} />
          <MacroBar label="Gordura" logged={t.fat} target={targets.fat} color={MACRO_COLORS.fat} />
        </div>
      </div>

      {/* Prescribed Diet (if exists) */}
      {prescribed && (
        <div className="surface p-6 border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand)/0.02)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-[hsl(var(--brand))]" strokeWidth={2} />
            <h3 className="text-[14px] font-semibold">Plano Alimentar</h3>
            <span className="ml-auto badge badge-blue">{prescribed.meals?.length || 0} refeições</span>
          </div>
          <div className="text-[12px] space-y-2 mb-3">
            {prescribed.name && <p><strong>{prescribed.name}</strong></p>}
            {prescribed.description && <p className="text-muted-foreground line-clamp-2">{prescribed.description}</p>}
          </div>
          {prescribed.target_calories && (
            <div className="text-[12px] text-muted-foreground space-y-1 pt-3 border-t border-border">
              <p>Meta: {prescribed.target_calories} kcal · P {prescribed.target_protein}g · C {prescribed.target_carbs}g · G {prescribed.target_fat}g</p>
            </div>
          )}
        </div>
      )}

      {/* Adherence */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(var(--brand)/0.05)] border border-[hsl(var(--brand)/0.1)] text-[12px] text-[hsl(var(--brand))]">
        <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span className="font-medium">
          {calPct >= 90 ? '✓ Meta de calorias atingida' : `${Math.round(calPct)}% da meta de calorias`}
        </span>
      </div>
    </div>
  );
}