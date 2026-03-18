import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Gift, Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PLAN_LABELS, FEATURE_LABELS } from '@/lib/entitlements';

const STATUS_COLORS = {
  active: 'badge-ok',
  trialing: 'badge-blue',
  past_due: 'badge-warn',
  canceled: 'badge-err',
  expired: 'badge-neutral',
};

const SOURCE_LABELS = {
  stripe: 'Stripe',
  manual: 'Manual',
  gift: 'Gift',
  admin: 'Admin',
};

export default function SubscriptionManager() {
  const qc = useQueryClient();
  const [showSub, setShowSub] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [subForm, setSubForm] = useState({ user_email: '', plan_code: 'pro', status: 'active', source: 'admin', notes: '', ends_at: '' });
  const [ovForm, setOvForm] = useState({ user_email: '', feature_key: 'atlas_ai', enabled: true, reason: '', expires_at: '' });

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 100),
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ['all-overrides'],
    queryFn: () => base44.entities.EntitlementOverride.list('-created_date', 100),
  });

  const createSubM = useMutation({
    mutationFn: (d) => base44.entities.Subscription.create({ ...d, started_at: new Date().toISOString().split('T')[0] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-subscriptions'] }); setShowSub(false); toast.success('Assinatura criada'); },
  });

  const deleteSubM = useMutation({
    mutationFn: (id) => base44.entities.Subscription.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-subscriptions'] }),
  });

  const createOvM = useMutation({
    mutationFn: (d) => base44.entities.EntitlementOverride.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-overrides'] }); setShowOverride(false); toast.success('Override criado'); },
  });

  const deleteOvM = useMutation({
    mutationFn: (id) => base44.entities.EntitlementOverride.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-overrides'] }),
  });

  return (
    <div className="space-y-6">

      {/* Subscriptions */}
      <div className="surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="t-subtitle">Assinaturas</p>
            <p className="t-caption mt-0.5">Gerencie planos de usuários manualmente</p>
          </div>
          <button onClick={() => setShowSub(true)} className="btn btn-primary gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" /> Novo plano
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 t-small text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : subs.length === 0 ? (
          <p className="t-caption text-center py-6">Nenhuma assinatura cadastrada</p>
        ) : (
          <div className="space-y-2">
            {subs.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{s.user_email}</span>
                    <span className="badge badge-blue">{PLAN_LABELS[s.plan_code] || s.plan_code}</span>
                    <span className={`badge ${STATUS_COLORS[s.status] || 'badge-neutral'}`}>{s.status}</span>
                    <span className="badge badge-neutral">{SOURCE_LABELS[s.source] || s.source}</span>
                  </div>
                  {s.notes && <p className="t-caption mt-0.5">{s.notes}</p>}
                  {s.ends_at && <p className="t-caption mt-0.5">Expira: {s.ends_at}</p>}
                </div>
                <button onClick={() => deleteSubM.mutate(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.4)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overrides */}
      <div className="surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="t-subtitle flex items-center gap-2"><Gift className="w-4 h-4 text-[hsl(var(--brand-ai))]" /> Overrides manuais</p>
            <p className="t-caption mt-0.5">Libere ou bloqueie features individualmente</p>
          </div>
          <button onClick={() => setShowOverride(true)} className="btn btn-secondary gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" /> Novo override
          </button>
        </div>

        {overrides.length === 0 ? (
          <p className="t-caption text-center py-6">Nenhum override cadastrado</p>
        ) : (
          <div className="space-y-2">
            {overrides.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${o.enabled ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--err))]'}`} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{o.user_email}</span>
                    <span className="badge badge-blue">{FEATURE_LABELS[o.feature_key] || o.feature_key}</span>
                    <span className={`badge ${o.enabled ? 'badge-ok' : 'badge-err'}`}>{o.enabled ? 'liberado' : 'bloqueado'}</span>
                  </div>
                  {o.reason && <p className="t-caption mt-0.5">{o.reason}</p>}
                  {o.expires_at && <p className="t-caption mt-0.5">Expira: {o.expires_at}</p>}
                </div>
                <button onClick={() => deleteOvM.mutate(o.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.4)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Subscription Dialog */}
      <Dialog open={showSub} onOpenChange={setShowSub}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border-h))] rounded-2xl">
          <DialogHeader><DialogTitle>Criar assinatura manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="t-label block mb-1.5">Email do usuário</label>
              <Input value={subForm.user_email} onChange={e => setSubForm(f => ({ ...f, user_email: e.target.value }))} placeholder="user@example.com" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Plano</label>
                <Select value={subForm.plan_code} onValueChange={v => setSubForm(f => ({ ...f, plan_code: v }))}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="t-label block mb-1.5">Status</label>
                <Select value={subForm.status} onValueChange={v => setSubForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['active','trialing','past_due','canceled','expired'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="t-label block mb-1.5">Expira em (opcional)</label>
              <Input type="date" value={subForm.ends_at} onChange={e => setSubForm(f => ({ ...f, ends_at: e.target.value }))} className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Observações</label>
              <Input value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: gift para parceiro, trial manual…" className="h-10 rounded-lg text-[13px]" />
            </div>
            <button onClick={() => createSubM.mutate(subForm)} disabled={!subForm.user_email || createSubM.isPending} className="btn btn-primary w-full h-11 rounded-xl text-[14px]">
              {createSubM.isPending ? 'Criando…' : 'Criar assinatura'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Override Dialog */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border-h))] rounded-2xl">
          <DialogHeader><DialogTitle>Criar override manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="t-label block mb-1.5">Email do usuário</label>
              <Input value={ovForm.user_email} onChange={e => setOvForm(f => ({ ...f, user_email: e.target.value }))} placeholder="user@example.com" className="h-10 rounded-lg text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-label block mb-1.5">Feature</label>
                <Select value={ovForm.feature_key} onValueChange={v => setOvForm(f => ({ ...f, feature_key: v }))}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEATURE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="t-label block mb-1.5">Ação</label>
                <Select value={String(ovForm.enabled)} onValueChange={v => setOvForm(f => ({ ...f, enabled: v === 'true' }))}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Liberar</SelectItem>
                    <SelectItem value="false">Bloquear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="t-label block mb-1.5">Expira em (opcional)</label>
              <Input type="date" value={ovForm.expires_at} onChange={e => setOvForm(f => ({ ...f, expires_at: e.target.value }))} className="h-10 rounded-lg text-[13px]" />
            </div>
            <div>
              <label className="t-label block mb-1.5">Motivo</label>
              <Input value={ovForm.reason} onChange={e => setOvForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ex: gift, trial, compensação…" className="h-10 rounded-lg text-[13px]" />
            </div>
            <button onClick={() => createOvM.mutate(ovForm)} disabled={!ovForm.user_email || createOvM.isPending} className="btn btn-primary w-full h-11 rounded-xl text-[14px]">
              {createOvM.isPending ? 'Criando…' : 'Criar override'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}