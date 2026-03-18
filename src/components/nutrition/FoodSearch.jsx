import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';

const DEBOUNCE_MS = 400;

export default function FoodSearch({ onSelectFood, compact = false }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Local cache
  const [searchCache, setSearchCache] = useState({});

  const { data: allFoods = [] } = useQuery({
    queryKey: ['food-master'],
    queryFn: () => base44.entities.FoodMaster.list('search_rank', 200),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['food-logs'],
    queryFn: () => base44.entities.FoodLog.list('-last_used_at', 20),
    staleTime: 10 * 60 * 1000,
  });

  // Filter and rank results
  const results = useMemo(() => {
    if (!debouncedSearch) return [];

    if (searchCache[debouncedSearch]) {
      return searchCache[debouncedSearch];
    }

    const q = debouncedSearch.toLowerCase();
    const filtered = allFoods
      .filter(
        (f) =>
          f.canonical_name?.toLowerCase().includes(q) ||
          f.aliases?.some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 15);

    setSearchCache((prev) => ({ ...prev, [debouncedSearch]: filtered }));
    return filtered;
  }, [debouncedSearch, allFoods, searchCache]);

  const recent = useMemo(() => {
    if (debouncedSearch) return [];
    return recentLogs
      .map((log) =>
        allFoods.find((f) => f.id === log.food_master_id)
      )
      .filter(Boolean)
      .slice(0, 5);
  }, [debouncedSearch, recentLogs, allFoods]);

  const handleSelectFood = useCallback(
    (food) => {
      const item = {
        name: food.canonical_name,
        food_master_id: food.id,
        amount: food.serving_base_amount,
        unit: food.serving_base_unit,
        kcal: food.calories_per_base,
        protein: food.protein_per_base,
        carbs: food.carbs_per_base,
        fat: food.fat_per_base,
        fiber: food.fiber_per_base || 0,
      };
      onSelectFood(item);
      setSearch('');
      setOpen(false);

      // Update favorite
      base44.entities.FoodLog.filter({ food_master_id: food.id }).then((logs) => {
        if (logs.length > 0) {
          base44.entities.FoodLog.update(logs[0].id, { last_used_at: new Date().toISOString() });
        } else {
          base44.entities.FoodLog.create({
            food_master_id: food.id,
            food_name: food.canonical_name,
            last_used_at: new Date().toISOString(),
          });
        }
      });

      toast.success(`${food.canonical_name} adicionado`);
    },
    [onSelectFood]
  );

  return (
    <div className="relative">
      <div
        className={`relative ${
          compact ? 'w-auto' : 'w-full'
        }`}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={compact ? '+ Alimento' : 'Buscar alimento...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          className={`pl-10 rounded-lg text-[13px] ${
            compact ? 'h-8 w-32' : 'h-10'
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[hsl(var(--card))] border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {search === '' && recent.length > 0 && (
            <>
              <div className="sticky top-0 px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground bg-[hsl(var(--secondary))]">
                <Clock className="w-3 h-3 inline mr-1" /> Recentes
              </div>
              {recent.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectFood(f)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--secondary))] transition-colors text-[12px]"
                >
                  <p className="font-medium">{f.canonical_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.serving_base_amount} {f.serving_base_unit} · {f.calories_per_base} kcal
                  </p>
                </button>
              ))}
            </>
          )}

          {debouncedSearch && results.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              Nenhum resultado para "{debouncedSearch}"
            </div>
          )}

          {debouncedSearch && results.length > 0 && (
            <>
              <div className="sticky top-0 px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground bg-[hsl(var(--secondary))]">
                <Search className="w-3 h-3 inline mr-1" /> Resultados
              </div>
              {results.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectFood(f)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--secondary))] transition-colors text-[12px]"
                >
                  <p className="font-medium">{f.canonical_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.serving_base_amount} {f.serving_base_unit} · {f.calories_per_base} kcal
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}