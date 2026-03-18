import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickWorkoutCreate({ date, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('strength');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '' }]);

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Workout.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts', date] });
      toast.success('Workout created!');
      onClose?.();
    },
  });

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '' }]);
  };

  const handleRemoveExercise = (idx) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim() || !exercises.some(e => e.name?.trim())) {
      toast.error('Add workout name and at least one exercise');
      return;
    }

    const payload = {
      date,
      name: name.trim(),
      type,
      exercises: exercises.filter(e => e.name?.trim()).map(e => ({
        name: e.name,
        target_sets: Number(e.sets) || 0,
        target_reps: e.reps || '',
      })),
      status: 'pending',
    };

    createMut.mutate(payload);
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Workout name (e.g., Upper A)"
        className="atlas-input h-10 rounded-lg text-[13px] w-full"
      />

      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="atlas-input h-10 rounded-lg text-[13px] w-full"
      >
        <option value="strength">Strength</option>
        <option value="cardio">Cardio</option>
        <option value="hiit">HIIT</option>
        <option value="flexibility">Flexibility</option>
      </select>

      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <input
              type="text"
              value={ex.name}
              onChange={e => {
                const updated = [...exercises];
                updated[idx].name = e.target.value;
                setExercises(updated);
              }}
              placeholder="Exercise"
              className="atlas-input h-9 flex-1 rounded-lg text-[12px]"
            />
            <input
              type="number"
              value={ex.sets}
              onChange={e => {
                const updated = [...exercises];
                updated[idx].sets = e.target.value;
                setExercises(updated);
              }}
              placeholder="Sets"
              className="atlas-input h-9 w-16 rounded-lg text-[12px]"
            />
            <input
              type="text"
              value={ex.reps}
              onChange={e => {
                const updated = [...exercises];
                updated[idx].reps = e.target.value;
                setExercises(updated);
              }}
              placeholder="Reps"
              className="atlas-input h-9 w-16 rounded-lg text-[12px]"
            />
            <button
              onClick={() => handleRemoveExercise(idx)}
              className="w-9 h-9 rounded-lg hover:bg-[hsl(var(--err)/0.1)] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--err))] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mx-auto" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddExercise}
        className="w-full py-2 rounded-lg border border-dashed border-[hsl(var(--border-h))] text-[12px] font-medium text-[hsl(var(--fg-2))] hover:bg-[hsl(var(--shell))] transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3 h-3" /> Add Exercise
      </button>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="btn btn-secondary flex-1 h-9 rounded-lg text-[12px]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={createMut.isPending}
          className="btn btn-primary flex-1 h-9 rounded-lg text-[12px] gap-1"
        >
          {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Create
        </button>
      </div>
    </div>
  );
}