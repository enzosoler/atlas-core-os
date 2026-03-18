import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGate from '@/components/rbac/RoleGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Loader2, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate } from '@/lib/atlas-theme';
import { toast } from 'sonner';

const ROUTES = { oral:'Oral', sublingual:'Sublingual', intramuscular:'IM', subcutaneous:'SC', topical:'Tópico', intravenous:'IV', nasal:'Nasal', other:'Outro' };
const STATUS_BADGE = { normal:'badge-ok', low:'badge-warn', high:'badge-warn', critical:'badge-err' };
const CATEGORIES = { front:'Frente', back:'Costas', side:'Lateral', pose:'Pose' };

function MacroSummary({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="kpi-sm" style={{ color }}>{value ?? '—'}</p>
      <p className="t-caption">{label}</p>
    </div>
  );
}

function OverviewTab({ email }) {
  const { data: checkins = [] } = useQuery({ queryKey: ['cp-checkins', email], queryFn: () => base44.entities.DailyCheckin.list('-date', 7) });
  const { data: measurements = [] } = useQuery({ queryKey: ['cp-measurements', email], queryFn: () => base44.entities.Measurement.list('-date', 1) });
  const { data: protocols = [] } = useQuery({ queryKey: ['cp-protocols', email], queryFn: () => base44.entities.Protocol.filter({ active: true }) });
  const { data: exams = [] } = useQuery({ queryKey: ['cp-exams', email], queryFn: () => base44.entities.LabExam.list('-exam_date', 3) });

  const latest = measurements[0];
  const avgMood = checkins.length ? (checkins.reduce((s, c) => s + (c.mood || 0), 0) / checkins.length).toFixed(1) : null;

  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <p className="t-label mb-3">Visão geral</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MacroSummary label="Peso" value={latest?.weight ? `${latest.weight}kg` : null} color="hsl(var(--brand))" />
          <MacroSummary label="Gordura" value={latest?.body_fat ? `${latest.body_fat}%` : null} color="hsl(var(--warn))" />
          <MacroSummary label="Humor médio" value={avgMood ? `${avgMood}/5` : null} color="hsl(var(--ok))" />
          <MacroSummary label="Protocolos" value={protocols.length} color="hsl(var(--brand-ai))" />
        </div>
      </div>
      {exams.length > 0 && (
        <div className="surface p-4">
          <p className="t-label mb-2">Último exame</p>
          <p className="text-[13px] font-semibold">{exams[0].panel_name}</p>
          <p className="t-caption">{formatDate(exams[0].exam_date)}</p>
        </div>
      )}
    </div>
  );
}

function ExamsTab() {
  const { data: exams = [] } = useQuery({ queryKey: ['cp-exams-all'], queryFn: () => base44.entities.LabExam.list('-exam_date', 20) });
  if (exams.length === 0) return <p className="t-caption p-4">Sem exames registrados.</p>;
  return (
    <div className="space-y-3">
      {exams.map(exam => (
        <div key={exam.id} className="surface p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] font-semibold">{exam.panel_name}</p>
            <p className="t-caption">{formatDate(exam.exam_date)}</p>
          </div>
          {(exam.markers || []).length > 0 && (
            <div className="space-y-1.5">
              {exam.markers.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="text-[hsl(var(--fg))]">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.value} {m.unit}</span>
                    {m.status && <span className={`badge ${STATUS_BADGE[m.status] || 'badge-neutral'}`}>{m.status}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {exam.notes && <p className="t-caption italic">{exam.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function MeasurementsTab() {
  const { data: measurements = [] } = useQuery({ queryKey: ['cp-measurements-all'], queryFn: () => base44.entities.Measurement.list('-date', 20) });
  const chartData = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => ({
    date: new Date(m.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Peso: m.weight, Gordura: m.body_fat,
  })).filter(d => d.Peso);

  return (
    <div className="space-y-4">
      {chartData.length >= 2 && (
        <div className="surface p-5">
          <p className="t-label mb-4">Evolução</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={32} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="Peso" stroke="hsl(var(--brand))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Gordura" stroke="hsl(var(--warn))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {measurements.map(m => (
        <div key={m.id} className="surface px-4 py-3">
          <p className="text-[13px] font-semibold mb-1">{formatDate(m.date)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 t-caption">
            {m.weight && <span>Peso <b>{m.weight}kg</b></span>}
            {m.body_fat && <span>Gordura <b>{m.body_fat}%</b></span>}
            {m.waist && <span>Cintura <b>{m.waist}cm</b></span>}
            {m.arms && <span>Braços <b>{m.arms}cm</b></span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotosTab() {
  const { data: photos = [] } = useQuery({ queryKey: ['cp-photos'], queryFn: () => base44.entities.ProgressPhoto.list('-date', 20) });
  if (photos.length === 0) return <p className="t-caption p-4">Sem fotos registradas.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map(p => (
        <div key={p.id} className="relative rounded-xl overflow-hidden">
          <img src={p.photo_url} alt="" className="w-full aspect-[3/4] object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-white text-[11px]">{CATEGORIES[p.category] || p.category}</p>
            <p className="text-white/70 text-[10px]">{formatDate(p.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProtocolsTab() {
  const { data: protocols = [] } = useQuery({ queryKey: ['cp-protocols-all'], queryFn: () => base44.entities.Protocol.list('-created_date', 30) });
  if (protocols.length === 0) return <p className="t-caption p-4">Sem protocolos registrados.</p>;
  return (
    <div className="space-y-2">
      {protocols.map(p => (
        <div key={p.id} className={`surface px-4 py-3 ${!p.active ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold">{p.name}</p>
            <span className={`badge ${p.active ? 'badge-ok' : 'badge-neutral'}`}>{p.active ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 t-caption">
            {p.substance_name && <span>{p.substance_name}</span>}
            {p.dose && <span className="font-semibold text-[hsl(var(--fg))]">{p.dose}</span>}
            {p.frequency && <span>{p.frequency}</span>}
            {p.route && <span>{ROUTES[p.route]}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExportsTab({ patientEmail }) {
  const exportCSV = async () => {
    const [exams, measurements, protocols] = await Promise.all([
      base44.entities.LabExam.list('-exam_date', 50),
      base44.entities.Measurement.list('-date', 50),
      base44.entities.Protocol.list('-created_date', 50),
    ]);

    const rows = [
      ['Tipo', 'Data', 'Detalhe', 'Valor'],
      ...measurements.map(m => ['Medida', m.date, 'Peso', m.weight ?? '']),
      ...measurements.map(m => ['Medida', m.date, 'Gordura %', m.body_fat ?? '']),
      ...exams.flatMap(e => (e.markers || []).map(mk => ['Exame', e.exam_date, mk.name, `${mk.value} ${mk.unit}`])),
      ...protocols.map(p => ['Protocolo', p.start_date || '', p.name, p.dose || '']),
    ];

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `paciente_${patientEmail}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  return (
    <div className="surface p-5 space-y-4">
      <p className="t-label">Exportações</p>
      <p className="t-body text-[hsl(var(--fg-2))]">Exporte os dados clínicos do paciente para CSV para uso externo ou análise.</p>
      <button onClick={exportCSV} className="btn btn-primary gap-1.5 h-10">
        <Download className="w-4 h-4" /> Exportar CSV
      </button>
    </div>
  );
}

export default function ClinicianPatientProfile() {
  const { id: patientEmail } = useParams();

  const { data: patientRecord } = useQuery({
    queryKey: ['clinician-patient-record', patientEmail],
    queryFn: () => base44.entities.ClinicianPatient.filter({ patient_email: patientEmail }),
  });

  const patient = patientRecord?.[0];
  const displayName = patient?.patient_name || patientEmail;

  return (
    <RoleGate roles={['clinician', 'admin']}>
      <div className="p-5 lg:p-8 max-w-3xl space-y-6">
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <Link to="/clinician/patients" className="flex items-center gap-1 t-caption text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-3 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} /> Voltar para pacientes
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[hsl(var(--ok)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--ok))] text-[17px] shrink-0">
              {displayName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="t-title">{displayName}</h1>
              <p className="t-caption">{patientEmail}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-[hsl(var(--card-hi))] border border-[hsl(var(--border))] h-10 rounded-xl w-full p-1 gap-1 flex-wrap">
            {[['overview','Resumo'], ['exams','Exames'], ['measurements','Medidas'], ['photos','Fotos'], ['protocols','Protocolos'], ['exports','Exportar']].map(([v, l]) => (
              <TabsTrigger key={v} value={v}
                className="flex-1 rounded-lg text-[10px] font-medium h-8 transition-all data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:text-[hsl(var(--fg))] data-[state=active]:shadow-sm text-[hsl(var(--fg-2))]">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="mt-4"><OverviewTab email={patientEmail} /></TabsContent>
          <TabsContent value="exams" className="mt-4"><ExamsTab /></TabsContent>
          <TabsContent value="measurements" className="mt-4"><MeasurementsTab /></TabsContent>
          <TabsContent value="photos" className="mt-4"><PhotosTab /></TabsContent>
          <TabsContent value="protocols" className="mt-4"><ProtocolsTab /></TabsContent>
          <TabsContent value="exports" className="mt-4"><ExportsTab patientEmail={patientEmail} /></TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}