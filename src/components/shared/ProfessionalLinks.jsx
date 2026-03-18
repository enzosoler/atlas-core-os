/**
 * ProfessionalLinks — Shows the athlete's active/pending professional connections
 * Used in Today page and Profile
 */
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, Check, X, UserCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const PROF_LABELS = {
  coach: { label: 'Coach / Personal', badge: 'badge-blue', icon: '🏋️' },
  nutritionist: { label: 'Nutricionista', badge: 'badge-ok', icon: '🥗' },
  clinician: { label: 'Clínico / Médico', badge: 'badge-ai', icon: '⚕️' },
};

export default function ProfessionalLinks({ showPending = true, showActive = true, user: userProp }) {
  const { user: authUser } = useAuth();
  const user = userProp || authUser;
  const qc = useQueryClient();

  const { data: coachLinks = [] } = useQuery({
    queryKey: ['my-coach-links', user?.email],
    queryFn: () => base44.entities.CoachStudent.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: nutriLinks = [] } = useQuery({
    queryKey: ['my-nutri-links', user?.email],
    queryFn: () => base44.entities.NutritionistClientLink.filter({ client_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: clinicLinks = [] } = useQuery({
    queryKey: ['my-clinic-links', user?.email],
    queryFn: () => base44.entities.ClinicianPatient.filter({ patient_email: user?.email }),
    enabled: !!user?.email,
  });

  const respond = (entity, id, status) => async () => {
    const today = new Date().toISOString().split('T')[0];
    await base44.entities[entity].update(id, {
      status,
      ...(status === 'accepted' ? { accepted_at: today } : {}),
    });
    qc.invalidateQueries({ queryKey: ['my-coach-links'] });
    qc.invalidateQueries({ queryKey: ['my-nutri-links'] });
    qc.invalidateQueries({ queryKey: ['my-clinic-links'] });
    toast.success(status === 'accepted' ? 'Vínculo aceito!' : 'Convite recusado');
  };

  const allLinks = [
    ...coachLinks.map(l => ({ ...l, kind: 'coach', entity: 'CoachStudent', from: l.coach_email })),
    ...nutriLinks.map(l => ({ ...l, kind: 'nutritionist', entity: 'NutritionistClientLink', from: l.nutritionist_email })),
    ...clinicLinks.map(l => ({ ...l, kind: 'clinician', entity: 'ClinicianPatient', from: l.clinician_email })),
  ];

  const pendingLinks = allLinks.filter(l => l.status === 'pending');
  const activeLinks = allLinks.filter(l => l.status === 'accepted');

  if (pendingLinks.length === 0 && activeLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Pending invites */}
      {showPending && pendingLinks.length > 0 && (
        <div className="surface border-[hsl(var(--warn)/0.4)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[hsl(var(--warn))]" strokeWidth={2} />
            <p className="t-subtitle text-[hsl(var(--warn))]">Convites pendentes ({pendingLinks.length})</p>
          </div>
          <div className="space-y-2">
            {pendingLinks.map(link => {
              const meta = PROF_LABELS[link.kind] || { label: link.kind, badge: 'badge-neutral', icon: '👤' };
              return (
                <div key={link.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`badge ${meta.badge}`}>{meta.icon} {meta.label}</span>
                    </div>
                    <p className="text-[12px] text-[hsl(var(--fg-2))]">{link.from}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={respond(link.entity, link.id, 'accepted')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--ok)/0.1)] text-[hsl(var(--ok))] border border-[hsl(var(--ok)/0.2)] text-[11px] font-semibold hover:bg-[hsl(var(--ok)/0.2)] transition-colors"
                    >
                      <Check className="w-3 h-3" strokeWidth={2.5} /> Aceitar
                    </button>
                    <button
                      onClick={respond(link.entity, link.id, 'rejected')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--err)/0.07)] text-[hsl(var(--err))] border border-[hsl(var(--err)/0.2)] text-[11px] font-semibold hover:bg-[hsl(var(--err)/0.15)] transition-colors"
                    >
                      <X className="w-3 h-3" strokeWidth={2.5} /> Recusar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active professional links */}
      {showActive && activeLinks.length > 0 && (
        <div className="surface p-4 space-y-2">
          <p className="t-label">Profissionais vinculados</p>
          {activeLinks.map(link => {
            const meta = PROF_LABELS[link.kind] || { label: link.kind, badge: 'badge-neutral', icon: '👤' };
            return (
              <div key={link.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`badge ${meta.badge}`}>{meta.icon} {meta.label}</span>
                    <span className="badge badge-ok text-[9px]">Ativo</span>
                  </div>
                  <p className="text-[12px] text-[hsl(var(--fg-2))]">{link.from}</p>
                </div>
                <button
                  onClick={respond(link.entity, link.id, 'revoked')}
                  className="text-[10px] text-[hsl(var(--fg-2))/0.5] hover:text-[hsl(var(--err))] transition-colors px-2 py-1"
                >
                  Revogar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}