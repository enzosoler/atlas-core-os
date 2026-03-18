import React from 'react';
import { Trophy } from 'lucide-react';

function calcStreak(checkins = []) {
  if (!checkins.length) return 0;
  const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (sorted.some(c => c.date === dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function MilestoneCard({ streak, checkins, workouts }) {
  // Support both old API (streak number) and new API (checkins array)
  const count = typeof streak === 'number' ? streak : calcStreak(checkins);

  const milestones = [
    { days: 7,   label: '1 semana',  emoji: '🔥', message: 'Semana de ouro!' },
    { days: 14,  label: '2 semanas', emoji: '🎯', message: 'Disciplina em ação!' },
    { days: 30,  label: '1 mês',     emoji: '🏆', message: 'Mês incrível!' },
    { days: 100, label: '100 dias',  emoji: '👑', message: 'Mestre da consistência!' },
  ];

  const nextMilestone = milestones.find(m => m.days > count);
  const achieved = milestones.filter(m => m.days <= count);

  if (!nextMilestone) {
    return (
      <div className="surface p-4 text-center space-y-2">
        <p className="text-[20px]">👑</p>
        <p className="text-[13px] font-semibold">Você é uma lenda!</p>
        <p className="text-[11px] text-[hsl(var(--fg-2))]">{count} dias de consistência</p>
      </div>
    );
  }

  const progress = (count / nextMilestone.days) * 100;

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[hsl(var(--warn))]" strokeWidth={2} />
        <p className="t-label">Próxima meta</p>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[13px] font-semibold">{nextMilestone.label}</span>
          <span className="text-[12px] text-[hsl(var(--fg-2))]">{count} / {nextMilestone.days}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[hsl(var(--shell))] overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--warn))] transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {achieved.length > 0 && (
        <div className="pt-2 border-t border-[hsl(var(--border-h))]">
          <p className="text-[10px] text-[hsl(var(--fg-2))] mb-1.5">Desbloqueadas</p>
          <div className="flex gap-1">
            {achieved.map(m => (
              <div key={m.days} className="flex-1 text-center">
                <p className="text-[16px] mb-0.5">{m.emoji}</p>
                <p className="text-[9px] text-[hsl(var(--fg-2))]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}