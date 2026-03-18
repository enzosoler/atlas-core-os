import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import { Download, FileText, Loader2, Calendar, BarChart3, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

function generateReportFilename(userName, startDate, endDate, reportType = 'relatorio-de-evolucao') {
  const cleanName = userName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  return `atlas-core_${reportType}_${cleanName}_${startDate}_a_${endDate}.pdf`;
}

function createPremiumPDF(report, fileName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - 2 * margin;

  // ── Design tokens ──
  const C = {
    brand:      [59, 130, 246],   // #3B82F6
    brandDark:  [29,  78, 216],   // #1D4ED8
    brandLight: [219, 234, 254],  // #DBEAFE
    accent:     [99,  102, 241],  // #6366F1
    bg:         [248, 250, 252],  // #F8FAFC
    white:      [255, 255, 255],
    text:       [15,  23,  42],   // #0F172A
    muted:      [100, 116, 139],  // #64748B
    divider:    [226, 232, 240],  // #E2E8F0
    ok:         [22,  163,  74],  // #16A34A
    warn:       [202, 138,  4],   // #CA8A04
    err:        [220,  38,  38],  // #DC2626
  };

  // ── Helpers ──
  const setColor = (c) => doc.setTextColor(...c);
  const setFill  = (c) => doc.setFillColor(...c);
  const setDraw  = (c) => doc.setDrawColor(...c);

  const boldText = (str, x, y, size = 10, color = C.text, opts = {}) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    setColor(color);
    doc.text(String(str), x, y, opts);
  };
  const normalText = (str, x, y, size = 10, color = C.text, opts = {}) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    setColor(color);
    doc.text(String(str), x, y, opts);
  };

  const hrLine = (y, color = C.divider, lw = 0.3) => {
    setDraw(color);
    doc.setLineWidth(lw);
    doc.line(margin, y, pageW - margin, y);
  };

  const fillRect = (x, y, w, h, color) => {
    setFill(color);
    doc.rect(x, y, w, h, 'F');
  };

  const roundRect = (x, y, w, h, r, color) => {
    setFill(color);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };

  // ── Section header helper ──
  const sectionHeader = (title, y) => {
    fillRect(margin, y, contentW, 8, C.brandLight);
    boldText(title, margin + 3, y + 5.5, 10, C.brandDark);
    return y + 12;
  };

  // ── Logo mark (geometric "A" symbol) ──
  const drawLogo = (x, y, size = 10) => {
    // Blue circle background
    setFill(C.white);
    doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
    setFill(C.brand);
    doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
    // "A" letter
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size * 0.65);
    setColor(C.white);
    doc.text('A', x + size / 2, y + size / 2 + size * 0.22, { align: 'center' });
  };

  // ══════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════

  // Top hero band
  fillRect(0, 0, pageW, 58, C.brand);

  // Subtle diagonal accent
  setFill(C.brandDark);
  doc.triangle(pageW - 60, 0, pageW, 0, pageW, 58, 'F');

  // Logo mark
  drawLogo(margin, 10, 14);

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setColor(C.white);
  doc.text('Atlas Core', margin + 18, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório de Evolução & Performance', margin + 18, 27);

  // Date badge (top right)
  const dateStr = new Date(report.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  normalText(dateStr, pageW - margin, 24, 8, C.white, { align: 'right' });

  // White content area start
  let y = 68;

  // User name block
  boldText(report.user?.name || 'Atleta', margin, y, 18, C.text);
  y += 7;
  normalText(`${report.user?.email || ''}`, margin, y, 9, C.muted);
  y += 5;
  normalText(`Período: ${report.period.start}  →  ${report.period.end}`, margin, y, 9, C.muted);
  y += 12;

  hrLine(y, C.brand, 0.8);
  y += 10;

  // ── KPI cards ──
  const kpis = [
    report.metrics.latest_weight   ? { label: 'Peso atual',   value: `${report.metrics.latest_weight}kg`, c: C.brand  } : null,
    report.stats.workouts_total > 0 ? { label: 'Treinos',     value: `${report.stats.workouts_completed}/${report.stats.workouts_total}`, c: C.ok } : null,
    report.metrics.workout_adherence > 0 ? { label: 'Aderência', value: `${report.metrics.workout_adherence}%`, c: C.accent } : null,
    report.stats.meals > 0          ? { label: 'Refeições',   value: String(report.stats.meals), c: C.warn } : null,
    report.stats.checkins > 0       ? { label: 'Check-ins',   value: String(report.stats.checkins), c: C.brand } : null,
  ].filter(Boolean).slice(0, 4);

  if (kpis.length > 0) {
    const gap = 3;
    const kw = (contentW - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach((kpi, i) => {
      const kx = margin + i * (kw + gap);
      roundRect(kx, y, kw, 22, 2, kpi.c);
      // label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setColor(C.white);
      doc.text(kpi.label, kx + kw / 2, y + 7, { align: 'center' });
      // value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(kpi.value, kx + kw / 2, y + 16, { align: 'center' });
    });
    y += 30;
  }

  // ── Executive Summary ──
  y = sectionHeader('Resumo Executivo', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(C.text);
  const summaryLines = doc.splitTextToSize(report.summary || 'Sem resumo disponível.', contentW);
  summaryLines.forEach((line) => {
    if (y > pageH - 22) { doc.addPage(); y = margin + 10; }
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 8;

  // ── Body Measurements ──
  if (report.measurements?.length > 0) {
    if (y > pageH - 50) { doc.addPage(); y = margin + 10; }
    y = sectionHeader('Evolução Corporal', y);

    // Table header
    fillRect(margin, y, contentW, 7, C.bg);
    boldText('Data',      margin + 2, y + 5, 8.5, C.muted);
    boldText('Peso',      margin + 38, y + 5, 8.5, C.muted);
    boldText('Gordura',   margin + 60, y + 5, 8.5, C.muted);
    boldText('Cintura',   margin + 82, y + 5, 8.5, C.muted);
    boldText('Braços',    margin + 104, y + 5, 8.5, C.muted);
    y += 10;

    const measRows = [...(report.measurements || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    measRows.forEach((m, idx) => {
      if (y > pageH - 20) { doc.addPage(); y = margin + 10; }
      if (idx % 2 === 0) fillRect(margin, y - 4, contentW, 7, C.bg);
      normalText(m.date,              margin + 2,   y, 9, C.text);
      normalText(m.weight   ? `${m.weight}kg`    : '—', margin + 38, y, 9, C.text);
      normalText(m.body_fat ? `${m.body_fat}%`   : '—', margin + 60, y, 9, C.text);
      normalText(m.waist    ? `${m.waist}cm`     : '—', margin + 82, y, 9, C.text);
      normalText(m.arms     ? `${m.arms}cm`      : '—', margin + 104, y, 9, C.text);
      y += 7;
    });

    // Delta summary
    if (measRows.length >= 2) {
      const first = measRows[measRows.length - 1];
      const last  = measRows[0];
      const delta = last.weight && first.weight ? (last.weight - first.weight).toFixed(1) : null;
      if (delta !== null) {
        y += 3;
        const deltaColor = parseFloat(delta) <= 0 ? C.ok : C.err;
        roundRect(margin, y, 60, 10, 2, deltaColor);
        setColor(C.white);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(`Variação: ${delta > 0 ? '+' : ''}${delta}kg no período`, margin + 4, y + 6.5);
        y += 14;
      }
    }
    y += 4;
  }

  // ── Active Protocols ──
  if (report.active_protocols?.length > 0) {
    if (y > pageH - 50) { doc.addPage(); y = margin + 10; }
    y = sectionHeader('Protocolos Ativos', y);

    report.active_protocols.slice(0, 10).forEach((p, idx) => {
      if (y > pageH - 20) { doc.addPage(); y = margin + 10; }
      if (idx % 2 === 0) fillRect(margin, y - 4, contentW, 7, C.bg);
      boldText(`• ${p.name}`, margin + 2, y, 9, C.text);
      const detail = [p.dose, p.frequency, p.route].filter(Boolean).join('  ·  ');
      if (detail) normalText(detail, margin + 55, y, 8.5, C.muted);
      y += 7;
    });
    y += 5;
  }

  // ── Lab Exams ──
  if (report.recent_lab_exams?.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = margin + 10; }
    y = sectionHeader('Exames Laboratoriais', y);

    report.recent_lab_exams.forEach((exam) => {
      if (y > pageH - 40) { doc.addPage(); y = margin + 10; }

      boldText(`${exam.exam_date}  —  ${exam.panel_name}`, margin + 2, y, 9.5, C.brandDark);
      y += 6;

      (exam.markers || []).slice(0, 6).forEach((marker) => {
        if (y > pageH - 20) { doc.addPage(); y = margin + 10; }
        const statusColor = { normal: C.ok, low: C.brand, high: C.err, critical: C.err }[marker.status] || C.muted;
        const statusLabel = { normal: '✓', low: '↓', high: '↑', critical: '⚠' }[marker.status] || '';
        normalText(`   ${marker.name}`, margin + 2, y, 8.5, C.text);
        normalText(`${marker.value}${marker.unit || ''}`, margin + 80, y, 8.5, C.text);
        if (statusLabel) boldText(statusLabel, margin + 110, y, 8.5, statusColor);
        if (marker.reference_min != null && marker.reference_max != null) {
          normalText(`ref: ${marker.reference_min}–${marker.reference_max}`, margin + 120, y, 7.5, C.muted);
        }
        y += 5.5;
      });
      y += 4;
    });
  }

  // ══════════════════════════════════════════
  // FOOTER — all pages
  // ══════════════════════════════════════════
  const totalPages = doc.internal.pages.length - 1; // jsPDF internal pages is 1-indexed
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Bottom band
    fillRect(0, pageH - 14, pageW, 14, C.brand);

    // Logo mark small
    drawLogo(margin, pageH - 11, 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(C.white);
    doc.text('Atlas Core', margin + 11, pageH - 6);

    doc.setFont('helvetica', 'normal');
    setColor([180, 210, 255]);
    doc.text('Relatório confidencial — gerado automaticamente', margin + 30, pageH - 6);

    doc.setFont('helvetica', 'normal');
    setColor(C.white);
    doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
  }

  doc.save(fileName);
}

export default function Export() {
  const { can } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastReport, setLastReport] = useState(null);

  // Check entitlement
  if (!can('standard_exports')) {
    return (
      <div className="h-screen flex items-center justify-center p-5">
        <UpgradeGate feature="standard_exports" plan="Pro" title="Exportar Dados — Plano Pro+" description="Exporte relatórios PDF e planilhas CSV com seu histórico completo" />
      </div>
    );
  }

  const handleExport = async (format) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('exportReport', { type: 'full', startDate, endDate });
      if (!res.data?.success) {
        toast.error('Erro ao gerar relatório');
        setLoading(false);
        return;
      }

      const report = res.data.report;
      setLastReport(report);

      if (format === 'pdf') {
        const fileName = generateReportFilename(report.user?.name || 'usuario', startDate, endDate);
        createPremiumPDF(report, fileName);
        toast.success('PDF exportado com sucesso!');
      }

      if (format === 'csv') {
        const rows = [
          ['Data', 'Peso (kg)', 'Gordura (%)', 'Cintura (cm)', 'Peito (cm)', 'Braços (cm)', 'Coxas (cm)', 'Quadril (cm)', 'Pescoço (cm)'],
          ...(report.measurements || []).map((m) => [
            m.date,
            m.weight || '',
            m.body_fat || '',
            m.waist || '',
            m.chest || '',
            m.arms || '',
            m.thighs || '',
            m.hips || '',
            m.neck || '',
          ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlas-core_medicoes_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exportado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[hsl(var(--border-h))]">
        <h1 className="t-headline">Exportar dados</h1>
        <p className="t-small mt-1">Gere relatórios premium e exporte seu histórico</p>
      </div>

      {/* Period selector */}
      <div className="surface p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-[hsl(var(--brand))]" strokeWidth={2} />
          <p className="t-subtitle">Período</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="t-label block mb-1.5">Data inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-lg text-[13px]"
            />
          </div>
          <div>
            <label className="t-label block mb-1.5">Data final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-lg text-[13px]"
            />
          </div>
        </div>
      </div>

      {/* Export options */}
      <div className="space-y-3">
        <p className="t-label">Formatos disponíveis</p>

        <div className="surface p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--err)/0.08)] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[hsl(var(--err))]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="t-subtitle">Relatório de Evolução</p>
                <p className="t-caption mt-0.5">PDF premium com resumo executivo, métricas, medições, protocolos e exames</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar
            </button>
          </div>
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--ok)/0.08)] flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-[hsl(var(--ok))]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="t-subtitle">Medições CSV</p>
                <p className="t-caption mt-0.5">Planilha com histórico completo de peso, gordura e circunferências</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar
            </button>
          </div>
        </div>
      </div>

      {lastReport && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--ok)/0.07)] border border-[hsl(var(--ok)/0.2)]">
          <CheckCircle className="w-4 h-4 text-[hsl(var(--ok))] shrink-0" strokeWidth={2} />
          <p className="t-small text-[hsl(var(--fg))]">
            Relatório gerado — {lastReport.stats.measurements} medições · {lastReport.stats.meals} refeições · {lastReport.stats.workouts_completed} treinos concluídos
          </p>
        </div>
      )}
    </div>
  );
}