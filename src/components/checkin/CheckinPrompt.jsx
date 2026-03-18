import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckinPrompt({ checkin, missingToday, onStart }) {
  // Support both old API (missingToday) and new API (checkin object)
  const isMissing = typeof missingToday === 'boolean' ? missingToday : !checkin;

  if (!isMissing) return null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--warn)/0.3)] bg-gradient-to-r from-[hsl(var(--warn)/0.08)] to-[hsl(var(--warn)/0.03)] p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[hsl(var(--warn))] mt-0.5 shrink-0" strokeWidth={2} />
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[hsl(var(--fg))]">Check-in diário pendente</p>
          <p className="text-[12px] text-[hsl(var(--fg-2))] mt-0.5">
            Complete seu check-in para manter a sequência e ter análises mais precisas.
          </p>
        </div>
      </div>
      {onStart && (
        <Button
          onClick={onStart}
          className="w-full h-9 rounded-lg bg-[hsl(var(--warn))] hover:bg-[hsl(var(--warn)/0.85)] text-white text-[13px] font-semibold"
        >
          Fazer check-in agora
        </Button>
      )}
    </div>
  );
}