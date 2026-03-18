import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle2, Zap, Volume2, Pause, Play } from 'lucide-react';

/**
 * WorkoutExecutionScreen — One exercise at a time, super focused
 */
export default function WorkoutExecutionScreen({ workout, onComplete }) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [formData, setFormData] = useState({ weight: '', reps: '', rir: '' });
  const audioRef = useRef(null);

  const exercise = workout.exercises?.[exerciseIdx];
  const sets = exercise?.sets || [];
  const currentSet = sets?.[setIdx];

  // Rest timer
  useEffect(() => {
    if (!resting || restTime <= 0) return;
    const timer = setInterval(() => {
      setRestTime(t => {
        if (t <= 1) {
          // Play sound
          if (audioRef.current) audioRef.current.play();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resting, restTime]);

  const handleSetComplete = async () => {
    // Save set data
    if (formData.weight || formData.reps) {
      // TODO: save to database
      console.log('Set saved:', { exerciseIdx, setIdx, ...formData });
    }

    // Move to next set or exercise
    if (setIdx < sets.length - 1) {
      setSetIdx(setIdx + 1);
      setFormData({ weight: '', reps: '', rir: '' });
      setResting(true);
      setRestTime(exercise.rest_seconds || 60);
    } else {
      // Exercise complete
      handleExerciseComplete();
    }
  };

  const handleExerciseComplete = () => {
    setResting(false);
    if (exerciseIdx < workout.exercises.length - 1) {
      setExerciseIdx(exerciseIdx + 1);
      setSetIdx(0);
      setFormData({ weight: '', reps: '', rir: '' });
    } else {
      // Workout complete
      onComplete?.();
    }
  };

  if (!exercise) return null;

  // Rest timer screen
  if (resting && restTime > 0) {
    return (
      <div className="fixed inset-0 bg-[hsl(var(--bg))] flex items-center justify-center flex-col gap-6 p-5">
        <p className="t-headline text-center">Descanse</p>
        <div className="w-32 h-32 rounded-full bg-[hsl(var(--brand)/0.1)] border-4 border-[hsl(var(--brand))] flex items-center justify-center">
          <span className="t-kpi-lg text-[hsl(var(--brand))]">{restTime}s</span>
        </div>
        <button
          onClick={() => setResting(false)}
          className="btn btn-secondary h-11 px-6 rounded-xl text-[14px] gap-2"
        >
          <Play className="w-4 h-4" /> Próximo Set
        </button>
        <audio ref={audioRef} src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="t-label">
          Exercício {exerciseIdx + 1} de {workout.exercises.length}
        </span>
        <span className="t-label">
          Set {setIdx + 1} de {sets.length}
        </span>
      </div>

      {/* Exercise Info */}
      <div className="surface rounded-xl p-5 space-y-4">
        <div>
          <p className="t-headline mb-2">{exercise.name}</p>
          <div className="flex gap-2 flex-wrap">
            {exercise.primary_muscles?.map(m => (
              <span key={m} className="badge badge-blue text-[11px]">{m}</span>
            ))}
          </div>
        </div>

        {/* Set target */}
        <div className="p-4 rounded-lg bg-[hsl(var(--brand)/0.05)] border border-[hsl(var(--brand)/0.2)]">
          <p className="t-small text-[hsl(var(--brand))] mb-2">Meta para este set</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="t-caption">Sets</p>
              <p className="text-[16px] font-bold">{currentSet?.target_sets || exercise.target_sets}</p>
            </div>
            <div>
              <p className="t-caption">Reps</p>
              <p className="text-[16px] font-bold">{currentSet?.target_reps || exercise.target_reps}</p>
            </div>
            <div>
              <p className="t-caption">Peso</p>
              <p className="text-[16px] font-bold">{currentSet?.target_weight || exercise.target_weight}kg</p>
            </div>
          </div>
        </div>

        {/* Form inputs */}
        <div className="space-y-3">
          <p className="t-label">Registre o set</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="t-label block mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.5"
                value={formData.weight}
                onChange={e => setFormData(f => ({ ...f, weight: e.target.value }))}
                placeholder="0"
                className="atlas-input h-10 rounded-lg text-center text-[14px]"
              />
            </div>
            <div>
              <label className="t-label block mb-1">Reps</label>
              <input
                type="number"
                value={formData.reps}
                onChange={e => setFormData(f => ({ ...f, reps: e.target.value }))}
                placeholder="0"
                className="atlas-input h-10 rounded-lg text-center text-[14px]"
              />
            </div>
            <div>
              <label className="t-label block mb-1">RIR</label>
              <input
                type="number"
                value={formData.rir}
                onChange={e => setFormData(f => ({ ...f, rir: e.target.value }))}
                placeholder="0"
                className="atlas-input h-10 rounded-lg text-center text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setSetIdx(Math.max(0, setIdx - 1));
            setFormData({ weight: '', reps: '', rir: '' });
          }}
          disabled={exerciseIdx === 0 && setIdx === 0}
          className="btn btn-secondary flex-1 h-11 rounded-xl text-[14px]"
        >
          ← Voltar
        </button>
        <button
          onClick={handleSetComplete}
          className="btn btn-primary flex-1 h-11 rounded-xl text-[14px] gap-2"
        >
          {setIdx < sets.length - 1 ? (
            <>
              Próximo Set <ChevronRight className="w-4 h-4" />
            </>
          ) : exerciseIdx < workout.exercises.length - 1 ? (
            <>
              Próximo Exercício <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Finalizar <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}