import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UtensilsCrossed } from 'lucide-react';
import AdherenceComparison from '@/components/shared/AdherenceComparison';

/**
 * NutritionistClientAdherence — Shows client's nutrition adherence vs prescribed
 */
export default function NutritionistClientAdherence({ clientEmail, days = 7 }) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data: meals = [] } = useQuery({
    queryKey: ['client-meals', clientEmail, startDateStr],
    queryFn: () => base44.entities.Meal.filter({ created_by: clientEmail }),
  });

  const { data: prescribed = [] } = useQuery({
    queryKey: ['prescribed-diet', clientEmail],
    queryFn: () => base44.entities.PrescribedDiet.filter({ client_email: clientEmail, active: true }),
  });

  // Calculate actual macros from logged meals
  const actualCals = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
  const actualProt = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
  const actualCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
  const actualFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);

  // Calculate prescribed targets
  const prescribedCals = prescribed[0]?.target_calories || 0;
  const prescribedProt = prescribed[0]?.target_protein || 0;
  const prescribedCarbs = prescribed[0]?.target_carbs || 0;
  const prescribedFat = prescribed[0]?.target_fat || 0;

  const avgDays = Math.max(days, 1);

  return (
    <div className="space-y-4">
      <div>
        <p className="t-subtitle flex items-center gap-2 mb-3">
          <UtensilsCrossed className="w-4 h-4" /> Aderência Nutricional
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdherenceComparison
          label={`Calorias (${days}d)`}
          actual={Math.round(actualCals / avgDays)}
          prescribed={prescribedCals}
          unit="kcal/dia"
        />
        <AdherenceComparison
          label={`Proteína (${days}d)`}
          actual={Math.round(actualProt / avgDays)}
          prescribed={prescribedProt}
          unit="g/dia"
        />
        <AdherenceComparison
          label={`Carboidratos (${days}d)`}
          actual={Math.round(actualCarbs / avgDays)}
          prescribed={prescribedCarbs}
          unit="g/dia"
        />
        <AdherenceComparison
          label={`Gordura (${days}d)`}
          actual={Math.round(actualFat / avgDays)}
          prescribed={prescribedFat}
          unit="g/dia"
        />
      </div>

      {prescribed.length === 0 && (
        <div className="p-4 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))] text-center">
          <p className="t-small text-[hsl(var(--fg-2))]">Nenhuma dieta prescrita ainda</p>
        </div>
      )}
    </div>
  );
}