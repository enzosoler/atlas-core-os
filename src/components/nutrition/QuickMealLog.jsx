import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickMealLog({ date, mealType, onClose }) {
  const qc = useQueryClient();
  const [foods, setFoods] = useState([{ name: '', amount: '', unit: '', kcal: '' }]);

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Meal.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals', date] });
      toast.success('Meal logged!');
      onClose?.();
    },
  });

  const handleAddFood = () => {
    setFoods([...foods, { name: '', amount: '', unit: '', kcal: '' }]);
  };

  const handleRemoveFood = (idx) => {
    setFoods(foods.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!foods.some(f => f.name?.trim())) {
      toast.error('Add at least one food item');
      return;
    }

    const totalCals = foods.reduce((sum, f) => sum + (Number(f.kcal) || 0), 0);
    const payload = {
      date,
      meal_type: mealType,
      foods: foods.filter(f => f.name?.trim()),
      total_calories: totalCals,
    };

    createMut.mutate(payload);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {foods.map((food, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <input
              type="text"
              value={food.name}
              onChange={e => {
                const updated = [...foods];
                updated[idx].name = e.target.value;
                setFoods(updated);
              }}
              placeholder="Food name"
              className="atlas-input h-9 flex-1 rounded-lg text-[12px]"
            />
            <input
              type="number"
              value={food.amount}
              onChange={e => {
                const updated = [...foods];
                updated[idx].amount = e.target.value;
                setFoods(updated);
              }}
              placeholder="Amount"
              className="atlas-input h-9 w-16 rounded-lg text-[12px]"
            />
            <input
              type="text"
              value={food.unit}
              onChange={e => {
                const updated = [...foods];
                updated[idx].unit = e.target.value;
                setFoods(updated);
              }}
              placeholder="g"
              className="atlas-input h-9 w-12 rounded-lg text-[12px]"
            />
            <input
              type="number"
              value={food.kcal}
              onChange={e => {
                const updated = [...foods];
                updated[idx].kcal = e.target.value;
                setFoods(updated);
              }}
              placeholder="kcal"
              className="atlas-input h-9 w-16 rounded-lg text-[12px]"
            />
            <button
              onClick={() => handleRemoveFood(idx)}
              className="w-9 h-9 rounded-lg hover:bg-[hsl(var(--err)/0.1)] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--err))] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mx-auto" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddFood}
        className="w-full py-2 rounded-lg border border-dashed border-[hsl(var(--border-h))] text-[12px] font-medium text-[hsl(var(--fg-2))] hover:bg-[hsl(var(--shell))] transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3 h-3" /> Add Food
      </button>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="btn btn-secondary flex-1 h-9 rounded-lg text-[12px]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={createMut.isPending}
          className="btn btn-primary flex-1 h-9 rounded-lg text-[12px] gap-1"
        >
          {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Save Meal
        </button>
      </div>
    </div>
  );
}