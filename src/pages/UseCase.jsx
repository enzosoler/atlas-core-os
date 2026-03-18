import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Zap, Target, BarChart3, UtensilsCrossed } from 'lucide-react';

const USE_CASES = {
  athlete: {
    title: 'Para Atletas & Entusiastas Fitness',
    heroSubtitle: 'Rastreie treinos, nutrição e progresso com precisão profissional.',
    features: [
      {
        icon: Target,
        title: 'Logging Detalhado de Treinos',
        description: 'Registre cada série, repetição e peso. Atlas rastreia seu progresso automaticamente.',
      },
      {
        icon: UtensilsCrossed,
        title: 'Nutrição Inteligente',
        description: 'Registre refeições, acompanhe macros e veja aderência ao plano alimentar em tempo real.',
      },
      {
        icon: BarChart3,
        title: 'Análises Profundas',
        description: 'Correlações entre sono, energia, treino e resultados. Identifique padrões que funcionam.',
      },
    ],
    benefits: [
      'Histórico completo de exercícios — nunca esqueça um PR',
      'Fotos de progresso com comparação lado a lado',
      'Medições (peso, gordura, circunferência)',
      'Atlas AI para sugestões de treino e nutrição',
      'Exportações em PDF para seus registros',
    ],
    cta: 'Comece seu Rastreamento',
  },
  coach: {
    title: 'Para Coaches & Personal Trainers',
    heroSubtitle: 'Gerencie múltiplos alunos, prescreva planos, acompanhe aderência.',
    features: [
      {
        icon: Users,
        title: 'Gerenciamento de Alunos',
        description: 'Convide alunos, veja dados deles em tempo real, e acompanhe progresso.',
      },
      {
        icon: Target,
        title: 'Prescrição de Treinos',
        description: 'Crie planos de treino customizados e veja exatamente o que seus alunos estão fazendo.',
      },
      {
        icon: BarChart3,
        title: 'Aderência em Tempo Real',
        description: 'Saiba se seus alunos estão seguindo o plano — compare prescrito vs executado.',
      },
    ],
    benefits: [
      'Dashboard dedicado para coaches com 5+ alunos',
      'Alertas de baixa aderência',
      'Comparação Plano vs Execução visual',
      'Exportar relatórios de progresso em PDF',
      'Acompanhar peso, medições e progresso de força',
    ],
    cta: 'Comece a Gerenciar Alunos',
  },
  nutritionist: {
    title: 'Para Nutricionistas & Dietistas',
    heroSubtitle: 'Prescreva dietas profissionais, acompanhe aderência nutricional, exporte relatórios.',
    features: [
      {
        icon: UtensilsCrossed,
        title: 'Prescrição de Dietas',
        description: 'Crie planos alimentares com macros específicas e envie para seus clientes.',
      },
      {
        icon: BarChart3,
        title: 'Análise de Aderência',
        description: 'Visualize o que seu cliente planejou vs o que comeu. Identifique lacunas nutricionais.',
      },
      {
        icon: Target,
        title: 'Relatórios Profissionais',
        description: 'Exporte análises detalhadas, comparações de macros e progresso de peso.',
      },
    ],
    benefits: [
      'Plano Nutricionista com até 25 clientes',
      'Dashboard com alertas — baixa aderência, sem logging',
      'Gráficos Plan vs Execution',
      'Integração com medições e dados biométricos',
      'Relatórios em PDF para seus clientes',
    ],
    cta: 'Comece a Prescrever',
  },
  clinician: {
    title: 'Para Clínicos & Médicos',
    heroSubtitle: 'Monitore pacientes com detalhe — nutrição, medicações, exames laboratoriais.',
    features: [
      {
        icon: BarChart3,
        title: 'Acompanhamento de Saúde',
        description: 'Veja registros nutricionais, peso, pressão e aderência a medicações.',
      },
      {
        icon: Target,
        title: 'Histórico Integrado',
        description: 'Exames laboratoriais, protocolo de suplementação e metas de saúde em um lugar.',
      },
      {
        icon: Users,
        title: 'Comunicação Paciente',
        description: 'Envie recomendações, veja compliance e ajuste prescrições baseado em dados reais.',
      },
    ],
    benefits: [
      'Plano Clínico com até 50 pacientes',
      'Rastreamento de exames laboratoriais e tendências',
      'Aderência a protocolos de medicação e suplementação',
      'Medições e biométricos ao longo do tempo',
      'Alertas para pacientes com baixa aderência',
    ],
    cta: 'Comece o Monitoramento',
  },
};

export default function UseCase() {
  const { role } = useParams();
  const navigate = useNavigate();
  const caseData = USE_CASES[role];

  if (!caseData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[hsl(var(--fg-2))] mb-4">Use case não encontrado</p>
          <Link to="/" className="btn btn-primary">Voltar para Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[hsl(var(--brand)/0.08)] to-white border-b border-[hsl(var(--border-h))]">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-4 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Voltar
          </button>
          
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-[hsl(var(--fg))]">
            {caseData.title}
          </h1>
          
          <p className="text-[18px] text-[hsl(var(--fg-2))] max-w-2xl">
            {caseData.heroSubtitle}
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-16">
        <h2 className="text-2xl font-bold mb-8">Funcionalidades Principais</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {caseData.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--brand)/0.1)] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[hsl(var(--brand))]" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[15px] text-[hsl(var(--fg))]">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-[hsl(var(--fg-2))] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="bg-[hsl(var(--card-hi))] rounded-2xl border border-[hsl(var(--border-h))] p-8">
          <h2 className="text-2xl font-bold mb-6">Benefícios</h2>
          <ul className="space-y-3">
            {caseData.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-[14px]">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand))] mt-1.5 shrink-0" />
                <span className="text-[hsl(var(--fg-2))]">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button className="btn btn-primary mb-4 gap-2">
            <Zap className="w-4 h-4" />
            {caseData.cta}
          </button>
          <p className="text-[12px] text-[hsl(var(--fg-2))]">
            Comece grátis. Sem cartão de crédito.
          </p>
        </div>
      </div>
    </div>
  );
}