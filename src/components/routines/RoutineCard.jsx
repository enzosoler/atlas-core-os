import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Calendar, Clock, Copy, Trash2, ChevronRight } from 'lucide-react';

const DAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function RoutineCard({ routine, isPrescribed, onDelete, onClone }) {
  const daysWithWorkout = routine.days_of_week?.filter(d => d.workout_id) || [];
  const activeDays = daysWithWorkout.map(d => DAYS_ABBR[d.day]).join(', ');

  return (
    <div className="surface p-5 hover:border-[hsl(var(--brand)/0.2)] transition-colors flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-bold truncate">{routine.name}</h3>
            {isPrescribed && <span className="badge badge-blue text-[10px]">Prescrita</span>}
            {routine.active && <span className="badge badge-ok text-[10px]">Ativa</span>}
          </div>
          {routine.description && (
            <p className="text-[12px] text-muted-foreground line-clamp-2">{routine.description}</p>
          )}
        </div>
        {!isPrescribed && (
          <div className="flex gap-1">
            <button
              onClick={onClone}
              title="Clonar"
              className="p-1.5 text-muted-foreground/60 hover:text-[hsl(var(--brand))] transition-colors"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={onDelete}
              title="Deletar"
              className="p-1.5 text-muted-foreground/60 hover:text-[hsl(var(--err))] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Days of Week Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS_ABBR.map((abbr, i) => {
          const hasWorkout = daysWithWorkout.some(d => d.day === i);
          return (
            <div
              key={i}
              className={`flex items-center justify-center h-7 rounded-lg text-[10px] font-semibold transition-colors ${
                hasWorkout
                  ? 'bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] border border-[hsl(var(--brand)/0.2)]'
                  : 'bg-[hsl(var(--secondary))] text-muted-foreground'
              }`}
            >
              {abbr}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        {routine.estimated_duration_minutes && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{routine.estimated_duration_minutes}min</span>
          </div>
        )}
        {routine.total_exercises && (
          <div className="flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{routine.total_exercises} exerc.</span>
          </div>
        )}
        {routine.last_completed_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{new Date(routine.last_completed_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        to={`/workouts?routine=${routine.id}`}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] text-[12px] font-semibold hover:bg-[hsl(var(--primary)/0.15)] transition-colors group"
      >
        Iniciar hoje
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
      </Link>
    </div>
  );
}