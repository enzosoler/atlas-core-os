/**
 * WorkoutComparison — side-by-side view: planned vs logged
 * Shows what was prescribed vs what was actually done
 */
import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function WorkoutComparison({ planned, logged }) {
  if (!planned && !logged) {
    return (
      <div className="surface p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-[13px] text-muted-foreground">Nenhum treino planejado ou registrado</p>
      </div>
    );
  }

  const plannedExercises = planned?.exercises || [];
  const loggedExercises = logged?.exercises || [];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Planned */}
      <div className="surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--fg-2))]" />
          <h3 className="text-[14px] font-semibold">Planejado</h3>
          {planned && <span className="badge badge-neutral">{plannedExercises.length} exerc.</span>}
        </div>
        {planned ? (
          <div className="space-y-2.5">
            <div className="text-[12px] text-muted-foreground space-y-1">
              {planned.name && <p><strong>{planned.name}</strong></p>}
              {planned.duration_minutes && <p>{planned.duration_minutes} min · RPE {planned.perceived_effort || '—'}</p>}
            </div>
            {plannedExercises.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-border">
                {plannedExercises.map((ex, i) => (
                  <div key={i} className="text-[12px]">
                    <p className="font-medium">{ex.name}</p>
                    {ex.sets?.length > 0 && (
                      <p className="text-muted-foreground">{ex.sets.length} sets{ex.sets[0].reps ? ` × ${ex.sets[0].reps} reps` : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground italic">Sem plano para hoje</p>
        )}
      </div>

      {/* Logged */}
      <div className="surface p-5 border-[hsl(var(--ok)/0.2)] bg-[hsl(var(--ok)/0.02)]">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ok))]" strokeWidth={2} />
          <h3 className="text-[14px] font-semibold">Executado</h3>
          {logged && <span className="badge badge-ok">{loggedExercises.length} exerc.</span>}
        </div>
        {logged ? (
          <div className="space-y-2.5">
            <div className="text-[12px] text-muted-foreground space-y-1">
              {logged.name && <p><strong>{logged.name}</strong></p>}
              {logged.duration_minutes && <p>{logged.duration_minutes} min · RPE {logged.perceived_effort || '—'}</p>}
              {logged.volume_load && <p className="text-[hsl(var(--brand))]">📊 {logged.volume_load.toLocaleString()} kg volume</p>}
            </div>
            {loggedExercises.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-border">
                {loggedExercises.map((ex, i) => (
                  <div key={i} className="text-[12px]">
                    <p className="font-medium">{ex.name}</p>
                    {ex.sets?.length > 0 && (
                      <p className="text-muted-foreground">{ex.sets.length} sets{ex.sets[0].reps ? ` × ${ex.sets[0].reps} reps` : ''}{ex.sets[0].weight ? ` @ ${ex.sets[0].weight}kg` : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground italic">Nada registrado ainda</p>
        )}
      </div>

      {/* Adherence badge */}
      {planned && logged && (
        <div className="lg:col-span-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--brand)/0.05)] border border-[hsl(var(--brand)/0.1)]">
          <AlertCircle className="w-4 h-4 text-[hsl(var(--brand))]" strokeWidth={2} />
          <span className="text-[12px] text-[hsl(var(--brand))] font-medium">
            {loggedExercises.length >= plannedExercises.length ? '✓ Todas as séries completadas' : `${loggedExercises.length}/${plannedExercises.length} exercícios realizados`}
          </span>
        </div>
      )}
    </div>
  );
}