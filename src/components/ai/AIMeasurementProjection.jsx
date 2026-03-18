/**
 * AIMeasurementProjection — project goal achievement timeline
 * Shows in /Measurements page
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function AIMeasurementProjection({ latest, measurements, profile }) {
  const { can } = useSubscription();
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateProjection = async () => {
    if (!can('atlas_ai') || measurements.length < 3) return;
    
    try {
      setLoading(true);
      const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
      const recentAvg = sorted.slice(-3).reduce((s, m) => s + m.weight, 0) / 3;
      const oldAvg = sorted.slice(0, 3).reduce((s, m) => s + m.weight, 0) / 3;
      const weeklyRate = (recentAvg - oldAvg) / Math.max(1, (sorted.length - 1) / 7);
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Projete quando o usuário atingirá a meta, baseado em:
        
- Peso atual: ${latest.weight}kg
- Meta: ${profile?.target_weight}kg
- Taxa média semanal: ${weeklyRate.toFixed(2)}kg/semana
- Semanas de tracking: ${Math.round((sorted.length - 1) / 7)}

Responda com: "Em ~X semanas" ou "já atingiu!" + dica motivadora.`,
        model: 'gemini_3_flash',
      });

      setProjection(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!can('atlas_ai') || measurements.length < 3 || !profile?.target_weight) return null;

  return (
    <div className="surface p-4 border-[hsl(var(--brand-ai)/0.2)] bg-[hsl(var(--brand-ai)/0.02)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[hsl(var(--brand-ai))]" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-[hsl(var(--brand-ai))]">Projeção de Meta</span>
        </div>
      </div>
      {projection ? (
        <p className="text-[12px] text-foreground mt-2 leading-relaxed">{projection}</p>
      ) : (
        <button
          onClick={generateProjection}
          disabled={loading}
          className="mt-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--brand-ai)/0.1)] text-[hsl(var(--brand-ai))] text-[11px] font-medium hover:bg-[hsl(var(--brand-ai)/0.2)] transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
          {loading ? 'Calculando...' : 'Gerar projeção'}
        </button>
      )}
    </div>
  );
}