import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import RoleGate from '@/components/rbac/RoleGate';
import { Users, FlaskConical, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';

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

export default function ClinicianDashboard() {
  const { user } = useAuth();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['clinician-patients', user?.email],
    queryFn: () => base44.entities.ClinicianPatient.filter({ clinician_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const patientEmails = patients.map(p => p.patient_email);

  const { data: exams = [] } = useQuery({
    queryKey: ['clinician-exams'],
    queryFn: () => base44.entities.LabExam.list('-exam_date', 50),
    enabled: patientEmails.length > 0,
  });

  const { data: protocols = [] } = useQuery({
    queryKey: ['clinician-protocols'],
    queryFn: () => base44.entities.Protocol.list('-created_date', 100),
    enabled: patientEmails.length > 0,
  });

  const patientExams = exams.filter(e => patientEmails.includes(e.created_by));
  const patientProtocols = protocols.filter(p => patientEmails.includes(p.created_by) && p.active);

  return (
    <RoleGate roles={['clinician', 'admin']}>
      <div className="p-5 lg:p-8 max-w-4xl space-y-6">
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <h1 className="t-headline">Dashboard Clínico</h1>
          <p className="t-small mt-1">Visão geral dos seus pacientes</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 t-small text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <KpiCard icon={Users} label="Pacientes ativos" value={patients.length} color="hsl(var(--ok))" href="/clinician/patients" />
              <KpiCard icon={FlaskConical} label="Exames registrados" value={patientExams.length} color="hsl(var(--brand))" />
              <KpiCard icon={ClipboardList} label="Protocolos ativos" value={patientProtocols.length} color="hsl(var(--brand-ai))" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="t-label">Pacientes recentes</p>
                <Link to="/clinician/patients" className="t-caption text-[hsl(var(--brand))] hover:underline">Ver todos →</Link>
              </div>
              {patients.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Users className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
                  <p className="t-subtitle mb-1">Nenhum paciente vinculado</p>
                  <p className="t-caption">Adicione pacientes para acompanhá-los aqui.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.slice(0, 5).map(p => (
                    <Link key={p.id} to={`/clinician/patient/${p.patient_email}`} className="surface flex items-center gap-3 px-4 py-3 hover:border-[hsl(var(--ok)/0.2)] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[hsl(var(--ok)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--ok))] text-[14px] shrink-0">
                        {(p.patient_name || p.patient_email)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{p.patient_name || p.patient_email}</p>
                        <p className="t-caption truncate">{p.patient_email}</p>
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