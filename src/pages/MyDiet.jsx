import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, UtensilsCrossed, ChevronDown, ChevronUp, Bot, User, Users } from 'lucide-react';
import { toast } from 'sonner';

const CREATOR_LABELS = { ai: 'Atlas AI', coach: 'Coach', user: 'Você' };
const CREATOR_BADGE  = { ai: 'badge-ai', coach: 'badge-blue', user: 'badge-neutral' };
const CREATOR_ICONS  = { ai: Bot, coach: Users, user: User };

function MacroChip({ label, value, unit, color }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-[hsl(var(--shell))]">
      <span className="kpi-sm" style={{ color }}>{value ?? '—'}</span>
      <span className="t-caption mt-0.5">{unit}</span>
      <span className="t-label mt-0.5">{label}</span>
    </div>
  );
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[13px] font-semibold">{meal.name}</p>
            {meal.time && <p className="t-caption">{meal.time}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 t-caption">
            <span>{meal.total_calories ?? 0} kcal</span>
            <span className="hidden sm:inline">P {meal.total_protein ?? 0}g</span>
            <span className="hidden sm:inline">C {meal.total_carbs ?? 0}g</span>
            <span className="hidden sm:inline">G {meal.total_fat ?? 0}g</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-[hsl(var(--fg-2))] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-2))] shrink-0" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-[hsl(var(--border-h))] pt-2">
          {(meal.foods || []).map((f, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <span className="text-[hsl(var(--fg))]">{f.name}</span>
              <span className="t-caption ml-3 shrink-0">{f.amount}{f.unit} · {f.kcal}kcal</span>
            </div>
          ))}
          {(!meal.foods || meal.foods.length === 0) && (
            <p className="t-caption">Sem alimentos detalhados.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyDiet() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigate('/Landing', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const p = await base44.entities.UserProfile.list(); return p?.[0] || null; },
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['diet-plans'],
    queryFn: () => base44.entities.DietPlan.filter({ active: true }, '-created_date'),
  });

  const plan = plans[0] || null;

  const generate = async () => {
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Crie um plano alimentar detalhado em português brasileiro para um usuário com o seguinte perfil:
- Objetivo: ${profile?.training_goal || 'saúde geral'}
- Calorias alvo: ${profile?.calories_target || 2200} kcal
- Proteína alvo: ${profile?.protein_target || 160}g
- Carboidratos alvo: ${profile?.carbs_target || 250}g
- Gordura alvo: ${profile?.fat_target || 70}g
- Estilo alimentar: ${profile?.dietary_style || 'balanceado'}

Crie um plano com 5-6 refeições distribuídas ao longo do dia, com alimentos reais e quantidades em gramas/unidades.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          objective: { type: 'string' },
          total_calories: { type: 'number' },
          total_protein: { type: 'number' },
          total_carbs: { type: 'number' },
          total_fat: { type: 'number' },
          meals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                time: { type: 'string' },
                total_calories: { type: 'number' },
                total_protein: { type: 'number' },
                total_carbs: { type: 'number' },
                total_fat: { type: 'number' },
                foods: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' }, amount: { type: 'number' },
                      unit: { type: 'string' }, kcal: { type: 'number' },
                      protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (res?.name) {
      // Deactivate existing
      for (const p of plans) await base44.entities.DietPlan.update(p.id, { active: false });
      await base44.entities.DietPlan.create({
        ...res,
        created_by_type: 'ai',
        active: true,
        version: 1,
        start_date: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['diet-plans'] });
      toast.success('Plano alimentar gerado!');
    } else {
      toast.error('Erro ao gerar. Tente novamente.');
    }
    setGenerating(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[50vh] gap-2 t-small text-[hsl(var(--fg-2))]">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
    </div>
  );

  const CreatorIcon = plan ? (CREATOR_ICONS[plan.created_by_type] || Bot) : null;

  return (
    <div className="p-5 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-5 border-b border-[hsl(var(--border-h))]">
        <div>
          <h1 className="t-headline">Minha Dieta</h1>
          <p className="t-small mt-1">Plano alimentar prescrito ativo</p>
        </div>
        <button onClick={generate} disabled={generating} className="btn btn-secondary gap-1.5">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {plan ? 'Gerar novo plano' : 'Gerar plano por IA'}
        </button>
      </div>

      {!plan ? (
        <div className="empty-state">
          <div className="empty-state-icon"><UtensilsCrossed className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhum plano alimentar ativo</p>
          <p className="t-caption mb-4">Gere um plano personalizado com IA baseado no seu perfil.</p>
          <button onClick={generate} disabled={generating} className="btn btn-primary gap-1.5">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar com IA
          </button>
        </div>
      ) : (
        <>
          {/* Plan header */}
          <div className="surface p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="t-title flex-1">{plan.name}</p>
              <span className={`badge ${CREATOR_BADGE[plan.created_by_type] || 'badge-neutral'} gap-1`}>
                {CreatorIcon && <CreatorIcon className="w-3 h-3" />}
                {CREATOR_LABELS[plan.created_by_type] || 'IA'}
              </span>
              <span className="badge badge-neutral">v{plan.version || 1}</span>
            </div>
            {plan.objective && <p className="t-body text-[hsl(var(--fg-2))]">{plan.objective}</p>}
            {plan.start_date && (
              <p className="t-caption">Desde {new Date(plan.start_date + 'T12:00').toLocaleDateString('pt-BR')}</p>
            )}
          </div>

          {/* Macros */}
          <div>
            <p className="t-label mb-3">Totais diários</p>
            <div className="grid grid-cols-4 gap-2">
              <MacroChip label="Calorias" value={plan.total_calories} unit="kcal" color="hsl(var(--brand))" />
              <MacroChip label="Proteína" value={plan.total_protein} unit="g" color="#4F8CFF" />
              <MacroChip label="Carboidr." value={plan.total_carbs} unit="g" color="#8B7CFF" />
              <MacroChip label="Gordura" value={plan.total_fat} unit="g" color="#F5A83A" />
            </div>
          </div>

          {/* Meals */}
          <div>
            <p className="t-label mb-3">Refeições planejadas ({(plan.meals || []).length})</p>
            <div className="space-y-2">
              {(plan.meals || []).map((meal, i) => <MealCard key={i} meal={meal} />)}
            </div>
          </div>

          {plan.notes && (
            <div className="surface p-4">
              <p className="t-label mb-1">Observações</p>
              <p className="t-body text-[hsl(var(--fg-2))]">{plan.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}