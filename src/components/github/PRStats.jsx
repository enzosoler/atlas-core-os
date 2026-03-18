import { GitPullRequest, GitMerge, Clock, CheckCircle } from 'lucide-react';

export default function PRStats({ prs }) {
  const open = prs.filter((p) => p.state === 'open' && !p.draft).length;
  const drafts = prs.filter((p) => p.draft).length;
  const merged = prs.filter((p) => p.merged_at).length;
  const closed = prs.filter((p) => p.state === 'closed' && !p.merged_at).length;
  const total = prs.length;
  const mergeRate = total > 0 ? Math.round((merged / total) * 100) : 0;

  const stats = [
    { label: 'Abertos', value: open, icon: GitPullRequest, color: 'text-[hsl(var(--brand))]', bg: 'bg-[hsl(var(--brand)/0.08)]' },
    { label: 'Drafts', value: drafts, icon: Clock, color: 'text-[hsl(var(--fg-2))]', bg: 'bg-[hsl(var(--shell))]' },
    { label: 'Merged', value: merged, icon: GitMerge, color: 'text-[hsl(var(--ok))]', bg: 'bg-[hsl(var(--ok)/0.08)]' },
    { label: 'Taxa Merge', value: `${mergeRate}%`, icon: CheckCircle, color: 'text-[hsl(var(--warn))]', bg: 'bg-[hsl(var(--warn)/0.08)]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="surface p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${s.color}`} strokeWidth={2} />
            </div>
            <p className="text-[22px] font-bold tracking-tight">{s.value}</p>
            <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5 font-medium">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}