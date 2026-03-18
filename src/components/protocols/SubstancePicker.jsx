import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

const CAT_LABELS = {
  supplement: 'Suplemento',
  medication: 'Medicamento',
  hormone: 'Hormônio',
  peptide: 'Peptídeo',
  ancillary: 'Ancillar',
  other: 'Outro',
};

const CAT_COLORS = {
  supplement: 'badge-ok',
  medication: 'badge-blue',
  hormone: 'badge-warn',
  peptide: 'badge-ai',
  ancillary: 'badge-neutral',
  other: 'badge-neutral',
};

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');
}

function matches(substance, query) {
  const q = normalize(query);
  if (!q) return true;
  const fields = [substance.canonical_name, ...(substance.aliases || [])].map(normalize);
  return fields.some(f => f.includes(q));
}

const ALL_CATS = ['all', 'supplement', 'medication', 'hormone', 'peptide', 'ancillary'];

export default function SubstancePicker({ substances = [], onSelect, value = null, placeholder = 'Buscar substância…' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = substances.filter(s => {
    if (cat !== 'all' && s.category !== cat) return false;
    return matches(s, query);
  });

  const handleSelect = (s) => {
    onSelect(s);
    setOpen(false);
    setQuery('');
  };

  const clear = (e) => { e.stopPropagation(); onSelect(null); setQuery(''); };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-10 flex items-center gap-2 px-3 rounded-xl border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-left transition-colors hover:border-[hsl(var(--brand)/0.4)] focus:outline-none focus:border-[hsl(var(--brand)/0.6)]"
      >
        {value ? (
          <>
            <span className="flex-1 text-[13px] font-medium text-[hsl(var(--fg))] truncate">{value.canonical_name}</span>
            <span className={`badge ${CAT_COLORS[value.category]} text-[10px] shrink-0`}>{CAT_LABELS[value.category]}</span>
            <button onClick={clear} className="ml-1 text-[hsl(var(--fg-2))] hover:text-[hsl(var(--err))] shrink-0">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5 text-[hsl(var(--fg-2))] shrink-0" strokeWidth={2} />
            <span className="flex-1 text-[13px] text-[hsl(var(--fg-2))]">{placeholder}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--fg-2))] shrink-0" strokeWidth={2} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-[hsl(var(--card))] border border-[hsl(var(--border-h))] rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[hsl(var(--border-h))]">
            <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-[hsl(var(--shell))]">
              <Search className="w-3.5 h-3.5 text-[hsl(var(--fg-2))] shrink-0" strokeWidth={2} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nome ou alias…"
                className="flex-1 bg-transparent text-[13px] text-[hsl(var(--fg))] placeholder:text-[hsl(var(--fg-2)/0.6)] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[hsl(var(--fg-2))]">
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-[hsl(var(--border-h))]">
            {ALL_CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors
                  ${cat === c
                    ? 'bg-[hsl(var(--brand))] text-white'
                    : 'bg-[hsl(var(--shell))] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'}`}
              >
                {c === 'all' ? 'Todos' : CAT_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-[12px] text-[hsl(var(--fg-2))] text-center py-4">Nenhuma substância encontrada</p>
            ) : filtered.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--shell))] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[hsl(var(--fg))] truncate">{s.canonical_name}</p>
                  {s.aliases?.length > 0 && (
                    <p className="text-[11px] text-[hsl(var(--fg-2))] truncate">{s.aliases.slice(0, 3).join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.default_unit && <span className="text-[11px] text-[hsl(var(--fg-2))]">{s.default_unit}</span>}
                  {s.estimated_half_life_days && (
                    <span className="text-[10px] text-[hsl(var(--fg-2))]">t½{s.estimated_half_life_days}d</span>
                  )}
                  <span className={`badge ${CAT_COLORS[s.category]} text-[10px]`}>{CAT_LABELS[s.category]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}