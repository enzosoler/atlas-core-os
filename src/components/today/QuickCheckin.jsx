import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { getToday } from '@/lib/atlas-theme';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const rows = [
  { key: 'mood', label: 'Humor', min: 1, max: 5, step: 1, format: v => ['', 'Péssimo', 'Ruim', 'Neutro', 'Bom', 'Ótimo'][v] },
  { key: 'energy', label: 'Energia', min: 1, max: 5, step: 1, format: v => `${v}/5` },
  { key: 'sleep_hours', label: 'Sono', min: 3, max: 12, step: 0.5, format: v => `${v}h` },
  { key: 'hydration_liters', label: 'Água', min: 0, max: 5, step: 0.25, format: v => `${v.toFixed(1)}L` },
];

export default function QuickCheckin({ existingCheckin }) {
  const [vals, setVals] = useState({
    mood: existingCheckin?.mood || 3,
    energy: existingCheckin?.energy || 3,
    sleep_hours: existingCheckin?.sleep_hours || 7,
    hydration_liters: existingCheckin?.hydration_liters || 0,
  });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    const data = { date: getToday(), ...vals };
    if (existingCheckin?.id) {
      await base44.entities.DailyCheckin.update(existingCheckin.id, data);
    } else {
      await base44.entities.DailyCheckin.create(data);
    }
    qc.invalidateQueries({ queryKey: ['daily-checkin'] });
    toast.success('Check-in salvo');
    setSaving(false);
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Check-in</p>
        <Button onClick={handleSave} disabled={saving} size="sm"
          className="h-7 px-3 rounded-lg text-[12px] font-medium bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.85)] text-white">
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      {rows.map(row => (
        <div key={row.key} className="space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">{row.format(vals[row.key])}</span>
          </div>
          <Slider
            value={[vals[row.key]]}
            onValueChange={([v]) => setVals(p => ({ ...p, [row.key]: v }))}
            min={row.min} max={row.max} step={row.step}
          />
        </div>
      ))}
    </div>
  );
}