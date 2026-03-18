import React, { useState } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FIELDS = [
  { key: 'name',    label: 'Nome do alimento', type: 'text',   placeholder: 'Ex: Frango assado caseiro', required: true },
  { key: 'amount',  label: 'Quantidade',       type: 'number', placeholder: '100', required: true },
  { key: 'unit',    label: 'Unidade',          type: 'text',   placeholder: 'g, ml, unidade...', required: true },
  { key: 'kcal',    label: 'Calorias (kcal)',  type: 'number', placeholder: '0', required: true },
  { key: 'protein', label: 'Proteína (g)',     type: 'number', placeholder: '0' },
  { key: 'carbs',   label: 'Carboidratos (g)', type: 'number', placeholder: '0' },
  { key: 'fat',     label: 'Gordura (g)',      type: 'number', placeholder: '0' },
  { key: 'fiber',   label: 'Fibra (g)',        type: 'number', placeholder: '0' },
];

export default function ManualFoodEntry({ onAdd, onBack }) {
  const [form, setForm] = useState({ name: '', amount: '100', unit: 'g', kcal: '', protein: '', carbs: '', fat: '', fiber: '' });

  const isValid = form.name.trim() && form.amount && form.kcal;

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({
      name: form.name.trim(),
      amount: parseFloat(form.amount) || 100,
      unit: form.unit || 'g',
      kcal: parseFloat(form.kcal) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      fiber: parseFloat(form.fiber) || 0,
      _manual: true,
    });
    setForm({ name: '', amount: '100', unit: 'g', kcal: '', protein: '', carbs: '', fat: '', fiber: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors text-[hsl(var(--fg-2))]">
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <p className="text-[13px] font-semibold">Adicionar manualmente</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(f => (
          <div key={f.key} className={f.key === 'name' ? 'col-span-2' : ''}>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] block mb-1">
              {f.label}{f.required && <span className="text-[hsl(var(--err))] ml-0.5">*</span>}
            </label>
            <Input
              type={f.type}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              inputMode={f.type === 'number' ? 'decimal' : 'text'}
              className="h-9 rounded-lg text-[13px]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        disabled={!isValid}
        className="btn btn-primary w-full h-10 rounded-xl text-[13px] gap-1.5 disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar alimento
      </button>
    </div>
  );
}