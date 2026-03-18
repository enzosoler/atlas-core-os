import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function SubscriptionBanner({ planName, onDismiss, subscription }) {
  const [dismissed, setDismissed] = useState(false);

  // Support both old API (planName) and new API (subscription object)
  const resolvedName = planName || (subscription?.plan_code
    ? subscription.plan_code.charAt(0).toUpperCase() + subscription.plan_code.slice(1)
    : null);

  // Only show if active/trialing and not dismissed
  const isVisible = !dismissed && resolvedName &&
    (!subscription || ['active', 'trialing'].includes(subscription.status));

  if (!isVisible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[hsl(var(--ok)/0.3)] bg-gradient-to-r from-[hsl(var(--ok)/0.08)] to-[hsl(var(--ok)/0.03)] p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--ok)/0.12)] flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-[hsl(var(--ok))]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[hsl(var(--ok))]">Bem-vindo ao {resolvedName}! 🎉</p>
          <p className="text-[12px] text-[hsl(var(--ok)/0.8)] mt-0.5">
            7 dias grátis. Seu plano começa a ser cobrado após o período de teste.
          </p>
        </div>
      </div>
      <button onClick={handleDismiss}
        className="p-1.5 hover:bg-[hsl(var(--ok)/0.1)] rounded-lg transition-colors shrink-0 text-[hsl(var(--ok))]">
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </motion.div>
  );
}