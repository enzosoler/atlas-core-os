import { GitPullRequest, GitMerge, GitBranch, Clock, User, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATE_CONFIG = {
  open: { label: 'Aberto', color: 'badge-blue', icon: GitPullRequest },
  closed_merged: { label: 'Merged', color: 'badge-ok', icon: GitMerge },
  closed: { label: 'Fechado', color: 'badge-neutral', icon: GitPullRequest },
  draft: { label: 'Draft', color: 'badge-neutral', icon: GitPullRequest },
};

export default function PRCard({ pr }) {
  const stateKey = pr.draft ? 'draft' : pr.merged_at ? 'closed_merged' : pr.state;
  const cfg = STATE_CONFIG[stateKey] || STATE_CONFIG.open;
  const Icon = cfg.icon;

  const timeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return date;
    }
  };

  return (
    <div className="surface p-4 hover:border-[hsl(var(--brand)/0.3)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
            ${pr.draft ? 'bg-[hsl(var(--shell))]' : pr.merged_at ? 'bg-[hsl(var(--ok)/0.1)]' : pr.state === 'open' ? 'bg-[hsl(var(--brand)/0.1)]' : 'bg-[hsl(var(--shell))]'}`}>
            <Icon className={`w-4 h-4
              ${pr.merged_at ? 'text-[hsl(var(--ok))]' : pr.state === 'open' && !pr.draft ? 'text-[hsl(var(--brand))]' : 'text-[hsl(var(--fg-2))]'}`}
              strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge ${cfg.color}`}>{cfg.label}</span>
              {pr.labels.map((l) => (
                <span key={l.name} className="badge badge-neutral text-[10px]"
                  style={{ borderColor: `#${l.color}30`, color: `#${l.color}`, background: `#${l.color}15` }}>
                  {l.name}
                </span>
              ))}
            </div>
            <p className="text-[13px] font-semibold text-[hsl(var(--fg))] leading-snug">{pr.title}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--fg-2))]">
                <GitBranch className="w-3 h-3" /> {pr.branch} → {pr.base_branch}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--fg-2))]">
                <User className="w-3 h-3" /> {pr.author}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--fg-2))]">
                <Clock className="w-3 h-3" /> {timeAgo(pr.updated_at)}
              </span>
            </div>
            {pr.body && (
              <p className="text-[11px] text-[hsl(var(--fg-2))] mt-1.5 line-clamp-2">{pr.body}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[hsl(var(--fg-2))] font-mono">#{pr.number}</span>
          <a href={pr.url} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2))] hover:text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.07)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}