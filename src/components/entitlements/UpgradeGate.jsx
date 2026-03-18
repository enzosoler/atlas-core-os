import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';

/**
 * UpgradeGate — blocks premium features for free users
 * Also shows trial expired message if applicable
 * 
 * Usage:
 * <UpgradeGate feature="atlas_ai" plan="Pro">
 *   <YourComponent />
 * </UpgradeGate>
 */
export default function UpgradeGate({ feature, plan = 'Pro', children, title, description }) {
  const { can, isTrialExpired } = useSubscription();

  if (can(feature)) {
    return children;
  }

  const planNames = {
    Pro: 'Plano Pro',
    Performance: 'Plano Performance',
    Coach: 'Plano Coach',
    Nutrition: 'Plano Nutricionista',
    Clinical: 'Plano Clínico',
  };

  const featureNames = {
    atlas_ai: 'Atlas AI',
    lab_exams: 'Exames Laboratoriais',
    progress_photos: 'Fotos de Progresso',
    ai_diet_generation: 'Geração de Dieta por IA',
    ai_workout_generation: 'Geração de Treino por IA',
    advanced_protocol_tracking: 'Protocolo Avançado',
    premium_exports: 'Exportação Premium',
    standard_exports: 'Exportação de Relatórios',
  };

  const featureName = featureNames[feature] || 'Este recurso';
  const planName = planNames[plan] || plan;

  // Show trial expired message if trial is expired
  if (isTrialExpired) {
    return (
      <div className="rounded-2xl border border-[hsl(var(--err)/0.3)] bg-gradient-to-r from-[hsl(var(--err)/0.08)] to-[hsl(var(--err)/0.03)] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[hsl(var(--err)/0.12)] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-[hsl(var(--err))]" strokeWidth={2} />
        </div>
        
        <div>
          <p className="text-[14px] font-semibold text-[hsl(var(--fg))] mb-1">
            Trial de {featureName} encerrou
          </p>
          <p className="text-[13px] text-[hsl(var(--fg-2))]">
            Continue com {planName} para seguir usando.
          </p>
        </div>

        <Link to="/Pricing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(var(--err))] text-white text-[13px] font-semibold hover:bg-[hsl(var(--err)/0.88)] transition-colors">
          Continuar assinatura <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand)/0.05)] p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-[hsl(var(--brand))]" strokeWidth={2} />
      </div>
      
      <div>
        <p className="text-[14px] font-semibold text-[hsl(var(--fg))] mb-1">
          {title || `${featureName} — ${planName}+`}
        </p>
        <p className="text-[13px] text-[hsl(var(--fg-2))]">
          {description || 'Upgrade para desbloquear este recurso'}
        </p>
      </div>

      <Link to="/Pricing"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--brand))] text-white text-[13px] font-semibold hover:bg-[hsl(var(--brand)/0.88)] transition-colors">
        Ver planos <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}