import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGate from '@/components/rbac/RoleGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Loader2, UtensilsCrossed, Dumbbell, BarChart3, ClipboardList } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate } from '@/lib/atlas-theme';
import CoachAdherenceScore from '@/components/coach/CoachAdherenceScore';
import WorkoutComparisonCard from '@/components/coach/WorkoutComparisonCard';
import StudentProgressMetrics from '@/components/coach/StudentProgressMetrics';

const MEAL_TYPE_LABELS = {
  breakfast: 'Café', morning_snack: 'Lanche M', lunch: 'Almoço',
  afternoon_snack: 'Lanche T', dinner: 'Jantar', evening_snack: 'Ceia',
  pre_workout: 'Pré-treino', post_workout: 'Pós-treino',
};

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border-h))] last:border-0">
      <span className="t-small text-[hsl(var(--fg-2))]">{label}</span>
      <span className="text-[13px] font-semibold">{value ?? '—'}</span>
    </div>
  );
}

function SummaryTab({ email }) {
  const { data: checkins = [] } = useQuery({
    queryKey: ['student-checkins', email],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 30),
  });
  const { data: workouts = [] } = useQuery({
    queryKey: ['student-workouts', email],
    queryFn: () => base44.entities.Workout.list('-date', 30),
  });
  const { data: meals = [] } = useQuery({
    queryKey: ['student-meals-recent', email],
    queryFn: () => base44.entities.Meal.list('-date', 30),
  });
  const { data: measurements = [] } = useQuery({
    queryKey: ['student-measurements', email],
    queryFn: () => base44.entities.Measurement.list('-date', 20),
  });
  const { data: prescribedWorkouts = [] } = useQuery({
    queryKey: ['student-prescribed-workouts', email],
    queryFn: () => base44.entities.PrescribedWorkout.filter({ active: true }),
  });

  return (
    <div className="space-y-5">
      {/* Adherence Score */}
      <CoachAdherenceScore checkins={checkins} workouts={workouts} meals={meals} days={7} />

      {/* Progress Metrics */}
      <StudentProgressMetrics measurements={measurements} checkins={checkins} workouts={workouts} />

      {/* Workout Comparison */}
      {prescribedWorkouts.length > 0 && (
        <WorkoutComparisonCard 
          prescribedWorkout={prescribedWorkouts[0]} 
          loggedWorkouts={workouts}
          dateRange={7}
        />
      )}
    </div>
  );
}

function DietTab() {
  const { data: plans = [] } = useQuery({
    queryKey: ['student-diet'],
    queryFn: () => base44.entities.DietPlan.filter({ active: true }),
  });
  const plan = plans[0];
  if (!plan) return <p className="t-caption p-4">Sem plano alimentar ativo.</p>;
  return (
    <div className="surface p-5 space-y-3">
      <p className="t-subtitle">{plan.name}</p>
      {plan.objective && <p className="t-body text-[hsl(var(--fg-2))]">{plan.objective}</p>}
      <div className="flex flex-wrap gap-3 t-small">
        <span>🔥 {plan.total_calories ?? '—'} kcal</span>
        <span>💪 P {plan.total_protein ?? '—'}g</span>
        <span>🍞 C {plan.total_carbs ?? '—'}g</span>
        <span>🥑 G {plan.total_fat ?? '—'}g</span>
      </div>
      {(plan.meals || []).map((m, i) => (
        <div key={i} className="p-3 rounded-xl bg-[hsl(var(--shell))]">
          <p className="text-[13px] font-semibold">{m.name}{m.time ? ` — ${m.time}` : ''}</p>
          <p className="t-caption mt-0.5">{m.total_calories ?? 0} kcal · P {m.total_protein ?? 0}g</p>
        </div>
      ))}
    </div>
  );
}

function WorkoutTab() {
  const { data: plans = [] } = useQuery({
    queryKey: ['student-workout-plan'],
    queryFn: () => base44.entities.WorkoutPlan.filter({ active: true }),
  });
  const plan = plans[0];
  if (!plan) return <p className="t-caption p-4">Sem plano de treino ativo.</p>;
  return (
    <div className="surface p-5 space-y-3">
      <p className="t-subtitle">{plan.name}</p>
      {plan.split && <span className="badge badge-neutral">{plan.split}</span>}
      {plan.objective && <p className="t-body text-[hsl(var(--fg-2))]">{plan.objective}</p>}
      {(plan.sessions || []).map((s, i) => (
        <div key={i} className="p-3 rounded-xl bg-[hsl(var(--shell))] space-y-1">
          <p className="text-[13px] font-semibold">{s.label}{s.day_name ? ` — ${s.day_name}` : ''}</p>
          {s.focus && <p className="t-caption">{s.focus}</p>}
          <p className="t-caption">{(s.exercises || []).length} exercícios</p>
        </div>
      ))}
    </div>
  );
}

function AdherenceTab() {
  const { data: checkins = [] } = useQuery({
    queryKey: ['student-checkins-full'],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 14),
  });
  return (
    <div className="space-y-2">
      {checkins.length === 0 ? <p className="t-caption p-4">Sem check-ins recentes.</p> : checkins.map(c => (
        <div key={c.id} className="surface px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-semibold">{formatDate(c.date)}</p>
            {c.adherence_score && <span className="badge badge-ok">{c.adherence_score}%</span>}
          </div>
          <div className="flex flex-wrap gap-4 t-caption">
            {c.mood && <span>😊 {c.mood}/5</span>}
            {c.energy && <span>⚡ {c.energy}/5</span>}
            {c.sleep_hours && <span>🌙 {c.sleep_hours}h sono</span>}
            {c.hydration_liters && <span>💧 {c.hydration_liters}L</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressTab() {
  const { data: measurements = [] } = useQuery({
    queryKey: ['student-measurements'],
    queryFn: () => base44.entities.Measurement.list('-date', 20),
  });
  const chartData = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => ({
    date: new Date(m.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Peso: m.weight,
    Gordura: m.body_fat,
  })).filter(d => d.Peso);

  return (
    <div className="space-y-4">
      {chartData.length >= 2 ? (
        <div className="surface p-5">
          <p className="t-label mb-4">Evolução de peso</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={32} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="Peso" stroke="hsl(var(--brand))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : <p className="t-caption p-4">Dados insuficientes para gráfico.</p>}
      {measurements.slice(0, 5).map(m => (
        <div key={m.id} className="surface px-4 py-3">
          <p className="text-[13px] font-semibold mb-1">{formatDate(m.date)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 t-caption">
            {m.weight && <span>Peso: <b>{m.weight}kg</b></span>}
            {m.body_fat && <span>Gordura: <b>{m.body_fat}%</b></span>}
            {m.waist && <span>Cintura: <b>{m.waist}cm</b></span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoachStudentProfile() {
  const { id: studentEmail } = useParams();

  const { data: studentRecord } = useQuery({
    queryKey: ['coach-student-record', studentEmail],
    queryFn: () => base44.entities.CoachStudent.filter({ student_email: studentEmail }),
  });

  const student = studentRecord?.[0];
  const displayName = student?.student_name || studentEmail;

  return (
    <RoleGate roles={['coach', 'admin']}>
      <div className="p-5 lg:p-8 max-w-3xl space-y-6">
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <Link to="/coach/students" className="flex items-center gap-1 t-caption text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-3 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} /> Voltar para alunos
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--brand))] text-[17px] shrink-0">
              {displayName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="t-title">{displayName}</h1>
              <p className="t-caption">{studentEmail}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="bg-[hsl(var(--card-hi))] border border-[hsl(var(--border))] h-10 rounded-xl w-full p-1 gap-1 flex-wrap">
            {[['summary','Resumo'], ['diet','Dieta'], ['workout','Treino'], ['adherence','Aderência'], ['progress','Progresso']].map(([v, l]) => (
              <TabsTrigger key={v} value={v}
                className="flex-1 rounded-lg text-[11px] font-medium h-8 transition-all data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:text-[hsl(var(--fg))] data-[state=active]:shadow-sm text-[hsl(var(--fg-2))]">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary" className="mt-4"><SummaryTab email={studentEmail} /></TabsContent>
          <TabsContent value="diet" className="mt-4"><DietTab /></TabsContent>
          <TabsContent value="workout" className="mt-4"><WorkoutTab /></TabsContent>
          <TabsContent value="adherence" className="mt-4"><AdherenceTab /></TabsContent>
          <TabsContent value="progress" className="mt-4"><ProgressTab /></TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}