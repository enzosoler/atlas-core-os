import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function RoutineForm({ onSuccess }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    estimated_duration_minutes: 45,
    total_exercises: 0,
    days_of_week: [],
  });
  const [selectedDays, setSelectedDays] = useState(new Set());

  const { data: workouts = [] } = useQuery({
    queryKey: ['prescribed-workouts', user?.email],
    queryFn: () => base44.entities.PrescribedWorkout?.filter?.({ athlete_email: user?.email }) ?? [],
    enabled: !!user?.email,
  });

  const createRoutine = useMutation({
    mutationFn: async (data) => {
      const daysData = Array.from(selectedDays).map(dayNum => ({
        day: dayNum,
        name: DAYS_PT[dayNum],
        workout_id: null,
        workout_name: null,
      }));

      const routineData = {
        ...data,
        athlete_email: user?.email,
        days_of_week: daysData,
        active: true,
        is_prescribed: false,
      };

      return base44.entities.Routine.create(routineData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Rotina criada com sucesso');
      onSuccess?.();
    },
    onError: (err) => {
      toast.error('Erro ao criar rotina: ' + err.message);
    },
  });

  const toggleDay = (dayNum) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayNum)) {
      newSelected.delete(dayNum);
    } else {
      newSelected.add(dayNum);
    }
    setSelectedDays(newSelected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Nome da rotina é obrigatório');
      return;
    }

    if (selectedDays.size === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    createRoutine.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
          Nome da Rotina
        </label>
        <Input
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Upper/Lower Split, Full Body 4x"
          className="h-10 rounded-lg text-[13px]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
          Descrição
        </label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descreva a rotina (opcional)"
          className="h-20 rounded-lg text-[13px] resize-none"
        />
      </div>

      {/* Duration & Exercises */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
            Duração (minutos)
          </label>
          <Input
            type="number"
            value={form.estimated_duration_minutes}
            onChange={(e) => setForm(f => ({ ...f, estimated_duration_minutes: Number(e.target.value) }))}
            min={5}
            max={300}
            className="h-10 rounded-lg text-[13px]"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
            Total de Exercícios
          </label>
          <Input
            type="number"
            value={form.total_exercises}
            onChange={(e) => setForm(f => ({ ...f, total_exercises: Number(e.target.value) }))}
            min={0}
            max={50}
            className="h-10 rounded-lg text-[13px]"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div>
        <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-2">
          Dias da Semana
        </label>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_PT.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <input
                type="checkbox"
                id={`day-${idx}`}
                checked={selectedDays.has(idx)}
                onChange={() => toggleDay(idx)}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <label htmlFor={`day-${idx}`} className="text-[10px] font-medium text-muted-foreground cursor-pointer">
                {day.slice(0, 3)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={createRoutine.isPending || selectedDays.size === 0}
        className="w-full h-11 rounded-lg bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.85)] text-white font-semibold text-[13px]"
      >
        {createRoutine.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Criando…
          </>
        ) : (
          'Criar rotina'
        )}
      </Button>
    </form>
  );
}