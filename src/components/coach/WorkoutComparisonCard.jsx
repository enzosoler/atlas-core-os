import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * WorkoutComparisonCard — side-by-side comparison of prescribed vs logged workouts
 * Shows exercise-level deltas
 * 
 * Usage:
 * <WorkoutComparisonCard 
 *   prescribedWorkout={workoutObj}
 *   loggedWorkouts={[workoutArray]}
 *   dateRange={7}
 * />
 */
export default function WorkoutComparisonCard({ prescribedWorkout, loggedWorkouts = [], dateRange = 7 }) {
  const comparison = useMemo(() => {
    if (!prescribedWorkout?.exercises) return null;

    // Build a map of prescribed exercises with their target frequency
    const prescribed = {};
    prescribedWorkout.exercises.forEach(ex => {
      const key = ex.name || ex.exercise_master_id;
      if (!prescribed[key]) {
        prescribed[key] = { name: ex.name, targetCount: 0, targetSets: 0, targetReps: ex.target_reps };
      }
      prescribed[key].targetCount++;
      prescribed[key].targetSets += ex.target_sets || 0;
    });

    // Count logged exercises
    const logged = {};
    loggedWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const key = ex.name;
        if (!logged[key]) {
          logged[key] = { name: ex.name, loggedCount: 0, loggedSets: 0, actualReps: 0 };
        }
        logged[key].loggedCount++;
        logged[key].loggedSets += (ex.sets?.length || 0);
        logged[key].actualReps = ex.sets?.length ? Math.round((ex.sets?.reduce((s, set) => s + set.reps, 0) / ex.sets.length)) : 0;
      });
    });

    // Merge and calculate deltas
    const allExercises = new Set([...Object.keys(prescribed), ...Object.keys(logged)]);
    const items = Array.from(allExercises).map(key => {
      const p = prescribed[key] || { name: key, targetCount: 0, targetSets: 0 };
      const l = logged[key] || { name: key, loggedCount: 0, loggedSets: 0 };
      const delta = (l.loggedCount || 0) - (p.targetCount || 0);
      const status = delta > 0 ? 'exceeded' : delta === 0 ? 'perfect' : 'missed';
      
      return {
        name: p.name || l.name,
        planned: p.targetCount || 0,
        logged: l.loggedCount || 0,
        sets: { planned: p.targetSets || 0, logged: l.loggedSets || 0 },
        delta,
        status,
      };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)); // Most important deltas first

    return items;
  }, [prescribedWorkout, loggedWorkouts]);

  if (!comparison || comparison.length === 0) {
    return (
      <div className="surface p-5 text-center">
        <p className="t-caption">Sem comparação disponível</p>
      </div>
    );
  }

  const perfectCount = comparison.filter(item => item.status === 'perfect').length;
  const adherencePercent = Math.round((perfectCount / comparison.length) * 100);

  return (
    <div className="surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="t-subtitle">Comparação: Plano vs Real</p>
        <span className={`badge ${adherencePercent >= 80 ? 'badge-ok' : adherencePercent >= 60 ? 'badge-primary' : 'badge-warning'}`}>
          {adherencePercent}% aderência
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-[hsl(var(--shell))] text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Planejados</p>
          <p className="text-[16px] font-bold">{comparison.reduce((s, i) => s + i.planned, 0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--shell))] text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Realizados</p>
          <p className="text-[16px] font-bold">{comparison.reduce((s, i) => s + i.logged, 0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--shell))] text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Perfeito</p>
          <p className="text-[16px] font-bold">{perfectCount}</p>
        </div>
      </div>

      {/* Exercise-level comparison */}
      <div className="space-y-2">
        {comparison.map((item, idx) => {
          const isDelta = item.status !== 'perfect';
          const Icon = item.delta > 0 ? ChevronUp : item.delta < 0 ? ChevronDown : null;
          const deltaColor = item.delta > 0 ? 'text-[hsl(var(--warn))]' : item.delta < 0 ? 'text-[hsl(var(--err))]' : 'text-[hsl(var(--ok))]';
          
          return (
            <div key={idx} className={`p-3 rounded-lg border ${item.status === 'perfect' ? 'border-[hsl(var(--ok)/0.2)] bg-[hsl(var(--ok)/0.05)]' : 'border-[hsl(var(--border-h))] bg-[hsl(var(--card-hi))]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[13px] font-semibold">{item.name}</p>
                {Icon && (
                  <div className="flex items-center gap-1">
                    <Icon className={`w-3.5 h-3.5 ${deltaColor}`} strokeWidth={2.5} />
                    <span className={`text-[11px] font-bold ${deltaColor}`}>
                      {item.delta > 0 ? '+' : ''}{item.delta}
                    </span>
                  </div>
                )}
                {item.status === 'perfect' && <span className="text-[11px] font-bold text-[hsl(var(--ok))]">✓</span>}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-center p-2 rounded bg-[hsl(var(--shell))]">
                  <p className="text-muted-foreground mb-0.5">Plano</p>
                  <p className="font-bold">{item.planned}x</p>
                </div>
                <div className="text-center p-2 rounded bg-[hsl(var(--shell))]">
                  <p className="text-muted-foreground mb-0.5">Real</p>
                  <p className="font-bold">{item.logged}x</p>
                </div>
              </div>

              {/* Set comparison if available */}
              {(item.sets.planned > 0 || item.sets.logged > 0) && (
                <div className="mt-2 pt-2 border-t border-[hsl(var(--border-h))] text-[10px] text-muted-foreground">
                  Sets: {item.sets.planned} plano vs {item.sets.logged} real
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="t-caption text-muted-foreground pt-2 border-t border-[hsl(var(--border-h))]">
        {perfectCount === comparison.length 
          ? '✓ Aluno seguiu perfeitamente o plano!'
          : `${comparison.filter(i => i.delta > 0).length} exercícios extras, ${comparison.filter(i => i.delta < 0).length} faltando`}
      </p>
    </div>
  );
}