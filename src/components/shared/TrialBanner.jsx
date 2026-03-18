/**
 * TrialBanner — shown to users with trialing subscription
 * Shows days remaining + CTA to upgrade
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Clock } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useAuth } from '@/lib/AuthContext';

function daysLeft(dateStr) {
  if (!dateStr) return 0;
  const end = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function TrialBanner() {
  const { subscription } = useSubscription();
  const [dismissed, setDismissed] = React.useState(false);
  const { user } = useAuth();

  if (dismissed) return null;
  if (!subscription || subscription.status !== 'trialing') return null;
  if (user?.atlas_role === 'admin') return null;

  const days = daysLeft(subscription.trial_ends_at);
  const isUrgent = days <= 2;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium border-b
      ${isUrgent
        ? 'bg-[hsl(var(--err)/0.08)] border-[hsl(var(--err)/0.2)] text-[hsl(var(--err))]'
        : 'bg-[hsl(var(--brand)/0.06)] border-[hsl(var(--brand)/0.15)] text-[hsl(var(--brand))]'
      }`}>
      <div className="flex items-center gap-1.5 shrink-0">
        {isUrgent
          ? <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
          : <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        }
        <span>
          {days > 0
            ? `Trial Performance — ${days} dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`
            : 'Seu trial encerrou hoje'}
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Link
          to="/Pricing"
          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors
            ${isUrgent
              ? 'bg-[hsl(var(--err))] text-white hover:bg-[hsl(var(--err)/0.88)]'
              : 'bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand)/0.88)]'
            }`}
        >
          Assinar agora
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}