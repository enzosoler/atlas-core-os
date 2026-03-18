import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { getToday } from '@/lib/atlas-theme';
import { Plus, Dumbbell, ChevronLeft, ChevronRight, CheckCircle, Clock, Trash2, X, Sparkles, Loader2, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ExerciseSearch from '@/components/workouts/ExerciseSearch';
import WorkoutComparison from '@/components/workouts/WorkoutComparison';
import AIWorkoutSuggestion from '@/components/ai/AIWorkoutSuggestion';
import WorkoutExecution from '@/components/workouts/WorkoutExecution';

const WORKOUT_LABELS = {
  strength: 'Força', cardio: 'Cardio', hiit: 'HIIT',
  flexibility: 'Flexibilidade', sport: 'Esporte', other: 'Outro',
};

const emptySet = () => ({ reps: 10, weight: 0, rir: 2 });
const emptyExercise = () => ({ name: '', muscle_groups: [], equipment: '', sets: [emptySet()], notes: '', exercise_master_id: null, movement_pattern: null });

function DateNav({ date, onChange }) {
  const isToday = date === getToday();
  const fmt = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors">
        <ChevronLeft className="w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
      </button>
      <span className="text-[13px] font-medium min-w-[150px] text-center text-[hsl(var(--fg))]">
        {fmt}
        {isToday && <span className="ml-2 badge badge-blue">Hoje</span>}
      </span>
      <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors">
        <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="t-label block mb-1.5">{children}</label>;
}

export default function Workouts() {
  const { can } = useSubscription();
  const [date, setDate] = useState(getToday());
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [executingWorkout, setExecutingWorkout] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'strength', perceived_effort: 7, duration_minutes: 60, exercises: [] });
  const qc = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', date],
    queryFn: () => base44.entities.Workout.filter({ date }, '-created_date'),
  });
  const { data: prescribed = [] } = useQuery({
    queryKey: ['prescribed-workouts'],
    queryFn: () => base44.entities.PrescribedWorkout.filter({ active: true }),
  });
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const p = await base44.entities.UserProfile.list(); return p?.[0] || null; },
  });

  const plannedForToday = prescribed.find(pw => {
    if (!pw.frequency) return false;
    const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return pw.frequency.toLowerCase().includes(dayOfWeek);
  });
  const logged = workouts[0];

  const createM = useMutation({
    mutationFn: (d) => base44.entities.Workout.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts', date] });
      setShowAdd(false);
      setForm({ name: '', type: 'strength', perceived_effort: 7, duration_minutes: 60, exercises: [] });
      toast.success('Treino registrado');
    },
  });
  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.Workout.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', date] }),
  });

  const changeDate = (d) => {
    const dt = new Date(date); dt.setDate(dt.getDate() + d);
    setDate(dt.toISOString().split('T')[0]);
  };
  const addExercise = (ex) => setForm(f => ({
    ...f,
    exercises: [...f.exercises, {
      ...emptyExercise(),
      name: ex.name,
      muscle_groups: ex.muscle_groups || [],
      equipment: ex.equipment || '',
      exercise_master_id: ex.exercise_master_id || null,
      movement_pattern: ex.movement_pattern || null,
      sets: [{ reps: parseInt(ex.default_rep_range) || 10, weight: 0, rir: 2 }],
    }],
  }));
  const addSet = (i) => setForm(f => {
    const ex = [...f.exercises];
    ex[i] = { ...ex[i], sets: [...ex[i].sets, emptySet()] };
    return { ...f, exercises: ex };
  });
  const updateSet = (ei, si, field, val) => setForm(f => {
    const ex = [...f.exercises];
    const sets = [...ex[ei].sets];
    sets[si] = { ...sets[si], [field]: Number(val) };
    ex[ei] = { ...ex[ei], sets };
    return { ...f, exercises: ex };
  });
  const removeExercise = (i) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, j) => j !== i) }));

  const save = () => {
    if (!form.name) { toast.error('Nome do treino obrigatório'); return; }
    const vol = form.exercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0);
    createM.mutate({ ...form, date, completed: true, volume_load: vol });
  };

  const handleStartExecution = (workout) => {
    setExecutingWorkout(workout);
  };

  const handleWorkoutComplete = (completedData) => {
    const vol = completedData.exercises.reduce((a, ex) => a + (ex.sets || []).reduce((s, set) => s + set.reps * set.weight, 0), 0);
    createM.mutate({
      name: completedData.exercises.map(ex => ex.name).slice(0, 2).join(' + '),
      date,
      exercises: completedData.exercises,
      volume_load: vol,
      duration_minutes: completedData.duration_minutes,
      completed: true,
      type: 'strength',
      perceived_effort: 7,
    });
    setExecutingWorkout(null);
  };

  const generate = async () => {
    if (!can('ai_workout_generation')) {
      toast.error('Geração de treino por IA — Plano Pro e acima');
      return;
    }
    setGenerating(true);
    const res = await base44.functions.invoke('generateWorkout', { date, profile });
    if (res.data?.success) { qc.invalidateQueries({ queryKey: ['workouts', date] }); toast.success('Treino gerado'); }
    else toast.error('Erro ao gerar. Tente novamente.');
    setGenerating(false);
  };

  if (executingWorkout) {
    return (
      <WorkoutExecution
        workout={executingWorkout}
        onComplete={handleWorkoutComplete}
        onBack={() => setExecutingWorkout(null)}
      />
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-5 border-b border-[hsl(var(--border-h))]">
        <div>
          <h1 className="t-headline">Treinos</h1>
          <p className="t-small mt-1">Registre e acompanhe seus treinos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generate} disabled={generating || !can('ai_workout_generation')} className={`btn gap-1.5 ${can('ai_workout_generation') ? 'btn-secondary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}>
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar por IA
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo treino
          </button>
        </div>
      </div>

      <DateNav date={date} onChange={changeDate} />

      {/* Planned Workouts */}
      {plannedForToday && (
        <div className="surface p-5 border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand)/0.02)] space-y-3">
          <p className="t-label">Treino Planejado para Hoje</p>
          <p className="t-subtitle">{plannedForToday.name}</p>
          {plannedForToday.description && <p className="t-small text-muted-foreground">{plannedForToday.description}</p>}
          <Button
            onClick={() => handleStartExecution(plannedForToday)}
            className="w-full h-10 rounded-lg bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.85)] text-white gap-2 font-semibold"
          >
            <Play className="w-4 h-4" /> Começar Execução
          </Button>
        </div>
      )}

      {/* Logged Workouts */}
      <div className="space-y-3">
        <p className="t-label">Treinos Registrados Hoje</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-[hsl(var(--fg-2))] gap-2 t-small">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Dumbbell className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} />
            </div>
            <p className="t-subtitle mb-1">Nenhum treino neste dia</p>
            <p className="t-caption mb-4">Comece um novo treino ou gere um com IA.</p>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo treino
            </button>
          </div>
        ) : (
          workouts.map(w => (
            <div key={w.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="t-subtitle mb-1">{w.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 t-small">
                    {w.duration_minutes > 0 && <span>{w.duration_minutes} min</span>}
                    {w.volume_load > 0 && <span>{w.volume_load.toLocaleString()} kg vol.</span>}
                    {w.perceived_effort > 0 && <span>RPE {w.perceived_effort}</span>}
                  </div>
                </div>
                <button onClick={() => deleteM.mutate(w.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.5)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
              {(w.exercises || []).length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[hsl(var(--border-h))]">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="t-small text-[hsl(var(--fg))]">{ex.name || '—'}</span>
                      <div className="flex gap-3 t-caption">
                        {ex.sets?.length > 0 && <span>{ex.sets.length} sets</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-xl bg-[hsl(var(--card))] border-[hsl(var(--border-h))] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="t-subtitle">Registrar treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Nome</FieldLabel>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Upper A, Leg Day" className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKOUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Duração (min)</FieldLabel>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="h-10 rounded-lg text-[13px]" />
              </div>
              <div>
                <FieldLabel>RPE: {form.perceived_effort}/10</FieldLabel>
                <Slider value={[form.perceived_effort]} onValueChange={([v]) => setForm(f => ({ ...f, perceived_effort: v }))} min={1} max={10} step={1} className="mt-3" />
              </div>
            </div>
            <div>
              <FieldLabel>Adicionar exercício</FieldLabel>
              <ExerciseSearch onSelect={addExercise} />
            </div>
            {form.exercises.map((ex, ei) => (
              <div key={ei} className="p-4 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[hsl(var(--fg))]">{ex.name}</p>
                  </div>
                  <button onClick={() => removeExercise(ei)} className="text-[hsl(var(--fg-2))] hover:text-[hsl(var(--err))]">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 t-caption px-1">
                  <span>Set</span><span>Reps</span><span>Kg</span><span>RIR</span>
                </div>
                {ex.sets.map((set, si) => (
                  <div key={si} className="grid grid-cols-4 gap-2 items-center">
                    <span className="t-caption text-center">{si + 1}</span>
                    <Input type="number" inputMode="decimal" value={set.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)} className="h-8 rounded-lg text-center px-2 text-[12px]" />
                    <Input type="number" inputMode="decimal" value={set.weight} onChange={e => updateSet(ei, si, 'weight', e.target.value)} className="h-8 rounded-lg text-center px-2 text-[12px]" />
                    <Input type="number" inputMode="decimal" value={set.rir} onChange={e => updateSet(ei, si, 'rir', e.target.value)} className="h-8 rounded-lg text-center px-2 text-[12px]" />
                  </div>
                ))}
                <button onClick={() => addSet(ei)} className="t-caption text-[hsl(var(--brand))] font-medium flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Adicionar set
                </button>
              </div>
            ))}
            <button onClick={save} disabled={createM.isPending} className="btn btn-primary w-full h-11 rounded-xl">
              {createM.isPending ? 'Salvando…' : 'Salvar treino'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}