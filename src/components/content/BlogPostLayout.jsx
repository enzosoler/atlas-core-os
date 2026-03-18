import React from 'react';
import { ChevronLeft, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * BlogPostLayout — wrapper para artigos de blog/guides com metadata
 */
export default function BlogPostLayout({ 
  title, 
  excerpt, 
  publishedAt, 
  readingTime, 
  author, 
  children,
  breadcrumb
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[hsl(var(--card-hi))] to-[hsl(var(--card))] border-b border-[hsl(var(--border-h))]">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
          {breadcrumb && (
            <Link to={breadcrumb.href} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-4 transition-colors">
              <ChevronLeft className="w-3 h-3" /> {breadcrumb.label}
            </Link>
          )}
          
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-[hsl(var(--fg))]">
            {title}
          </h1>
          
          {excerpt && (
            <p className="text-[16px] text-[hsl(var(--fg-2))] mb-6 leading-relaxed">
              {excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-6 text-[12px] text-[hsl(var(--fg-2))]">
            {publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(publishedAt).toLocaleDateString('pt-BR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}
            {readingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {readingTime} min de leitura
              </div>
            )}
            {author && (
              <div className="text-[11px]">Por <span className="font-semibold">{author}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
        <article className="prose prose-sm max-w-none [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:text-[15px] [&>p]:leading-relaxed [&>p]:mb-4 [&>li]:text-[15px] [&>li]:leading-relaxed [&>blockquote]:border-l-4 [&>blockquote]:border-[hsl(var(--brand))] [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:bg-[hsl(var(--brand)/0.05)] [&>pre]:bg-[hsl(var(--shell))] [&>pre]:p-4 [&>pre]:rounded-lg [&>code]:text-[13px] [&>code]:font-mono">
          {children}
        </article>
      </div>
    </div>
  );
}