import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Copy, Trash2, CheckCircle2, Clock, Dumbbell, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import RoutineCard from '@/components/routines/RoutineCard';
import RoutineForm from '@/components/routines/RoutineForm';

const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function Routines() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [cloneSource, setCloneSource] = useState(null);
  const qc = useQueryClient();

  const { data: routines = [] } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ athlete_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: prescribedRoutines = [] } = useQuery({
    queryKey: ['prescribed-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ athlete_email: user?.email, is_prescribed: true }),
    enabled: !!user?.email,
  });

  const deleteRoutine = useMutation({
    mutationFn: (id) => base44.entities.Routine.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Rotina deletada');
    },
  });

  const cloneRoutine = useMutation({
    mutationFn: async (source) => {
      const newRoutine = {
        ...source,
        id: undefined,
        name: `${source.name} (Cópia)`,
        created_date: undefined,
        updated_date: undefined,
      };
      delete newRoutine.id;
      return base44.entities.Routine.create(newRoutine);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      setShowClone(false);
      setCloneSource(null);
      toast.success('Rotina clonada com sucesso');
    },
  });

  const userRoutines = routines.filter(r => !r.is_prescribed);
  const activeRoutine = routines.find(r => r.active);

  return (
    <div className="p-5 lg:p-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rotinas de Treino</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Organize seus treinos em rotinas estruturadas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="h-9 rounded-lg text-[13px] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.85)] text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nova rotina
        </Button>
      </div>

      {/* Active Routine Highlight */}
      {activeRoutine && (
        <div className="surface border-[hsl(var(--ok)/0.3)] bg-[hsl(var(--ok)/0.02)] p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--ok)/0.12)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--ok))]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-[hsl(var(--ok))] tracking-wider">Rotina Ativa</p>
                <p className="text-[15px] font-bold text-foreground mt-0.5">{activeRoutine.name}</p>
              </div>
            </div>
            {activeRoutine.last_completed_date && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Último completado</p>
                <p className="text-[13px] font-semibold">{new Date(activeRoutine.last_completed_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>

          {/* Days of Week Visual */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {DAYS_ABBR.map((abbr, i) => {
              const dayWorkout = activeRoutine.days_of_week?.find(d => d.day === i);
              return (
                <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  dayWorkout
                    ? 'bg-[hsl(var(--ok)/0.15)] border border-[hsl(var(--ok)/0.3)]'
                    : 'bg-[hsl(var(--secondary))] border border-transparent'
                }`}>
                  <p className="text-[10px] font-semibold text-foreground">{abbr}</p>
                  {dayWorkout && (
                    <Dumbbell className="w-3.5 h-3.5 text-[hsl(var(--ok))]" strokeWidth={2} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 text-[12px] text-muted-foreground">
            {activeRoutine.estimated_duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-foreground/40" strokeWidth={2} />
                <span>{activeRoutine.estimated_duration_minutes}min por sessão</span>
              </div>
            )}
            {activeRoutine.total_exercises && (
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-foreground/40" strokeWidth={2} />
                <span>{activeRoutine.total_exercises} exercícios</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Routines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="t-label">Todas as rotinas ({userRoutines.length})</p>
        </div>

        {userRoutines.length === 0 ? (
          <div className="text-center py-12 card border-dashed space-y-3">
            <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">Nenhuma rotina criada</p>
            <button onClick={() => setShowCreate(true)} className="text-[13px] text-[hsl(var(--brand))] font-medium hover:underline">
              + Criar primeira rotina
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRoutines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onDelete={() => deleteRoutine.mutate(routine.id)}
                onClone={() => {
                  setCloneSource(routine);
                  setShowClone(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prescribed Routines */}
      {prescribedRoutines.length > 0 && (
        <div>
          <p className="t-label mb-3">Rotinas Prescritas</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescribedRoutines.map(routine => (
              <RoutineCard key={routine.id} routine={routine} isPrescribed onClone={() => {
                setCloneSource(routine);
                setShowClone(true);
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl bg-[hsl(var(--card))] border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Criar nova rotina</DialogTitle>
          </DialogHeader>
          <RoutineForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={showClone} onOpenChange={setShowClone}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Clonar rotina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-medium text-foreground mb-1">Nome da cópia</p>
              <Input
                id="clone-name"
                defaultValue={`${cloneSource?.name} (Cópia)`}
                className="h-10 rounded-lg text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowClone(false)} className="flex-1 h-10 rounded-lg">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const newName = document.getElementById('clone-name')?.value;
                  cloneRoutine.mutate({ ...cloneSource, name: newName || `${cloneSource?.name} (Cópia)` });
                }}
                disabled={cloneRoutine.isPending}
                className="flex-1 h-10 rounded-lg bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.85)] text-white"
              >
                {cloneRoutine.isPending ? 'Clonando…' : 'Clonar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}