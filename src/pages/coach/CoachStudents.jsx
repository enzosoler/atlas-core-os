import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import InviteModal from '@/components/shared/InviteModal';
import { Link } from 'react-router-dom';
import RoleGate from '@/components/rbac/RoleGate';
import { Users, Plus, ChevronRight, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachStudents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['coach-students', user?.email],
    queryFn: () => base44.entities.CoachStudent.filter({ coach_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const removeM = useMutation({
    mutationFn: (id) => base44.entities.CoachStudent.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-students'] }),
  });

  return (
    <RoleGate roles={['coach', 'admin']}>
      <div className="p-5 lg:p-8 max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[hsl(var(--border-h))]">
          <div>
            <h1 className="t-headline">Meus Alunos</h1>
            <p className="t-small mt-1">{students.length} aluno{students.length !== 1 ? 's' : ''} vinculado{students.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn btn-primary gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar aluno
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 t-small text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
            <p className="t-subtitle mb-1">Nenhum aluno ainda</p>
            <p className="t-caption mb-4">Adicione alunos para começar a acompanhá-los.</p>
            <button onClick={() => setShowInvite(true)} className="btn btn-primary gap-1.5"><Plus className="w-3.5 h-3.5" /> Adicionar aluno</button>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="surface flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--brand))] text-[15px] shrink-0">
                  {(s.student_name || s.student_email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{s.student_name || s.student_email}</p>
                  <p className="t-caption truncate">{s.student_email}</p>
                </div>
                <span className={`badge ${s.status === 'accepted' ? 'badge-ok' : s.status === 'pending' ? 'badge-warn' : 'badge-neutral'}`}>
                  {s.status === 'accepted' ? 'Ativo' : s.status === 'pending' ? 'Pendente' : s.status}
                </span>
                <Link to={`/coach/student/${s.student_email}`} className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--shell))] transition-colors ${s.status !== 'accepted' ? 'opacity-30 pointer-events-none' : ''}`}>
                  <ChevronRight className="w-4 h-4 text-[hsl(var(--fg-2))]" strokeWidth={2} />
                </Link>
                <button onClick={() => removeM.mutate(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--fg-2)/0.4)] hover:text-[hsl(var(--err))] hover:bg-[hsl(var(--err)/0.07)] transition-colors">
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <InviteModal open={showInvite} onOpenChange={setShowInvite} role="coach" />
      </div>
    </RoleGate>
  );
}