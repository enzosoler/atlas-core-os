import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import { getToday, MEAL_TYPES } from '@/lib/atlas-theme';
const MACRO_COLORS = { protein: '#4F8CFF', carbs: '#8B7CFF', fat: '#F5A83A' };
import { Plus, UtensilsCrossed, Sparkles, ChevronLeft, ChevronRight, Loader2, Trash2, Edit2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FoodSearch from '@/components/nutrition/FoodSearch';
import MealEditModal from '@/components/nutrition/MealEditModal';
import NutritionComparison from '@/components/nutrition/NutritionComparison';
import AIMealSuggestion from '@/components/ai/AIMealSuggestion';
import { toast } from 'sonner';

function DateNav({ date, onChange }) {
  const isToday = date === getToday();
  const fmt = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--secondary))] transition-colors">
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
      </button>
      <span className="text-[13px] font-medium min-w-[140px] text-center">
        {fmt}{isToday && <span className="ml-1.5 badge badge-primary">Hoje</span>}
      </span>
      <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--secondary))] transition-colors">
        <ChevronRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function MacroBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}<span className="text-muted-foreground font-normal">/{max}g</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function DaySummary({ meals, profile }) {
  const t = meals.reduce((a, m) => ({
    cal: a.cal + (m.total_calories || 0), pro: a.pro + (m.total_protein || 0),
    carb: a.carb + (m.total_carbs || 0), fat: a.fat + (m.total_fat || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });
  const targets = { cal: profile?.calories_target || 2200, pro: profile?.protein_target || 160, carb: profile?.carbs_target || 250, fat: profile?.fat_target || 70 };
  const pct = Math.min((t.cal / targets.cal) * 100, 100);
  const remaining = Math.max(0, targets.cal - Math.round(t.cal));

  return (
    <div className="surface p-6">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="kpi-lg">{Math.round(t.cal)}</span>
          <span className="text-[13px] text-muted-foreground">/ {targets.cal} kcal</span>
        </div>
        <span className="text-[12px] text-muted-foreground">{remaining > 0 ? `${remaining} restam` : 'Meta atingida'}</span>
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--secondary))] overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all duration-700 bg-[hsl(var(--brand))]" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MacroBar label="Proteína" value={t.pro} max={targets.pro} color={MACRO_COLORS.protein} />
        <MacroBar label="Carboidratos" value={t.carb} max={targets.carb} color={MACRO_COLORS.carbs} />
        <MacroBar label="Gordura" value={t.fat} max={targets.fat} color={MACRO_COLORS.fat} />
      </div>
    </div>
  );
}

function MealRow({ meal, onEdit, onDelete, onDuplicate, date }) {
  const label = MEAL_TYPES[meal.meal_type]?.label || meal.meal_type;
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="section-label">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-semibold tabular-nums">{meal.total_calories || 0} kcal</span>
          <div className="flex gap-0.5 ml-2">
            {onEdit && (
              <button onClick={() => onEdit(meal)} className="text-muted-foreground/60 hover:text-[hsl(var(--brand))] transition-colors p-1.5">
                <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
            {onDuplicate && (
              <button onClick={() => onDuplicate(meal, date)} className="text-muted-foreground/60 hover:text-[hsl(var(--brand))] transition-colors p-1.5">
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(meal.id)} className="text-muted-foreground/60 hover:text-[hsl(var(--danger))] transition-colors p-1.5">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1 mb-3">
        {(meal.foods || []).map((f, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span className="text-foreground/80 truncate">{f.name}</span>
            <span className="text-muted-foreground shrink-0 ml-3 tabular-nums">{f.amount}{f.unit}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 pt-2.5 border-t border-border text-[11px] text-muted-foreground">
        <span>P <b className="text-foreground font-medium">{meal.total_protein || 0}g</b></span>
        <span>C <b className="text-foreground font-medium">{meal.total_carbs || 0}g</b></span>
        <span>G <b className="text-foreground font-medium">{meal.total_fat || 0}g</b></span>
      </div>
    </div>
  );
}

export default function Nutrition() {
  const { can } = useSubscription();
  const [date, setDate] = useState(getToday());
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [foods, setFoods] = useState([]);
  const [genDiet, setGenDiet] = useState(false);
  const [tab, setTab] = useState('comparison'); // comparison | logged | prescribed
  const qc = useQueryClient();

  const { data: meals, isLoading } = useQuery({ queryKey: ['meals', date], queryFn: () => base44.entities.Meal.filter({ date }, '-created_date'), initialData: [] });
  const { data: prescribed = [] } = useQuery({ 
    queryKey: ['prescribed-diets'],
    queryFn: () => base44.entities.PrescribedDiet.filter({ active: true }),
  });
  const { data: profile } = useQuery({ queryKey: ['user-profile'], queryFn: async () => { const p = await base44.entities.UserProfile.list(); return p?.[0] || null; } });

  const prescribedDiet = prescribed[0]; // First active prescribed diet

  const createMeal = useMutation({
    mutationFn: (d) => base44.entities.Meal.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meals', date] }); setShowAdd(false); setFoods([]); toast.success('Refeição registrada'); },
  });
  const deleteMeal = useMutation({
    mutationFn: (id) => base44.entities.Meal.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meals', date] }); toast.success('Refeição removida'); },
  });

  const duplicateMeal = (meal, sourceDate) => {
    const tomorrow = new Date(sourceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    base44.entities.Meal.create({
      date: tomorrow.toISOString().split('T')[0],
      meal_type: meal.meal_type,
      foods: JSON.parse(JSON.stringify(meal.foods)),
      total_calories: meal.total_calories,
      total_protein: meal.total_protein,
      total_carbs: meal.total_carbs,
      total_fat: meal.total_fat,
      total_fiber: meal.total_fiber,
    }).then(() => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      toast.success('Refeição duplicada para amanhã');
    });
  };

  const saveMeal = () => {
    if (!foods.length) return;
    const t = foods.reduce((a, f) => ({ cal: a.cal + f.kcal, pro: a.pro + f.protein, carb: a.carb + f.carbs, fat: a.fat + f.fat, fib: a.fib + (f.fiber || 0) }), { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0 });
    createMeal.mutate({ date, meal_type: mealType, foods, total_calories: Math.round(t.cal), total_protein: Math.round(t.pro * 10) / 10, total_carbs: Math.round(t.carb * 10) / 10, total_fat: Math.round(t.fat * 10) / 10, total_fiber: Math.round(t.fib * 10) / 10 });
  };

  const generateDiet = async () => {
    if (!can('ai_diet_generation')) {
      toast.error('Geração de dieta por IA — Plano Pro e acima');
      return;
    }
    setGenDiet(true);
    const res = await base44.functions.invoke('generateDiet', { date, profile });
    if (res.data?.success) { qc.invalidateQueries({ queryKey: ['meals', date] }); toast.success(`${res.data.count} refeições geradas`); }
    else toast.error('Erro ao gerar. Tente novamente.');
    setGenDiet(false);
  };

  const changeDate = (d) => { const dt = new Date(date); dt.setDate(dt.getDate() + d); setDate(dt.toISOString().split('T')[0]); };

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutrição</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Registro alimentar diário</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => {
             if (!can('ai_diet_generation')) {
               toast.error('Geração de dieta por IA — Plano Pro e acima');
               return;
             }
             generateDiet();
           }} disabled={genDiet} variant="outline" className="h-9 rounded-lg text-[13px] gap-1.5 border-border">
             {genDiet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
             Gerar dieta IA
           </Button>
          <Button onClick={() => setShowAdd(true)} className="h-9 rounded-lg text-[13px] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.85)] text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nova refeição
          </Button>
        </div>
      </div>

      <DateNav date={date} onChange={changeDate} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'comparison', label: 'Meta vs Registrado' },
          { id: 'logged', label: `Registrado (${meals.length})` },
          { id: 'prescribed', label: 'Plano Alimentar' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[hsl(var(--brand))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Comparison Tab */}
      {tab === 'comparison' && (
        <NutritionComparison profile={profile} logged={meals} prescribed={prescribedDiet} />
      )}

      {/* Logged Tab */}
      {tab === 'logged' && (
      <div className="space-y-4">
        {/* Calculate remaining macros */}
        {(() => {
          const targets = { cal: profile?.calories_target || 2200, pro: profile?.protein_target || 160, carb: profile?.carbs_target || 250, fat: profile?.fat_target || 70 };
          const t = meals.reduce((a, m) => ({ cal: a.cal + (m.total_calories || 0), pro: a.pro + (m.total_protein || 0), carb: a.carb + (m.total_carbs || 0), fat: a.fat + (m.total_fat || 0) }), { cal: 0, pro: 0, carb: 0, fat: 0 });
          return <AIMealSuggestion loggedMeals={meals} profile={profile} remaining={{ cal: Math.max(0, targets.cal - Math.round(t.cal)), pro: Math.max(0, targets.pro - Math.round(t.pro)), carb: Math.max(0, targets.carb - Math.round(t.carb)), fat: Math.max(0, targets.fat - Math.round(t.fat)) }} />;
        })()}
        <div>
          <p className="t-label mb-3">Refeições Registradas</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12 card border-dashed space-y-3">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">Nenhuma refeição registrada</p>
            <div className="flex items-center justify-center gap-3 text-[12px]">
              <button onClick={() => setShowAdd(true)} className="text-[hsl(var(--brand))] font-medium hover:underline text-[13px]">+ Registrar</button>
              <span className="text-muted-foreground/40">·</span>
              <button onClick={() => {
                if (!can('ai_diet_generation')) {
                  toast.error('Geração de dieta por IA — Plano Pro e acima');
                  return;
                }
                generateDiet();
              }} disabled={genDiet} className={`font-medium ${can('ai_diet_generation') ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'}`}>Gerar por IA</button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {meals.map(m => (
              <MealRow
                key={m.id}
                meal={m}
                onEdit={(meal) => { setEditingMeal(meal); setShowEdit(true); }}
                onDelete={(id) => deleteMeal.mutate(id)}
                onDuplicate={duplicateMeal}
                date={date}
              />
            ))}
          </div>
        )}
        </div>
      </div>
      )}

      {/* Prescribed Tab */}
      {tab === 'prescribed' && (
        <div className="space-y-6 mt-4">
          {prescribedDiet ? (
            <>
              <div className="surface p-6 border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand)/0.02)]">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-[15px] font-bold">{prescribedDiet.name}</h3>
                    {prescribedDiet.description && <p className="t-small text-muted-foreground mt-1">{prescribedDiet.description}</p>}
                  </div>
                  <span className="badge badge-blue">{prescribedDiet.meals?.length || 0} refeições</span>
                </div>
                {prescribedDiet.target_calories && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="t-caption mb-1">Calorias</p>
                      <p className="text-[15px] font-bold">{prescribedDiet.target_calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="t-caption mb-1">Proteína</p>
                      <p className="text-[15px] font-bold">{prescribedDiet.target_protein}g</p>
                    </div>
                    <div className="text-center">
                      <p className="t-caption mb-1">Carboidratos</p>
                      <p className="text-[15px] font-bold">{prescribedDiet.target_carbs}g</p>
                    </div>
                    <div className="text-center">
                      <p className="t-caption mb-1">Gordura</p>
                      <p className="text-[15px] font-bold">{prescribedDiet.target_fat}g</p>
                    </div>
                  </div>
                )}
              </div>
              {prescribedDiet.meals?.length > 0 && (
                <div>
                  <p className="t-label mb-3">Refeições Prescritas</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {prescribedDiet.meals.map((meal, i) => (
                      <div key={i} className="surface p-4">
                        <p className="text-[13px] font-semibold mb-2">{meal.meal_type}</p>
                        {meal.foods?.map((f, fi) => (
                          <div key={fi} className="text-[12px] text-muted-foreground mb-1">
                            {f.name} · {f.amount}{f.unit}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 card border-dashed space-y-3">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground">Nenhum plano alimentar ativo</p>
              <p className="text-[12px] text-muted-foreground">Peça a um nutricionista para criar seu plano ou gere um com IA.</p>
            </div>
          )}
        </div>
      )}

      {/* Add meal dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[15px]">Registrar refeição</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MEAL_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <FoodSearch onSelectFood={(f) => setFoods(prev => [...prev, f])} />
            {foods.length > 0 && (
              <div className="space-y-1.5">
                <p className="section-label">Adicionados</p>
                {foods.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[hsl(var(--secondary))] text-[12px]">
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-muted-foreground">{f.amount}{f.unit} · {Math.round(f.kcal)} kcal</p>
                    </div>
                    <button onClick={() => setFoods(foods.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-[hsl(var(--danger))] ml-3">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-4 text-[11px] text-muted-foreground px-1">
                  <span>{foods.reduce((s, f) => s + f.kcal, 0)} kcal</span>
                  <span>P {foods.reduce((s, f) => s + f.protein, 0).toFixed(0)}g</span>
                  <span>C {foods.reduce((s, f) => s + f.carbs, 0).toFixed(0)}g</span>
                  <span>G {foods.reduce((s, f) => s + f.fat, 0).toFixed(0)}g</span>
                </div>
              </div>
            )}
            <Button onClick={saveMeal} disabled={!foods.length || createMeal.isPending}
              className="btn btn-primary w-full h-11 rounded-xl">
              {createMeal.isPending ? 'Salvando…' : 'Salvar refeição'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit meal modal */}
      <MealEditModal
        open={showEdit}
        onOpenChange={setShowEdit}
        meal={editingMeal}
        date={date}
        onSuccess={() => setEditingMeal(null)}
      />
    </div>
  );
}