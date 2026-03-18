import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ROLE_LABELS, ROLE_BADGE } from '@/lib/rbac';
import { useAuth } from '@/lib/AuthContext';
import RoleGate from '@/components/rbac/RoleGate';
import SubscriptionManager from '@/components/admin/SubscriptionManager';
import { UserPlus, RefreshCw, Loader2, Users, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import substancesSeed from '@/lib/substances_seed.json';

function InviteForm({ onDone }) {
  const [email, setEmail] = useState('');
  const [atlasRole, setAtlasRole] = useState('athlete');
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // Base44 internal role is always "user"; atlas_role is saved on the User entity separately
    await base44.users.inviteUser(email.trim(), 'user');
    // Find the newly created user and set their atlas_role
    try {
      const users = await base44.entities.User.list();
      const newUser = users.find(u => u.email === email.trim());
      if (newUser) {
        await base44.entities.User.update(newUser.id, { atlas_role: atlasRole });
      }
    } catch (_) {
      // User may not exist yet (invite pending), atlas_role will be set when they join
    }
    toast.success(`Convite enviado para ${email}`);
    setEmail('');
    setLoading(false);
    onDone?.();
  };

  return (
    <div className="surface p-5 space-y-4">
      <p className="t-subtitle">Convidar usuário</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="t-label block mb-1.5">E-mail</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@email.com"
            className="h-10 rounded-lg text-[13px]"
            onKeyDown={e => e.key === 'Enter' && invite()}
          />
        </div>
        <div>
          <label className="t-label block mb-1.5">Papel</label>
          <Select value={atlasRole} onValueChange={setAtlasRole}>
            <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <button onClick={invite} disabled={!email.trim() || loading} className="btn btn-primary gap-1.5">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Enviar convite
      </button>
    </div>
  );
}

function UserRow({ u, onRoleChange }) {
  const [updating, setUpdating] = useState(false);

  const changeRole = async (newRole) => {
    setUpdating(true);
    await base44.entities.User.update(u.id, { atlas_role: newRole });
    toast.success(`Papel de ${u.full_name || u.email} atualizado`);
    setUpdating(false);
    onRoleChange?.();
  };

  const currentAtlasRole = u.atlas_role || 'athlete';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[hsl(var(--shell))] rounded-xl transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand)/0.1)] flex items-center justify-center text-[13px] font-bold text-[hsl(var(--brand))] shrink-0">
          {(u.full_name || u.email || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[hsl(var(--fg))] truncate">{u.full_name || '—'}</p>
          <p className="t-caption truncate">{u.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {updating ? (
          <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--fg-2))]" />
        ) : (
          <Select value={currentAtlasRole} onValueChange={changeRole}>
            <SelectTrigger className="h-8 rounded-lg text-[12px] w-32 border-[hsl(var(--border-h))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className={ROLE_BADGE[currentAtlasRole]}>{ROLE_LABELS[currentAtlasRole]}</span>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const handleSeedSubstances = async () => {
    setSeeding(true);
    let count = 0;
    try {
      for (const substance of substancesSeed) {
        await base44.entities.SubstanceDatabase.create({ ...substance, active: true });
        count++;
      }
      toast.success(`${count} substâncias importadas com sucesso!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar algumas substâncias.');
    } finally {
      setSeeding(false);
    }
  };

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const stats = Object.entries(ROLE_LABELS).map(([role, label]) => ({
    role, label,
    count: users.filter(u => (u.atlas_role || 'athlete') === role).length,
  }));

  return (
    <RoleGate page="AdminPanel">
      <div className="p-5 lg:p-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <h1 className="t-headline">Painel Admin</h1>
          <p className="t-small mt-1">Gestão de usuários e permissões</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.role} className="surface p-4 text-center">
              <p className="kpi-sm">{s.count}</p>
              <p className="t-caption mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Seed Substances */}
        <div className="surface p-5 border-[hsl(var(--brand)/0.3)]">
          <p className="t-subtitle text-[hsl(var(--brand))]">Setup do Sistema</p>
          <p className="t-caption mb-3">Popular base de dados de substâncias clínicas (Hormônios, Peptídeos, Ancilares, etc). Execute apenas uma vez.</p>
          <button onClick={handleSeedSubstances} disabled={seeding} className="btn btn-primary gap-1.5">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {seeding ? 'Importando…' : 'Importar Substâncias'}
          </button>
        </div>

        {/* Invite */}
        <InviteForm onDone={refetch} />

        {/* Subscription Manager */}
        <SubscriptionManager />

        {/* User list */}
        <div className="surface p-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border-h))] mb-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[hsl(var(--fg-2))]" />
              <p className="t-subtitle">Usuários ({users.length})</p>
            </div>
            <button onClick={() => refetch()} className="btn btn-ghost">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 t-small text-[hsl(var(--fg-2))]">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-10 t-caption">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-0.5">
              {users.map(u => (
                <UserRow key={u.id} u={u} onRoleChange={refetch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}