import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Github, RefreshCw, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PRCard from '@/components/github/PRCard';
import PRStats from '@/components/github/PRStats';

export default function GitHubPRTracker() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [prs, setPRs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [error, setError] = useState(null);

  // Load repos on mount
  useEffect(() => {
    loadRepos();
  }, []);

  // Load PRs when repo changes
  useEffect(() => {
    if (selectedRepo) loadPRs(selectedRepo);
  }, [selectedRepo]);

  const loadRepos = async () => {
    setLoadingRepos(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('githubRepos', {});
      setRepos(res.data?.repos || []);
      if (res.data?.repos?.length > 0) {
        setSelectedRepo(res.data.repos[0].full_name);
      }
    } catch (e) {
      setError('Erro ao carregar repositórios: ' + e.message);
    } finally {
      setLoadingRepos(false);
    }
  };

  const loadPRs = async (fullName) => {
    const [owner, repo] = fullName.split('/');
    setLoadingPRs(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('githubPRs', { owner, repo, state: 'all' });
      setPRs(res.data?.prs || []);
    } catch (e) {
      setError('Erro ao carregar PRs: ' + e.message);
    } finally {
      setLoadingPRs(false);
    }
  };

  const filteredPRs = prs.filter((pr) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'open' && pr.state === 'open' && !pr.draft) ||
      (filter === 'draft' && pr.draft) ||
      (filter === 'merged' && pr.merged_at) ||
      (filter === 'closed' && pr.state === 'closed' && !pr.merged_at);
    const matchesSearch =
      !search ||
      pr.title.toLowerCase().includes(search.toLowerCase()) ||
      pr.branch.toLowerCase().includes(search.toLowerCase()) ||
      (pr.author || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-[hsl(var(--border-h))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--shell))] flex items-center justify-center">
            <Github className="w-5 h-5 text-[hsl(var(--fg))]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pull Requests</h1>
            <p className="text-[13px] text-[hsl(var(--fg-2))] mt-0.5">Acompanhe o progresso de implementação de features</p>
          </div>
        </div>
        <button
          onClick={() => selectedRepo && loadPRs(selectedRepo)}
          disabled={loadingPRs}
          className="btn btn-secondary gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPRs ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Repo selector */}
      {loadingRepos ? (
        <div className="flex items-center gap-2 text-[hsl(var(--fg-2))] text-[13px]">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando repositórios…
        </div>
      ) : repos.length > 0 ? (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[12px] font-semibold text-[hsl(var(--fg-2))] uppercase tracking-wider">Repositório</label>
          <Select value={selectedRepo || ''} onValueChange={setSelectedRepo}>
            <SelectTrigger className="w-72 h-9 rounded-lg text-[13px]">
              <SelectValue placeholder="Selecionar repositório…" />
            </SelectTrigger>
            <SelectContent>
              {repos.map((r) => (
                <SelectItem key={r.full_name} value={r.full_name}>
                  {r.full_name} {r.private ? '🔒' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {error && (
        <div className="p-4 rounded-xl border border-[hsl(var(--err)/0.3)] bg-[hsl(var(--err)/0.05)] text-[13px] text-[hsl(var(--err))]">
          {error}
        </div>
      )}

      {/* Stats */}
      {prs.length > 0 && <PRStats prs={prs} />}

      {/* Filters + Search */}
      {prs.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 bg-[hsl(var(--card-hi))] border border-[hsl(var(--border-h))] rounded-xl">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'open', label: 'Abertos' },
              { key: 'draft', label: 'Drafts' },
              { key: 'merged', label: 'Merged' },
              { key: 'closed', label: 'Fechados' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all
                  ${filter === f.key ? 'bg-[hsl(var(--card))] text-[hsl(var(--fg))] shadow-sm' : 'text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--fg-2))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, branch ou autor…"
              className="pl-8 h-9 rounded-lg text-[13px]"
            />
          </div>
        </div>
      )}

      {/* PR List */}
      {loadingPRs ? (
        <div className="flex items-center justify-center py-16 gap-2 text-[hsl(var(--fg-2))]">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando pull requests…
        </div>
      ) : filteredPRs.length === 0 && selectedRepo ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Github className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} />
          </div>
          <p className="t-subtitle mb-1">Nenhum PR encontrado</p>
          <p className="t-caption">Tente mudar o filtro ou busca</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPRs.map((pr) => (
            <PRCard key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}