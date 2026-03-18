import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useRBAC } from '@/lib/rbac';
import { Plus, UtensilsCrossed, ChevronDown, ChevronUp, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

function MacroChip({ label, value, unit = 'g', color }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[12px] font-semibold" style={{ color }}>{Math.round(value || 0)}{unit}</p>
    </div>
  );
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--card-hi))] hover:bg-[hsl(var(--shell))] transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[13px] font-semibold truncate">{meal.name}</span>
          {meal.time && <span className="text-[11px] text-muted-foreground shrink-0">{meal.time}</span>}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-[12px] font-medium text-muted-foreground">{meal.total_calories || 0} kcal</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-1.5 bg-[hsl(var(--card))]">
          {(meal.foods || []).map((f, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <span className="truncate text-foreground/80">{f.name}</span>
              <span className="text-muted-foreground shrink-0 ml-3">{f.amount}{f.unit} · {f.kcal} kcal</span>
            </div>
          ))}
          {meal.foods?.length === 0 && <p className="text-[12px] text-muted-foreground">Nenhum alimento cadastrado</p>}
        </div>
      )}
    </div>
  );
}

const emptyMeal = () => ({ name: '', time: '', foods: [] });
const emptyForm = () => ({ name: '', objective: '', notes: '', athlete_email: '', start_date: '', total_calories: '', total_protein: '', total_carbs: '', total_fat: '', meals: [emptyMeal()] });

export default function MyPrescribedDiet() {
  const { user } = useAuth();
  const { isStaff } = useRBAC(user);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Athletes see only their plans; staff sees all they created
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['prescribed-diet', user?.email],
    queryFn: () => isStaff
      ? base44.entities.PrescribedDiet.filter({ coach_email: user.email }, '-created_date')
      : base44.entities.PrescribedDiet.filter({ athlete_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const createM = useMutation({
    mutationFn: (d) => base44.entities.PrescribedDiet.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prescribed-diet'] }); setShowCreate(false); setForm(emptyForm()); toast.success('Plano criado'); },
  });
  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.PrescribedDiet.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescribed-diet'] }),
  });

  const addMeal = () => setForm(f => ({ ...f, meals: [...f.meals, emptyMeal()] }));
  const updateMeal = (i, field, val) => setForm(f => {
    const meals = [...f.meals];
    meals[i] = { ...meals[i], [field]: val };
    return { ...f, meals };
  });
  const removeMeal = (i) => setForm(f => ({ ...f, meals: f.meals.filter((_, j) => j !== i) }));

  const save = () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (isStaff && !form.athlete_email) { toast.error('Email do atleta obrigatório'); return; }
    createM.mutate({
      ...form,
      coach_email: user.email,
      athlete_email: isStaff ? form.athlete_email : user.email,
      total_calories: form.total_calories ? +form.total_calories : undefined,
      total_protein:  form.total_protein  ? +form.total_protein  : undefined,
      total_carbs:    form.total_carbs    ? +form.total_carbs    : undefined,
      total_fat:      form.total_fat      ? +form.total_fat      : undefined,
    });
  };

  const activePlan = plans.find(p => p.active) || plans[0];

  return (
    <div className="p-4 lg:p-8 max-w-4xl w-full space-y-6">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="t-headline">Dieta Prescrita</h1>
          <p className="t-small mt-1">Plano alimentar definido pelo seu profissional</p>
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
          <div className="empty-state-icon"><UtensilsCrossed className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhum plano prescrito</p>
          <p className="t-caption">{isStaff ? 'Crie um plano para um atleta.' : 'Aguarde seu coach prescrever um plano alimentar.'}</p>
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
                    {!plan.active && <span className="badge badge-neutral">Inativo</span>}
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

              {/* Macros summary */}
              {(plan.total_calories || plan.total_protein) && (
                <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-[hsl(var(--shell))] rounded-xl">
                  <MacroChip label="Calorias" value={plan.total_calories} unit="kcal" color="hsl(var(--fg))" />
                  <MacroChip label="Proteína" value={plan.total_protein} color="#4F8CFF" />
                  <MacroChip label="Carbos"   value={plan.total_carbs}   color="#8B7CFF" />
                  <MacroChip label="Gordura"  value={plan.total_fat}     color="#F5A83A" />
                </div>
              )}

              {/* Meals */}
              <div className="space-y-2">
                {(plan.meals || []).map((meal, i) => <MealCard key={i} meal={meal} />)}
              </div>

              {plan.notes && <p className="t-caption mt-4 italic">{plan.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog — staff only */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="t-subtitle">Novo plano alimentar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="t-label block mb-1.5">Email do atleta *</label>
              <Input value={form.athlete_email} onChange={e => setForm(f => ({ ...f, athlete_email: e.target.value }))} placeholder="atleta@email.com" className="h-9 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Nome do plano *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Bulking Fase 1" className="h-9 rounded-lg text-[13px]" />
              </div>
              <div>
                <label className="t-label block mb-1.5">Data início</label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
              </div>
            </div>
            <div>
              <label className="t-label block mb-1.5">Objetivo</label>
              <Input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Ex: Ganho de massa, emagrecimento" className="h-9 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[['Kcal', 'total_calories'], ['Proteína g', 'total_protein'], ['Carbos g', 'total_carbs'], ['Gordura g', 'total_fat']].map(([l, k]) => (
                <div key={k}>
                  <label className="t-label block mb-1.5">{l}</label>
                  <Input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="t-label">Refeições</label>
                <button onClick={addMeal} className="text-[11px] text-[hsl(var(--brand))] font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
              </div>
              {form.meals.map((meal, i) => (
                <div key={i} className="p-3 bg-[hsl(var(--shell))] rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={meal.name} onChange={e => updateMeal(i, 'name', e.target.value)} placeholder={`Refeição ${i + 1}`} className="h-8 rounded-lg text-[12px] flex-1" />
                    <Input value={meal.time} onChange={e => updateMeal(i, 'time', e.target.value)} placeholder="08:00" className="h-8 rounded-lg text-[12px] w-20" />
                    <button onClick={() => removeMeal(i)} className="text-muted-foreground/40 hover:text-[hsl(var(--err))]"><Trash2 className="w-3.5 h-3.5" /></button>
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