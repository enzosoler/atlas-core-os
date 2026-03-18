import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Bug, Lightbulb, HelpCircle, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const OPTIONS = [
  { id: 'bug',     icon: Bug,        label: 'Reportar um bug',         color: 'text-[hsl(var(--err))]',  bg: 'bg-[hsl(var(--err)/0.07)]' },
  { id: 'feature', icon: Lightbulb,  label: 'Sugerir funcionalidade',  color: 'text-[hsl(var(--warn))]', bg: 'bg-[hsl(var(--warn)/0.07)]' },
  { id: 'help',    icon: HelpCircle, label: 'Algo confuso?',           color: 'text-[hsl(var(--brand))]', bg: 'bg-[hsl(var(--brand)/0.07)]' },
  { id: 'contact', icon: Mail,       label: 'Falar com o time',        color: 'text-[hsl(var(--fg-2))]', bg: 'bg-[hsl(var(--shell))]' },
];

const PLACEHOLDERS = {
  bug:     'Descreva o que aconteceu e em qual parte do app...',
  feature: 'Qual funcionalidade tornaria o app mais útil para você?',
  help:    'O que está confuso ou difícil de entender?',
  contact: 'Como podemos ajudar?',
};

export default function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => { setSelected(null); setText(''); };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'suporte@atlascore.app',
        subject: `[Atlas Core] ${OPTIONS.find(o => o.id === selected)?.label} — ${user?.email || 'anon'}`,
        body: `Tipo: ${selected}\nUsuário: ${user?.email || 'não identificado'}\nNome: ${user?.full_name || '—'}\n\nMensagem:\n${text}`,
      });
      toast.success('Mensagem enviada! Obrigado pelo feedback.');
      setOpen(false);
      reset();
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FAB button */}
      <div className="fixed bottom-[80px] right-4 lg:bottom-6 z-50">
        <button
          onClick={() => { setOpen(o => !o); reset(); }}
          className={`w-11 h-11 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center
            ${open
              ? 'bg-[hsl(var(--card))] border border-[hsl(var(--border-h))] text-[hsl(var(--fg-2))]'
              : 'bg-[hsl(var(--brand))] text-white hover:shadow-xl hover:scale-105'
            }`}
        >
          {open ? <X className="w-4 h-4" strokeWidth={2} /> : <MessageCircle className="w-4.5 h-4.5" strokeWidth={2} />}
        </button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-[136px] right-4 lg:bottom-20 z-50 w-72 surface rounded-2xl shadow-2xl p-4"
          >
            {!selected ? (
              <>
                <div className="mb-3">
                  <p className="text-[13px] font-semibold">Precisa de ajuda?</p>
                  <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5">Estamos aqui durante o early access.</p>
                </div>
                <div className="space-y-1.5">
                  {OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.id} onClick={() => setSelected(opt.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-left ${opt.bg} hover:opacity-80`}>
                        <Icon className={`w-4 h-4 shrink-0 ${opt.color}`} strokeWidth={2} />
                        <span className="text-[12px] font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button onClick={reset} className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--fg-2))] mb-3 hover:text-[hsl(var(--fg))] transition-colors">
                  ← Voltar
                </button>
                <p className="text-[13px] font-semibold mb-2">{OPTIONS.find(o => o.id === selected)?.label}</p>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={PLACEHOLDERS[selected]}
                  className="w-full h-28 px-3 py-2.5 text-[12px] rounded-xl border border-[hsl(var(--border-h))] bg-[hsl(var(--card-hi))] resize-none outline-none focus:border-[hsl(var(--brand)/0.4)] transition-colors"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="btn btn-primary w-full h-9 rounded-xl text-[12px] mt-2 gap-1.5 disabled:opacity-50"
                >
                  {sending ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</> : 'Enviar mensagem'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}