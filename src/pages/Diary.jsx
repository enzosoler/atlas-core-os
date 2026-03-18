import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Smile, Zap, Moon, Droplets, UtensilsCrossed, Dumbbell, BarChart3, Pill, Loader2 } from 'lucide-react';
import { getToday, MEAL_TYPES } from '@/lib/atlas-theme';

function DateNav({ date, onChange }) {
  const isToday = date === getToday();
  const fmt = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors">
        <ChevronLeft className="w-4 h-4" strokeWidth={2} />
      </button>
      <span className="text-[13px] font-medium min-w-[200px] text-center capitalize">
        {fmt}{isToday && <span className="ml-2 badge badge-blue">Hoje</span>}
      </span>
      <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors">
        <ChevronRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function ScoreDot({ value, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < value ? 'bg-[hsl(var(--brand))]' : 'bg-[hsl(var(--shell))]'}`} />
      ))}
    </div>
  );
}

function TimelineSection({ icon: Icon, color, title, children, empty }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `hsl(${color}/0.1)` }}>
          <Icon className="w-4 h-4" style={{ color: `hsl(${color})` }} strokeWidth={2} />
        </div>
        <div className="w-px flex-1 bg-[hsl(var(--border-h))] mt-2" />
      </div>
      <div className="flex-1 pb-6">
        <p className="t-label mb-2">{title}</p>
        {empty ? (
          <p className="t-caption italic">Nenhum registro.</p>
        ) : children}
      </div>
    </div>
  );
}

export default function Diary() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(getToday());

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigate('/Landing', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const changeDate = (d) => {
    const dt = new Date(date); dt.setDate(dt.getDate() + d);
    setDate(dt.toISOString().split('T')[0]);
  };

  const { data: checkin } = useQuery({
    queryKey: ['diary-checkin', date],
    queryFn: async () => { const r = await base44.entities.DailyCheckin.filter({ date }); return r?.[0] || null; },
  });
  const { data: meals = [] } = useQuery({
    queryKey: ['diary-meals', date],
    queryFn: () => base44.entities.Meal.filter({ date }),
  });
  const { data: workouts = [] } = useQuery({
    queryKey: ['diary-workouts', date],
    queryFn: () => base44.entities.Workout.filter({ date }),
  });
  const { data: measurements = [] } = useQuery({
    queryKey: ['diary-measurements', date],
    queryFn: () => base44.entities.Measurement.filter({ date }),
  });
  const { data: supplements = [] } = useQuery({
    queryKey: ['diary-supplements-active'],
    queryFn: () => base44.entities.Supplement.filter({ active: true }),
  });

  const totalCal = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
  const measurement = measurements[0] || null;

  return (
    <div className="p-5 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[hsl(var(--border-h))]">
        <h1 className="t-headline">Diário</h1>
        <p className="t-small mt-1">Resumo cronológico do seu dia</p>
      </div>

      <DateNav date={date} onChange={changeDate} />

      {/* Timeline */}
      <div className="pt-2">

        {/* Check-in */}
        <TimelineSection icon={Smile} color="var(--ok)" title="Check-in" empty={!checkin}>
          {checkin && (
            <div className="surface p-4 space-y-3">
              {[
                { label: 'Humor', icon: Smile, value: checkin.mood, max: 5 },
                { label: 'Energia', icon: Zap, value: checkin.energy, max: 5 },
              ].map(({ label, value, max }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="t-small">{label}</span>
                  <ScoreDot value={value} max={max} />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="t-small flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Sono</span>
                <span className="text-[13px] font-semibold">{checkin.sleep_hours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="t-small flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Água</span>
                <span className="text-[13px] font-semibold">{checkin.hydration_liters}L</span>
              </div>
              {checkin.notes && <p className="t-caption italic border-t border-[hsl(var(--border-h))] pt-2 mt-1">{checkin.notes}</p>}
            </div>
          )}
        </TimelineSection>

        {/* Nutrition */}
        <TimelineSection icon={UtensilsCrossed} color="var(--brand)" title={`Nutrição ${meals.length > 0 ? `· ${totalCal} kcal` : ''}`} empty={meals.length === 0}>
          <div className="space-y-2">
            {meals.map(m => (
              <div key={m.id} className="surface px-4 py-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-[13px] font-medium">{MEAL_TYPES[m.meal_type]?.label || m.meal_type}</p>
                  <span className="t-caption">{m.total_calories || 0} kcal</span>
                </div>
                <div className="flex gap-3 t-caption mt-0.5">
                  <span>P {m.total_protein || 0}g</span>
                  <span>C {m.total_carbs || 0}g</span>
                  <span>G {m.total_fat || 0}g</span>
                </div>
                {(m.foods || []).length > 0 && (
                  <p className="t-caption mt-1 text-[hsl(var(--fg-2))]">{m.foods.map(f => f.name).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </TimelineSection>

        {/* Workout */}
        <TimelineSection icon={Dumbbell} color="var(--brand-ai)" title="Treino" empty={workouts.length === 0}>
          {workouts.map(w => (
            <div key={w.id} className="surface px-4 py-3 space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-[13px] font-medium">{w.name}</p>
                <span className={`badge ${w.completed ? 'badge-ok' : 'badge-warn'}`}>
                  {w.completed ? 'Concluído' : 'Pendente'}
                </span>
              </div>
              <div className="flex gap-3 t-caption">
                {w.duration_minutes > 0 && <span>{w.duration_minutes} min</span>}
                {w.volume_load > 0 && <span>{w.volume_load.toLocaleString()} kg vol.</span>}
                {w.perceived_effort > 0 && <span>RPE {w.perceived_effort}</span>}
              </div>
              {(w.exercises || []).length > 0 && (
                <p className="t-caption text-[hsl(var(--fg-2))]">{w.exercises.map(e => e.name).join(', ')}</p>
              )}
            </div>
          ))}
        </TimelineSection>

        {/* Measurements */}
        <TimelineSection icon={BarChart3} color="var(--warn)" title="Medidas" empty={!measurement}>
          {measurement && (
            <div className="surface px-4 py-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1 t-small">
                {measurement.weight   && <span>Peso <b>{measurement.weight}kg</b></span>}
                {measurement.body_fat && <span>Gordura <b>{measurement.body_fat}%</b></span>}
                {measurement.waist    && <span>Cintura <b>{measurement.waist}cm</b></span>}
                {measurement.arms     && <span>Braços <b>{measurement.arms}cm</b></span>}
              </div>
            </div>
          )}
        </TimelineSection>

        {/* Supplements */}
        <TimelineSection icon={Pill} color="var(--ok)" title={`Suplementos ${supplements.length > 0 ? `(${supplements.length} ativos)` : ''}`} empty={supplements.length === 0}>
          <div className="flex flex-wrap gap-1.5">
            {supplements.map(s => (
              <span key={s.id} className="badge badge-neutral">{s.name}{s.dose ? ` · ${s.dose}` : ''}</span>
            ))}
          </div>
        </TimelineSection>

      </div>
    </div>
  );
}