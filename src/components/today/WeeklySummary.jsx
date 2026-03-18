import React from 'react';
import { Calendar } from 'lucide-react';
import { subDays } from 'date-fns';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * WeeklySummary — visual weekly adherence & highlights
 * Shows 7-day pattern, key metrics trending
 */
export default function WeeklySummary({ allCheckins, meals, workouts }) {
  // Last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayCheckin = allCheckins.find(c => c.date === dateStr);
    const dayMeals = meals.filter(m => m.date === dateStr);
    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    
    return {
      date,
      dateStr,
      dayLabel: DAY_LABELS[date.getDay()],
      checkin: dayCheckin,
      mealsCount: dayMeals.length,
      workoutsCount: dayWorkouts.filter(w => w.completed).length,
      score: (dayCheckin ? 40 : 0) + (dayMeals.length > 0 ? 30 : 0) + (dayWorkouts.some(w => w.completed) ? 30 : 0),
    };
  });

  const weekAvgScore = Math.round(days.reduce((s, d) => s + d.score, 0) / 7);
  const checkinsThisWeek = days.filter(d => d.checkin).length;
  const workoutsThisWeek = days.filter(d => d.workoutsCount > 0).length;

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
        <p className="t-label">Esta semana</p>
      </div>

      {/* Weekly pattern */}
      <div className="flex items-end justify-between gap-1.5 h-20">
        {days.map((day, i) => {
          const maxScore = 100;
          const heightPct = (day.score / maxScore) * 100;
          const color = day.score >= 80 ? 'bg-[hsl(var(--ok))]' : day.score >= 50 ? 'bg-[hsl(var(--warn))]' : 'bg-[hsl(var(--fg-2)/0.2)]';
          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-16 rounded-t-md bg-[hsl(var(--shell))] relative flex items-end justify-center overflow-hidden">
                <div 
                  className={`w-full ${color} transition-all duration-500 rounded-t-sm`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-[hsl(var(--fg-2))] text-center">{day.dayLabel}</p>
            </div>
          );
        })}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[hsl(var(--border-h))]">
        <div className="text-center">
          <p className="text-[11px] text-[hsl(var(--fg-2))] mb-0.5">Média</p>
          <p className="text-[14px] font-bold text-[hsl(var(--fg))]">{weekAvgScore}%</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-[hsl(var(--fg-2))] mb-0.5">Check-ins</p>
          <p className="text-[14px] font-bold text-[hsl(var(--fg))]">{checkinsThisWeek}/7</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-[hsl(var(--fg-2))] mb-0.5">Treinos</p>
          <p className="text-[14px] font-bold text-[hsl(var(--fg))]">{workoutsThisWeek}</p>
        </div>
      </div>
    </div>
  );
}