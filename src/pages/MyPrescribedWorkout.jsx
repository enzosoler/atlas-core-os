import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useRBAC } from '@/lib/rbac';
import { Plus, Dumbbell, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

function SessionCard({ session }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--card-hi))] hover:bg-[hsl(var(--shell))] transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[13px] font-semibold shrink-0">{session.label}</span>
          {session.day_name && <span className="text-[11px] text-muted-foreground truncate">{session.day_name}</span>}
          {session.focus && <span className="badge badge-neutral shrink-0">{session.focus}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[11px] text-muted-foreground">{session.exercises?.length || 0} exerc.</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="bg-[hsl(var(--card))]">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] text-muted-foreground border-b border-border">
            <span>Exercício</span><span className="text-center">Séries</span><span className="text-center">Reps</span><span className="text-center">Carga</span>
          </div>
          {(session.exercises || []).map((ex, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-b border-border/50 last:border-0 text-[12px]">
              <span className="font-medium truncate">{ex.name}</span>
              <span className="text-center text-muted-foreground">{ex.sets}</span>
              <span className="text-center text-muted-foreground">{ex.reps}</span>
              <span className="text-center text-muted-foreground">{ex.load || '—'}</span>
            </div>
          ))}
          {session.exercises?.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-muted-foreground">Nenhum exercício cadastrado</p>
          )}
        </div>
      )}
    </div>
  );
}

const emptySession = () => ({ label: '', day_name: '', focus: '', exercises: [] });
const emptyForm = () => ({ name: '', split: '', objective: '', notes: '', athlete_email: '', start_date: '', sessions: [emptySession()] });

export default function MyPrescribedWorkout() {
  const { user } = useAuth();
  const { isStaff } = useRBAC(user);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['prescribed-workout', user?.email],
    queryFn: () => isStaff
      ? base44.entities.PrescribedWorkout.filter({ coach_email: user.email }, '-created_date')
      : base44.entities.PrescribedWorkout.filter({ athlete_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const createM = useMutation({
    mutationFn: (d) => base44.entities.PrescribedWorkout.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prescribed-workout'] }); setShowCreate(false); setForm(emptyForm()); toast.success('Plano criado'); },
  });
  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.PrescribedWorkout.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescribed-workout'] }),
  });

  const addSession = () => setForm(f => ({ ...f, sessions: [...f.sessions, emptySession()] }));
  const updateSession = (i, field, val) => setForm(f => {
    const sessions = [...f.sessions];
    sessions[i] = { ...sessions[i], [field]: val };
    return { ...f, sessions };
  });
  const removeSession = (i) => setForm(f => ({ ...f, sessions: f.sessions.filter((_, j) => j !== i) }));

  // Add exercise row to session
  const addExercise = (si) => setForm(f => {
    const sessions = [...f.sessions];
    sessions[si] = { ...sessions[si], exercises: [...(sessions[si].exercises || []), { name: '', sets: 3, reps: '8-12', load: '', rest_seconds: 60 }] };
    return { ...f, sessions };
  });
  const updateExercise = (si, ei, field, val) => setForm(f => {
    const sessions = [...f.sessions];
    const exercises = [...sessions[si].exercises];
    exercises[ei] = { ...exercises[ei], [field]: val };
    sessions[si] = { ...sessions[si], exercises };
    return { ...f, sessions };
  });

  const save = () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (isStaff && !form.athlete_email) { toast.error('Email do atleta obrigatório'); return; }
    createM.mutate({ ...form, coach_email: user.email, athlete_email: isStaff ? form.athlete_email : user.email });
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl w-full space-y-6">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="t-headline">Treino Prescrito</h1>
          <p className="t-small mt-1">Plano de treino definido pelo seu coach</p>
        </div>
        {isStaff && (
          <Button onClick={() => setShowCreate(true)} className="btn btn-primary gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Novo plano
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Dumbbell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhum treino prescrito</p>
          <p className="t-caption">{isStaff ? 'Crie um plano para um atleta.' : 'Aguarde seu coach prescrever um plano de treino.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {plans.map(plan => (
            <div key={plan.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="t-subtitle">{plan.name}</p>
                    {plan.active && <span className="badge badge-ok">Ativo</span>}
                    {plan.split && <span className="badge badge-neutral">{plan.split}</span>}
                  </div>
                  {plan.objective && <p className="t-caption mt-0.5">{plan.objective}</p>}
                  {isStaff && <p className="t-caption mt-0.5">Para: {plan.athlete_email}</p>}
                </div>
                {isStaff && (
                  <button onClick={() => deleteM.mutate(plan.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(plan.sessions || []).map((session, i) => <SessionCard key={i} session={session} />)}
              </div>

              {plan.notes && <p className="t-caption mt-4 italic">{plan.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog — staff only */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="t-subtitle">Novo plano de treino</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="t-label block mb-1.5">Email do atleta *</label>
              <Input value={form.athlete_email} onChange={e => setForm(f => ({ ...f, athlete_email: e.target.value }))} placeholder="atleta@email.com" className="h-9 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Nome do plano *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Hipertrofia Fase A" className="h-9 rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="t-label block mb-1.5">Split</label>
                <Input value={form.split} onChange={e => setForm(f => ({ ...f, split: e.target.value }))} placeholder="Ex: ABC, PPL" className="h-9 rounded-lg text-[13px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Objetivo</label>
                <Input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Ex: Hipertrofia" className="h-9 rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="t-label block mb-1.5">Data início</label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
              </div>
            </div>

            {/* Sessions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="t-label">Treinos</label>
                <button onClick={addSession} className="text-[11px] text-[hsl(var(--brand))] font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar treino</button>
              </div>
              {form.sessions.map((session, si) => (
                <div key={si} className="p-3 bg-[hsl(var(--shell))] rounded-xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input value={session.label} onChange={e => updateSession(si, 'label', e.target.value)} placeholder="Treino A" className="h-8 rounded-lg text-[12px] w-24 shrink-0" />
                    <Input value={session.day_name} onChange={e => updateSession(si, 'day_name', e.target.value)} placeholder="Segunda" className="h-8 rounded-lg text-[12px] flex-1" />
                    <Input value={session.focus} onChange={e => updateSession(si, 'focus', e.target.value)} placeholder="Foco (ex: Peito)" className="h-8 rounded-lg text-[12px] flex-1" />
                    <button onClick={() => removeSession(si)} className="text-muted-foreground/40 hover:text-[hsl(var(--err))] shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {/* Exercises */}
                  <div className="space-y-1.5">
                    {(session.exercises || []).map((ex, ei) => (
                      <div key={ei} className="grid grid-cols-4 gap-1.5">
                        <Input value={ex.name} onChange={e => updateExercise(si, ei, 'name', e.target.value)} placeholder="Exercício" className="h-7 rounded-lg text-[11px] col-span-2" />
                        <Input value={ex.sets} onChange={e => updateExercise(si, ei, 'sets', e.target.value)} placeholder="Séries" className="h-7 rounded-lg text-[11px]" />
                        <Input value={ex.reps} onChange={e => updateExercise(si, ei, 'reps', e.target.value)} placeholder="Reps" className="h-7 rounded-lg text-[11px]" />
                      </div>
                    ))}
                    <button onClick={() => addExercise(si)} className="text-[11px] text-muted-foreground hover:text-[hsl(var(--brand))] flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Exercício
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="t-label block mb-1.5">Observações</label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-lg resize-none h-16 text-[13px]" />
            </div>
            <Button onClick={save} disabled={createM.isPending} className="w-full h-11 rounded-xl btn btn-primary">
              {createM.isPending ? 'Salvando…' : 'Salvar plano'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}