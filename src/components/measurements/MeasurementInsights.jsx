import React from 'react';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

export default function MeasurementInsights({ measurements, latest, prev }) {
  if (!latest || measurements.length < 2) return null;

  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  const oldest = sorted[0];
  
  // Calculate insights
  const weightChange = latest.weight - oldest.weight;
  const bfChange = latest.body_fat && oldest.body_fat ? latest.body_fat - oldest.body_fat : null;
  const waistChange = latest.waist && oldest.waist ? latest.waist - oldest.waist : null;
  
  // Days elapsed
  const daysElapsed = Math.floor((new Date(latest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
  const weeksElapsed = daysElapsed / 7;
  
  // Rate and projection
  const weightRate = weeksElapsed > 0 ? weightChange / weeksElapsed : 0;
  const projectedWeight8w = latest.weight + (weightRate * 8);
  
  const insights = [];
  
  if (Math.abs(weightChange) > 0.1) {
    insights.push({
      icon: weightChange > 0 ? TrendingUp : TrendingDown,
      color: weightChange > 0 ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--ok))]',
      text: `${weightChange > 0 ? 'Ganhou' : 'Perdeu'} ${Math.abs(weightChange).toFixed(1)}kg desde ${new Date(oldest.date).toLocaleDateString('pt-BR')}`
    });
  }
  
  if (bfChange && Math.abs(bfChange) > 0.05) {
    insights.push({
      icon: bfChange > 0 ? TrendingUp : TrendingDown,
      color: bfChange > 0 ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--ok))]',
      text: `Gordura corporal ${bfChange > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(bfChange).toFixed(2)}%`
    });
  }
  
  if (waistChange && Math.abs(waistChange) > 0.1) {
    insights.push({
      icon: waistChange > 0 ? TrendingUp : TrendingDown,
      color: waistChange > 0 ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--ok))]',
      text: `Cintura ${waistChange > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(waistChange).toFixed(1)}cm`
    });
  }
  
  if (Math.abs(weightRate) > 0.05) {
    insights.push({
      icon: AlertCircle,
      color: 'text-[hsl(var(--brand))]',
      text: `Ritmo: ${Math.abs(weightRate).toFixed(2)}kg/semana. Projeção em 8 semanas: ${projectedWeight8w.toFixed(1)}kg`
    });
  }
  
  if (insights.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <p className="t-label">Insights Automáticos</p>
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        return (
          <div key={i} className="surface p-4 flex items-start gap-3">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.color}`} strokeWidth={2} />
            <p className="t-body text-[hsl(var(--fg-2))]">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}