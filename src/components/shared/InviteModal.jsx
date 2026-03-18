import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

/**
 * InviteModal - Send invite to student/client/patient
 * Usage: <InviteModal open={show} onOpenChange={setShow} role="coach" />
 */
export default function InviteModal({ open, onOpenChange, role = 'coach' }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);

  const roleLabels = {
    coach: { title: 'Convidar Aluno', placeholder: 'aluno@example.com' },
    nutritionist: { title: 'Convidar Cliente', placeholder: 'cliente@example.com' },
    clinician: { title: 'Convidar Paciente', placeholder: 'paciente@example.com' },
  };

  const label = roleLabels[role] || roleLabels.coach;

  const handleSend = async () => {
    if (!email.trim() || !name.trim()) {
      toast.error('Preencha email e nome');
      return;
    }

    setSending(true);
    try {
      const res = await base44.functions.invoke('sendInviteEmail', {
        recipient_email: email,
        recipient_name: name,
        invited_by_role: role,
      });

      if (res.data?.success) {
        toast.success(`Convite enviado para ${email}`);
        qc.invalidateQueries({ queryKey: ['invites'] });
        setEmail('');
        setName('');
        onOpenChange(false);
      } else {
        toast.error(res.data?.error || 'Erro ao enviar convite');
      }
    } catch (err) {
      toast.error('Erro ao enviar convite');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{label.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Nome
            </label>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-[hsl(var(--card))]">
              <User className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-[hsl(var(--card))]">
              <Mail className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              <input
                type="email"
                placeholder={label.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[13px]"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Convite expira em 30 dias se não for aceito
          </p>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full h-11 rounded-xl bg-[hsl(var(--brand))] text-white font-semibold text-[13px] hover:bg-[hsl(var(--brand)/0.88)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {sending ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}