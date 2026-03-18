import React, { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS, computeAchievements } from '@/lib/achievements';
import { Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  agua:     '💧 Hidratação',
  checkin:  '📋 Check-ins',
  treino:   '💪 Treinos',
  corpo:    '📏 Corpo',
  especial: '🌟 Especiais',
};

function AchievementBadge({ def, progress, unlocked, isNew }) {
  const pct = Math.min(100, Math.round((progress / def.target) * 100));

  return (
    <div className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-center
      ${unlocked
        ? 'border-[hsl(var(--warn)/0.4)] bg-[hsl(var(--warn)/0.06)] shadow-sm'
        : 'border-[hsl(var(--border-h))] bg-[hsl(var(--shell))] opacity-60'
      }`}>
      {isNew && (
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[hsl(var(--warn))] text-white text-[9px] font-bold rounded-full leading-none">
          NOVO
        </span>
      )}
      <div className={`text-[28px] leading-none transition-all ${unlocked ? '' : 'grayscale opacity-50'}`}>
        {def.emoji}
      </div>
      <p className={`text-[11px] font-bold leading-tight ${unlocked ? 'text-[hsl(var(--fg))]' : 'text-[hsl(var(--fg-2))]'}`}>
        {def.label}
      </p>
      <p className="text-[9px] text-[hsl(var(--fg-2))] leading-snug max-w-[80px]">{def.desc}</p>
      {!unlocked && (
        <div className="w-full mt-1">
          <div className="h-1 rounded-full bg-[hsl(var(--border-h))] overflow-hidden">
            <div className="h-full rounded-full bg-[hsl(var(--brand)/0.5)] transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[9px] text-[hsl(var(--fg-2))] mt-0.5">{progress}/{def.target}</p>
        </div>
      )}
      {unlocked && <span className="text-[9px] text-[hsl(var(--warn))] font-semibold">Conquistado ✓</span>}
    </div>
  );
}

export default function AchievementsSection() {
  const qc = useQueryClient();

  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins-achievements'],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 200),
  });
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-achievements'],
    queryFn: () => base44.entities.Workout.list('-date', 200),
  });
  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements-achievements'],
    queryFn: () => base44.entities.Measurement.list('-date', 100),
  });
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const p = await base44.entities.UserProfile.list(); return p?.[0] || null; },
  });
  const { data: saved = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list(),
  });

  const computed = useMemo(() =>
    computeAchievements({ checkins, workouts, measurements, profile }),
    [checkins, workouts, measurements, profile]
  );

  const saveMut = useMutation({
    mutationFn: ({ key, progress }) =>
      base44.entities.Achievement.create({ key, progress, unlocked_at: new Date().toISOString().split('T')[0], notified: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Achievement.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });

  // Sync new achievements
  useEffect(() => {
    if (!Object.keys(computed).length) return;
    ACHIEVEMENTS.forEach(def => {
      const c = computed[def.key];
      if (!c) return;
      const existing = saved.find(s => s.key === def.key);

      if (c.unlocked && !existing) {
        saveMut.mutate({ key: def.key, progress: c.progress });
        toast.success(`🏆 Conquista desbloqueada: ${def.label}!`, { duration: 4000 });
      } else if (existing && !existing.notified && c.unlocked) {
        updateMut.mutate({ id: existing.id, data: { notified: true } });
      } else if (existing && !c.unlocked) {
        updateMut.mutate({ id: existing.id, data: { progress: c.progress } });
      }
    });
  }, [computed, saved.length]);

  const savedKeys = new Set(saved.map(s => s.key));
  const unlockedCount = ACHIEVEMENTS.filter(a => savedKeys.has(a.key)).length;

  // Group by category
  const byCategory = Object.entries(CATEGORY_LABELS).map(([cat, label]) => ({
    cat, label,
    items: ACHIEVEMENTS.filter(a => a.category === cat),
  }));

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <div className="surface p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--warn)/0.1)] flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-[hsl(var(--warn))]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold">Conquistas</p>
          <p className="text-[12px] text-[hsl(var(--fg-2))]">{unlockedCount} de {ACHIEVEMENTS.length} desbloqueadas</p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-black tracking-tight leading-none text-[hsl(var(--warn))]">{unlockedCount}</p>
          <p className="text-[10px] text-[hsl(var(--fg-2))]">medalhas</p>
        </div>
      </div>

      {/* Progress bar total */}
      <div className="px-1">
        <div className="h-2 rounded-full bg-[hsl(var(--shell))] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--warn))] to-[hsl(var(--brand))] transition-all duration-700"
            style={{ width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%` }} />
        </div>
        <p className="text-[11px] text-[hsl(var(--fg-2))] mt-1 text-right">
          {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% completo
        </p>
      </div>

      {/* Categories */}
      {byCategory.map(({ cat, label, items }) => (
        <div key={cat}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-2">{label}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map(def => {
              const c = computed[def.key] || { progress: 0, unlocked: false };
              const isUnlocked = savedKeys.has(def.key);
              const isNew = isUnlocked && saved.find(s => s.key === def.key && !s.notified);
              return (
                <AchievementBadge
                  key={def.key}
                  def={def}
                  progress={c.progress}
                  unlocked={isUnlocked}
                  isNew={!!isNew}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}