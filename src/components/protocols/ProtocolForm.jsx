import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProtocolForm({ protocol, onSuccess }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    category: 'supplement',
    substance_name: '',
    dose: '',
    frequency: '',
    route: 'oral',
    half_life_days: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    active: true,
    stock_quantity: '',
    stock_unit: '',
    daily_usage: '',
    notes: '',
  });

  const { data: substances = [] } = useQuery({
    queryKey: ['substances'],
    queryFn: () => base44.entities.SubstanceDatabase.list('-active', 200),
  });

  useEffect(() => {
    if (protocol) {
      setForm({
        name: protocol.name || '',
        category: protocol.category || 'supplement',
        substance_name: protocol.substance_name || '',
        dose: protocol.dose || '',
        frequency: protocol.frequency || '',
        route: protocol.route || 'oral',
        half_life_days: protocol.half_life_days || '',
        start_date: protocol.start_date || new Date().toISOString().split('T')[0],
        end_date: protocol.end_date || '',
        active: protocol.active !== false,
        stock_quantity: protocol.stock_quantity || '',
        stock_unit: protocol.stock_unit || '',
        daily_usage: protocol.daily_usage || '',
        notes: protocol.notes || '',
      });
    }
  }, [protocol]);

  const saveMut = useMutation({
    mutationFn: (data) =>
      protocol
        ? base44.entities.Protocol.update(protocol.id, data)
        : base44.entities.Protocol.create(data),
    onSuccess: () => {
      toast.success(protocol ? 'Updated!' : 'Protocol created!');
      qc.invalidateQueries({ queryKey: ['protocols'] });
      onSuccess?.();
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null) return;
      payload[k] = ['half_life_days', 'stock_quantity', 'daily_usage'].includes(k) ? Number(v) : v;
    });

    saveMut.mutate(payload);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="t-label block mb-1">Name</label>
        <Input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Protocol name"
          className="h-10 rounded-lg text-[13px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="t-label block mb-1">Category</label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="h-10 rounded-lg text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplement">Supplement</SelectItem>
              <SelectItem value="medication">Medication</SelectItem>
              <SelectItem value="hormone">Hormone</SelectItem>
              <SelectItem value="peptide">Peptide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="t-label block mb-1">Route</label>
          <Select value={form.route} onValueChange={v => setForm(f => ({ ...f, route: v }))}>
            <SelectTrigger className="h-10 rounded-lg text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="sublingual">Sublingual</SelectItem>
              <SelectItem value="intramuscular">IM</SelectItem>
              <SelectItem value="subcutaneous">SubQ</SelectItem>
              <SelectItem value="topical">Topical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="t-label block mb-1">Substance (optional)</label>
        <Select value={form.substance_name} onValueChange={v => setForm(f => ({ ...f, substance_name: v }))}>
          <SelectTrigger className="h-10 rounded-lg text-[12px]">
            <SelectValue placeholder="Search or type…" />
          </SelectTrigger>
          <SelectContent>
            {substances.map(s => (
              <SelectItem key={s.id} value={s.canonical_name || ''}>
                {s.canonical_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="t-label block mb-1">Dose</label>
          <Input
            value={form.dose}
            onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
            placeholder="e.g., 500mg"
            className="h-10 rounded-lg text-[12px]"
          />
        </div>

        <div>
          <label className="t-label block mb-1">Frequency</label>
          <Input
            value={form.frequency}
            onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
            placeholder="e.g., 2x daily"
            className="h-10 rounded-lg text-[12px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="t-label block mb-1">Start Date</label>
          <Input
            type="date"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            className="h-10 rounded-lg text-[12px]"
          />
        </div>

        <div>
          <label className="t-label block mb-1">End Date (optional)</label>
          <Input
            type="date"
            value={form.end_date}
            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            className="h-10 rounded-lg text-[12px]"
          />
        </div>
      </div>

      <div>
        <label className="t-label block mb-1">Half-Life (days)</label>
        <Input
          type="number"
          step="0.5"
          value={form.half_life_days}
          onChange={e => setForm(f => ({ ...f, half_life_days: e.target.value }))}
          placeholder="e.g., 7.5"
          className="h-10 rounded-lg text-[12px]"
        />
      </div>

      {/* Stock tracking */}
      <div className="pt-2 border-t border-[hsl(var(--border-h))]">
        <p className="t-label mb-2">Stock Tracking (optional)</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input
            type="number"
            value={form.stock_quantity}
            onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
            placeholder="Quantity"
            className="h-10 rounded-lg text-[12px]"
          />
          <Input
            value={form.stock_unit}
            onChange={e => setForm(f => ({ ...f, stock_unit: e.target.value }))}
            placeholder="Unit (tabs, ml, etc)"
            className="h-10 rounded-lg text-[12px]"
          />
        </div>
        <Input
          type="number"
          step="0.5"
          value={form.daily_usage}
          onChange={e => setForm(f => ({ ...f, daily_usage: e.target.value }))}
          placeholder="Daily usage (for stock calc)"
          className="h-10 rounded-lg text-[12px]"
        />
      </div>

      <div>
        <label className="t-label block mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Additional notes…"
          className="w-full h-16 p-3 rounded-lg border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[12px] text-[hsl(var(--fg))] placeholder:text-[hsl(var(--fg-2))] outline-none focus:border-[hsl(var(--brand)/0.4)]"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saveMut.isPending}
          className="btn btn-primary flex-1 h-10 rounded-lg text-[13px] gap-1.5"
        >
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {protocol ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  );
}