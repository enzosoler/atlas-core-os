import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Play, Eye, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import WorkoutExecutionScreen from '@/components/workouts/WorkoutExecutionScreen';

export default function WorkoutsV2() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('planning'); // planning | execution
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', selectedDate],
    queryFn: () => base44.entities.Workout.filter({ date: selectedDate }),
  });

  const { data: allWorkouts = [] } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list('-created_date', 50),
  });

  const completeMut = useMutation({
    mutationFn: (id) => base44.entities.Workout.update(id, { status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', selectedDate] }),
  });

  // Planning mode
  if (mode === 'planning') {
    return (
      <div className="p-5 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="t-headline mb-1">Meus Treinos</h1>
            <p className="t-caption">{format(new Date(selectedDate), 'EEEE, d MMM', { locale: require('date-fns/locale/pt-BR') })}</p>
          </div>
          <button className="btn btn-primary gap-2 h-10">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="atlas-input h-10 rounded-lg text-[13px]"
        />

        {/* Workouts list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="t-caption">Nenhum treino para hoje</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map(w => (
              <div key={w.id} className="surface rounded-xl p-4 hover:border-[hsl(var(--brand)/0.3)] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-[hsl(var(--fg))]">{w.name}</h3>
                    <p className="t-caption mt-1">{w.exercises?.length || 0} exercícios</p>
                    {w.description && <p className="t-small mt-2 text-[hsl(var(--fg-2))]">{w.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedWorkout(w);
                        setMode('execution');
                      }}
                      className="btn btn-primary h-10 px-4 rounded-lg text-[12px] gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Iniciar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent */}
        {allWorkouts.length > 0 && (
          <div className="surface rounded-xl p-5 space-y-3">
            <p className="t-subtitle">Treinos Recentes</p>
            <div className="space-y-2">
              {allWorkouts.slice(0, 5).map(w => (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWorkout(w);
                    setMode('planning');
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-[hsl(var(--shell))] transition-colors"
                >
                  <p className="text-[13px] font-medium text-[hsl(var(--fg))]">{w.name}</p>
                  <p className="t-caption">{w.exercises?.length || 0} exercícios</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Execution mode
  if (mode === 'execution' && selectedWorkout) {
    return (
      <div className="p-5 pb-20 lg:pb-8 space-y-4">
        <button
          onClick={() => setMode('planning')}
          className="text-[13px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] font-medium"
        >
          ← Voltar
        </button>
        <WorkoutExecutionScreen
          workout={selectedWorkout}
          onComplete={() => {
            completeMut.mutate(selectedWorkout.id);
            setMode('planning');
          }}
        />
      </div>
    );
  }

  return null;
}