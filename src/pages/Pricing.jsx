import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18nContext';
import { base44 } from '@/api/base44Client';
import { Check, X, Loader2, Zap, Users, Stethoscope, Star, CheckCircle, Activity } from 'lucide-react';
import { useSubscription } from '@/lib/SubscriptionContext';
import { toast } from 'sonner';
import RegionSelector from '@/components/pricing/RegionSelector';
import { getRegionPricing } from '@/lib/regionalPricing';

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const ATHLETE_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Grátis',
    pitch: 'Registrar e começar.',
    icon: Activity,
    popular: false,
    features: [
      'Today básico',
      'Diário de treino e nutrição',
      'Registro de medidas',
      'Protocolos básicos',
      'Perfil e configurações',
      'Histórico limitado (30 dias)',
      'Atlas AI limitada',
    ],
    missing: [
      'Geração de dieta/treino por IA',
      'Exames laboratoriais completos',
      'Fotos de progresso',
      'Analytics avançados',
      'Export PDF/CSV',
    ],
  },
  {
    id: 'athlete_pro',
    name: 'Pro',
    price: 'R$ 29',
    pitch: 'Usar de verdade no dia a dia.',
    icon: Zap,
    popular: true,
    features: [
      'Tudo do Free',
      'Geração de dieta por IA',
      'Geração de treino por IA',
      'Plano Alimentar / Plano de Treino completos',
      'Exames laboratoriais completos',
      'Fotos de progresso ilimitadas',
      'Histórico expandido (1 ano)',
      'Analytics completos',
      'Atlas AI contextual completa',
      'Export PDF e CSV',
      'Alertas de estoque',
      'Social cards premium',
    ],
    missing: [],
  },
  {
    id: 'athlete_performance',
    name: 'Performance',
    price: 'R$ 59',
    pitch: 'Hub central da sua rotina.',
    icon: Star,
    popular: false,
    features: [
      'Tudo do Pro',
      'Protocolo inteligente completo',
      'Curva estimada de meia-vida',
      'Última e próxima dose',
      'Stock depletion avançado',
      'Relatórios premium',
      'Dashboards profundos',
      'Atlas AI avançada com resumos',
      'Exports completos',
      'Histórico ilimitado',
    ],
    missing: [],
  },
];

const PRO_PLANS = [
  {
    id: 'coach',
    name: 'Coach',
    price: 'R$ 99',
    pitch: 'Prescrição e acompanhamento de alunos.',
    icon: Users,
    features: [
      'Coach dashboard completo',
      'Lista e gestão de alunos',
      'Prescrição de treino personalizado',
      'Prescrição de dieta personalizada',
      'Acompanhamento de aderência',
      'Progresso e evolução do aluno',
      'Medidas e fotos (com permissão)',
      'Exportação de resumo',
    ],
    note: 'Por profissional · até 20 alunos',
  },
  {
    id: 'nutritionist',
    name: 'Nutricionista',
    price: 'R$ 79',
    pitch: 'Acompanhamento nutricional de clientes.',
    icon: Users,
    features: [
      'Nutritionist dashboard completo',
      'Lista e gestão de clientes',
      'Prescrição de dieta personalizada',
      'Acompanhamento de refeições',
      'Visualização de medidas e fotos',
      'Geração de dieta por IA',
      'Relatórios nutricionais',
      'Exportação de resumo',
    ],
    note: 'Por profissional · até 25 clientes',
  },
  {
    id: 'clinician',
    name: 'Clínico',
    price: 'R$ 129',
    pitch: 'Visão clínica consolidada e relatórios.',
    icon: Stethoscope,
    features: [
      'Clinician dashboard completo',
      'Lista e gestão de pacientes',
      'Histórico laboratorial completo',
      'Medidas e evolução corporal',
      'Protocolos e logs de uso',
      'Fotos de progresso (com permissão)',
      'Exports clínicos',
      'Relatórios consolidados premium',
    ],
    note: 'Por profissional · até 30 pacientes',
  },
];

function PlanCard({ plan, onSubscribe, loading, isAuthenticated, currentPlanId }) {
  const Icon = plan.icon;
  const isFree = plan.id === 'free';
  const isCurrentPlan = currentPlanId === plan.id || (isFree && !currentPlanId);

  return (
    <motion.div
      variants={fade}
      className={`relative flex flex-col p-6 rounded-2xl border transition-all
        ${plan.popular
          ? 'border-[hsl(var(--brand)/0.4)] bg-[hsl(var(--brand)/0.04)] shadow-lg shadow-[hsl(var(--brand)/0.08)]'
          : 'border-[hsl(var(--border-h))] bg-[hsl(var(--card))]'
        }`}
    >
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[hsl(var(--brand))] text-white text-[11px] font-bold rounded-full shadow">
          Mais popular
        </span>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-[hsl(var(--brand)/0.12)]' : 'bg-[hsl(var(--shell))]'}`}>
          <Icon className={`w-4.5 h-4.5 ${plan.popular ? 'text-[hsl(var(--brand))]' : 'text-[hsl(var(--fg-2))]'}`} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-bold">{plan.name}</p>
          <p className="text-[11px] text-[hsl(var(--fg-2))]">{plan.pitch}</p>
        </div>
      </div>

      <div className="mb-5">
        <span className="text-[32px] font-bold tracking-tight">{plan.price}</span>
        {!isFree && <span className="text-[13px] text-[hsl(var(--fg-2))] ml-1">/mês</span>}
        {!isFree && <p className="text-[11px] text-[hsl(var(--ok))] mt-1 font-medium">7 dias grátis</p>}
      </div>

      <ul className="space-y-1.5 mb-5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-[hsl(var(--fg))]">
            <Check className="w-3.5 h-3.5 text-[hsl(var(--ok))] shrink-0 mt-0.5" strokeWidth={2.5} />
            {f}
          </li>
        ))}
        {plan.missing?.map((f, i) => (
          <li key={`m-${i}`} className="flex items-start gap-2 text-[12px] text-[hsl(var(--fg-2))] line-through">
            <X className="w-3.5 h-3.5 text-[hsl(var(--fg-2))/0.4] shrink-0 mt-0.5" strokeWidth={2} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={loading === plan.id || (isFree && isCurrentPlan)}
        className={`w-full h-11 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2
          ${isCurrentPlan
            ? 'border border-[hsl(var(--ok)/0.4)] bg-[hsl(var(--ok)/0.07)] text-[hsl(var(--ok))] cursor-default'
            : isFree
              ? 'border border-[hsl(var(--border-h))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--shell))]'
              : plan.popular
                ? 'bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.88)] text-white shadow-sm'
                : 'border border-[hsl(var(--border-h))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--shell))]'
          }`}
      >
        {loading === plan.id
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isCurrentPlan
            ? '✓ Plano atual'
            : isFree
              ? (isAuthenticated ? 'Plano Free' : 'Criar conta grátis')
              : `Assinar ${plan.name}`
        }
      </button>
    </motion.div>
  );
}

function ProPlanCard({ plan, onSubscribe, loading, currentPlanId }) {
  const Icon = plan.icon;
  const isCurrentPlan = currentPlanId === plan.id;

  return (
    <motion.div
      variants={fade}
      className="flex flex-col p-6 rounded-2xl border border-[hsl(var(--border-h))] bg-[hsl(var(--card))]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--shell))] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[14px] font-bold">{plan.name}</p>
          <p className="text-[11px] text-[hsl(var(--fg-2))]">{plan.pitch}</p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-[32px] font-bold tracking-tight">{plan.price}</span>
        <span className="text-[13px] text-[hsl(var(--fg-2))]">/mês</span>
      </div>
      <p className="text-[11px] text-[hsl(var(--ok))] mb-1 font-medium">7 dias grátis</p>
      <p className="text-[11px] text-[hsl(var(--fg-2))] mb-5">{plan.note}</p>

      <ul className="space-y-1.5 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-[hsl(var(--fg))]">
            <Check className="w-3.5 h-3.5 text-[hsl(var(--ok))] shrink-0 mt-0.5" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isCurrentPlan && onSubscribe(plan.id)}
        disabled={loading === plan.id || isCurrentPlan}
        className={`w-full h-11 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-default
          ${isCurrentPlan
            ? 'border border-[hsl(var(--ok)/0.4)] bg-[hsl(var(--ok)/0.07)] text-[hsl(var(--ok))]'
            : 'border border-[hsl(var(--border-h))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--shell))] disabled:opacity-60'
          }`}
      >
        {loading === plan.id
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isCurrentPlan ? '✓ Plano atual' : `Assinar ${plan.name}`
        }
      </button>
    </motion.div>
  );
}

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const [region, setRegion] = useState('US');
  const { user, isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const { t: tOld, language, setLanguage } = useTranslation(); // Old hook, keep for compatibility
  const { t, locale, setLocale } = useI18n(); // New i18n
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine current plan ID from subscription
  const currentPlanId = (() => {
    if (!isAuthenticated || !subscription) return null;
    const status = subscription.status;
    if (!['active', 'trialing'].includes(status)) return null;
    const code = subscription.plan_code;
    // Map plan codes to plan IDs used in ATHLETE_PLANS / PRO_PLANS
    const map = { pro: 'athlete_pro', performance: 'athlete_performance', free: 'free', coach: 'coach', nutritionist: 'nutritionist', clinician: 'clinician' };
    return map[code] || 'free';
  })();

  // Se voltou do login com plano pendente, retomar checkout automaticamente
  useEffect(() => {
    const pendingPlan = sessionStorage.getItem('pending_plan');
    if (pendingPlan && isAuthenticated) {
      sessionStorage.removeItem('pending_plan');
      handleSubscribe(pendingPlan);
    }
  }, [isAuthenticated]);

  const handleSubscribe = async (planId) => {
    // Free: redirecionar para signup
    if (planId === 'free') {
      window.location.href = '/auth?mode=signup';
      return;
    }

    // Bloquear dentro de iframe (preview Base44)
    if (window.self !== window.top) {
      toast.error('O checkout só funciona no app publicado. Acesse a URL pública para assinar.');
      return;
    }

    // Usuário não autenticado: salvar plano e redirecionar para login
    if (!isAuthenticated) {
      sessionStorage.setItem('pending_plan', planId);
      window.location.href = `/auth?mode=signup&next=/Pricing`;
      return;
    }

    setLoading(planId);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        plan: planId,
        success_url: `${window.location.origin}/Today?subscribed=1`,
        cancel_url: `${window.location.origin}/Pricing`,
        email: user?.email,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data?.error || 'Erro ao iniciar checkout. Tente novamente.');
      }
    } catch (err) {
      toast.error('Não foi possível conectar ao servidor de pagamentos. Tente novamente.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  const pricing = getRegionPricing(region);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] p-5 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        className="text-center mb-12"
      >
        <motion.div variants={fade} className="flex items-center justify-between mb-6">
          <Link to="/Today" className="flex items-center gap-2 text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] transition-colors text-[13px]">
            {t('pricing_page.backToApp')}
          </Link>
          <div className="flex items-center gap-3">
            <RegionSelector onRegionChange={setRegion} />
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className="px-2 py-1 text-[13px] rounded border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[hsl(var(--fg))]">
              <option value="pt-BR">PT</option>
              <option value="en-US">EN</option>
            </select>
          </div>
        </motion.div>
        <motion.p variants={fade} className="t-label mb-3">{t('pricing_page.title')}</motion.p>
        <motion.h1 variants={fade} className="t-headline text-3xl md:text-4xl mb-3">
          {t('pricing_page.heading')}
        </motion.h1>
        <motion.p variants={fade} className="t-body text-[hsl(var(--fg-2))] max-w-md mx-auto">
          {t('pricing_page.subtitle')}
        </motion.p>
      </motion.div>

      {/* Athlete Plans */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.p variants={fade} className="t-label mb-4">{t('pricing_page.athlete')}</motion.p>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {ATHLETE_PLANS.map((plan, i) => (
            <motion.div key={plan.id} variants={fade} custom={i}>
              <PlanCard plan={plan} onSubscribe={handleSubscribe} loading={loading} isAuthenticated={isAuthenticated} currentPlanId={currentPlanId} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Professional Plans */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={fade} className="mb-4">
          <p className="t-label">{t('pricing_page.professional')}</p>
          <p className="text-[13px] text-[hsl(var(--fg-2))] mt-1">{t('pricing_page.professionalDesc')}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {PRO_PLANS.map((plan, i) => (
            <motion.div key={plan.id} variants={fade} custom={i}>
              <ProPlanCard plan={plan} onSubscribe={handleSubscribe} loading={loading} currentPlanId={currentPlanId} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }}
        variants={fade}
        className="text-center py-8 border-t border-[hsl(var(--border-h))]"
      >
        <p className="text-[12px] text-[hsl(var(--fg-2))]">
          {t('pricing_page.footer')}
        </p>
        <p className="text-[11px] text-[hsl(var(--fg-2))/0.6] mt-1">
          {t('pricing_page.footerPayment')}
        </p>
      </motion.div>
    </div>
  );
}