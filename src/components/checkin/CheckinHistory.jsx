import React from 'react';
import { subDays } from 'date-fns';
import { Zap, Moon, Droplets } from 'lucide-react';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const MOOD_LABELS = { 1: 'Muito ruim', 2: 'Ruim', 3: 'Neutro', 4: 'Bom', 5: 'Ótimo' };
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function CheckinHistory({ checkins }) {
  // Last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dateStr = date.toISOString().split('T')[0];
    const checkin = checkins.find(c => c.date === dateStr);
    return { date, dateStr, checkin };
  }).reverse();

  return (
    <div className="space-y-3">
      <p className="t-label">Últimos 7 dias</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ date, checkin }) => {
          const dayLabel = DAY_SHORT[date.getDay()];
          const dayNum = date.getDate();
          
          return (
            <div key={date.toISOString()} className={`rounded-lg p-2 text-center transition-all border ${
              checkin 
                ? 'bg-[hsl(var(--brand)/0.08)] border-[hsl(var(--brand)/0.2)]' 
                : 'bg-[hsl(var(--shell)/0.5)] border-[hsl(var(--border-h))]'
            }`}>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">{dayLabel}</p>
              <p className="text-[11px] font-bold mb-1.5">{dayNum}</p>
              {checkin ? (
                <div className="space-y-1">
                  <div className="text-[16px] leading-none">{MOODS[checkin.mood - 1] || '—'}</div>
                  <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                    <span>✓</span>
                  </div>
                </div>
              ) : (
                <div className="text-[14px] text-muted-foreground/40">—</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed cards for completed days */}
      {days.filter(d => d.checkin).length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-[hsl(var(--border-h))]">
          {days
            .filter(d => d.checkin)
            .reverse()
            .map(({ date, checkin }) => (
              <div key={date.toISOString()} className="surface p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold">{DAY_SHORT[date.getDay()]}, {date.getDate()} {MONTH_SHORT[date.getMonth()]}</p>
                  <span className="text-[12px] text-muted-foreground">{MOOD_LABELS[checkin.mood]}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[hsl(var(--warn))]" strokeWidth={2} />
                    <span>{checkin.energy || '—'}/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon className="w-3 h-3 text-[hsl(var(--brand))]" strokeWidth={2} />
                    <span>{checkin.sleep_hours || '—'}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-[hsl(var(--brand))]" strokeWidth={2} />
                    <span>{checkin.hydration_liters || '—'}L</span>
                  </div>
                </div>
                {checkin.notes && <p className="text-[11px] text-muted-foreground italic">{checkin.notes}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}