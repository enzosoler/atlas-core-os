import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * GuideCard — card para listar guides/artigos em listings
 */
export default function GuideCard({ title, excerpt, readingTime, icon: Icon, href, category }) {
  return (
    <Link 
      to={href}
      className="surface p-5 hover:border-[hsl(var(--brand)/0.3)] hover:bg-[hsl(var(--brand)/0.01)] transition-all group"
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand)/0.08)] flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--brand)/0.12)] transition-colors">
            <Icon className="w-5 h-5 text-[hsl(var(--brand))]" strokeWidth={1.5} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {category && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-1">
              {category}
            </p>
          )}
          
          <h3 className="text-[14px] font-semibold text-[hsl(var(--fg))] mb-2 group-hover:text-[hsl(var(--brand))] transition-colors">
            {title}
          </h3>
          
          <p className="text-[13px] text-[hsl(var(--fg-2))] mb-3 line-clamp-2">
            {excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--fg-2))]">
              {readingTime && (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} min
                </>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-[hsl(var(--fg-2))] group-hover:text-[hsl(var(--brand))] transition-colors" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
}