import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MEAL_TYPES } from '@/lib/atlas-theme';
import FoodSearch from './FoodSearch';

const MACRO_COLORS = { protein: '#4F8CFF', carbs: '#8B7CFF', fat: '#F5A83A' };

export default function MealEditModal({ open, onOpenChange, meal, date, onSuccess }) {
  const qc = useQueryClient();
  const [mealType, setMealType] = useState(meal?.meal_type || 'lunch');
  const [foods, setFoods] = useState(meal?.foods || []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const totals = useMemo(() => {
    return foods.reduce(
      (a, f) => ({
        cal: a.cal + (f.kcal || 0),
        pro: a.pro + (f.protein || 0),
        carb: a.carb + (f.carbs || 0),
        fat: a.fat + (f.fat || 0),
        fib: a.fib + (f.fiber || 0),
      }),
      { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0 }
    );
  }, [foods]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Meal.update(meal.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals', date] });
      onOpenChange(false);
      toast.success('Refeição atualizada');
      onSuccess?.();
    },
    onError: () => toast.error('Erro ao salvar refeição'),
  });

  const saveMeal = () => {
    if (!foods.length) return;
    updateMutation.mutate({
      meal_type: mealType,
      foods,
      total_calories: Math.round(totals.cal),
      total_protein: Math.round(totals.pro * 10) / 10,
      total_carbs: Math.round(totals.carb * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
      total_fiber: Math.round(totals.fib * 10) / 10,
    });
  };

  const handleEditFood = (idx) => {
    setEditingIdx(idx);
    setEditAmount(foods[idx].amount.toString());
  };

  const handleSaveEdit = (idx) => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;
    const f = foods[idx];
    const ratio = newAmount / f.amount;
    const updated = [...foods];
    updated[idx] = {
      ...f,
      amount: newAmount,
      kcal: f.kcal * ratio,
      protein: f.protein * ratio,
      carbs: f.carbs * ratio,
      fat: f.fat * ratio,
      fiber: (f.fiber || 0) * ratio,
    };
    setFoods(updated);
    setEditingIdx(null);
  };

  const removeFood = (idx) => {
    setFoods(foods.filter((_, i) => i !== idx));
  };

  const duplicateMeal = () => {
    const newFoods = JSON.parse(JSON.stringify(foods));
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    base44.entities.Meal.create({
      date: tomorrow.toISOString().split('T')[0],
      meal_type: mealType,
      foods: newFoods,
      total_calories: Math.round(totals.cal),
      total_protein: Math.round(totals.pro * 10) / 10,
      total_carbs: Math.round(totals.carb * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
      total_fiber: Math.round(totals.fib * 10) / 10,
    }).then(() => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      toast.success('Refeição duplicada para amanhã');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Editar refeição</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal type */}
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="h-10 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEAL_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Foods list with edit capability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="section-label">Alimentos</p>
              <FoodSearch
                onSelectFood={(f) => setFoods([...foods, f])}
                compact
              />
            </div>

            {foods.length > 0 ? (
              <div className="space-y-1.5">
                {foods.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[hsl(var(--secondary))] text-[12px]"
                  >
                    {editingIdx === idx ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="flex-1 font-medium">{f.name}</span>
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          step="0.1"
                          className="h-7 w-16 text-[11px] rounded-md"
                        />
                        <span className="text-muted-foreground">{f.unit}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => handleSaveEdit(idx)}
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium">{f.name}</p>
                          <p className="text-muted-foreground">
                            {f.amount}
                            {f.unit} · {Math.round(f.kcal)} kcal
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditFood(idx)}
                            className="text-muted-foreground hover:text-[hsl(var(--brand))] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => removeFood(idx)}
                            className="text-muted-foreground hover:text-[hsl(var(--danger))] transition-colors"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground text-center py-3">
                Nenhum alimento adicionado
              </p>
            )}
          </div>

          {/* Totals */}
          {foods.length > 0 && (
            <div className="p-3 rounded-lg bg-[hsl(var(--secondary))] space-y-2">
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span>
                  <b className="text-foreground">{Math.round(totals.cal)}</b> kcal
                </span>
                <span>
                  P <b className="text-foreground">{totals.pro.toFixed(0)}g</b>
                </span>
                <span>
                  C <b className="text-foreground">{totals.carb.toFixed(0)}g</b>
                </span>
                <span>
                  G <b className="text-foreground">{totals.fat.toFixed(0)}g</b>
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={saveMeal}
              disabled={!foods.length || updateMutation.isPending}
              className="btn btn-primary flex-1 h-11 rounded-xl"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando…
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
            {meal && (
              <Button
                onClick={duplicateMeal}
                variant="outline"
                className="h-11 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}