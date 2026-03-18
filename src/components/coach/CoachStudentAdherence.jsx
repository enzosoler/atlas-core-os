import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Activity, TrendingUp } from 'lucide-react';
import AdherenceComparison from '@/components/shared/AdherenceComparison';

/**
 * CoachStudentAdherence — Shows athlete's workout adherence vs prescribed
 */
export default function CoachStudentAdherence({ studentEmail, weeks = 4 }) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data: workouts = [] } = useQuery({
    queryKey: ['student-workouts', studentEmail, startDateStr],
    queryFn: () => base44.entities.Workout.filter({ created_by: studentEmail }),
  });

  const { data: prescribed = [] } = useQuery({
    queryKey: ['prescribed-workouts', studentEmail],
    queryFn: () => base44.entities.PrescribedWorkout.filter({ athlete_email: studentEmail, active: true }),
  });

  // Count completed workouts (status = 'completed')
  const completedCount = workouts.filter(w => w.status === 'completed').length;

  // Calculate expected from prescribed
  const expectedCount = prescribed.length > 0
    ? prescribed.reduce((sum, p) => sum + (p.frequency?.includes('2') ? 2 : p.frequency?.includes('3') ? 3 : 1), 0)
    : 0;

  // Calculate total volume (sets × reps)
  const actualVolume = workouts.reduce((sum, w) => {
    const wVol = w.exercises?.reduce((s, ex) => s + ((ex.sets || 0) * (ex.reps || 0)), 0) || 0;
    return sum + wVol;
  }, 0);

  const prescribedVolume = prescribed.reduce((sum, p) => {
    const pVol = p.exercises?.reduce((s, ex) => s + ((ex.target_sets || 0) * (parseInt(ex.target_reps) || 0)), 0) || 0;
    return sum + pVol;
  }, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="t-subtitle flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" /> Aderência a Treinos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdherenceComparison
          label="Sessões completadas"
          actual={completedCount}
          prescribed={expectedCount}
          unit="sessões"
        />
        {prescribedVolume > 0 && (
          <AdherenceComparison
            label="Volume total (sets × reps)"
            actual={actualVolume}
            prescribed={prescribedVolume}
            unit="reps"
          />
        )}
      </div>

      {prescribed.length === 0 && (
        <div className="p-4 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))] text-center">
          <p className="t-small text-[hsl(var(--fg-2))]">Nenhum treino prescrito ainda</p>
        </div>
      )}
    </div>
  );
}