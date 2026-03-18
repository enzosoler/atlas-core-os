import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * DietPlanVsExecution — visualiza aderência alimentar prescrito vs consumido
 */
export default function DietPlanVsExecution({ diet, meals }) {
  if (!diet) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-[13px] text-[hsl(var(--fg-2))]">Nenhum plano alimentar prescrito</p>
      </div>
    );
  }

  // Summarize this week's consumption
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  
  const weekMeals = meals.filter(m => new Date(m.date) >= weekStart && new Date(m.date) <= now);
  const avgDailyCalories = weekMeals.length > 0 
    ? Math.round(weekMeals.reduce((s, m) => s + (m.total_calories || 0), 0) / 7)
    : 0;
  
  const planCalories = diet.target_calories || 0;
  const adherenceCalories = planCalories > 0 ? Math.round((avgDailyCalories / planCalories) * 100) : 0;

  // Macro comparison
  const avgMacros = {
    protein: weekMeals.length > 0 ? Math.round(weekMeals.reduce((s, m) => s + (m.total_protein || 0), 0) / 7) : 0,
    carbs: weekMeals.length > 0 ? Math.round(weekMeals.reduce((s, m) => s + (m.total_carbs || 0), 0) / 7) : 0,
    fat: weekMeals.length > 0 ? Math.round(weekMeals.reduce((s, m) => s + (m.total_fat || 0), 0) / 7) : 0,
  };

  const chartData = [
    {
      macro: 'Proteína',
      Plano: diet.target_protein || 0,
      Consumido: avgMacros.protein,
    },
    {
      macro: 'Carboidratos',
      Plano: diet.target_carbs || 0,
      Consumido: avgMacros.carbs,
    },
    {
      macro: 'Gordura',
      Plano: diet.target_fat || 0,
      Consumido: avgMacros.fat,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-[11px] text-[hsl(var(--fg-2))] uppercase tracking-wider mb-1">Meta</p>
            <p className="text-[18px] font-bold">{planCalories}</p>
            <p className="text-[10px] text-[hsl(var(--fg-2))]">kcal</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[hsl(var(--fg-2))] uppercase tracking-wider mb-1">Média 7d</p>
            <p className="text-[18px] font-bold">{avgDailyCalories}</p>
            <p className="text-[10px] text-[hsl(var(--fg-2))]">kcal</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[hsl(var(--fg-2))] uppercase tracking-wider mb-1">Aderência</p>
            <p className={`text-[18px] font-bold ${adherenceCalories >= 90 ? 'text-[hsl(var(--ok))]' : adherenceCalories >= 70 ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--err))]'}`}>
              {adherenceCalories}%
            </p>
            <p className="text-[10px] text-[hsl(var(--fg-2))]">adesão</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <p className="t-label mb-3">Macronutrientes: Plano vs Consumido</p>
        {weekMeals.length === 0 ? (
          <p className="text-center text-[12px] text-[hsl(var(--fg-2))] py-4">Sem registros esta semana</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border-h))" />
              <XAxis dataKey="macro" tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />
              <Bar dataKey="Plano" fill="hsl(var(--shell))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Consumido" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}