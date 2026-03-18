/**
 * ExerciseSearch — deterministic exercise search against local ExerciseMaster DB
 *
 * Architecture:
 *   1. Show recents/favorites on open (no query)
 *   2. On query: search via exerciseSearch backend (local DB, scoring by alias)
 *   3. Manual entry as last resort
 *   4. On select: log use via exerciseLogs backend
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, Star, Clock, PenLine, CheckCircle, Dumbbell, Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MUSCLE_FILTER_OPTIONS = ['peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 'isquiotibiais', 'glúteo', 'panturrilha', 'core'];
const EQUIPMENT_FILTER_OPTIONS = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell'];

const MOVEMENT_LABEL = {
  push_horizontal: 'Empurrar horizontal',
  push_vertical: 'Empurrar vertical',
  pull_horizontal: 'Puxar horizontal',
  pull_vertical: 'Puxar vertical',
  squat: 'Agachamento',
  hinge: 'Dobradiça',
  lunge: 'Avanço',
  rotation: 'Rotação',
  isolation: 'Isolamento',
  carry: 'Carregamento',
  cardio_pattern: 'Cardio',
  other: 'Outro',
};

const DIFFICULTY_BADGE = {
  beginner: 'badge-ok',
  intermediate: 'badge-warn',
  advanced: 'badge-err',
};
const DIFFICULTY_LABEL = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

function ExerciseRow({ exercise, onSelect }) {
  const muscles = exercise.primary_muscles?.slice(0, 2).join(', ') || '';
  const equip = exercise.equipment?.slice(0, 2).join(', ') || '';
  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-start justify-between px-3 py-2.5 hover:bg-[hsl(var(--shell))] transition-colors text-left border-b border-[hsl(var(--border-h))] last:border-0"
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-[hsl(var(--fg))] truncate">{exercise.name}</p>
          {exercise.is_compound && (
            <span className="badge badge-blue shrink-0" style={{ fontSize: 9, padding: '1px 5px' }}>Comp.</span>
          )}
        </div>
        <p className="text-[11px] text-[hsl(var(--fg-2))] truncate">
          {muscles}{equip ? ` · ${equip}` : ''}
          {exercise.default_rep_range ? ` · ${exercise.default_rep_range} reps` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {exercise.difficulty_level && (
          <span className={`badge ${DIFFICULTY_BADGE[exercise.difficulty_level]}`} style={{ fontSize: 9 }}>
            {DIFFICULTY_LABEL[exercise.difficulty_level]}
          </span>
        )}
        {exercise.personal_record_weight && (
          <span className="text-[9px] text-[hsl(var(--warn))] font-medium">PR: {exercise.personal_record_weight}kg</span>
        )}
      </div>
    </button>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--shell))] border-b border-[hsl(var(--border-h))]">
      <Icon className="w-3 h-3 text-[hsl(var(--fg-2))]" strokeWidth={2} />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))]">{label}</p>
    </div>
  );
}

function ManualEntry({ onAdd, onBack }) {
  const [name, setName] = useState('');
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]">
        ← Voltar
      </button>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] block mb-1.5">
          Nome do exercício
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Meu exercício personalizado"
          className="atlas-input"
          autoFocus
        />
      </div>
      <button
        onClick={() => {
          if (name.trim()) {
            onAdd({ id: null, name: name.trim(), primary_muscles: [], equipment: [], _manual: true });
            setName('');
          }
        }}
        disabled={!name.trim()}
        className="btn btn-primary w-full h-10 rounded-xl text-[13px] gap-1.5 disabled:opacity-50"
      >
        <PenLine className="w-3.5 h-3.5" /> Adicionar manualmente
      </button>
    </div>
  );
}

export default function ExerciseSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [showManual, setShowManual] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load recents + favorites
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingContext(true);
      try {
        const [rec, fav] = await Promise.all([
          base44.functions.invoke('exerciseLogs', { action: 'recent' }),
          base44.functions.invoke('exerciseLogs', { action: 'favorites' }),
        ]);
        if (!cancelled) {
          setRecents(rec.data?.results || []);
          setFavorites(fav.data?.results || []);
        }
      } catch {
        // Not critical
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Active filter search (muscle or equipment)
  useEffect(() => {
    if (!muscleFilter && !equipFilter) return;
    if (query) return; // query takes precedence
    setLoading(true);
    const action = muscleFilter ? 'by_muscle' : 'by_equipment';
    const param = muscleFilter ? { muscle: muscleFilter } : { equipment: equipFilter };
    base44.functions.invoke('exerciseSearch', { action, ...param })
      .then(res => setResults(res.data?.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [muscleFilter, equipFilter]);

  // Text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      if (!muscleFilter && !equipFilter) setResults([]);
      return;
    }
    setMuscleFilter('');
    setEquipFilter('');
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('exerciseSearch', { action: 'search', query });
        setResults(res.data?.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = async (exercise) => {
    // Log use (non-blocking)
    if (exercise.id) {
      base44.functions.invoke('exerciseLogs', {
        action: 'log_use',
        exercise_master_id: exercise.id,
        exercise_name: exercise.name,
      }).catch(() => {});
    }
    onSelect({
      name: exercise.name,
      muscle_groups: exercise.primary_muscles || [],
      equipment: (exercise.equipment || [])[0] || '',
      exercise_master_id: exercise.id || null,
      movement_pattern: exercise.movement_pattern || null,
      default_rep_range: exercise.default_rep_range || null,
      default_set_range: exercise.default_set_range || null,
      default_rest_seconds: exercise.default_rest_seconds || null,
      is_compound: exercise.is_compound || false,
    });
    setQuery('');
    setResults([]);
    setMuscleFilter('');
    setEquipFilter('');
    setShowFilters(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setMuscleFilter('');
    setEquipFilter('');
    inputRef.current?.focus();
  };

  const showHome = !query && !muscleFilter && !equipFilter && !showManual;
  const hasContext = !loadingContext && (favorites.length > 0 || recents.length > 0);

  if (showManual) {
    return <ManualEntry onAdd={ex => { handleSelect(ex); setShowManual(false); }} onBack={() => setShowManual(false)} />;
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar exercício… (supino, agachamento)"
            className="atlas-input pl-9 pr-9"
            inputMode="text"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[hsl(var(--fg-2))]" />}
          {(query || muscleFilter || equipFilter) && !loading && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${showFilters ? 'bg-[hsl(var(--brand)/0.1)] border-[hsl(var(--brand)/0.3)] text-[hsl(var(--brand))]' : 'border-[hsl(var(--border-h))] text-[hsl(var(--fg-2))] hover:bg-[hsl(var(--shell))]'}`}
        >
          <Filter className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-2 p-3 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-1.5">Músculo</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_FILTER_OPTIONS.map(m => (
                <button key={m} onClick={() => setMuscleFilter(p => p === m ? '' : m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors capitalize ${muscleFilter === m ? 'bg-[hsl(var(--brand))] text-white border-[hsl(var(--brand))]' : 'border-[hsl(var(--border-h))] text-[hsl(var(--fg-2))] hover:bg-[hsl(var(--card))]'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-1.5">Equipamento</p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_FILTER_OPTIONS.map(e => (
                <button key={e} onClick={() => setEquipFilter(p => p === e ? '' : e)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${equipFilter === e ? 'bg-[hsl(var(--brand))] text-white border-[hsl(var(--brand))]' : 'border-[hsl(var(--border-h))] text-[hsl(var(--fg-2))] hover:bg-[hsl(var(--card))]'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Home: favorites + recents */}
      {showHome && hasContext && (
        <div className="border border-[hsl(var(--border-h))] rounded-xl overflow-hidden bg-[hsl(var(--card))]">
          {favorites.length > 0 && (
            <>
              <SectionHeader icon={Star} label="Favoritos" />
              {favorites.slice(0, 3).map((ex, i) => <ExerciseRow key={`fav-${i}`} exercise={ex} onSelect={handleSelect} />)}
            </>
          )}
          {recents.length > 0 && (
            <>
              <SectionHeader icon={Clock} label="Recentes" />
              {recents.slice(0, 5).map((ex, i) => <ExerciseRow key={`rec-${i}`} exercise={ex} onSelect={handleSelect} />)}
            </>
          )}
        </div>
      )}

      {/* Results */}
      {(results.length > 0 || (loading && (query || muscleFilter || equipFilter))) && (
        <div className="border border-[hsl(var(--border-h))] rounded-xl overflow-hidden bg-[hsl(var(--card))]">
          {(muscleFilter || equipFilter) && (
            <SectionHeader icon={Dumbbell} label={muscleFilter ? `Músculo: ${muscleFilter}` : `Equipamento: ${equipFilter}`} />
          )}
          {results.map((ex, i) => <ExerciseRow key={i} exercise={ex} onSelect={handleSelect} />)}
          {!loading && results.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-[13px] text-[hsl(var(--fg-2))] mb-2">Nenhum resultado encontrado</p>
              <button onClick={() => setShowManual(true)} className="text-[12px] text-[hsl(var(--brand))] font-medium hover:underline flex items-center gap-1 mx-auto">
                <PenLine className="w-3.5 h-3.5" /> Adicionar manualmente
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results for text search */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-3">
          <p className="text-[13px] text-[hsl(var(--fg-2))] mb-1">Nenhum resultado para "{query}"</p>
          <button onClick={() => setShowManual(true)} className="text-[12px] text-[hsl(var(--brand))] font-medium hover:underline flex items-center gap-1 mx-auto">
            <PenLine className="w-3.5 h-3.5" /> Adicionar manualmente
          </button>
        </div>
      )}

      {/* Manual shortcut */}
      {showHome && (
        <button onClick={() => setShowManual(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] transition-colors rounded-lg hover:bg-[hsl(var(--shell))]">
          <PenLine className="w-3.5 h-3.5" strokeWidth={2} /> Adicionar exercício manualmente
        </button>
      )}
    </div>
  );
}