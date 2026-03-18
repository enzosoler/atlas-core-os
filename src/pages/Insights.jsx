import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import {
  LineChart, Line, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader2, Info, Activity, Brain, Moon, Droplets, Dumbbell, Scale, FlaskConical } from 'lucide-react';
import { format, subDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (d) => {
  try { return format(parseISO(d), 'dd/MM', { locale: ptBR }); } catch { return d; }
};

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

const pearson = (xs, ys) => {
  if (xs.length < 3) return null;
  const mx = avg(xs), my = avg(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den === 0 ? 0 : num / den;
};

const corrLabel = (r) => {
  if (r === null) return { text: 'Sem dados', color: 'text-[hsl(var(--fg-2))]', icon: Minus };
  const abs = Math.abs(r);
  if (abs < 0.2) return { text: 'Sem correlação', color: 'text-[hsl(var(--fg-2))]', icon: Minus };
  const dir = r > 0 ? '↑ Correlação positiva' : '↓ Correlação negativa';
  if (abs < 0.4) return { text: `Fraca · ${dir}`, color: 'text-[hsl(var(--warn))]', icon: r > 0 ? TrendingUp : TrendingDown };
  if (abs < 0.7) return { text: `Moderada · ${dir}`, color: 'text-[hsl(var(--brand))]', icon: r > 0 ? TrendingUp : TrendingDown };
  return { text: `Forte · ${dir}`, color: 'text-[hsl(var(--ok))]', icon: r > 0 ? TrendingUp : TrendingDown };
};

const RANGE_DAYS = { '14d': 14, '30d': 30, '60d': 60, '90d': 90 };

const CHART_COLORS = {
  weight: '#4F8CFF',
  sleep: '#8B7CFF',
  energy: '#F5A83A',
  workout_load: '#34D399',
  mood: '#F87171',
  calories: '#60A5FA',
  water: '#38BDF8',
  protocol: '#A78BFA',
};

// ─── custom tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface text-[11px] px-3 py-2 rounded-xl shadow-lg space-y-1">
      <p className="font-semibold text-[hsl(var(--fg-2))]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── correlation badge ───────────────────────────────────────────────────────

function CorrBadge({ r }) {
  const { text, color, icon: Icon } = corrLabel(r);
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${color}`}>
      <Icon className="w-3 h-3" strokeWidth={2.5} /> {text}
      {r !== null && <span className="opacity-60 font-normal">(r={r.toFixed(2)})</span>}
    </span>
  );
}

// ─── section card ────────────────────────────────────────────────────────────

function InsightCard({ title, subtitle, icon: Icon, children, r, empty, emptyMsg }) {
  return (
    <div className="surface p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--brand)/0.08)] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[hsl(var(--brand))]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[13px] font-bold">{title}</p>
            <p className="text-[11px] text-[hsl(var(--fg-2))]">{subtitle}</p>
          </div>
        </div>
        {r !== undefined && <CorrBadge r={r} />}
      </div>
      {empty ? (
        <div className="py-6 text-center">
          <p className="text-[12px] text-[hsl(var(--fg-2))]">{emptyMsg || 'Dados insuficientes — registre por pelo menos 7 dias para ver correlações.'}</p>
        </div>
      ) : children}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Insights() {
  const { can } = useSubscription();
  const [range, setRange] = useState('30d');
  const days = RANGE_DAYS[range];
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');

  // ── Fetch all data in parallel — hooks must be called before any conditional return ──
  const { data: measurements = [], isLoading: loadM } = useQuery({
    queryKey: ['measurements-insights', days],
    queryFn: () => base44.entities.Measurement.list('-date', 200),
  });
  const { data: checkins = [], isLoading: loadC } = useQuery({
    queryKey: ['checkins-insights', days],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 200),
  });
  const { data: workouts = [], isLoading: loadW } = useQuery({
    queryKey: ['workouts-insights', days],
    queryFn: () => base44.entities.Workout.list('-date', 200),
  });
  const { data: meals = [], isLoading: loadF } = useQuery({
    queryKey: ['meals-insights', days],
    queryFn: () => base44.entities.Meal.list('-date', 500),
  });
  const { data: protocols = [] } = useQuery({
    queryKey: ['protocols-insights'],
    queryFn: () => base44.entities.Protocol.list('-start_date', 50),
  });
  const { data: labExams = [] } = useQuery({
    queryKey: ['labs-insights', days],
    queryFn: () => base44.entities.LabExam.list('-exam_date', 50),
  });

  const isLoading = loadM || loadC || loadW || loadF;

  // Check entitlement after all hooks
  if (!can('advanced_analytics')) {
    return (
      <div className="h-screen flex items-center justify-center p-5">
        <UpgradeGate feature="advanced_analytics" plan="Pro" title="Analytics Avançados — Plano Pro+" description="Visualize correlações automáticas entre seus dados e identifique padrões" />
      </div>
    );
  }

  // ── Filter to range ──
  const filteredMeasurements = measurements.filter(m => m.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  const filteredCheckins = checkins.filter(c => c.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  const filteredWorkouts = workouts.filter(w => w.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));

  // ── Build daily meal aggregates ──
  const mealsByDate = useMemo(() => {
    const map = {};
    meals.filter(m => m.date >= cutoff).forEach(m => {
      if (!map[m.date]) map[m.date] = { cal: 0, protein: 0, count: 0 };
      map[m.date].cal += m.total_calories || 0;
      map[m.date].protein += m.total_protein || 0;
      map[m.date].count++;
    });
    return map;
  }, [meals, cutoff]);

  // ── Build workout aggregates by date ──
  const workoutByDate = useMemo(() => {
    const map = {};
    filteredWorkouts.forEach(w => {
      const load = w.volume_load || (w.exercises?.reduce((s, e) =>
        s + (e.sets?.reduce((ss, st) => ss + (st.reps || 0) * (st.weight || 0), 0) || 0), 0) || 0);
      if (!map[w.date]) map[w.date] = { load: 0, duration: 0, completed: false };
      map[w.date].load += load;
      map[w.date].duration += w.duration_minutes || 0;
      if (w.completed) map[w.date].completed = true;
    });
    return map;
  }, [filteredWorkouts]);

  // ════════════════════════════════════════════════════════════
  // 1. SLEEP × ENERGY (next day) correlation
  // ════════════════════════════════════════════════════════════
  const sleepEnergyData = useMemo(() => {
    const sorted = [...filteredCheckins].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(0, -1).map((c, i) => ({
      date: fmt(c.date),
      sleep: c.sleep_hours,
      nextEnergy: sorted[i + 1]?.energy,
    })).filter(d => d.sleep && d.nextEnergy);
  }, [filteredCheckins]);

  const rSleepEnergy = useMemo(() =>
    pearson(sleepEnergyData.map(d => d.sleep), sleepEnergyData.map(d => d.nextEnergy)),
    [sleepEnergyData]);

  // ════════════════════════════════════════════════════════════
  // 2. MOOD × WORKOUT PERFORMANCE (volume load on same day)
  // ════════════════════════════════════════════════════════════
  const moodWorkoutData = useMemo(() =>
    filteredCheckins
      .filter(c => workoutByDate[c.date]?.load > 0)
      .map(c => ({
        date: fmt(c.date),
        mood: c.mood,
        load: workoutByDate[c.date].load,
      }))
      .filter(d => d.mood && d.load),
    [filteredCheckins, workoutByDate]);

  const rMoodWorkout = useMemo(() =>
    pearson(moodWorkoutData.map(d => d.mood), moodWorkoutData.map(d => d.load)),
    [moodWorkoutData]);

  // ════════════════════════════════════════════════════════════
  // 3. WEIGHT EVOLUTION × CALORIES × PROTEIN (timeline)
  // ════════════════════════════════════════════════════════════
  const weightNutritionData = useMemo(() =>
    filteredMeasurements
      .filter(m => m.weight)
      .map(m => ({
        date: fmt(m.date),
        rawDate: m.date,
        weight: m.weight,
        cal: mealsByDate[m.date]?.cal ? Math.round(mealsByDate[m.date].cal) : null,
        protein: mealsByDate[m.date]?.protein ? Math.round(mealsByDate[m.date].protein) : null,
      })),
    [filteredMeasurements, mealsByDate]);

  const weightArr = weightNutritionData.map(d => d.weight);
  const calArr = weightNutritionData.filter(d => d.cal).map(d => d.cal);
  const rWeightCal = useMemo(() => {
    const pairs = weightNutritionData.filter(d => d.cal);
    return pearson(pairs.map(d => d.cal), pairs.map(d => d.weight));
  }, [weightNutritionData]);

  // ════════════════════════════════════════════════════════════
  // 4. HYDRATION × ENERGY (same day)
  // ════════════════════════════════════════════════════════════
  const hydrationEnergyData = useMemo(() =>
    filteredCheckins
      .filter(c => c.hydration_liters > 0 && c.energy)
      .map(c => ({
        date: fmt(c.date),
        water: c.hydration_liters,
        energy: c.energy,
      })),
    [filteredCheckins]);

  const rHydrationEnergy = useMemo(() =>
    pearson(hydrationEnergyData.map(d => d.water), hydrationEnergyData.map(d => d.energy)),
    [hydrationEnergyData]);

  // ════════════════════════════════════════════════════════════
  // 5. PROTOCOL TIMELINE × WEIGHT
  // ════════════════════════════════════════════════════════════
  const protocolWeightData = useMemo(() => {
    if (!weightNutritionData.length || !protocols.length) return { series: [], hasProtocols: false };
    const activeProtocols = protocols.filter(p => p.active || p.start_date);
    if (!activeProtocols.length) return { series: weightNutritionData, hasProtocols: false };

    return {
      series: weightNutritionData,
      markers: activeProtocols.filter(p => p.start_date && p.start_date >= cutoff).map(p => ({
        date: fmt(p.start_date),
        rawDate: p.start_date,
        name: p.substance_name || p.name,
      })),
      hasProtocols: true,
    };
  }, [weightNutritionData, protocols, cutoff]);

  // ════════════════════════════════════════════════════════════
  // 6. ENERGY TREND over time (dual axis: sleep + energy)
  // ════════════════════════════════════════════════════════════
  const energySleepTrend = useMemo(() =>
    filteredCheckins.map(c => ({
      date: fmt(c.date),
      sleep: c.sleep_hours,
      energy: c.energy,
      mood: c.mood,
    })).filter(d => d.sleep || d.energy),
    [filteredCheckins]);

  // ════════════════════════════════════════════════════════════
  // 7. WEEKLY WORKOUT VOLUME trend
  // ════════════════════════════════════════════════════════════
  const weeklyVolumeData = useMemo(() => {
    const weeks = {};
    Object.entries(workoutByDate).forEach(([date, w]) => {
      const d = parseISO(date);
      if (!isValid(d)) return;
      const weekStart = format(subDays(d, d.getDay()), 'dd/MM');
      if (!weeks[weekStart]) weeks[weekStart] = { week: weekStart, load: 0, sessions: 0 };
      weeks[weekStart].load += w.load;
      weeks[weekStart].sessions++;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
  }, [workoutByDate]);

  // ════════════════════════════════════════════════════════════
  // Summary stats
  // ════════════════════════════════════════════════════════════
  const summaryStats = useMemo(() => {
    const weights = filteredMeasurements.map(m => m.weight).filter(Boolean);
    const energies = filteredCheckins.map(c => c.energy).filter(Boolean);
    const sleeps = filteredCheckins.map(c => c.sleep_hours).filter(Boolean);
    const workoutDays = Object.values(workoutByDate).filter(w => w.completed).length;
    return {
      avgWeight: avg(weights),
      weightDelta: weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null,
      avgEnergy: avg(energies),
      avgSleep: avg(sleeps),
      workoutDays,
      totalCheckins: filteredCheckins.length,
    };
  }, [filteredMeasurements, filteredCheckins, workoutByDate]);

  return (
    <div className="p-4 lg:p-8 max-w-5xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Insights</h1>
          <p className="text-[12px] text-[hsl(var(--fg-2))] mt-0.5">Correlações automáticas entre seus dados</p>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 p-1 bg-[hsl(var(--card-hi))] border border-[hsl(var(--border-h))] rounded-xl">
          {Object.keys(RANGE_DAYS).map(k => (
            <button key={k} onClick={() => setRange(k)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all
                ${range === k ? 'bg-[hsl(var(--card))] text-[hsl(var(--fg))] shadow-sm' : 'text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-[hsl(var(--fg-2))]">
          <Loader2 className="w-5 h-5 animate-spin" /> Calculando correlações...
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Peso médio',
                value: summaryStats.avgWeight ? `${summaryStats.avgWeight.toFixed(1)} kg` : '—',
                sub: summaryStats.weightDelta !== null
                  ? `${summaryStats.weightDelta > 0 ? '+' : ''}${summaryStats.weightDelta.toFixed(1)} kg no período`
                  : 'Registre medidas',
                icon: Scale,
                color: summaryStats.weightDelta < 0 ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--brand))]',
              },
              {
                label: 'Energia média',
                value: summaryStats.avgEnergy ? `${summaryStats.avgEnergy.toFixed(1)}/5` : '—',
                sub: `${summaryStats.totalCheckins} check-ins`,
                icon: Activity,
                color: 'text-[hsl(var(--warn))]',
              },
              {
                label: 'Sono médio',
                value: summaryStats.avgSleep ? `${summaryStats.avgSleep.toFixed(1)}h` : '—',
                sub: summaryStats.avgSleep >= 7 ? '✓ Meta atingida' : 'Abaixo de 7h recomendado',
                icon: Moon,
                color: summaryStats.avgSleep >= 7 ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--err))]',
              },
              {
                label: 'Treinos concluídos',
                value: summaryStats.workoutDays || '—',
                sub: `nos últimos ${days} dias`,
                icon: Dumbbell,
                color: 'text-[hsl(var(--brand))]',
              },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="surface p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} strokeWidth={2} />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))]">{s.label}</p>
                  </div>
                  <p className="text-[20px] font-bold tracking-tight">{s.value}</p>
                  <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5">{s.sub}</p>
                </div>
              );
            })}
          </div>

          {/* ── 1. Sleep → Next-day Energy ── */}
          <InsightCard
            title="Sono → Energia no dia seguinte"
            subtitle="Como as horas de sono afetam sua disposição no próximo dia"
            icon={Moon}
            r={rSleepEnergy}
            empty={sleepEnergyData.length < 5}
          >
            <div className="h-52">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="sleep" type="number" name="Sono (h)" domain={[4, 12]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} label={{ value: 'Sono (h)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis dataKey="nextEnergy" type="number" name="Energia" domain={[1, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                  <Scatter data={sleepEnergyData} fill={CHART_COLORS.sleep} opacity={0.75} name="Noites" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[hsl(var(--fg-2))] flex items-start gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Cada ponto representa uma noite de sono e a energia reportada no dia seguinte.
            </p>
          </InsightCard>

          {/* ── 2. Energy + Sleep trend ── */}
          <InsightCard
            title="Sono e Energia ao longo do tempo"
            subtitle="Evolução diária — identificar padrões e quedas"
            icon={Activity}
            empty={energySleepTrend.length < 5}
          >
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={energySleepTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--fg-2))' }} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" domain={[1, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[4, 12]} tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="energy" stroke={CHART_COLORS.energy} strokeWidth={2} dot={false} name="Energia (1-5)" />
                  <Line yAxisId="left" type="monotone" dataKey="mood" stroke={CHART_COLORS.mood} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Humor (1-5)" />
                  <Line yAxisId="right" type="monotone" dataKey="sleep" stroke={CHART_COLORS.sleep} strokeWidth={1.5} dot={false} name="Sono (h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>

          {/* ── 3. Weight × Nutrition ── */}
          <InsightCard
            title="Peso corporal × Nutrição"
            subtitle="Evolução do peso e ingestão calórica no mesmo período"
            icon={Scale}
            r={rWeightCal}
            empty={weightNutritionData.length < 3}
          >
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={weightNutritionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--fg-2))' }} interval="preserveStartEnd" />
                  <YAxis yAxisId="weight" domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis yAxisId="cal" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="weight" type="monotone" dataKey="weight" stroke={CHART_COLORS.weight} strokeWidth={2.5} dot={{ r: 3 }} name="Peso (kg)" connectNulls />
                  <Line yAxisId="cal" type="monotone" dataKey="cal" stroke={CHART_COLORS.calories} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Kcal" connectNulls />
                  {/* Protocol start markers */}
                  {protocolWeightData.markers?.map((m, i) => (
                    <ReferenceLine key={i} yAxisId="weight" x={m.date}
                      stroke={CHART_COLORS.protocol} strokeDasharray="3 3"
                      label={{ value: m.name, position: 'top', fontSize: 9, fill: CHART_COLORS.protocol }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {protocolWeightData.markers?.length > 0 && (
              <p className="text-[11px] text-[hsl(var(--fg-2))] flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Linhas verticais indicam início de protocolos ativos no período.
              </p>
            )}
          </InsightCard>

          {/* ── 4. Mood → Workout volume ── */}
          <InsightCard
            title="Humor → Volume de treino"
            subtitle="Seu humor no check-in do dia e o volume total treinado"
            icon={Dumbbell}
            r={rMoodWorkout}
            empty={moodWorkoutData.length < 4}
          >
            <div className="h-52">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="mood" type="number" name="Humor" domain={[1, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }}
                    label={{ value: 'Humor (1–5)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis dataKey="load" type="number" name="Volume (kg)" tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Scatter data={moodWorkoutData} fill={CHART_COLORS.workout_load} opacity={0.75} name="Sessões" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[hsl(var(--fg-2))] flex items-start gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Cada ponto é um dia com treino registrado. Volume = soma de reps × carga em todos os exercícios.
            </p>
          </InsightCard>

          {/* ── 4.5 Adherence: Check-in completion → Workout consistency ── */}
          {(() => {
            const adherenceData = [];
            const checkinsByDate = {};
            filteredCheckins.forEach(c => { checkinsByDate[c.date] = true; });
            Object.entries(workoutByDate).forEach(([date, w]) => {
              if (w.completed) {
                adherenceData.push({
                  date: fmt(date),
                  completedCheckin: checkinsByDate[date] ? 1 : 0,
                  workoutCompleted: 1,
                });
              }
            });
            const rCheckinWorkout = adherenceData.length >= 4 
              ? pearson(adherenceData.map(d => d.completedCheckin), adherenceData.map(d => d.workoutCompleted))
              : null;

            return (
              <InsightCard
                title="Check-in → Aderência de treino"
                subtitle="Dias com check-in completo vs. treinos realizados"
                icon={Activity}
                r={rCheckinWorkout}
                empty={adherenceData.length < 4}
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-[hsl(var(--brand)/0.06)]">
                    <p className="text-[11px] text-muted-foreground mb-1">Dias com ambos:</p>
                    <p className="text-[18px] font-bold text-[hsl(var(--brand))]">
                      {adherenceData.filter(d => d.completedCheckin && d.workoutCompleted).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Check-in + Treino</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(var(--shell))]">
                    <p className="text-[11px] text-muted-foreground mb-1">Apenas treino:</p>
                    <p className="text-[18px] font-bold">
                      {adherenceData.filter(d => !d.completedCheckin && d.workoutCompleted).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Sem check-in</p>
                  </div>
                </div>
                <p className="text-[11px] text-[hsl(var(--fg-2))] flex items-start gap-1.5 mt-3">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Treinos completados em dias com check-in tendem a ser mais consistentes.
                </p>
              </InsightCard>
            );
          })()}

          {/* ── 5. Hydration → Energy ── */}
          <InsightCard
            title="Hidratação → Energia"
            subtitle="Relação entre consumo de água e nível de energia diário"
            icon={Droplets}
            r={rHydrationEnergy}
            empty={hydrationEnergyData.length < 5}
          >
            <div className="h-52">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="water" type="number" name="Água (L)" domain={[0, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }}
                    label={{ value: 'Água (L)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis dataKey="energy" type="number" name="Energia" domain={[1, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Scatter data={hydrationEnergyData} fill={CHART_COLORS.water} opacity={0.75} name="Dias" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>

          {/* ── 6. Weekly workout volume trend ── */}
          <InsightCard
            title="Volume semanal de treino"
            subtitle="Carga acumulada por semana — identifica overtraining ou destreino"
            icon={TrendingUp}
            empty={weeklyVolumeData.length < 2}
          >
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={weeklyVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-h))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--fg-2))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--fg-2))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="load" fill={CHART_COLORS.workout_load} radius={[4, 4, 0, 0]} name="Volume (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>

          {/* ── Lab Exams ── */}
          {labExams.length >= 2 && (() => {
            // Flatten all markers across exams and show last 2 values side by side
            const allMarkers = {};
            labExams.slice(0, 6).forEach(exam => {
              (exam.markers || []).forEach(m => {
                if (!allMarkers[m.name]) allMarkers[m.name] = [];
                allMarkers[m.name].push({ date: fmt(exam.exam_date), value: m.value, unit: m.unit, status: m.status, ref_min: m.reference_min, ref_max: m.reference_max });
              });
            });
            const markerEntries = Object.entries(allMarkers).filter(([, vals]) => vals.length >= 2);
            if (!markerEntries.length) return null;

            return (
              <InsightCard
                title="Evolução de biomarcadores"
                subtitle="Marcadores laboratoriais com pelo menos 2 medições"
                icon={FlaskConical}
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  {markerEntries.slice(0, 6).map(([name, vals]) => {
                    const chartData = [...vals].sort((a, b) => a.date.localeCompare(b.date));
                    const last = chartData[chartData.length - 1];
                    const statusColor = { normal: 'text-[hsl(var(--ok))]', low: 'text-[hsl(var(--brand))]', high: 'text-[hsl(var(--err))]', critical: 'text-[hsl(var(--err))]' };
                    return (
                      <div key={name} className="bg-[hsl(var(--card-hi))] rounded-xl p-3 border border-[hsl(var(--border-h))]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] font-semibold">{name}</p>
                          {last.status && <span className={`text-[11px] font-semibold ${statusColor[last.status] || ''}`}>{last.status}</span>}
                        </div>
                        <div className="h-20">
                          <ResponsiveContainer>
                            <LineChart data={chartData}>
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--fg-2))' }} />
                              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--fg-2))' }} domain={['auto', 'auto']} />
                              <Tooltip content={<ChartTooltip />} />
                              {last.ref_min && <ReferenceLine y={last.ref_min} stroke="hsl(var(--ok))" strokeDasharray="3 3" />}
                              {last.ref_max && <ReferenceLine y={last.ref_max} stroke="hsl(var(--err))" strokeDasharray="3 3" />}
                              <Line type="monotone" dataKey="value" stroke={CHART_COLORS.protocol} strokeWidth={2} dot={{ r: 3 }} name={`${name} (${last.unit || ''})`} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[hsl(var(--fg-2))] flex items-start gap-1.5 mt-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Linhas verdes/vermelhas indicam os valores de referência do exame.
                </p>
              </InsightCard>
            );
          })()}

          {/* ── Empty state ── */}
          {filteredCheckins.length === 0 && filteredMeasurements.length === 0 && filteredWorkouts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Brain className="w-5 h-5" /></div>
              <p className="t-subtitle mb-2">Sem dados suficientes ainda</p>
              <p className="t-caption max-w-xs">
                Registre check-ins diários, medidas corporais e treinos por pelo menos 7 dias para começar a ver correlações automáticas.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}