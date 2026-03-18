import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

/**
 * TrialExpiredUpgrade — shows when trial is expired for a feature
 * Only renders if user's trial status is 'trialing' but days remaining = 0
 */
export default function TrialExpiredUpgrade({ feature = 'Atlas AI', plan = 'Pro' }) {
  const { isTrialExpired } = useSubscription();

  if (!isTrialExpired) return null;

  const planNames = {
    Pro: 'Pro',
    Performance: 'Performance',
    Coach: 'Coach',
    Nutrition: 'Nutricionista',
    Clinical: 'Clínico',
  };

  return (
    <div className="rounded-2xl border border-[hsl(var(--err)/0.3)] bg-gradient-to-r from-[hsl(var(--err)/0.08)] to-[hsl(var(--err)/0.03)] p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--err)/0.12)] flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-[hsl(var(--err))]" strokeWidth={2} />
      </div>
      
      <div>
        <p className="text-[14px] font-semibold text-[hsl(var(--fg))] mb-1">
          Trial encerrado
        </p>
        <p className="text-[13px] text-[hsl(var(--fg-2))]">
          {feature} continua disponível no plano {planNames[plan]}.
        </p>
      </div>

      <Link to="/Pricing"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(var(--err))] text-white text-[13px] font-semibold hover:bg-[hsl(var(--err)/0.88)] transition-colors">
        Continuar assinatura <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}