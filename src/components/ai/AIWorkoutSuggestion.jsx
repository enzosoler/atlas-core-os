/**
 * AIWorkoutSuggestion — suggest next exercise based on current workout
 * Shows in /Workouts page
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function AIWorkoutSuggestion({ loggedExercises, profile }) {
  const { can } = useSubscription();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSuggestion = async () => {
    if (!can('atlas_ai')) return;
    
    try {
      setLoading(true);
      const doneExercises = loggedExercises?.map(ex => ex.name).join(', ') || 'nenhum';
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sugira UM exercício PRÁTICO para continuar o treino, baseado em:
        
- Exercícios já feitos: ${doneExercises}
- Meta de treino: ${profile?.training_goal || 'ganho de força'}

Responda com APENAS o nome do exercício + 1 linha (ex: "Supino dumbbell — 3x8, foco no controle").`,
        model: 'gemini_3_flash',
      });

      setSuggestion(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!can('atlas_ai')) return null;

  return (
    <div className="surface p-4 border-[hsl(var(--brand-ai)/0.2)] bg-[hsl(var(--brand-ai)/0.02)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--brand-ai))]" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-[hsl(var(--brand-ai))]">Próximo Exercício</span>
        </div>
      </div>
      {suggestion ? (
        <p className="text-[12px] text-foreground mt-2 leading-relaxed">{suggestion}</p>
      ) : (
        <button
          onClick={generateSuggestion}
          disabled={loading}
          className="mt-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--brand-ai)/0.1)] text-[hsl(var(--brand-ai))] text-[11px] font-medium hover:bg-[hsl(var(--brand-ai)/0.2)] transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {loading ? 'Gerando...' : 'Sugerir exercício'}
        </button>
      )}
    </div>
  );
}