import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Loader2, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ExerciseDetail from './ExerciseDetail';
import RestTimer from './RestTimer';

export default function WorkoutExecution({ workout, onComplete, onBack }) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [sets, setSets] = useState([]); // Array of logged sets
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);
  const [workoutStart] = useState(new Date());

  const exercises = workout.exercises || [];
  const currentExercise = exercises[currentExerciseIdx];
  const currentSet = currentExercise?.sets?.[currentSetIdx];

  // Initialize sets array
  useEffect(() => {
    if (exercises.length > 0) {
      const initialSets = exercises.flatMap((ex, ei) =>
        (ex.sets || []).map((set, si) => ({
          exerciseIdx: ei,
          setIdx: si,
          exerciseName: ex.name,
          targetReps: set.reps,
          targetWeight: set.weight,
          targetRir: set.rir,
          weight: '',
          reps: '',
          rir: '',
          completed: false,
          timestamp: null,
        }))
      );
      setSets(initialSets);
    }
  }, [exercises]);

  const handleSetComplete = () => {
    const currentSetObj = sets.find(
      s => s.exerciseIdx === currentExerciseIdx && s.setIdx === currentSetIdx
    );

    if (!currentSetObj?.weight || !currentSetObj?.reps) {
      toast.error('Preecha weight e reps');
      return;
    }

    // Mark as completed
    setSets(prevSets =>
      prevSets.map(s =>
        s === currentSetObj
          ? { ...s, completed: true, timestamp: new Date() }
          : s
      )
    );

    setShowTimer(true);
  };

  const handleRestComplete = () => {
    setShowTimer(false);

    // Move to next set or exercise
    const remainingSets = currentExercise?.sets || [];
    if (currentSetIdx < remainingSets.length - 1) {
      setCurrentSetIdx(currentSetIdx + 1);
    } else if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx(currentExerciseIdx + 1);
      setCurrentSetIdx(0);
    } else {
      // Workout complete
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    const completedSets = sets.filter(s => s.completed);
    const volume = completedSets.reduce((a, s) => a + (s.weight * s.reps || 0), 0);
    const duration = Math.round((new Date() - workoutStart) / 60000);

    onComplete({
      exercises: exercises.map((ex, ei) => ({
        ...ex,
        sets: (ex.sets || []).map((_, si) => {
          const logged = sets.find(s => s.exerciseIdx === ei && s.setIdx === si && s.completed);
          return logged ? { reps: logged.reps, weight: logged.weight, rir: logged.rir } : null;
        }).filter(Boolean),
      })),
      volume_load: Math.round(volume),
      duration_minutes: duration,
    });
  };

  if (!currentExercise) {
    return <div className="text-center py-12">Sem exercícios</div>;
  }

  const loggedSet = sets.find(s => s.exerciseIdx === currentExerciseIdx && s.setIdx === currentSetIdx);

  return (
    <div className="fixed inset-0 bg-[hsl(var(--bg))] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border-h))] px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--shell))] rounded-lg">
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
        <span className="text-[12px] font-semibold text-muted-foreground">
          {currentExerciseIdx + 1} de {exercises.length} exercícios
        </span>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          {/* Exercise Detail */}
          <ExerciseDetail exercise={currentExercise} />

          {/* Current Set Info */}
          <div className="surface p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="t-subtitle">Set {currentSetIdx + 1} de {currentExercise.sets?.length || 0}</h3>
              <span className="text-[12px] text-muted-foreground">
                {currentSet?.reps}x{currentSet?.weight ? `${currentSet.weight}kg` : '—'} (RIR {currentSet?.rir})
              </span>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="t-label block mb-1">Reps</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={loggedSet?.reps || ''}
                  onChange={e => setSets(prev => prev.map(s => s === loggedSet ? { ...s, reps: e.target.value } : s))}
                  placeholder={currentSet?.reps}
                  className="h-12 text-center text-[16px] rounded-lg"
                />
              </div>
              <div>
                <label className="t-label block mb-1">Kg</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={loggedSet?.weight || ''}
                  onChange={e => setSets(prev => prev.map(s => s === loggedSet ? { ...s, weight: e.target.value } : s))}
                  placeholder={currentSet?.weight || '0'}
                  className="h-12 text-center text-[16px] rounded-lg"
                />
              </div>
              <div>
                <label className="t-label block mb-1">RIR</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={loggedSet?.rir || ''}
                  onChange={e => setSets(prev => prev.map(s => s === loggedSet ? { ...s, rir: e.target.value } : s))}
                  placeholder={currentSet?.rir || '0'}
                  className="h-12 text-center text-[16px] rounded-lg"
                />
              </div>
            </div>

            {/* Set Complete Button */}
            <Button
              onClick={handleSetComplete}
              disabled={!loggedSet?.weight || !loggedSet?.reps}
              className="w-full h-12 rounded-lg bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.85)] text-white font-semibold text-[14px] gap-2"
            >
              <Check className="w-5 h-5" />
              Set Completo
            </Button>
          </div>

          {/* Rest Timer */}
          {showTimer && (
            <RestTimer duration={timerDuration} onComplete={handleRestComplete} />
          )}
        </div>
      </div>
    </div>
  );
}