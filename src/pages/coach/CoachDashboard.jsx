import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import RoleGate from '@/components/rbac/RoleGate';
import { Users, TrendingUp, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, color, href }) {
  const inner = (
    <div className="surface p-5 flex items-center gap-4 hover:border-[hsl(var(--brand)/0.3)] transition-colors">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="kpi-sm">{value ?? '—'}</p>
        <p className="t-caption">{label}</p>
      </div>
      {href && <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-2)/0.4)] shrink-0" strokeWidth={2} />}
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

export default function CoachDashboard() {
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['coach-students', user?.email],
    queryFn: () => base44.entities.CoachStudent.filter({ coach_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const studentEmails = students.map(s => s.student_email);

  const { data: checkins = [] } = useQuery({
    queryKey: ['coach-checkins-recent'],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 50),
    enabled: studentEmails.length > 0,
  });

  const recentCheckins = checkins.filter(c => studentEmails.includes(c.created_by));
  const avgAdherence = recentCheckins.length > 0
    ? Math.round(recentCheckins.reduce((s, c) => s + (c.adherence_score || 0), 0) / recentCheckins.length)
    : null;

  const { data: workouts = [] } = useQuery({
    queryKey: ['coach-workouts-pending'],
    queryFn: () => base44.entities.Workout.list('-date', 100),
    enabled: studentEmails.length > 0,
  });

  const pendingWorkouts = workouts.filter(w => !w.completed && studentEmails.includes(w.created_by)).length;

  return (
    <RoleGate roles={['coach', 'admin']}>
      <div className="p-5 lg:p-8 max-w-4xl space-y-6">
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <h1 className="t-headline">Dashboard Coach</h1>
          <p className="t-small mt-1">Visão geral dos seus alunos</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 t-small text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <KpiCard icon={Users} label="Alunos ativos" value={students.length} color="hsl(var(--brand))" href="/coach/students" />
              <KpiCard icon={TrendingUp} label="Aderência média" value={avgAdherence !== null ? `${avgAdherence}%` : 'N/A'} color="hsl(var(--ok))" />
              <KpiCard icon={ClipboardList} label="Treinos pendentes" value={pendingWorkouts} color="hsl(var(--warn))" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="t-label">Alunos recentes</p>
                <Link to="/coach/students" className="t-caption text-[hsl(var(--brand))] hover:underline">Ver todos →</Link>
              </div>
              {students.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Users className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
                  <p className="t-subtitle mb-1">Nenhum aluno vinculado</p>
                  <p className="t-caption">Adicione alunos para acompanhá-los aqui.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.slice(0, 5).map(s => (
                    <Link key={s.id} to={`/coach/student/${s.student_email}`} className="surface flex items-center gap-3 px-4 py-3 hover:border-[hsl(var(--brand)/0.2)] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--brand))] text-[14px] shrink-0">
                        {(s.student_name || s.student_email)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{s.student_name || s.student_email}</p>
                        <p className="t-caption truncate">{s.student_email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-2)/0.4)] shrink-0" strokeWidth={2} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RoleGate>
  );
}