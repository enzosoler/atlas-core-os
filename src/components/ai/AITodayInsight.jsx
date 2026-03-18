/**
 * AITodayInsight — contextual recommendation for today
 * Shows on /Today page
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function AITodayInsight({ checkin, meals, workouts, profile }) {
  const { can } = useSubscription();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasAI = can('atlas_ai');

  useEffect(() => {
    if (!hasAI) return;
    
    const fetchInsight = async () => {
      try {
        setLoading(true);
        const mealsCount = meals?.length || 0;
        const workoutLogged = workouts?.some(w => w.completed);
        
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Dê uma recomendação contextual SUPER CURTA (máx 2 linhas) para o usuário HOJE baseada em:
          
- Refeições registradas: ${mealsCount}
- Treino completado: ${workoutLogged ? 'sim' : 'não'}
- Meta de calorias: ${profile?.calories_target || 2200} kcal
- Humor/energia (se checkin): ${checkin ? `${checkin.mood}/5 humor, ${checkin.energy}/5 energia` : 'não preenchido'}

Seja motivador, prático, uma ação concreta para as próximas horas.`,
          model: 'gemini_3_flash',
        });

        setInsight(typeof res === 'string' ? res : res?.data || res);
      } catch (err) {
        console.error('AITodayInsight error:', err.message);
        setError('Não consegui gerar insight');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [hasAI, meals?.length, workouts?.length, checkin?.id]);

  if (!can('atlas_ai')) return null;

  return (
    <div className="surface p-4 border-[hsl(var(--brand-ai)/0.2)] bg-[hsl(var(--brand-ai)/0.02)]">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-ai)/0.1)] flex items-center justify-center shrink-0 mt-0.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-[hsl(var(--brand-ai))] animate-spin" strokeWidth={2} />
          ) : (
            <Brain className="w-4 h-4 text-[hsl(var(--brand-ai))]" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[hsl(var(--brand-ai))] mb-1">Atlas AI</p>
          {loading ? (
            <p className="text-[12px] text-muted-foreground">Analisando seu dia...</p>
          ) : error ? (
            <p className="text-[12px] text-[hsl(var(--err))]">{error}</p>
          ) : insight ? (
            <p className="text-[12px] text-foreground leading-relaxed">{insight}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}