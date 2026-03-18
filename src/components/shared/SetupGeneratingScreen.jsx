import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

const DEFAULT_MESSAGES = [
  'Analisando seus objetivos...',
  'Construindo seu painel personalizado...',
  'Configurando suas categorias de tracking...',
  'Calculando metas nutricionais...',
  'Preparando sua linha do tempo...',
  'Tudo pronto.',
];

/**
 * Reusable "system is building something" loading screen.
 * Use for: onboarding, AI summary generation, report generation.
 *
 * Props:
 *   messages?: string[]  — custom rotating messages
 *   onDone?: () => void  — called when animation completes (auto, no button)
 *   autoFinishMs?: number — ms per step (default 650)
 *   showButton?: boolean  — show "Entrar" button at end instead of auto-advancing
 *   buttonLabel?: string
 */
export default function SetupGeneratingScreen({
  messages = DEFAULT_MESSAGES,
  onDone,
  autoFinishMs = 650,
  showButton = false,
  buttonLabel = 'Continuar',
}) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length - 1) {
        setMsgIdx(i);
      } else {
        setMsgIdx(messages.length - 1);
        setDone(true);
        clearInterval(interval);
        if (!showButton && onDone) {
          setTimeout(onDone, 600);
        }
      }
    }, autoFinishMs);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-4 space-y-8">
      {/* Ring */}
      <div className="relative w-20 h-20 mx-auto">
        <svg className="absolute inset-0 -rotate-90" style={{ animation: done ? 'none' : 'spin 2s linear infinite' }}
          viewBox="0 0 80 80">
          <style>{`@keyframes spin { to { transform: rotate(270deg); } }`}</style>
          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border-h))" strokeWidth="4" />
          <circle cx="40" cy="40" r="34" fill="none"
            stroke={done ? 'hsl(var(--ok))' : 'hsl(var(--brand))'} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={done ? '214 0' : '50 164'}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <Check className="w-8 h-8 text-[hsl(var(--ok))]" strokeWidth={2.5} />
            : <Zap className="w-7 h-7 text-[hsl(var(--brand))]" strokeWidth={2} />
          }
        </div>
      </div>

      {/* Message */}
      <div className="min-h-[48px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="text-[15px] font-semibold text-[hsl(var(--fg))]">
            {messages[msgIdx]}
          </motion.p>
        </AnimatePresence>
        {!done && <p className="text-[12px] text-[hsl(var(--fg-2))] mt-1">Atlas Core está configurando...</p>}
      </div>

      {/* Button (optional) */}
      {done && showButton && onDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={onDone} className="btn btn-primary h-12 px-8 rounded-2xl text-[14px]">
            {buttonLabel}
          </button>
        </motion.div>
      )}
    </div>
  );
}