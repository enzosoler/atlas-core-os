import React from 'react';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * AdherenceComparison — Shows actual vs prescribed metrics
 * 
 * Usage:
 * <AdherenceComparison
 *   label="Treino desta semana"
 *   actual={5}
 *   prescribed={6}
 *   unit="sessões"
 * />
 */
export default function AdherenceComparison({ label, actual, prescribed, unit = '' }) {
  const percentage = prescribed > 0 ? Math.round((actual / prescribed) * 100) : 0;
  const isExceeded = actual > prescribed;
  const isMet = actual >= prescribed;

  return (
    <div className="surface rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="t-small text-[hsl(var(--fg-2))] mb-2">{label}</p>
          <p className="t-kpi-sm text-[hsl(var(--fg))]">
            {actual}
            <span className="text-[13px] font-normal text-[hsl(var(--fg-2))] ml-1">{unit}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isMet ? (
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--ok))]" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-5 h-5 text-[hsl(var(--warn))]" strokeWidth={2} />
          )}
          <span className={`text-[13px] font-semibold ${isExceeded ? 'text-[hsl(var(--ok))]' : isMet ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--warn))]'}`}>
            {percentage}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[hsl(var(--fg-2))]">Meta: {prescribed} {unit}</span>
          {isExceeded && <span className="text-[hsl(var(--ok))] font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Acima!</span>}
        </div>
        <div className="h-2 bg-[hsl(var(--shell))] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isMet ? 'bg-[hsl(var(--ok))]' : 'bg-[hsl(var(--warn))]'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}