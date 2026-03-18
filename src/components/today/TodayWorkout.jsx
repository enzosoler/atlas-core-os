import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle, Circle } from 'lucide-react';

export default function TodayWorkout({ workouts }) {
  const w = workouts?.[0];

  return (
    <Link to="/Workouts" className="block p-5 rounded-2xl bg-card border border-border hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Treino</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" strokeWidth={2} />
      </div>
      {w ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {w.completed
              ? <CheckCircle className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" strokeWidth={2.5} />
              : <Circle className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />}
            <p className="font-semibold text-[15px]">{w.name}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[12px] text-muted-foreground">
            {w.exercises?.length > 0 && <span>{w.exercises.length} exercícios</span>}
            {w.duration_minutes && <span>{w.duration_minutes} min</span>}
            {w.volume_load > 0 && <span>{w.volume_load.toLocaleString()} kg</span>}
          </div>
          <div className="mt-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium
              ${w.completed ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]' : 'bg-secondary text-muted-foreground'}`}>
              {w.completed ? 'Concluído' : 'Pendente'}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-3">
          <p className="text-[13px] text-muted-foreground">Nenhum treino hoje</p>
          <p className="text-[12px] text-[hsl(var(--primary))] mt-1 font-medium">Registrar ou gerar →</p>
        </div>
      )}
    </Link>
  );
}