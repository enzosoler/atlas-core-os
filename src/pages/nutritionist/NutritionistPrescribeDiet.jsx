import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import RoleGate from '@/components/rbac/RoleGate';

const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'pre_workout', 'post_workout'];

export default function NutritionistPrescribeDiet() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_email: '',
    name: '',
    description: '',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fat: '',
    target_water: '',
    meals: [],
    restrictions: [],
    frequency: 'daily',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    active: true,
    notes: '',
  });

  const { data: client } = useQuery({
    queryKey: ['nutritionist-client', clientId],
    queryFn: () => clientId ? base44.entities.NutritionistClientLink.filter({ id: clientId }).then(r => r?.[0]) : null,
  });

  useEffect(() => {
    if (client) setForm(f => ({ ...f, client_email: client.client_email }));
  }, [client]);

  const saveMut = useMutation({
    mutationFn: (data) => base44.entities.PrescribedDiet.create(data),
    onSuccess: () => {
      toast.success('Dieta prescrita com sucesso!');
      qc.invalidateQueries(['nutritionist-client']);
      navigate(-1);
    },
  });

  const addMeal = () => {
    setForm(f => ({
      ...f,
      meals: [...f.meals, { meal_type: 'breakfast', foods: [] }],
    }));
  };

  const handleSave = () => {
    if (!form.client_email || !form.name) {
      toast.error('Nome e email do cliente são obrigatórios');
      return;
    }
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      if (['target_calories', 'target_protein', 'target_carbs', 'target_fat', 'target_water'].includes(k)) payload[k] = Number(v);
      else payload[k] = v;
    });
    saveMut.mutate(payload);
  };

  return (
    <RoleGate roles={['nutritionist']}>
      <div className="p-5 lg:p-8 space-y-6 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div>
          <h1 className="t-headline mb-1">Prescrever Dieta</h1>
          <p className="t-caption">Crie um plano nutricional para {client?.client_name}</p>
        </div>

        <div className="surface rounded-xl p-5 space-y-4">
          <div>
            <label className="t-label block mb-1.5">Nome do Plano</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Cutting Phase, Bulk Protocol" className="h-10 rounded-lg text-[13px]" />
          </div>

          <div>
            <label className="t-label block mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do plano…" className="w-full h-20 p-3 rounded-lg border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[13px] outline-none focus:border-[hsl(var(--brand)/0.4)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="t-label block mb-1.5">Calorias diárias</label>
              <Input type="number" value={form.target_calories} onChange={e => setForm(f => ({ ...f, target_calories: e.target.value }))} placeholder="2200" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Proteína (g)</label>
              <Input type="number" value={form.target_protein} onChange={e => setForm(f => ({ ...f, target_protein: e.target.value }))} placeholder="160" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Carboidratos (g)</label>
              <Input type="number" value={form.target_carbs} onChange={e => setForm(f => ({ ...f, target_carbs: e.target.value }))} placeholder="250" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Gordura (g)</label>
              <Input type="number" value={form.target_fat} onChange={e => setForm(f => ({ ...f, target_fat: e.target.value }))} placeholder="70" className="h-10 rounded-lg text-[13px]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="t-label block mb-1.5">Água (L/dia)</label>
              <Input type="number" step="0.5" value={form.target_water} onChange={e => setForm(f => ({ ...f, target_water: e.target.value }))} placeholder="3" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Frequência</label>
              <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekdays">Dias úteis</SelectItem>
                  <SelectItem value="weekends">Finais de semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="t-label block mb-1.5">Data inicial</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-10 rounded-lg text-[13px]" />
            </div>
          </div>

          <div>
            <label className="t-label block mb-1.5">Restrições</label>
            <Input value={form.restrictions.join(', ')} onChange={e => setForm(f => ({ ...f, restrictions: e.target.value.split(',').map(r => r.trim()).filter(r => r) }))} placeholder="Ex: sem lácteos, vegano, gluten-free" className="h-10 rounded-lg text-[13px]" />
          </div>

          <div>
            <label className="t-label block mb-1.5">Observações</label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais…" className="h-10 rounded-lg text-[13px]" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saveMut.isPending} className="btn btn-primary w-full h-11 rounded-xl text-[14px] gap-2">
          {saveMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : <><Save className="w-4 h-4" /> Prescrever Dieta</>}
        </button>
      </div>
    </RoleGate>
  );
}