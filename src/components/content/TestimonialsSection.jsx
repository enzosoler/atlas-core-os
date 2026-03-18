import React from 'react';
import { Star } from 'lucide-react';

/**
 * TestimonialsSection — seção de reviews/depoimentos para landing
 */
export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Marcus Silva',
      role: 'Atleta Competitivo',
      rating: 5,
      text: 'Atlas Core transformou meu treino. Pela primeira vez vejo realmente meu progresso — comparar treinos de 6 meses atrás vs hoje é incrível. Ganho consistente de força.',
      avatar: '👨‍💼',
    },
    {
      name: 'Ana Martins',
      role: 'Personal Trainer',
      rating: 5,
      text: 'Como coach, Atlas é um game-changer. Vejo dados dos meus alunos em tempo real, sei quem está aderindo, quem precisa de ajuste. Relatórios em PDF impressionam meus clientes.',
      avatar: '👩‍🏫',
    },
    {
      name: 'Dr. Carlos Rocha',
      role: 'Nutricionista',
      rating: 5,
      text: 'Atlas me permite prescrever com precisão e acompanhar. Os gráficos de Plan vs Execution revelam comportamentos que conversas não mostram. Clientes adoram a clareza.',
      avatar: '👨‍⚕️',
    },
    {
      name: 'Juliana Costa',
      role: 'Fitness Enthusiast',
      rating: 5,
      text: 'Simples, mas poderoso. Não preciso de 10 apps — Atlas integra tudo. Check-ins, treino, nutrição, análise. O Atlas AI me dá insights que nunca teria visto sozinha.',
      avatar: '👩‍💻',
    },
  ];

  return (
    <div className="py-16 lg:py-24 border-t border-[hsl(var(--border-h))]">
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--brand))] mb-2">
            Confiam em Atlas Core
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-[hsl(var(--fg))]">
            O que nossos usuários dizem
          </h2>
          <p className="text-[16px] text-[hsl(var(--fg-2))] max-w-2xl mx-auto">
            Atletas, coaches, nutricionistas e clínicos compartilham como Atlas Core transformou seus treinos e resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.name}
              className="surface p-6 space-y-4 hover:border-[hsl(var(--brand)/0.3)] transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4 fill-[hsl(var(--warn))] text-[hsl(var(--warn))]" 
                    strokeWidth={0}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[14px] leading-relaxed text-[hsl(var(--fg-2))]">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[hsl(var(--border-h))]">
                <div className="text-2xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold text-[13px] text-[hsl(var(--fg))]">
                    {testimonial.name}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--fg-2))]">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-16 border-t border-[hsl(var(--border-h))]">
          <p className="text-center text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-8">
            Usado por atletas e profissionais em todo Brasil
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🏋️', label: '5,000+\nAtletas' },
              { icon: '👨‍🏫', label: '800+\nCoaches' },
              { icon: '🥗', label: '500+\nNutricionistas' },
              { icon: '⭐', label: '4.9/5\nRating' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-3xl">{stat.icon}</p>
                <p className="text-[11px] font-semibold text-[hsl(var(--fg-2))] whitespace-pre-line">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}