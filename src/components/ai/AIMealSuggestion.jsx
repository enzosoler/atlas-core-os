/**
 * AIMealSuggestion — suggest next meal based on current intake
 * Shows in /Nutrition page
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function AIMealSuggestion({ loggedMeals, profile, remaining }) {
  const { can } = useSubscription();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSuggestion = async () => {
    if (!can('atlas_ai')) return;
    
    try {
      setLoading(true);
      const meals = loggedMeals?.map(m => m.meal_type).join(', ') || 'nenhuma';
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sugira UMA refeição PRÁTICA, baseado em:
        
- Refeições já feitas: ${meals}
- Calorias restantes: ${remaining.cal} kcal
- Proteína a atingir: ${remaining.pro}g
- Objetivos: ${profile?.training_goal || 'saúde geral'}

Responda com: "Próxima refeição: [nome] — [ingredientes simples, ~cal kcal]".`,
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
          <span className="text-[12px] font-semibold text-[hsl(var(--brand-ai))]">Próxima Refeição</span>
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
          {loading ? 'Gerando...' : 'Sugerir refeição'}
        </button>
      )}
    </div>
  );
}