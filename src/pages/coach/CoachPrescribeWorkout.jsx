import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import RoleGate from '@/components/rbac/RoleGate';

export default function CoachPrescribeWorkout() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    athlete_email: '',
    name: '',
    description: '',
    type: 'strength',
    target_duration_minutes: '',
    target_rpe: '',
    exercises: [],
    frequency: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    active: true,
    notes: '',
  });

  const { data: student } = useQuery({
    queryKey: ['coach-student', studentId],
    queryFn: () => studentId ? base44.entities.CoachStudent.filter({ id: studentId }).then(r => r?.[0]) : null,
  });

  useEffect(() => {
    if (student) setForm(f => ({ ...f, athlete_email: student.student_email }));
  }, [student]);

  const saveMut = useMutation({
    mutationFn: (data) => base44.entities.PrescribedWorkout.create(data),
    onSuccess: () => {
      toast.success('Treino prescrito com sucesso!');
      qc.invalidateQueries(['coach-student']);
      navigate(-1);
    },
  });

  const addExercise = () => {
    setForm(f => ({
      ...f,
      exercises: [...f.exercises, { exercise_master_id: '', name: '', target_sets: '', target_reps: '', target_weight: '', rest_seconds: '', notes: '' }],
    }));
  };

  const updateExercise = (idx, updates) => {
    setForm(f => ({
      ...f,
      exercises: f.exercises.map((e, i) => i === idx ? { ...e, ...updates } : e),
    }));
  };

  const removeExercise = (idx) => {
    setForm(f => ({
      ...f,
      exercises: f.exercises.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = () => {
    if (!form.athlete_email || !form.name) {
      toast.error('Nome e email do atleta são obrigatórios');
      return;
    }
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      if (['target_duration_minutes', 'target_rpe'].includes(k)) payload[k] = Number(v);
      else payload[k] = v;
    });
    saveMut.mutate(payload);
  };

  return (
    <RoleGate roles={['coach']}>
      <div className="p-5 lg:p-8 space-y-6 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div>
          <h1 className="t-headline mb-1">Prescrever Treino</h1>
          <p className="t-caption">Crie um treino personalizado para {student?.student_name}</p>
        </div>

        <div className="surface rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="t-label block mb-1.5">Nome do Treino</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Upper A, Leg Day" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Tipo</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['strength', 'cardio', 'hiit', 'flexibility', 'sport', 'other'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="t-label block mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do treino..." className="w-full h-20 p-3 rounded-lg border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[13px] text-[hsl(var(--fg))] placeholder:text-[hsl(var(--fg-2))] outline-none focus:border-[hsl(var(--brand)/0.4)]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="t-label block mb-1.5">Duração (min)</label>
              <Input type="number" value={form.target_duration_minutes} onChange={e => setForm(f => ({ ...f, target_duration_minutes: e.target.value }))} placeholder="45" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">RPE alvo (1-10)</label>
              <Input type="number" min="1" max="10" value={form.target_rpe} onChange={e => setForm(f => ({ ...f, target_rpe: e.target.value }))} placeholder="7" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Frequência</label>
              <Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="Ex: 2x semana" className="h-10 rounded-lg text-[13px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="t-label block mb-1.5">Data inicial</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Data final (opcional)</label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-10 rounded-lg text-[13px]" />
            </div>
          </div>

          <div>
            <label className="t-label block mb-1.5">Observações</label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais..." className="h-10 rounded-lg text-[13px]" />
          </div>
        </div>

        {/* Exercises */}
        <div className="surface rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="t-subtitle">Exercícios ({form.exercises.length})</p>
            <button onClick={addExercise} className="btn btn-secondary gap-1.5 h-9">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {form.exercises.map((ex, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={ex.name} onChange={e => updateExercise(idx, { name: e.target.value })} placeholder="Ex: Bench Press" className="h-9 rounded-lg text-[12px]" />
                  <div className="flex gap-1">
                    <Input type="number" value={ex.target_sets} onChange={e => updateExercise(idx, { target_sets: Number(e.target.value) })} placeholder="Sets" className="h-9 rounded-lg text-[12px] flex-1" />
                    <Input value={ex.target_reps} onChange={e => updateExercise(idx, { target_reps: e.target.value })} placeholder="Reps" className="h-9 rounded-lg text-[12px] flex-1" />
                    <Input type="number" value={ex.target_weight} onChange={e => updateExercise(idx, { target_weight: Number(e.target.value) })} placeholder="Peso (kg)" className="h-9 rounded-lg text-[12px] flex-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input type="number" value={ex.rest_seconds} onChange={e => updateExercise(idx, { rest_seconds: Number(e.target.value) })} placeholder="Descanso (seg)" className="h-9 rounded-lg text-[12px] flex-1" />
                  <Input value={ex.notes} onChange={e => updateExercise(idx, { notes: e.target.value })} placeholder="Notas" className="h-9 rounded-lg text-[12px] flex-1" />
                  <button onClick={() => removeExercise(idx)} className="w-9 h-9 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.4)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saveMut.isPending} className="btn btn-primary w-full h-11 rounded-xl text-[14px] gap-2">
          {saveMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : <><Save className="w-4 h-4" /> Prescrever Treino</>}
        </button>
      </div>
    </RoleGate>
  );
}