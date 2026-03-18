import React from 'react';
import { Trash2 } from 'lucide-react';
import { MEAL_TYPES } from '@/lib/atlas-theme';

export default function MealCard({ meal, onDelete }) {
  const label = MEAL_TYPES[meal.meal_type]?.label || meal.meal_type;

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold">{meal.total_calories || 0} kcal</span>
          {onDelete && (
            <button onClick={() => onDelete(meal.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {(meal.foods || []).map((food, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span className="text-foreground/80 truncate">{food.name}</span>
            <span className="text-muted-foreground shrink-0 ml-2">{food.amount}{food.unit}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-3 border-t border-border text-[11px]">
        <span className="text-muted-foreground">P <span className="text-foreground font-medium">{meal.total_protein || 0}g</span></span>
        <span className="text-muted-foreground">C <span className="text-foreground font-medium">{meal.total_carbs || 0}g</span></span>
        <span className="text-muted-foreground">G <span className="text-foreground font-medium">{meal.total_fat || 0}g</span></span>
      </div>
    </div>
  );
}