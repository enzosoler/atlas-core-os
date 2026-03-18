/**
 * PendingInvites — shown to athletes/patients on their Today/Profile page
 * Lets them accept or reject pending invitations from coaches, nutritionists, clinicians
 */
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Check, X, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingInvites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: coachInvites = [] } = useQuery({
    queryKey: ['coach-invites', user?.email],
    queryFn: () => base44.entities.CoachStudent.filter({ student_email: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const { data: nutriInvites = [] } = useQuery({
    queryKey: ['nutri-invites', user?.email],
    queryFn: () => base44.entities.NutritionistClientLink.filter({ client_email: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const { data: clinicInvites = [] } = useQuery({
    queryKey: ['clinic-invites', user?.email],
    queryFn: () => base44.entities.ClinicianPatient.filter({ patient_email: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const acceptCoach = useMutation({
    mutationFn: (id) => base44.entities.CoachStudent.update(id, { status: 'accepted', accepted_at: new Date().toISOString().split('T')[0] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-invites'] }); toast.success('Vínculo aceito'); },
  });
  const rejectCoach = useMutation({
    mutationFn: (id) => base44.entities.CoachStudent.update(id, { status: 'rejected' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-invites'] }); toast.success('Convite recusado'); },
  });

  const acceptNutri = useMutation({
    mutationFn: (id) => base44.entities.NutritionistClientLink.update(id, { status: 'accepted', accepted_at: new Date().toISOString().split('T')[0] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nutri-invites'] }); toast.success('Vínculo aceito'); },
  });
  const rejectNutri = useMutation({
    mutationFn: (id) => base44.entities.NutritionistClientLink.update(id, { status: 'rejected' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nutri-invites'] }); toast.success('Convite recusado'); },
  });

  const acceptClinic = useMutation({
    mutationFn: (id) => base44.entities.ClinicianPatient.update(id, { status: 'accepted', accepted_at: new Date().toISOString().split('T')[0] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinic-invites'] }); toast.success('Vínculo aceito'); },
  });
  const rejectClinic = useMutation({
    mutationFn: (id) => base44.entities.ClinicianPatient.update(id, { status: 'rejected' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinic-invites'] }); toast.success('Convite recusado'); },
  });

  const allInvites = [
    ...coachInvites.map(i => ({ ...i, kind: 'coach', from: i.coach_email, label: 'Coach', accept: () => acceptCoach.mutate(i.id), reject: () => rejectCoach.mutate(i.id) })),
    ...nutriInvites.map(i => ({ ...i, kind: 'nutri', from: i.nutritionist_email, label: 'Nutricionista', accept: () => acceptNutri.mutate(i.id), reject: () => rejectNutri.mutate(i.id) })),
    ...clinicInvites.map(i => ({ ...i, kind: 'clinic', from: i.clinician_email, label: 'Clínico', accept: () => acceptClinic.mutate(i.id), reject: () => rejectClinic.mutate(i.id) })),
  ];

  if (allInvites.length === 0) return null;

  return (
    <div className="surface border-[hsl(var(--warn)/0.3)] p-4 space-y-3" style={{ borderColor: 'hsl(var(--warn)/0.4)' }}>
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-[hsl(var(--warn))]" strokeWidth={2} />
        <p className="t-subtitle text-[hsl(var(--warn))]">Convites pendentes ({allInvites.length})</p>
      </div>
      <div className="space-y-2">
        {allInvites.map(invite => (
          <div key={invite.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
            <div className="flex-1 min-w-0">
              <span className="badge badge-warn mr-2">{invite.label}</span>
              <span className="text-[13px] font-medium">{invite.from}</span>
              <p className="t-caption mt-0.5">quer acesso aos seus dados</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={invite.accept}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[hsl(var(--ok)/0.1)] text-[hsl(var(--ok))] border border-[hsl(var(--ok)/0.2)] text-[12px] font-semibold hover:bg-[hsl(var(--ok)/0.2)] transition-colors"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Aceitar
              </button>
              <button
                onClick={invite.reject}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[hsl(var(--err)/0.07)] text-[hsl(var(--err))] border border-[hsl(var(--err)/0.2)] text-[12px] font-semibold hover:bg-[hsl(var(--err)/0.15)] transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} /> Recusar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}