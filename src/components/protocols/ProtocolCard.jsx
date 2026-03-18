import React from 'react';
import { Edit2, Trash2, Copy, Pause, Play, X, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProtocolCard({
  protocol,
  status = 'active',
  onEdit,
  onDelete,
  onDuplicate,
  onPause,
  onResume,
  onFinish,
}) {
  const statusBadges = {
    active: 'badge-primary',
    paused: 'badge-warn',
    finished: 'badge-neutral',
  };

  const statusLabels = {
    active: 'Ativo',
    paused: 'Pausado',
    finished: 'Encerrado',
  };

  const lowStock =
    protocol.stock_quantity &&
    protocol.daily_usage &&
    protocol.stock_quantity / protocol.daily_usage < 14;

  return (
    <div
      className={`surface rounded-xl p-4 space-y-3 transition-all ${
        status === 'finished' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-foreground">{protocol.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${statusBadges[status]} text-[10px]`}>
              {statusLabels[status]}
            </span>
            <span className="badge badge-blue text-[10px]">{protocol.category}</span>
            {protocol.route && (
              <span className="badge badge-neutral text-[10px]">{protocol.route}</span>
            )}
            {protocol.prescribed && (
              <span className="badge badge-primary text-[10px]">Prescrito</span>
            )}
            {lowStock && (
              <span className="badge bg-[hsl(var(--warn)/0.1)] text-[hsl(var(--warn))] text-[10px]">
                Estoque baixo
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {status === 'active' && onPause && (
            <button
              onClick={onPause}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-muted-foreground hover:text-foreground"
              title="Pausar protocolo"
            >
              <Pause className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {status === 'paused' && onResume && (
            <button
              onClick={onResume}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-muted-foreground hover:text-foreground"
              title="Retomar protocolo"
            >
              <Play className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {status === 'paused' && onFinish && (
            <button
              onClick={onFinish}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-muted-foreground hover:text-foreground"
              title="Encerrar protocolo"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-[hsl(var(--err)/0.1)] text-muted-foreground hover:text-[hsl(var(--err))] transition-colors"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Dosage & Frequency */}
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
          <p className="section-label">Dose</p>
          <p className="font-bold mt-1">{protocol.dose}</p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
          <p className="section-label">Frequência</p>
          <p className="font-bold mt-1">{protocol.frequency}</p>
        </div>
      </div>

      {/* Half-life */}
      {protocol.half_life_days && (
        <div className="p-3 rounded-lg bg-[hsl(var(--brand)/0.05)] border border-[hsl(var(--brand)/0.1)]">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[hsl(var(--brand))]">
            <TrendingDown className="w-4 h-4" strokeWidth={2} />
            Meia-vida: {protocol.half_life_days} dias
          </div>
        </div>
      )}

      {/* Stock tracker */}
      {protocol.stock_quantity && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Estoque</span>
            <span className="font-medium">
              {protocol.stock_quantity} {protocol.stock_unit}
            </span>
          </div>
          {protocol.daily_usage && (
            <div className="h-1.5 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  lowStock
                    ? 'bg-[hsl(var(--warn))]'
                    : 'bg-[hsl(var(--brand))]'
                }`}
                style={{
                  width: `${Math.min(
                    ((protocol.stock_quantity / protocol.daily_usage) / 30) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
          {protocol.daily_usage && (
            <div className="text-[11px] text-muted-foreground">
              ~{(protocol.stock_quantity / protocol.daily_usage).toFixed(0)} dias
              restantes
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {protocol.notes && (
        <p className="text-[12px] text-muted-foreground italic">{protocol.notes}</p>
      )}
    </div>
  );
}