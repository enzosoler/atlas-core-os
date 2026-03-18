import React from 'react';

export default function AdherenceScore({ meals, workouts, checkin }) {
  let points = 0, max = 0;

  const mealCount = (meals || []).length;
  points += Math.min(mealCount * 10, 30); max += 30;
  if ((workouts || []).some(w => w.completed)) { points += 20; } max += 20;
  if (checkin) { points += 20; } max += 20;
  if (checkin?.hydration_liters >= 2) { points += 15; } max += 15;
  if (checkin?.sleep_hours >= 7) { points += 15; } max += 15;

  const score = max > 0 ? Math.round((points / max) * 100) : 0;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;

  const label = score >= 80 ? 'Excelente' : score >= 50 ? 'Bom' : 'Atenção';

  return (
    <div className="p-5 rounded-2xl bg-card border border-border">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Aderência</p>
      <div className="flex items-center gap-4">
        <div className="relative w-[84px] h-[84px] shrink-0">
          <svg width="84" height="84" className="-rotate-90">
            <circle cx="42" cy="42" r="34" fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
            <circle cx="42" cy="42" r="34" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none">{score}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-base font-semibold">{label}</p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            {score >= 80 ? 'Continue assim.' : score >= 50 ? 'Pode melhorar ainda mais.' : 'Foque nos itens pendentes.'}
          </p>
        </div>
      </div>
    </div>
  );
}