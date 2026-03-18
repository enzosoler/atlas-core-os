import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Dumbbell, ChevronDown, ChevronUp, Bot, User, Users } from 'lucide-react';
import { toast } from 'sonner';

const CREATOR_LABELS = { ai: 'Atlas AI', coach: 'Coach', user: 'Você' };
const CREATOR_BADGE  = { ai: 'badge-ai', coach: 'badge-blue', user: 'badge-neutral' };
const CREATOR_ICONS  = { ai: Bot, coach: Users, user: User };

function SessionCard({ session }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="surface overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold">{session.label}</p>
            {session.day_name && <span className="badge badge-neutral">{session.day_name}</span>}
          </div>
          {session.focus && <p className="t-caption mt-0.5">{session.focus}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="t-caption">{(session.exercises || []).length} exercícios</span>
          {open ? <ChevronUp className="w-4 h-4 text-[hsl(var(--fg-2))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-2))]" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-[hsl(var(--border-h))]">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[hsl(var(--shell))] t-label">
            <span className="col-span-5">Exercício</span>
            <span className="col-span-2 text-center">Séries</span>
            <span className="col-span-2 text-center">Reps</span>
            <span className="col-span-3 text-center">Carga</span>
          </div>
          {(session.exercises || []).map((ex, i) => (
            <div key={i} className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-[12px] items-center ${i % 2 === 0 ? '' : 'bg-[hsl(var(--shell)/0.4)]'}`}>
              <div className="col-span-5">
                <p className="font-medium text-[hsl(var(--fg))]">{ex.name}</p>
                {ex.muscle_groups?.length > 0 && (
                  <p className="t-caption">{ex.muscle_groups.slice(0, 2).join(', ')}</p>
                )}
              </div>
              <span className="col-span-2 text-center font-semibold">{ex.sets ?? '—'}</span>
              <span className="col-span-2 text-center">{ex.reps ?? '—'}</span>
              <span className="col-span-3 text-center text-[hsl(var(--fg-2))]">{ex.load || '—'}</span>
            </div>
          ))}
          {(session.exercises || []).length === 0 && (
            <p className="px-4 py-3 t-caption">Sem exercícios.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyWorkout() {
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
    queryKey: ['workout-plans'],
    queryFn: () => base44.entities.WorkoutPlan.filter({ active: true }, '-created_date'),
  });

  const plan = plans[0] || null;

  const generate = async () => {
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Crie um plano de treino completo em português brasileiro para:
- Objetivo: ${profile?.training_goal || 'hipertrofia'}
- Nível de atividade: ${profile?.activity_level || 'moderado'}
- Estilo alimentar: ${profile?.dietary_style || 'balanceado'}

Crie um plano com 3-4 sessões (Treino A, B, C...) com exercícios reais, séries, reps e carga sugerida.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name:      { type: 'string' },
          split:     { type: 'string' },
          objective: { type: 'string' },
          sessions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label:    { type: 'string' },
                day_name: { type: 'string' },
                focus:    { type: 'string' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name:          { type: 'string' },
                      sets:          { type: 'number' },
                      reps:          { type: 'string' },
                      load:          { type: 'string' },
                      rest_seconds:  { type: 'number' },
                      muscle_groups: { type: 'array', items: { type: 'string' } }
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
      for (const p of plans) await base44.entities.WorkoutPlan.update(p.id, { active: false });
      await base44.entities.WorkoutPlan.create({
        ...res,
        created_by_type: 'ai',
        active: true,
        current_week: 1,
        start_date: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['workout-plans'] });
      toast.success('Plano de treino gerado!');
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
          <h1 className="t-headline">Meu Treino</h1>
          <p className="t-small mt-1">Plano de treino prescrito ativo</p>
        </div>
        <button onClick={generate} disabled={generating} className="btn btn-secondary gap-1.5">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {plan ? 'Gerar novo plano' : 'Gerar plano por IA'}
        </button>
      </div>

      {!plan ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Dumbbell className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhum plano de treino ativo</p>
          <p className="t-caption mb-4">Gere um plano personalizado com IA baseado no seu perfil.</p>
          <button onClick={generate} disabled={generating} className="btn btn-primary gap-1.5">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar com IA
          </button>
        </div>
      ) : (
        <>
          {/* Plan info */}
          <div className="surface p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="t-title flex-1">{plan.name}</p>
              <span className={`badge ${CREATOR_BADGE[plan.created_by_type] || 'badge-neutral'} gap-1`}>
                {CreatorIcon && <CreatorIcon className="w-3 h-3" />}
                {CREATOR_LABELS[plan.created_by_type] || 'IA'}
              </span>
              {plan.split && <span className="badge badge-neutral">{plan.split}</span>}
            </div>
            {plan.objective && <p className="t-body text-[hsl(var(--fg-2))]">{plan.objective}</p>}
            <div className="flex flex-wrap gap-4 t-small text-[hsl(var(--fg-2))]">
              {plan.current_week && <span>Semana {plan.current_week}</span>}
              {plan.start_date && <span>Início {new Date(plan.start_date + 'T12:00').toLocaleDateString('pt-BR')}</span>}
              {plan.sessions?.length && <span>{plan.sessions.length} sessões</span>}
            </div>
          </div>

          {/* Sessions */}
          <div>
            <p className="t-label mb-3">Divisão de treino</p>
            <div className="space-y-3">
              {(plan.sessions || []).map((session, i) => <SessionCard key={i} session={session} />)}
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