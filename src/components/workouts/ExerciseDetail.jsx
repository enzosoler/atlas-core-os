import React from 'react';
import { Dumbbell, Zap } from 'lucide-react';

export default function ExerciseDetail({ exercise }) {
  if (!exercise) return null;

  return (
    <div className="surface p-5 space-y-4">
      {/* Exercise Media */}
      {exercise.media_gif_url && (
        <div className="w-full rounded-xl overflow-hidden bg-[hsl(var(--shell))] aspect-video flex items-center justify-center">
          <img src={exercise.media_gif_url} alt={exercise.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Name & Muscles */}
      <div>
        <h2 className="t-subtitle mb-1">{exercise.name}</h2>
        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(exercise.muscle_groups)
              ? exercise.muscle_groups.map((m, i) => (
                  <span key={i} className="badge badge-neutral text-[11px]">{m}</span>
                ))
              : <span className="badge badge-neutral text-[11px]">{exercise.muscle_groups}</span>
            }
          </div>
        )}
      </div>

      {/* Form Cues */}
      {exercise.form_cues_pt && exercise.form_cues_pt.length > 0 && (
        <div>
          <p className="t-label mb-2">Dicas de Forma</p>
          <ul className="space-y-1">
            {exercise.form_cues_pt.slice(0, 3).map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <span className="text-[hsl(var(--brand))] mt-1">•</span>
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}