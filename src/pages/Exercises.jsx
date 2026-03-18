import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Filter, Heart, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MUSCLE_EMOJIS = {
  chest: '🫀', back: '📦', shoulders: '🔱', biceps: '💪', triceps: '💪', forearms: '💪',
  legs: '🦵', quads: '🦵', hamstrings: '🦵', glutes: '🍑', calves: '🦵',
  core: '⭕', abs: '⭕', obliques: '⭕', lower_back: '📦', traps: '📦',
};

export default function Exercises() {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterPattern, setFilterPattern] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises-library'],
    queryFn: () => base44.entities.ExerciseMaster.list('-search_rank', 500),
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['exercise-logs'],
    queryFn: () => base44.entities.ExerciseLog.list('-last_used_at', 100),
  });

  // Filter logic
  const filtered = useMemo(() => {
    let result = exercises;

    // Search by name or aliases
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(ex =>
        ex.canonical_name_pt?.toLowerCase().includes(q) ||
        ex.canonical_name_en?.toLowerCase().includes(q) ||
        ex.aliases_pt?.some(a => a.toLowerCase().includes(q)) ||
        ex.aliases_en?.some(a => a.toLowerCase().includes(q))
      );
    }

    // Filter by muscle
    if (filterMuscle !== 'all') {
      result = result.filter(ex =>
        ex.primary_muscles?.includes(filterMuscle) ||
        ex.secondary_muscles?.includes(filterMuscle)
      );
    }

    // Filter by pattern
    if (filterPattern !== 'all') {
      result = result.filter(ex => ex.movement_pattern === filterPattern);
    }

    // Filter by equipment
    if (filterEquipment !== 'all') {
      result = result.filter(ex => ex.equipment?.includes(filterEquipment));
    }

    // Filter by favorites
    if (showFavorites) {
      const favIds = new Set(exerciseLogs.filter(l => l.is_favorite).map(l => l.exercise_master_id));
      result = result.filter(ex => favIds.has(ex.id));
    }

    // Filter by recent
    if (showRecent) {
      const recentIds = new Set(exerciseLogs.slice(0, 20).map(l => l.exercise_master_id));
      result = result.filter(ex => recentIds.has(ex.id));
    }

    return result;
  }, [exercises, exerciseLogs, search, filterMuscle, filterPattern, filterEquipment, showFavorites, showRecent]);

  const muscles = [...new Set(exercises.flatMap(e => [...(e.primary_muscles || []), ...(e.secondary_muscles || [])]))].sort();
  const patterns = [...new Set(exercises.map(e => e.movement_pattern))].filter(Boolean);
  const equipment = [...new Set(exercises.flatMap(e => e.equipment || []))].sort();

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div>
        <h1 className="t-headline mb-1">Biblioteca de Exercícios</h1>
        <p className="t-caption">Explore, favoritos e adicione aos seus treinos</p>
      </div>

      {/* Search */}
      <div className="surface rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg-2))]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou aliases…"
            className="h-10 pl-10 rounded-lg text-[13px]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterMuscle} onValueChange={setFilterMuscle}>
            <SelectTrigger className="h-9 rounded-lg text-[12px] flex-1 min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os músculos</SelectItem>
              {muscles.map(m => (
                <SelectItem key={m} value={m}>
                  {MUSCLE_EMOJIS[m] || '•'} {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPattern} onValueChange={setFilterPattern}>
            <SelectTrigger className="h-9 rounded-lg text-[12px] flex-1 min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os movimentos</SelectItem>
              {patterns.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEquipment} onValueChange={setFilterEquipment}>
            <SelectTrigger className="h-9 rounded-lg text-[12px] flex-1 min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os equipamentos</SelectItem>
              {equipment.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick toggles */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 h-8 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
              showFavorites
                ? 'bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))]'
                : 'bg-[hsl(var(--shell))] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'
            }`}
          >
            <Heart className="w-3 h-3" /> Favoritos
          </button>
          <button
            onClick={() => setShowRecent(!showRecent)}
            className={`px-3 h-8 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
              showRecent
                ? 'bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))]'
                : 'bg-[hsl(var(--shell))] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'
            }`}
          >
            <Clock className="w-3 h-3" /> Recentes
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="t-caption">Nenhum exercício encontrado</p>
          </div>
        ) : (
          filtered.map(ex => {
            const log = exerciseLogs.find(l => l.exercise_master_id === ex.id);
            return (
              <Link
                key={ex.id}
                to={`/exercise/${ex.id}`}
                className="surface rounded-xl p-4 hover:shadow-md hover:border-[hsl(var(--brand)/0.3)] transition-all group cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-[hsl(var(--fg))] truncate group-hover:text-[hsl(var(--brand))] transition-colors">
                      {ex.canonical_name_pt}
                    </h3>
                    {ex.canonical_name_en && (
                      <p className="text-[11px] text-[hsl(var(--fg-2))] truncate">{ex.canonical_name_en}</p>
                    )}
                  </div>
                  {log?.is_favorite && <Heart className="w-4 h-4 text-[hsl(var(--err))] fill-current shrink-0" />}
                </div>

                {/* Muscles */}
                <div className="space-y-2 mb-3">
                  {ex.primary_muscles && ex.primary_muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ex.primary_muscles.slice(0, 3).map(m => (
                        <span key={m} className="badge badge-blue text-[10px]">
                          {MUSCLE_EMOJIS[m] || '•'} {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {ex.difficulty_level && (
                    <span className={`badge ${ex.difficulty_level === 'beginner' ? 'badge-ok' : ex.difficulty_level === 'intermediate' ? 'badge-blue' : 'badge-warn'}`}>
                      {ex.difficulty_level}
                    </span>
                  )}
                  {ex.is_compound && <span className="badge badge-primary">Composto</span>}
                  {log?.use_count && <span className="badge badge-neutral">{log.use_count}× usado</span>}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}