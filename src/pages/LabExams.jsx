import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import { motion } from 'framer-motion';
import { Plus, Heart, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, getToday } from '@/lib/atlas-theme';

const STATUS_CONFIG = {
  normal:   { label: 'Normal',  cls: 'badge badge-ok' },
  low:      { label: 'Baixo',   cls: 'badge badge-warn' },
  high:     { label: 'Alto',    cls: 'badge badge-err' },
  critical: { label: 'Crítico', cls: 'badge badge-err' },
};

const emptyMarker = () => ({ name: '', value: '', unit: '', reference_min: '', reference_max: '', status: 'normal' });

export default function LabExams() {
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ exam_date: getToday(), panel_name: '', markers: [emptyMarker()], notes: '' });
  const [importing, setImporting] = useState(false);
  const qc = useQueryClient();

  const { data: exams } = useQuery({
    queryKey: ['lab-exams'],
    queryFn: () => base44.entities.LabExam.list('-exam_date', 50),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.LabExam.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-exams'] }); setShowAdd(false); toast.success('Exame registrado!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LabExam.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-exams'] }),
  });

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          panel_name: { type: "string" },
          exam_date: { type: "string" },
          markers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "number" },
                unit: { type: "string" },
                reference_min: { type: "number" },
                reference_max: { type: "number" },
                status: { type: "string", enum: ["normal", "low", "high", "critical"] },
              }
            }
          }
        }
      }
    });
    if (result.status === 'success') {
      const data = result.output;
      setForm(f => ({ ...f, panel_name: data.panel_name || f.panel_name, exam_date: data.exam_date || f.exam_date, markers: data.markers?.length ? data.markers.map(m => ({ ...m, value: String(m.value), reference_min: String(m.reference_min || ''), reference_max: String(m.reference_max || '') })) : f.markers }));
      toast.success(`Importado ${result.output.markers?.length || 0} marcadores!`);
    } else {
      toast.error('Erro ao importar arquivo');
    }
    setImporting(false);
    e.target.value = '';
  };

  const addMarker = () => setForm(f => ({ ...f, markers: [...f.markers, emptyMarker()] }));
  const removeMarker = (i) => setForm(f => ({ ...f, markers: f.markers.filter((_, j) => j !== i) }));
  const updateMarker = (i, field, value) => setForm(f => {
    const markers = [...f.markers];
    markers[i] = { ...markers[i], [field]: value };
    return { ...f, markers };
  });

  const handleSave = () => {
    const payload = {
      ...form,
      markers: form.markers.filter(m => m.name).map(m => ({
        ...m,
        value: m.value !== '' ? Number(m.value) : undefined,
        reference_min: m.reference_min !== '' ? Number(m.reference_min) : undefined,
        reference_max: m.reference_max !== '' ? Number(m.reference_max) : undefined,
      })),
    };
    createMutation.mutate(payload);
  };

  const getExamSummary = (exam) => {
    const markers = exam.markers || [];
    const abnormal = markers.filter(m => m.status && m.status !== 'normal').length;
    return { total: markers.length, abnormal };
  };

  const markerTrends = useMemo(() => {
    const trends = {};
    exams.forEach(exam => {
      exam.markers?.forEach(marker => {
        if (!trends[marker.name]) {
          trends[marker.name] = [];
        }
        trends[marker.name].push({
          date: exam.exam_date,
          value: marker.value,
          status: marker.status,
        });
      });
    });
    return trends;
  }, [exams]);

  return (
    <div className="p-5 lg:p-8 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-[hsl(var(--border-h))]">
        <div>
          <h1 className="t-headline flex items-center gap-2">
            <Heart className="w-6 h-6 text-[hsl(var(--err))]" strokeWidth={1.75} /> Exames
          </h1>
          <p className="t-small mt-1">Centralize e acompanhe seus resultados laboratoriais</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn btn-primary h-9 rounded-lg text-[13px]">
          <Plus className="w-4 h-4 mr-2" /> Novo exame
        </Button>
      </div>

      {/* Exams list */}
      {exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Heart className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
          <p className="t-subtitle mb-1">Nenhum exame registrado</p>
          <p className="t-caption">Adicione exames manualmente ou importe um PDF.</p>
        </div>
      ) : (
        <>
          {/* Marker trends */}
          {Object.keys(markerTrends).length > 0 && (
            <div className="space-y-3">
              <p className="t-subtitle">Key Markers Over Time</p>
              {Object.entries(markerTrends).filter(([_, data]) => data.length > 1).map(([markerName, data]) => {
                const latest = data[data.length - 1];
                const oldest = data[0];
                const change = latest.value - oldest.value;
                const isUp = change > 0;
                return (
                  <div key={markerName} className="surface rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-bold">{markerName}</p>
                      <span className={`text-[12px] font-medium ${isUp ? 'text-[hsl(var(--warn))]' : 'text-[hsl(var(--ok))]'}`}>
                        {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-end justify-between h-12 gap-1">
                      {data.map((d, i) => {
                        const height = (d.value / Math.max(...data.map(x => x.value))) * 100;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t-lg transition-all opacity-70 hover:opacity-100 ${
                              d.status === 'normal' ? 'bg-[hsl(var(--ok))]' : 'bg-[hsl(var(--warn))]'
                            }`}
                            style={{ height: `${height}%` }}
                            title={`${d.value} on ${d.date}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Exams list */}
          {exams.map(exam => {
            const { total, abnormal } = getExamSummary(exam);
            const isExpanded = expanded[exam.id];
            return (
          <motion.div key={exam.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="surface overflow-hidden">
            <button onClick={() => setExpanded(e => ({ ...e, [exam.id]: !e[exam.id] }))} className="w-full p-5 flex items-center justify-between text-left">
              <div>
                <h3 className="font-bold">{exam.panel_name}</h3>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatDate(exam.exam_date)}</span>
                  <span>{total} marcadores</span>
                  {abnormal > 0 && <span className="text-[hsl(var(--warn))] flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{abnormal} alterados</span>}
                  {abnormal === 0 && total > 0 && <span className="text-[hsl(var(--ok))] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Todos normais</span>}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(exam.id); }} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-5 pb-5 space-y-2 border-t border-border pt-3">
                {(exam.markers || []).map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{m.value} {m.unit}</span>
                      {m.reference_min != null && m.reference_max != null && (
                        <span className="text-xs text-muted-foreground">Ref: {m.reference_min}–{m.reference_max}</span>
                      )}
                      {m.status && <span className={STATUS_CONFIG[m.status]?.cls || 'badge badge-neutral'}>{STATUS_CONFIG[m.status]?.label}</span>}
                    </div>
                  </div>
                ))}
                {exam.notes && <p className="text-xs text-muted-foreground italic mt-2">{exam.notes}</p>}
              </div>
            )}
          </motion.div>
          );
          })}
          </>
          )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg bg-[hsl(var(--card))] border-[hsl(var(--border-h))] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo exame</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Import from file */}
            <label className={`flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-[hsl(var(--border-h))] cursor-pointer hover:border-[hsl(var(--brand)/0.4)] transition-colors t-small text-[hsl(var(--fg-2))] ${importing ? 'opacity-70 pointer-events-none' : ''}`}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importando...' : 'Importar PDF ou imagem do exame'}
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleImportFile} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Painel / exame</label>
                <Input placeholder="Ex: Hemograma, Hormônios" value={form.panel_name} onChange={e => setForm(f => ({ ...f, panel_name: e.target.value }))} className="rounded-2xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                <Input type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} className="rounded-2xl" />
              </div>
            </div>

            {/* Markers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Marcadores</label>
                <button onClick={addMarker} className="text-[12px] text-[hsl(var(--brand))] hover:text-[hsl(var(--brand)/0.8)] flex items-center gap-1 font-medium">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {form.markers.map((m, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                    <Input placeholder="Nome" value={m.name} onChange={e => updateMarker(i, 'name', e.target.value)} className="rounded-xl h-8 text-xs col-span-2" />
                    <Input type="number" placeholder="Valor" value={m.value} onChange={e => updateMarker(i, 'value', e.target.value)} className="rounded-xl h-8 text-xs" />
                    <Input placeholder="Unidade" value={m.unit} onChange={e => updateMarker(i, 'unit', e.target.value)} className="rounded-xl h-8 text-xs" />
                    <button onClick={() => removeMarker(i)} className="text-muted-foreground hover:text-red-400 flex justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
              <Textarea placeholder="Observações..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-2xl resize-none h-20" />
            </div>

            <Button onClick={handleSave} disabled={!form.panel_name || createMutation.isPending} className="btn btn-primary w-full h-11 rounded-xl text-[14px]">
              Salvar exame
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}