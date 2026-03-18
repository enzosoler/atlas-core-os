import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChevronRight } from 'lucide-react';

export default function AIInsight() {
  return (
    <Link to="/AtlasAI"
      className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-[hsl(var(--primary)/0.3)] transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
        <Brain className="w-5 h-5 text-[hsl(var(--primary))]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold">Atlas AI</p>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
          Seu copiloto contextual. Registre dados para insights personalizados.
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-[hsl(var(--primary))] transition-colors" strokeWidth={2} />
    </Link>
  );
}