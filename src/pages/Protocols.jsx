import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Loader2, Trash2, Edit2, AlertCircle, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProtocolForm from '@/components/protocols/ProtocolForm';
import ProtocolCard from '@/components/protocols/ProtocolCard';

export default function Protocols() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: protocols = [] } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => base44.entities.Protocol.list('-start_date', 100),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Protocol.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocols'] });
      toast.success('Protocolo removido');
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Protocol.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocols'] });
      toast.success('Status atualizado');
    },
  });

  const duplicateMut = useMutation({
    mutationFn: (p) => base44.entities.Protocol.create({
      name: `${p.name} (cópia)`,
      category: p.category,
      substance_name: p.substance_name,
      dose: p.dose,
      frequency: p.frequency,
      route: p.route,
      half_life_days: p.half_life_days,
      prescribed: p.prescribed,
      notes: p.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocols'] });
      toast.success('Protocolo duplicado');
    },
  });

  const active = protocols.filter(p => p.active && !p.end_date);
  const paused = protocols.filter(p => !p.active && !p.end_date);
  const finished = protocols.filter(p => p.end_date);

  // Low stock warnings
  const lowStock = active.filter(p => {
    if (!p.stock_quantity || !p.daily_usage) return false;
    const daysLeft = p.stock_quantity / p.daily_usage;
    return daysLeft < 14;
  });

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocolos</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Gerenciar substâncias, suplementos e medicamentos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn btn-primary gap-2 h-10"
        >
          <Plus className="w-4 h-4" /> Novo protocolo
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'active', label: `Ativos (${active.length})` },
          { id: 'paused', label: `Pausados (${paused.length})` },
          { id: 'finished', label: `Encerrados (${finished.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              statusFilter === tab.id
                ? 'border-[hsl(var(--brand))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock alerts */}
      {lowStock.length > 0 && (
        <div className="surface rounded-xl p-4 border border-[hsl(var(--warn)/0.2)] bg-[hsl(var(--warn)/0.05)] space-y-2">
          <div className="flex items-center gap-2 text-[hsl(var(--warn))]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-[13px] font-medium">{lowStock.length} protocolo(s) com estoque baixo</p>
          </div>
          {lowStock.map(p => {
            const daysLeft = p.stock_quantity / p.daily_usage;
            return (
              <div key={p.id} className="text-[12px] text-[hsl(var(--warn))]">
                <strong>{p.name}</strong> — {daysLeft.toFixed(0)} dias de estoque
              </div>
            );
          })}
        </div>
      )}

      {/* Protocols by status */}
      <div className="space-y-3">
        {statusFilter === 'active' && (
          <>
            {active.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-[13px]">Nenhum protocolo ativo</p>
              </div>
            ) : (
              active.map(p => <ProtocolCard key={p.id} protocol={p} onEdit={() => { setEditing(p); setShowForm(true); }} onDelete={() => deleteMut.mutate(p.id)} onDuplicate={() => duplicateMut.mutate(p)} onPause={() => updateStatusMut.mutate({ id: p.id, data: { active: false } })} />)
            )}
          </>
        )}

        {statusFilter === 'paused' && (
          <>
            {paused.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-[13px]">Nenhum protocolo pausado</p>
              </div>
            ) : (
              paused.map(p => <ProtocolCard key={p.id} protocol={p} status="paused" onEdit={() => { setEditing(p); setShowForm(true); }} onDelete={() => deleteMut.mutate(p.id)} onDuplicate={() => duplicateMut.mutate(p)} onResume={() => updateStatusMut.mutate({ id: p.id, data: { active: true } })} onFinish={() => updateStatusMut.mutate({ id: p.id, data: { end_date: new Date().toISOString().split('T')[0] } })} />)
            )}
          </>
        )}

        {statusFilter === 'finished' && (
          <>
            {finished.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-[13px]">Nenhum protocolo encerrado</p>
              </div>
            ) : (
              finished.map(p => <ProtocolCard key={p.id} protocol={p} status="finished" onDelete={() => deleteMut.mutate(p.id)} onDuplicate={() => duplicateMut.mutate(p)} />)
            )}
          </>
        )}
      </div>

      {/* Form modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Protocol' : 'Add Protocol'}</DialogTitle>
          </DialogHeader>
          <ProtocolForm
            protocol={editing}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['protocols'] });
              setShowForm(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}