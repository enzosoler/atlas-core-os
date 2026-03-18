import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * CoachAdherenceScore — visualizes overall adherence % for a student
 * Calculates adherence from: check-ins, workouts, meals logged
 * 
 * Usage:
 * <CoachAdherenceScore 
 *   checkins={checkinArray}
 *   workouts={workoutArray}
 *   meals={mealArray}
 *   days={7}
 * />
 */
export default function CoachAdherenceScore({ checkins = [], workouts = [], meals = [], days = 7 }) {
  const adherence = useMemo(() => {
    if (!days) return 0;
    
    let score = 0;
    let maxScore = 0;
    
    // 1. Check-in adherence (max 40 points)
    const uniqueCheckinDates = new Set(checkins.map(c => c.date));
    const checkinAdherence = Math.min(uniqueCheckinDates.size / days * 100, 100);
    score += checkinAdherence * 0.4;
    maxScore += 40;
    
    // 2. Workout adherence (max 35 points)
    const uniqueWorkoutDates = new Set(workouts.map(w => w.date));
    const workoutAdherence = Math.min(uniqueWorkoutDates.size / (days * 0.6) * 100, 100); // Expect ~3-4x/week
    score += workoutAdherence * 0.35;
    maxScore += 35;
    
    // 3. Meal logging (max 25 points)
    const uniqueMealDates = new Set(meals.map(m => m.date));
    const mealAdherence = Math.min(uniqueMealDates.size / days * 100, 100);
    score += mealAdherence * 0.25;
    maxScore += 25;
    
    return Math.round(score);
  }, [checkins, workouts, meals, days]);

  const getAdherenceColor = () => {
    if (adherence >= 85) return { bg: 'bg-[hsl(var(--ok)/0.08)]', text: 'text-[hsl(var(--ok))]', label: 'Excelente' };
    if (adherence >= 70) return { bg: 'bg-[hsl(var(--brand)/0.08)]', text: 'text-[hsl(var(--brand))]', label: 'Boa' };
    if (adherence >= 50) return { bg: 'bg-[hsl(var(--warn)/0.08)]', text: 'text-[hsl(var(--warn))]', label: 'Moderada' };
    return { bg: 'bg-[hsl(var(--err)/0.08)]', text: 'text-[hsl(var(--err))]', label: 'Baixa' };
  };

  const colors = getAdherenceColor();

  return (
    <div className={`surface p-5 rounded-xl border ${colors.bg.replace('bg-', 'border-').replace('/0.08', '/0.25')}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="t-label">Aderência Geral</p>
        <span className={`badge ${colors.bg} ${colors.text} font-bold`}>{adherence}%</span>
      </div>
      
      <div className="relative h-2 rounded-full bg-[hsl(var(--shell))] overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.text.replace('text-', 'bg-')}`}
          style={{ width: `${adherence}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="text-center p-2 rounded-lg bg-[hsl(var(--card-hi))]">
          <p className="text-muted-foreground mb-0.5">Check-ins</p>
          <p className="font-bold">{new Set(checkins.map(c => c.date)).size}</p>
          <p className="text-muted-foreground text-[10px]">de {days}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[hsl(var(--card-hi))]">
          <p className="text-muted-foreground mb-0.5">Treinos</p>
          <p className="font-bold">{new Set(workouts.map(w => w.date)).size}</p>
          <p className="text-muted-foreground text-[10px]">registrados</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[hsl(var(--card-hi))]">
          <p className="text-muted-foreground mb-0.5">Refeições</p>
          <p className="font-bold">{new Set(meals.map(m => m.date)).size}</p>
          <p className="text-muted-foreground text-[10px]">de {days}</p>
        </div>
      </div>

      <p className={`t-caption mt-3 ${colors.text}`}>{colors.label}</p>
    </div>
  );
}