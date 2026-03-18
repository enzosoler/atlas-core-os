import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import RoleGate from '@/components/rbac/RoleGate';
import InviteModal from '@/components/shared/InviteModal';

export default function NutritionistClients() {
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const qc = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['nutritionist-clients'],
    queryFn: () => base44.entities.NutritionistClientLink.filter({ nutritionist_email: user?.email }, '-created_date', 100),
  });

  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.NutritionistClientLink.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutritionist-clients'] }),
  });

  return (
    <RoleGate page="NutritionistClients">
      <div className="p-5 lg:p-8 max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[hsl(var(--border-h))]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Clientes</h1>
            <p className="text-[13px] text-[hsl(var(--fg-2))] mt-1">Gerenciar vínculos com atletas</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn btn-primary gap-1.5 h-9">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} />
            </div>
            <p className="t-subtitle mb-1">Sem clientes</p>
            <p className="t-caption mb-4">Você ainda não vinculou nenhum cliente</p>
            <button onClick={() => setShowInvite(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Adicionar cliente
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.id}
                to={`/nutritionist/client/${link.id}`}
                className="surface p-4 flex items-center justify-between hover:border-[hsl(var(--brand)/0.3)] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px]">{link.client_name}</p>
                  <p className="text-[12px] text-[hsl(var(--fg-2))]">{link.client_email}</p>
                  <p className="text-[11px] text-[hsl(var(--fg-2))] mt-1">
                    {link.permissions?.can_view_meals ? '📊 Refeições' : ''}
                    {link.permissions?.can_create_diet_plan ? ' · 📋 Planos' : ''}
                    {link.permissions?.can_view_lab_exams ? ' · 🧬 Exames' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${link.status === 'accepted' ? 'badge-ok' : link.status === 'pending' ? 'badge-warn' : 'badge-neutral'}`}>
                    {link.status === 'accepted' ? 'Ativo' : link.status === 'pending' ? 'Pendente' : link.status}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); deleteM.mutate(link.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.5)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        <InviteModal open={showInvite} onOpenChange={setShowInvite} role="nutritionist" />
      </div>
    </RoleGate>
  );
}