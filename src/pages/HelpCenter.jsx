import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GuideCard from '@/components/content/GuideCard';
import { BookOpen, Dumbbell, UtensilsCrossed, Target, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

const GUIDES = {
  'getting-started': [
    {
      title: 'Primeiros Passos',
      excerpt: 'Começar com Atlas Core — criar conta, onboarding básico e configurar perfil.',
      readingTime: 5,
      icon: BookOpen,
      href: '/guides/getting-started',
      category: 'Onboarding',
    },
    {
      title: 'Entender o Dashboard',
      excerpt: 'Tour guiado pelo dashboard — onde encontrar cada recurso e como usá-lo.',
      readingTime: 6,
      icon: Brain,
      href: '/guides/dashboard-tour',
      category: 'Onboarding',
    },
  ],
  'tracking': [
    {
      title: 'Logging de Treinos',
      excerpt: 'Guia completo para registrar exercícios, séries, repetições e progresso.',
      readingTime: 8,
      icon: Dumbbell,
      href: '/guides/workout-logging',
      category: 'Treino',
    },
    {
      title: 'Rastreamento Nutricional',
      excerpt: 'Como registrar refeições, calcular macros e aderir ao seu plano alimentar.',
      readingTime: 9,
      icon: UtensilsCrossed,
      href: '/guides/nutrition-tracking',
      category: 'Nutrição',
    },
    {
      title: 'Plano vs Execução',
      excerpt: 'Comparar o que você planejou vs o que realmente executou — entender aderência.',
      readingTime: 7,
      icon: Target,
      href: '/guides/plan-vs-execution',
      category: 'Análise',
    },
  ],
  'features': [
    {
      title: 'Atlas AI — seu Coach Pessoal',
      excerpt: 'Como usar a IA para análises, recomendações e insights personalizados.',
      readingTime: 10,
      icon: Brain,
      href: '/guides/atlas-ai',
      category: 'IA & Análise',
    },
    {
      title: 'Medições e Progresso',
      excerpt: 'Registrar peso, gordura corporal e visualizar progresso ao longo do tempo.',
      readingTime: 6,
      icon: Target,
      href: '/guides/measurements',
      category: 'Rastreamento',
    },
  ],
};

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[hsl(var(--card-hi))] to-[hsl(var(--card))] border-b border-[hsl(var(--border-h))]">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-[hsl(var(--fg))]">
            Help Center
          </h1>
          <p className="text-[16px] text-[hsl(var(--fg-2))] max-w-2xl">
            Aprenda a usar Atlas Core com guias detalhados, tutoriais e melhorias práticas.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
        <Tabs defaultValue="getting-started" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--shell))] p-1 rounded-lg">
            <TabsTrigger value="getting-started" className="text-[12px] font-medium h-9">
              Início
            </TabsTrigger>
            <TabsTrigger value="tracking" className="text-[12px] font-medium h-9">
              Rastreamento
            </TabsTrigger>
            <TabsTrigger value="features" className="text-[12px] font-medium h-9">
              Recursos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-3">
            {GUIDES['getting-started'].map((guide) => (
              <GuideCard key={guide.href} {...guide} />
            ))}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-3">
            {GUIDES['tracking'].map((guide) => (
              <GuideCard key={guide.href} {...guide} />
            ))}
          </TabsContent>

          <TabsContent value="features" className="space-y-3">
            {GUIDES['features'].map((guide) => (
              <GuideCard key={guide.href} {...guide} />
            ))}
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mt-16 pt-16 border-t border-[hsl(var(--border-h))]">
          <h2 className="text-2xl font-bold mb-8">Perguntas Frequentes</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: 'Quanto custa Atlas Core?',
                a: 'Atlas Core oferece planos desde gratuito até profissional. Veja nossa página de Preços para mais detalhes.'
              },
              {
                q: 'Posso sincronizar com wearables?',
                a: 'Atualmente suportamos registro manual. Integrações com Apple Health e Google Fit estão no roadmap.'
              },
              {
                q: 'Como exportar meus dados?',
                a: 'Você pode exportar seus dados em PDF ou CSV a partir da página de Exportação.'
              },
              {
                q: 'Qual é a política de privacidade?',
                a: 'Seus dados são criptografados e nunca compartilhados. Veja nossa Política de Privacidade completa.'
              },
            ].map((item, i) => (
              <div key={i} className="surface p-4">
                <p className="font-semibold text-[13px] mb-2 text-[hsl(var(--fg))]">{item.q}</p>
                <p className="text-[13px] text-[hsl(var(--fg-2))]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-[13px] text-[hsl(var(--fg-2))] mb-4">Ainda tem dúvidas?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:support@atlascore.com" className="btn btn-secondary text-[13px]">
              Enviar Email
            </a>
            <Link to="/" className="btn btn-ghost text-[13px]">
              Voltar para Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}