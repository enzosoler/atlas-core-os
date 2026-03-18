import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import AtlasCoreLogoSVG from '@/components/AtlasCoreLogoSVG';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ChevronRight, Check, ArrowRight,
  Dumbbell, UtensilsCrossed, FlaskConical, BarChart3,
  Brain, Package, AlertCircle, CheckCircle, Zap,
  Users, User, Stethoscope, X, TrendingUp,
} from 'lucide-react';

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }),
};

const ROLE_HOME = { athlete: '/Today', coach: '/coach-dashboard', nutritionist: '/nutritionist-dashboard', clinician: '/clinician-dashboard', admin: '/AdminPanel' };

const handleSignUp = () => window.location.href = '/auth?mode=signup';
const handleLogin = () => window.location.href = '/auth?mode=login';

const handlePlanClick = (planId) => {
  if (planId === 'free' || !planId) {
    window.location.href = '/auth?mode=signup';
    return;
  }
  if (window.self !== window.top) {
    alert('O checkout só funciona no app publicado. Acesse a URL pública para assinar.');
    return;
  }
  sessionStorage.setItem('pending_plan', planId);
  window.location.href = `/auth?mode=signup&next=/Pricing`;
};

// ── Mock "Today" screen card ──
function TodayMock() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Shadow */}
      <div className="absolute -inset-3 bg-gradient-to-b from-[#3B82F6]/20 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      {/* Light mode card */}
      <div className="relative rounded-2xl border border-[#111827]/[0.08] bg-white overflow-hidden shadow-xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#111827]/[0.08] bg-gradient-to-r from-[#FBFCFE] to-white">
          <div>
            <p className="text-[10px] text-[#98A2B3] mb-0.5">Domingo, 16 de março</p>
            <p className="text-[13px] font-semibold text-[#111827]">Bom dia, Ana 👋</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#7C6CF2]/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-[#7C6CF2]" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* Action needed */}
          <div className="rounded-xl bg-[#EEF2F7]/50 border border-[#111827]/[0.08] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#667085] mb-2">Ação necessária</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#DC2626]/[0.08] border border-[#DC2626]/[0.15]">
                <AlertCircle className="w-3 h-3 text-[#DC2626] shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#111827]">Treino Lower A — hoje</p>
                  <p className="text-[9px] text-[#667085]">5 exercícios · 45 min</p>
                </div>
                <ChevronRight className="w-3 h-3 text-[#667085]/40 shrink-0" />
              </div>
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#F59E0B]/[0.08] border border-[#F59E0B]/[0.15]">
                <Package className="w-3 h-3 text-[#F59E0B] shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#111827]">Creatina — 5 dias</p>
                  <p className="text-[9px] text-[#667085]">Reabastecer estoque</p>
                </div>
                <ChevronRight className="w-3 h-3 text-[#667085]/40 shrink-0" />
              </div>
            </div>
          </div>

          {/* Nutrition + Workout row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-[#FBFCFE] to-white border border-[#111827]/[0.08] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#667085] mb-1.5">Nutrição</p>
              <p className="text-[18px] font-bold text-[#111827] leading-none">1.620</p>
              <p className="text-[9px] text-[#667085] mb-2">/ 2.200 kcal</p>
              <div className="h-1 rounded-full bg-[#111827]/[0.08] overflow-hidden">
                <div className="h-full rounded-full bg-[#3B82F6] w-[74%]" />
              </div>
              <div className="flex gap-2 mt-2 text-[8px] text-[#667085]">
                <span>P <b className="text-[#111827] font-semibold">138g</b></span>
                <span>C <b className="text-[#111827] font-semibold">220g</b></span>
                <span>G <b className="text-[#111827] font-semibold">48g</b></span>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#FBFCFE] to-white border border-[#111827]/[0.08] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#667085] mb-1.5">Treino</p>
              <p className="text-[13px] font-semibold text-[#111827] leading-tight">Lower A</p>
              <p className="text-[9px] text-[#667085] mb-2">Pernas e glúteos</p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#B45309] text-[8px] font-medium border border-[#F59E0B]/20">
                Pendente
              </span>
            </div>
          </div>

          {/* Adherence */}
          <div className="rounded-xl bg-gradient-to-br from-[#FBFCFE] to-white border border-[#111827]/[0.08] p-3 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg width="40" height="40" className="-rotate-90">
                <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(17, 24, 39, 0.08)" strokeWidth="3" />
                <circle cx="20" cy="20" r="14" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={88} strokeDashoffset={88 * 0.22} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#111827]">78</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#111827]">Aderência ótima</p>
              <p className="text-[9px] text-[#667085]">Treino, nutrição e sono em dia</p>
            </div>
          </div>

          {/* AI insight */}
          <div className="rounded-xl bg-[#7C6CF2]/[0.06] border border-[#7C6CF2]/[0.15] p-3 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#7C6CF2]/[0.12] flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-3 h-3 text-[#7C6CF2]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#7C6CF2] mb-0.5">Atlas AI</p>
              <p className="text-[10px] text-[#667085] leading-relaxed">Padrão consistente: treinos leves aos domingos melhoram a recuperação em 15%. Continue assim!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dinâmic content from translations — no hardcoding
const getContent = (t) => ({
  chaos: [
    { icon: Dumbbell, label: t('landing.problem.items.workout'), where: t('landing.problem.items.workoutWhere') },
    { icon: UtensilsCrossed, label: t('landing.problem.items.diet'), where: t('landing.problem.items.dietWhere') },
    { icon: FlaskConical, label: t('landing.problem.items.labs'), where: t('landing.problem.items.labsWhere') },
    { icon: BarChart3, label: t('landing.problem.items.measurements'), where: t('landing.problem.items.measurementsWhere') },
    { icon: Package, label: t('landing.problem.items.protocols'), where: t('landing.problem.items.protocolsWhere') },
    { icon: Brain, label: t('landing.problem.items.history'), where: t('landing.problem.items.historyWhere') },
  ],
  gains: [
    { icon: CheckCircle, key: 'dashboard' },
    { icon: BarChart3, key: 'data' },
    { icon: Zap, key: 'score' },
    { icon: TrendingUp, key: 'trends' },
    { icon: Brain, key: 'ai' },
    { icon: Users, key: 'team' },
  ].map(g => ({ icon: g.icon, title: t(`landing.solution.gains.${g.key}.title`), desc: t(`landing.solution.gains.${g.key}.desc`) })),
  forWho: [
    { key: 'athlete', icon: User },
    { key: 'coach', icon: Users },
    { key: 'nutritionist', icon: Users },
    { key: 'clinician', icon: Stethoscope },
  ].map(w => ({
    icon: w.icon,
    title: t(`landing.forWho.${w.key}.title`),
    desc: t(`landing.forWho.${w.key}.desc`),
    items: t(`landing.forWho.${w.key}.features`),
  })),
  system: t('landing.system.items'),
  faq: t('landing.faq.items'),
});

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const content = getContent(t);
  const CHAOS_ITEMS = content.chaos;
  const GAINS = content.gains;
  const FOR_WHO = content.forWho;

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      pitch: 'Registrar e começar.',
      price: 'Grátis',
      popular: false,
      features: ['Today básico', 'Diário de treino e nutrição', 'Registro de medidas', 'Atlas AI limitada'],
      missing: ['Geração por IA', 'Exames laboratoriais', 'Fotos de progresso', 'Analytics avançados'],
      cta: 'Criar conta grátis',
    },
    {
      id: 'athlete_pro',
      name: 'Pro',
      pitch: 'Usar de verdade no dia a dia.',
      price: 'R$ 29',
      popular: true,
      features: ['Tudo do Free', 'Geração de dieta por IA', 'Geração de treino por IA', 'Exames laboratoriais', 'Fotos de progresso', 'Analytics completos', 'Export PDF e CSV'],
      missing: [],
      cta: 'Assinar Pro',
    },
    {
      id: 'athlete_performance',
      name: 'Performance',
      pitch: 'Hub central da sua rotina.',
      price: 'R$ 59',
      popular: false,
      features: ['Tudo do Pro', 'Protocolo inteligente completo', 'Relatórios premium', 'Histórico ilimitado', 'Atlas AI avançada'],
      missing: [],
      cta: 'Assinar Performance',
    },
  ];

  const FAQ = [
    { q: 'Preciso de cartão para começar?', a: 'Não. O plano Free é permanentemente gratuito. Nos planos pagos, você tem 7 dias de trial sem cobrança.' },
    { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multa, sem burocracia. Cancele pelo app ou entre em contato.' },
    { q: 'Meus dados ficam salvos no cancelamento?', a: 'Sim. Seu histórico fica disponível no plano Free após cancelar um plano pago.' },
    { q: 'O app funciona para profissionais de saúde?', a: 'Sim. Temos planos específicos para coaches, nutricionistas e clínicos com dashboards dedicados.' },
    { q: 'Posso usar em vários dispositivos?', a: 'Sim. O Atlas Core é um webapp que funciona em qualquer dispositivo com navegador.' },
  ];

  useEffect(() => {
    window.addEventListener('languageChanged', () => window.location.reload());
    return () => window.removeEventListener('languageChanged', () => {});
  }, []);

  const handleEnter = () => {
    if (isAuthenticated && user) {
      navigate(ROLE_HOME[user.atlas_role] || '/Today');
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] overflow-x-hidden" style={{ colorScheme: 'light' }}>

      {/* ── Nav (iOS style) ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#D5D5D7]"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AtlasCoreLogoSVG width={28} height={28} />
            <span className="text-[16px] font-semibold tracking-tight text-[#1D1D1D]">Atlas Core</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[15px]">
            {[['#solution', t('landing.nav.howItWorks')], ['#pricing', t('landing.nav.pricing')], ['#faq', t('landing.nav.faq')]].map(([href, label]) => (
              <a key={href} href={href} className="text-[#86868B] hover:text-[#1D1D1D] transition-colors font-medium">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-2 py-1 text-[13px] rounded border border-[#D5D5D7] bg-white text-[#1D1D1D]">
              <option value="pt-BR">PT</option>
              <option value="en-US">EN</option>
            </select>
            <button onClick={handleLogin} className="px-4 py-2 text-[15px] text-[#3B82F6] hover:text-[#2563EB] transition-colors font-semibold">
              {t('landing.nav.login')}
            </button>
            <button onClick={handleSignUp} className="px-5 py-2 bg-[#3B82F6] text-white text-[15px] font-semibold rounded-lg hover:bg-[#2563EB] transition-colors">
              {t('landing.nav.signup')}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ 1. HERO ══ */}
      <section className="relative pt-32 pb-16 px-5 min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Minimal background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-40 right-0 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)' }} />
        </div>

        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="relative text-center max-w-4xl mx-auto">

          <motion.div variants={fade} custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D5D5D7] text-[#3B82F6] text-[13px] mb-8 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1 variants={fade} custom={1}
            className="text-[48px] md:text-[64px] font-bold tracking-[-1px] leading-[1.1] mb-6 text-[#1D1D1D] whitespace-pre-line">
            {t('landing.hero.title')}
          </motion.h1>

          <motion.p variants={fade} custom={2}
            className="text-[17px] text-[#86868B] leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* 3 simple truths */}
          <motion.div variants={fade} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[13px] text-[#86868B] mb-12">
            {[t('landing.hero.benefit1'), t('landing.hero.benefit2'), t('landing.hero.benefit3')].map(b => (
              <span key={b} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3B82F6]" strokeWidth={3} /> {b}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fade} custom={4} className="flex items-center justify-center gap-3 mb-16 flex-wrap">
            <button onClick={handleSignUp} className="px-7 py-3 bg-[#3B82F6] text-white text-[16px] font-semibold rounded-xl hover:bg-[#2563EB] transition-colors flex items-center gap-2.5">
              {t('landing.hero.cta')} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <a href="#solution">
              <button className="px-7 py-3 text-[#1D1D1D] text-[16px] font-semibold border border-[#D5D5D7] rounded-xl hover:bg-[#F5F5F7] transition-colors">
                {t('landing.hero.learnMore')}
              </button>
            </a>
          </motion.div>

          {/* Product mock */}
          <motion.div variants={fade} custom={5}>
            <TodayMock />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ 2. O PROBLEMA ══ */}
      <section id="pain" className="py-20 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="max-w-4xl mx-auto">
          <motion.div variants={fade} className="text-center mb-12">
            <p className="text-[13px] text-[#3B82F6] uppercase tracking-[0.5px] mb-3 font-semibold">O Problema</p>
            <h2 className="text-[36px] md:text-[44px] font-bold tracking-[-0.5px] mb-4 text-[#1D1D1D]">
              Tudo espalhado<br />por toda parte.
            </h2>
            <p className="text-[17px] text-[#86868B] max-w-2xl mx-auto leading-relaxed">
              Treino em um app, dieta em outro, exames em PDF, medidas em fotos. Seu histórico? Em lugar nenhum. Você nunca sabe se realmente evoluiu.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CHAOS_ITEMS.map((item, i) => (
              <motion.div key={i} variants={fade} custom={i}
                className="p-4 rounded-[12px] border border-[#D5D5D7] bg-[#F5F5F7] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8E8ED] flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#86868B]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1D1D1D]">{item.label}</p>
                  <p className="text-[11px] text-[#A1A1A6] mt-0.5">{item.where}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 3. SOLUÇÃO ══ */}
      <section id="solution" className="py-28 px-5 border-t border-[#111827]/[0.08]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="max-w-4xl mx-auto text-center">
          <motion.p variants={fade} className="text-[12px] text-[#3B82F6] uppercase tracking-widest mb-3 font-bold">A solução real</motion.p>
          <motion.h2 variants={fade} className="text-[40px] md:text-[48px] font-bold tracking-tight mb-4 text-[#111827]">
            Centralizar tudo muda<br />
            <span className="text-[#3B82F6]">como você vê a evolução.</span>
          </motion.h2>
          <motion.p variants={fade} className="text-[17px] text-[#475569] max-w-2xl mx-auto mb-16 leading-relaxed">
            O Atlas Core não é um app a mais. É o sistema operacional que junta treino, nutrição, exames, medidas e protocolos em uma visão única. Com histórico real. Com contexto. Com dados que realmente importam.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            {GAINS.map((g, i) => (
              <motion.div key={i} variants={fade} custom={i}
                className="p-5 rounded-2xl border border-[#111827]/[0.08] bg-[#FBFCFE] flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2F7] flex items-center justify-center shrink-0">
                  <g.icon className="w-4.5 h-4.5 text-[#3B82F6]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111827] mb-1">{g.title}</p>
                  <p className="text-[13px] text-[#667085] leading-relaxed">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 4. PARA QUEM É ══ */}
      <section id="for-who" className="py-20 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="max-w-5xl mx-auto">
          <motion.div variants={fade} className="text-center mb-12">
            <p className="text-[13px] text-[#3B82F6] uppercase tracking-[0.5px] mb-3 font-semibold">Para Quem É</p>
            <h2 className="text-[36px] md:text-[44px] font-bold tracking-[-0.5px] mb-4 text-[#1D1D1D]">Feito para quem quer<br />dados que não mentem.</h2>
            <p className="text-[17px] text-[#86868B]">Se você mede progresso em dados, não em sensação. Se você quer saber exatamente o que funcionou.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {FOR_WHO.map((w, i) => (
              <motion.div key={i} variants={fade} custom={i}
                className="p-6 rounded-[12px] border border-[#D5D5D7] bg-[#F5F5F7]">
                <div className="w-10 h-10 rounded-lg bg-[#E8E8ED] flex items-center justify-center mb-4">
                  <w.icon className="w-5 h-5 text-[#86868B]" strokeWidth={2} />
                </div>
                <p className="text-[15px] font-semibold mb-2 text-[#1D1D1D]">{w.title}</p>
                <p className="text-[13px] text-[#86868B] leading-relaxed mb-4">{w.desc}</p>
                <ul className="space-y-1.5">
                  {w.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-[12px] text-[#86868B]">
                      <Check className="w-3 h-3 text-[#3B82F6] shrink-0" strokeWidth={2.5} /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 5. NÃO É GENÉRICO ══ */}
      <section className="py-16 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fade} className="text-[32px] md:text-[40px] font-bold tracking-[-0.5px] mb-8 text-[#1D1D1D]">
            Não é só treino.<br />
            <span className="text-[#86868B]">É sistema completo.</span>
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ['Treino só', 'Treino + recuperação + aderência'],
              ['Dieta só', 'Dieta + protocolo + contexto'],
              ['Exames só', 'Exames + histórico + tendências'],
              ['IA genérica', 'IA com seus dados reais'],
              ['Acompanhamento só', 'Histórico compartilhado com profissional'],
              ['App bonito só', 'Sistema que resolve caos'],
            ].map(([title, sub], i) => (
              <motion.div key={i} variants={fade} custom={i}
                className="p-4 rounded-[12px] border border-[#D5D5D7] bg-[#F5F5F7] text-left">
                <div className="flex items-start gap-2 mb-1">
                  <X className="w-3 h-3 text-[#A1A1A6] shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[11px] text-[#A1A1A6] line-through">{title}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-[#3B82F6] shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[11px] text-[#1D1D1D] font-medium">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 6. PRICING ══ */}
      <section id="pricing" className="py-20 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="max-w-5xl mx-auto">
          <motion.div variants={fade} className="text-center mb-12">
            <p className="text-[13px] text-[#3B82F6] uppercase tracking-[0.5px] mb-3 font-semibold">Planos</p>
            <h2 className="text-[36px] md:text-[44px] font-bold tracking-[-0.5px] mb-4 text-[#1D1D1D]">Comece grátis,<br />evolua se quiser.</h2>
            <p className="text-[17px] text-[#86868B]">Sem cartão. Sem compromisso. 7 dias grátis nos pagos. Cancele quando quiser.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <motion.div key={i} variants={fade} custom={i}
                className={`relative p-6 rounded-[12px] border transition-all
                  ${plan.popular ? 'border-[#3B82F6] bg-white shadow-md' : 'border-[#D5D5D7] bg-[#F5F5F7]'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#3B82F6] text-white text-[10px] font-semibold rounded-full">
                    Popular
                  </span>
                )}
                <p className="text-[12px] text-[#86868B] font-medium uppercase tracking-[0.5px] mb-1">{plan.name}</p>
                <p className="text-[13px] text-[#86868B] mb-4">{plan.pitch}</p>
                <div className="mb-6">
                  <span className="text-[36px] font-bold text-[#1D1D1D]">{plan.price}</span>
                  {plan.price !== 'Grátis' && <span className="text-[#86868B] text-[13px] ml-1">/mês</span>}
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-[13px] text-[#1D1D1D]">
                      <Check className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                  {plan.missing.map((f, j) => (
                    <li key={`m-${j}`} className="flex items-center gap-2 text-[13px] text-[#A1A1A6] line-through">
                      <X className="w-3.5 h-3.5 text-[#D5D5D7] shrink-0" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handlePlanClick(plan.id)} className={`w-full h-11 rounded-lg text-[13px] font-semibold transition-colors
                  ${plan.popular ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]' : 'border border-[#D5D5D7] text-[#1D1D1D] hover:bg-white'}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 7. FAQ ══ */}
      <section id="faq" className="py-20 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="max-w-3xl mx-auto">
          <motion.div variants={fade} className="text-center mb-12">
            <p className="text-[13px] text-[#3B82F6] uppercase tracking-[0.5px] mb-3 font-semibold">FAQ</p>
            <h2 className="text-[36px] md:text-[44px] font-bold tracking-[-0.5px] text-[#1D1D1D]">Perguntas frequentes</h2>
          </motion.div>
          <div className="space-y-1">
            {FAQ.map((faq, i) => (
              <motion.div key={i} variants={fade} custom={i}
                className="border border-[#D5D5D7] rounded-lg overflow-hidden hover:border-[#3B82F6]/40 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F5F5F7] transition-colors">
                  <span className="text-[15px] font-medium text-[#1D1D1D] pr-8">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-[#3B82F6] shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`} strokeWidth={2} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 bg-[#F5F5F7] border-t border-[#D5D5D7]">
                    <p className="text-[14px] text-[#86868B] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 8. CTA FINAL ══ */}
      <section className="py-24 px-5 border-t border-[#D5D5D7]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="text-center max-w-2xl mx-auto">
          <motion.h2 variants={fade} className="text-[40px] md:text-[50px] font-bold tracking-[-1px] mb-6 leading-tight text-[#1D1D1D]">
            Você pode<br />
            <span className="text-[#3B82F6]">ver a evolução.</span>
          </motion.h2>
          <motion.p variants={fade} className="text-[17px] text-[#86868B] mb-10 leading-relaxed">
            Crie sua conta grátis. Em 2 minutos, seu primeiro dashboard está rodando.
          </motion.p>
          <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={handleSignUp} className="px-8 py-3.5 bg-[#3B82F6] text-white text-[16px] font-semibold rounded-xl hover:bg-[#2563EB] transition-colors inline-flex items-center gap-2">
              Começar grátis <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </motion.div>
          <motion.p variants={fade} className="text-[13px] text-[#A1A1A6] mt-6">
            Sem cartão · Sem compromisso · Histórico grátis forever
          </motion.p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D5D5D7] py-8 px-5 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AtlasCoreLogoSVG width={20} height={20} />
            <span className="text-[13px] font-semibold text-[#1D1D1D]">Atlas Core</span>
          </div>
          <p className="text-[12px] text-[#A1A1A6]">© 2026 Atlas Core. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}