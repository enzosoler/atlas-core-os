import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ClientPdfExport({ link, measurements, meals, photos, exams, diets }) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = pageW - 2 * margin;
      let y = margin;

      const brand = [59, 130, 246];
      const textColor = [17, 24, 39];
      const muted = [107, 114, 128];
      const divider = [229, 231, 235];

      const addPage = () => { doc.addPage(); y = margin; };
      const checkPage = (needed = 20) => { if (y + needed > 275) addPage(); };

      // ── HEADER ──
      doc.setFillColor(...brand);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Atlas Core', margin, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório Nutricional do Paciente', margin, 26);
      doc.text(new Date().toLocaleDateString('pt-BR'), pageW - margin, 26, { align: 'right' });

      y = 50;

      // ── PATIENT INFO ──
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(link.client_name || link.client_email, margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...muted);
      doc.text(link.client_email, margin, y);
      y += 5;
      doc.text(`Vínculo desde: ${link.invited_at || '—'} · Status: ${link.status === 'accepted' ? 'Ativo' : link.status}`, margin, y);
      y += 12;

      doc.setDrawColor(...divider);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 10;

      // ── SUMMARY STATS ──
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Resumo', margin, y);
      y += 8;

      const latestM = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const activeDiet = diets.find(d => d.active) || diets[0];
      const stats = [
        ['Peso atual', latestM?.weight ? `${latestM.weight} kg` : '—'],
        ['Gordura corporal', latestM?.body_fat ? `${latestM.body_fat}%` : '—'],
        ['Refeições registradas', meals.length],
        ['Medições registradas', measurements.length],
        ['Plano alimentar ativo', activeDiet ? activeDiet.name : 'Nenhum'],
        ['Exames laboratoriais', exams.length],
        ['Fotos de progresso', photos.length],
      ];

      const colW = (contentW - 4) / 2;
      stats.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (colW + 4);
        const rowY = y + row * 14;
        checkPage(14);
        doc.setFillColor(246, 248, 251);
        doc.rect(x, rowY - 5, colW, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text(label, x + 4, rowY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(String(value), x + 4, rowY + 6);
      });

      y += Math.ceil(stats.length / 2) * 14 + 10;

      // ── ACTIVE DIET PLAN ──
      if (activeDiet) {
        checkPage(30);
        doc.setDrawColor(...divider);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.text('Plano Alimentar Ativo', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text(`${activeDiet.name} · Criado em: ${activeDiet.start_date || '—'} · Objetivo: ${activeDiet.objective || '—'}`, margin, y);
        y += 6;
        if (activeDiet.total_calories) {
          doc.text(`Metas: ${activeDiet.total_calories} kcal · P:${activeDiet.total_protein}g · C:${activeDiet.total_carbs}g · G:${activeDiet.total_fat}g`, margin, y);
          y += 6;
        }

        (activeDiet.meals || []).forEach(m => {
          checkPage(20);
          y += 4;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(`${m.name || m.meal_type || ''}${m.time ? ' · ' + m.time : ''}`, margin, y);
          y += 5;
          (m.foods || []).forEach(f => {
            checkPage(6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...muted);
            doc.text(`  • ${f.name} ${f.amount}${f.unit} — ${f.kcal || 0}kcal P:${f.protein || 0}g C:${f.carbs || 0}g G:${f.fat || 0}g`, margin, y);
            y += 5;
          });
        });
        y += 4;
      }

      // ── MEASUREMENTS ──
      if (measurements.length > 0) {
        checkPage(30);
        doc.setDrawColor(...divider);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.text('Histórico de Medidas', margin, y);
        y += 7;

        const sorted = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
        sorted.forEach(m => {
          checkPage(8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...textColor);
          const parts = [m.date];
          if (m.weight) parts.push(`${m.weight}kg`);
          if (m.body_fat) parts.push(`${m.body_fat}% BF`);
          if (m.waist) parts.push(`cintura ${m.waist}cm`);
          if (m.arms) parts.push(`braços ${m.arms}cm`);
          doc.text(parts.join(' · '), margin, y);
          y += 6;
        });
        y += 4;
      }

      // ── LAB EXAMS ──
      if (exams.length > 0 && link.permissions?.can_view_lab_exams) {
        checkPage(30);
        doc.setDrawColor(...divider);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.text('Exames Laboratoriais', margin, y);
        y += 7;

        exams.slice(0, 5).forEach(e => {
          checkPage(20);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(`${e.panel_name} — ${e.exam_date}`, margin, y);
          y += 5;
          (e.markers || []).slice(0, 6).forEach(mk => {
            checkPage(6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const flag = mk.status === 'high' ? ' ↑' : mk.status === 'low' ? ' ↓' : mk.status === 'critical' ? ' ⚠' : '';
            doc.setTextColor(mk.status === 'normal' || !mk.status ? muted[0] : mk.status === 'critical' ? 200 : 160, mk.status === 'critical' ? 0 : muted[1], muted[2]);
            doc.text(`  ${mk.name}: ${mk.value}${mk.unit}${flag}`, margin, y);
            y += 5;
          });
          y += 3;
        });
      }

      // ── FOOTER ──
      const totalPages = doc.internal.pages.length - 1;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...divider);
        doc.setLineWidth(0.3);
        doc.line(margin, 285, pageW - margin, 285);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text('Gerado por Atlas Core', margin, 291);
        doc.text(`Página ${p} de ${totalPages}`, pageW - margin, 291, { align: 'right' });
      }

      const safeName = (link.client_name || link.client_email).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      doc.save(`atlas-core_relatorio_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="btn btn-secondary gap-1.5 h-9"
      title="Exportar relatório em PDF"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileDown className="w-4 h-4" />}
      Exportar PDF
    </button>
  );
}