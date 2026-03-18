import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { formatDate, getToday } from '@/lib/atlas-theme';
import MeasurementInsights from '@/components/measurements/MeasurementInsights';

const METRICS = [
  { key: 'weight',   label: 'Peso',      unit: 'kg' },
  { key: 'body_fat', label: 'Gordura',   unit: '%'  },
  { key: 'waist',    label: 'Cintura',   unit: 'cm' },
  { key: 'chest',    label: 'Peitoral',  unit: 'cm' },
  { key: 'arms',     label: 'Braços',    unit: 'cm' },
  { key: 'thighs',   label: 'Coxas',    unit: 'cm' },
  { key: 'hips',     label: 'Quadril',   unit: 'cm' },
  { key: 'neck',     label: 'Pescoço',   unit: 'cm' },
];
const ACCENT = 'hsl(var(--brand))';
const EMPTY = { date: getToday(), weight: '', body_fat: '', waist: '', chest: '', arms: '', thighs: '', hips: '', neck: '' };

function Trend({ curr, prev }) {
  if (!curr || !prev) return null;
  const d = curr - prev;
  if (Math.abs(d) < 0.1) return <Minus className="w-3 h-3 text-[hsl(var(--fg-2))]" strokeWidth={2} />;
  return d > 0
    ? <TrendingUp className="w-3 h-3 text-[hsl(var(--err))]" strokeWidth={2} />
    : <TrendingDown className="w-3 h-3 text-[hsl(var(--ok))]" strokeWidth={2} />;
}

export default function Measurements() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [active, setActive] = useState('weight');
  const qc = useQueryClient();

  const { data: measurements } = useQuery({ queryKey: ['measurements'], queryFn: () => base44.entities.Measurement.list('-date', 60), initialData: [] });
  const createM = useMutation({ mutationFn: d => base44.entities.Measurement.create(d), onSuccess: () => { qc.invalidateQueries(['measurements']); setShowAdd(false); setForm(EMPTY); toast.success('Medida registrada'); } });
  const deleteM = useMutation({ mutationFn: id => base44.entities.Measurement.delete(id), onSuccess: () => qc.invalidateQueries(['measurements']) });

  const save = () => {
    const p = { date: form.date };
    METRICS.forEach(m => { if (form[m.key] !== '') p[m.key] = +form[m.key]; });
    createM.mutate(p);
  };

  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted.at(-1), prev = sorted.at(-2);
  const chart = sorted.map(m => ({ date: new Date(m.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), v: m[active] })).filter(d => d.v != null);
  const activeCfg = METRICS.find(m => m.key === active);

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medidas</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Evolução corporal ao longo do tempo</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-9 rounded-lg text-[13px] bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.85)] text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Registrar
        </Button>
      </div>

      {/* Latest grid */}
      {latest && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {METRICS.map(m => latest[m.key] != null && (
              <button key={m.key} onClick={() => setActive(m.key)}
                className={`p-4 rounded-xl text-left transition-all border ${active === m.key ? 'border-[hsl(var(--brand)/0.4)] bg-[hsl(var(--brand)/0.06)]' : 'surface hover:border-[hsl(var(--brand)/0.2)]'}`}>
                <p className="t-label mb-1">{m.label}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="kpi-sm">{latest[m.key]}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5">{m.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Trend curr={latest[m.key]} prev={prev?.[m.key]} />
                  {prev?.[m.key] && (
                    <span className="text-[10px] text-muted-foreground">{Math.abs(latest[m.key] - prev[m.key]).toFixed(1)}{m.unit}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Auto Insights */}
          <MeasurementInsights measurements={measurements} latest={latest} prev={prev} />
        </>
      )}

      {/* Chart */}
      <div className="card p-5">
        <p className="t-label mb-4">{activeCfg?.label} — evolução</p>
        {chart.length >= 2 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={32} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex flex-col items-center justify-center border-2 border-dashed border-[hsl(var(--border-h))] rounded-xl bg-[hsl(var(--shell)/0.4)]">
            <p className="text-[13px] text-[hsl(var(--fg-2))]">Registre pelo menos 2 medidas para ver a evolução</p>
            <p className="text-[11px] text-[hsl(var(--fg-2))/0.6] mt-1">O gráfico aparecerá automaticamente</p>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="space-y-3">
        <p className="t-label">Histórico Completo</p>
        {measurements.length === 0 ? (
          <div className="text-center py-14 card border-dashed"><p className="text-[13px] text-muted-foreground">Nenhuma medida registrada</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[hsl(var(--border-h))]">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Data</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Peso</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Gordura</th>
                  {['waist', 'chest', 'arms'].map(k => (
                    <th key={k} className="text-center px-4 py-3 font-semibold text-muted-foreground">{METRICS.find(m => m.key === k)?.label}</th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...measurements].sort((a, b) => new Date(b.date) - new Date(a.date)).map((m, i) => {
                  const prevM = measurements.find(x => new Date(x.date) < new Date(m.date));
                  return (
                    <tr key={m.id} className="border-b border-[hsl(var(--border-h))] hover:bg-[hsl(var(--shell)/0.3)]">
                      <td className="px-4 py-3 font-medium">{formatDate(m.date)}</td>
                      <td className="text-center px-4 py-3">
                        <span className="font-semibold">{m.weight}</span>
                        {prevM?.weight && (
                          <span className={`text-[10px] block ${m.weight < prevM.weight ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--warn))]'}`}>
                            {m.weight < prevM.weight ? '−' : '+'}{Math.abs(m.weight - prevM.weight).toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {m.body_fat ? (
                          <>
                            <span className="font-semibold">{m.body_fat}%</span>
                            {prevM?.body_fat && (
                              <span className={`text-[10px] block ${m.body_fat < prevM.body_fat ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--warn))]'}`}>
                                {m.body_fat < prevM.body_fat ? '−' : '+'}{Math.abs(m.body_fat - prevM.body_fat).toFixed(1)}%
                              </span>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      {['waist', 'chest', 'arms'].map(k => (
                        <td key={k} className="text-center px-4 py-3 text-[11px]">{m[k] || '—'}</td>
                      ))}
                      <td className="text-center px-4 py-3">
                        <button onClick={() => deleteM.mutate(m.id)} className="text-muted-foreground/40 hover:text-[hsl(var(--err))] transition-colors">
                          <Trash2 className="w-3.5 h-3.5 mx-auto" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[15px]">Registrar medidas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="section-label block mb-1.5">Data</label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map(m => (
                <div key={m.key}>
                  <label className="section-label block mb-1.5">{m.label} ({m.unit})</label>
                  <Input type="number" step="0.1" inputMode="decimal" placeholder="—" value={form[m.key]} onChange={e => setForm(f => ({ ...f, [m.key]: e.target.value }))} className="h-9 rounded-lg text-[13px]" />
                </div>
              ))}
            </div>
            <Button onClick={save} disabled={createM.isPending} className="w-full h-11 rounded-lg bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.85)] text-white text-[13px] font-semibold">
              Salvar medidas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}