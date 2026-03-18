import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Check, Loader2, X, ArrowRight, Zap, Heart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AtlasCoreLogoSVG from '@/components/AtlasCoreLogoSVG';

// ─────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────

const GOALS = [
  { id: 'fat_loss',    emoji: '🔥', label: 'Perda de gordura' },
  { id: 'muscle_gain', emoji: '💪', label: 'Ganho muscular' },
  { id: 'recomp',      emoji: '⚡', label: 'Recomposição' },
  { id: 'performance', emoji: '🏆', label: 'Performance' },
  { id: 'health',      emoji: '❤️', label: 'Saúde geral' },
  { id: 'longevity',   emoji: '🌱', label: 'Longevidade' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary',   label: 'Sedentário',    desc: 'Sem exercícios regulares' },
  { id: 'light',       label: 'Leve',           desc: '1–2× por semana' },
  { id: 'moderate',    label: 'Moderado',       desc: '3–4× por semana' },
  { id: 'active',      label: 'Ativo',          desc: '5–6× por semana' },
  { id: 'very_active', label: 'Muito ativo',    desc: '2× ao dia / atleta' },
];

const TRACK_OPTIONS = [
  { id: 'protocol',  emoji: '💉', label: 'Protocolo',           desc: 'Substâncias, doses, ciclos' },
  { id: 'body',      emoji: '📏', label: 'Composição corporal',  desc: 'Peso, medidas, fotos' },
  { id: 'exams',     emoji: '🧬', label: 'Exames laboratoriais', desc: 'Hormônios, sangue, saúde' },
  { id: 'nutrition', emoji: '🥗', label: 'Alimentação',         desc: 'Refeições e macros' },
  { id: 'workouts',  emoji: '🏋️', label: 'Treinos',             desc: 'Sessões e evolução' },
  { id: 'symptoms',  emoji: '📊', label: 'Sintomas / humor',    desc: 'Check-in diário' },
];

const SETUP_MESSAGES = [
  'Analisando seus objetivos...',
  'Construindo seu painel personalizado...',
  'Configurando suas categorias de tracking...',
  'Calculando metas nutricionais...',
  'Preparando sua linha do tempo...',
  'Seu Atlas Core está pronto.',
];

// ─────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <AtlasCoreLogoSVG width={28} height={28} className="shrink-0" />
      <span className="text-[17px] font-bold tracking-tight">Atlas Core</span>
    </div>
  );
}

function StepDots({ step, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === step ? 'w-6 h-2 bg-[hsl(var(--brand))]'
          : i < step ? 'w-2 h-2 bg-[hsl(var(--brand)/0.4)]'
          : 'w-2 h-2 bg-[hsl(var(--border-h))]'
        }`} />
      ))}
    </div>
  );
}

function GoalChip({ selected, onClick, emoji, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all text-center
      ${selected ? 'border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand)/0.08)] shadow-sm' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--card-hi))]'}`}>
      <span className="text-[22px] leading-none">{emoji}</span>
      <span className={`text-[12px] font-semibold leading-tight ${selected ? 'text-[hsl(var(--fg))]' : 'text-[hsl(var(--fg-2))]'}`}>{label}</span>
      {selected && <div className="w-4 h-4 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center">
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
      </div>}
    </button>
  );
}

function ActivityRow({ selected, onClick, label, desc }) {
  return (
    <button onClick={onClick} className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all
      ${selected ? 'border-[hsl(var(--brand)/0.4)] bg-[hsl(var(--brand)/0.07)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--card-hi))]'}`}>
      <div>
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="text-[12px] text-[hsl(var(--fg-2))] ml-2">{desc}</span>
      </div>
      {selected && <Check className="w-3.5 h-3.5 text-[hsl(var(--brand))] shrink-0" strokeWidth={2.5} />}
    </button>
  );
}

function TrackChip({ selected, onClick, emoji, label, desc }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left
      ${selected ? 'border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand)/0.08)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--card-hi))]'}`}>
      <span className="text-[20px] leading-none shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-semibold leading-tight ${selected ? 'text-[hsl(var(--fg))]' : 'text-[hsl(var(--fg-2))]'}`}>{label}</p>
        <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5">{desc}</p>
      </div>
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
        ${selected ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))]' : 'border-[hsl(var(--border))]'}`}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

function FieldLabel({ children }) {
  return <label className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] block mb-1.5">{children}</label>;
}

// ─────────────────────────────────────────────────────────
// STEP SCREENS
// ─────────────────────────────────────────────────────────

function StepWelcome() {
   return (
     <div className="text-center space-y-6 py-2">
       <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center mx-auto">
         <Heart className="w-8 h-8 text-[hsl(var(--brand))]" strokeWidth={1.75} />
       </div>
      <div>
        <h2 className="text-[22px] font-bold tracking-tight mb-2">Bem-vindo ao Atlas Core</h2>
        <p className="text-[14px] text-[hsl(var(--fg-2))] leading-relaxed max-w-xs mx-auto">
          Vamos configurar o app especificamente para você. Leva menos de 2 minutos.
        </p>
        <p className="text-[12px] text-[hsl(var(--ok))] mt-2 font-medium">⭐ Complete os dados essenciais para melhor experiência.</p>
      </div>
      <div className="space-y-2 text-left">
        {[
          ['📊', 'Seu histórico único', 'Treino, nutrição, exames, medidas — em uma timeline conectada'],
          ['🎯', 'Rastreamento inteligente', 'Acompanhe o que importa e veja a evolução em contexto'],
          ['🤖', 'IA contextual', 'Recomendações que usam seus dados reais, não perguntas genéricas'],
          ['⚡', 'Configuração automática', 'Calculamos suas metas de nutrição e setup do painel'],
        ].map(([emoji, title, desc]) => (
          <div key={title} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--card-hi))] border border-[hsl(var(--border-h))]">
            <span className="text-[18px] shrink-0 leading-none">{emoji}</span>
            <div className="text-left">
              <p className="text-[13px] font-semibold leading-snug">{title}</p>
              <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGoalAndBasics({ form, set, toggle }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold mb-1">Qual é seu objetivo principal?</h2>
        <p className="text-[12px] text-[hsl(var(--fg-2))]">Define o foco do seu painel e das recomendações da IA</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {GOALS.map(g => (
          <GoalChip key={g.id} selected={form.health_goals.includes(g.id)}
            onClick={() => toggle('health_goals', g.id)} emoji={g.emoji} label={g.label} />
        ))}
      </div>
      <div className="pt-1 border-t border-[hsl(var(--border-h))]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-3">Dados básicos</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Altura (cm)</FieldLabel>
            <Input type="number" value={form.height} onChange={e => set('height', e.target.value)} placeholder="175" className="h-10 rounded-lg text-[13px]" />
          </div>
          <div>
            <FieldLabel>Peso atual (kg)</FieldLabel>
            <Input type="number" step="0.1" value={form.current_weight} onChange={e => set('current_weight', e.target.value)} placeholder="80" className="h-10 rounded-lg text-[13px]" />
          </div>
          <div>
            <FieldLabel>Sexo biológico</FieldLabel>
            <Select value={form.sex} onValueChange={v => set('sex', v)}>
              <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Idade</FieldLabel>
            <Input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="30" className="h-10 rounded-lg text-[13px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRoutineAndExperience({ form, set }) {
  // adaptive: show more detail for active/very_active users
  const isAdvanced = ['active', 'very_active'].includes(form.activity_level);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold mb-1">Sua rotina de treino</h2>
        <p className="text-[12px] text-[hsl(var(--fg-2))]">Calibra metas e personaliza a geração de treinos e dietas</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))] mb-2">Nível de atividade</p>
        <div className="space-y-1.5">
          {ACTIVITY_LEVELS.map(a => (
            <ActivityRow key={a.id} selected={form.activity_level === a.id}
              onClick={() => set('activity_level', a.id)} label={a.label} desc={a.desc} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[hsl(var(--border-h))]">
        <div>
          <FieldLabel>Treinos / semana</FieldLabel>
          <Select value={String(form.training_days_per_week || '')} onValueChange={v => set('training_days_per_week', Number(v))}>
            <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7].map(n => <SelectItem key={n} value={String(n)}>{n}× / semana</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Experiência</FieldLabel>
          <Select value={form.training_experience || ''} onValueChange={v => set('training_experience', v)}>
            <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Iniciante (&lt;1 ano)</SelectItem>
              <SelectItem value="intermediate">Intermediário (1–3 anos)</SelectItem>
              <SelectItem value="advanced">Avançado (3–6 anos)</SelectItem>
              <SelectItem value="expert">Expert (6+ anos)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Adaptive: advanced users see more context fields */}
      {isAdvanced && (
        <div className="space-y-3 pt-1 border-t border-[hsl(var(--border-h))]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))]">Contexto adicional</p>
          <div>
            <FieldLabel>Equipamentos disponíveis</FieldLabel>
            <Input value={form.training_equipment} onChange={e => set('training_equipment', e.target.value)}
              placeholder="Ex: Academia completa, halteres, barra..." className="h-10 rounded-lg text-[13px]" />
          </div>
          <div>
            <FieldLabel>Lesões ou limitações</FieldLabel>
            <Input value={form.injuries} onChange={e => set('injuries', e.target.value)}
              placeholder="Ex: Joelho, hérnia lombar, ombro..." className="h-10 rounded-lg text-[13px]" />
          </div>
          <div>
            <FieldLabel>Estilo alimentar</FieldLabel>
            <Input value={form.dietary_style} onChange={e => set('dietary_style', e.target.value)}
              placeholder="Ex: Low-carb, carnívoro, mediterrâneo..." className="h-10 rounded-lg text-[13px]" />
          </div>
        </div>
      )}
    </div>
  );
}

function StepTrackingSetup({ form, toggle }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold mb-1">O que quer acompanhar?</h2>
        <p className="text-[12px] text-[hsl(var(--fg-2))]">
          Isso monta seu painel inicial. Você pode ativar ou desativar depois a qualquer momento.
        </p>
      </div>
      <div className="space-y-2">
        {TRACK_OPTIONS.map(opt => (
          <TrackChip key={opt.id} selected={form.track_interests.includes(opt.id)}
            onClick={() => toggle('track_interests', opt.id)} emoji={opt.emoji} label={opt.label} desc={opt.desc} />
        ))}
      </div>
      <p className="text-[11px] text-[hsl(var(--fg-2))] text-center">
        Selecione quantos quiser — mais é sempre melhor para a IA
      </p>
    </div>
  );
}

function StepPreferences({ form, set }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold mb-1">Preferências finais</h2>
        <p className="text-[12px] text-[hsl(var(--fg-2))]">Customize sua experiência</p>
      </div>
      
      <div className="space-y-3 border-t border-[hsl(var(--border-h))] pt-4">
        <div>
          <FieldLabel>Peso alvo (kg)</FieldLabel>
          <Input type="number" step="0.1" value={form.target_weight} onChange={e => set('target_weight', e.target.value)} placeholder="75" className="h-10 rounded-lg text-[13px]" />
        </div>
        <div>
          <FieldLabel>Objetivo de treino</FieldLabel>
          <Input value={form.training_goal} onChange={e => set('training_goal', e.target.value)} placeholder="Ex: Hipertrofia, emagrecimento, performance…" className="h-10 rounded-lg text-[13px]" />
        </div>
      </div>

      <div className="space-y-3 border-t border-[hsl(var(--border-h))] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))]">Tom da IA</p>
        <Select value={form.ai_tone_preference} onValueChange={v => set('ai_tone_preference', v)}>
          <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="friendly">Amigável e encorajador</SelectItem>
            <SelectItem value="direct">Direto e objetivo</SelectItem>
            <SelectItem value="motivational">Motivacional e intenso</SelectItem>
            <SelectItem value="analytical">Analítico e técnico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 border-t border-[hsl(var(--border-h))] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--fg-2))]">Tema</p>
        <Select value={form.theme_preference} onValueChange={v => set('theme_preference', v)}>
          <SelectTrigger className="h-10 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Claro (padrão)</SelectItem>
            <SelectItem value="dark">Escuro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────────────────

function SuccessScreen({ onDone }) {
  useEffect(() => {
    // Trigger confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="text-center py-4 space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-[hsl(var(--ok)/0.1)] flex items-center justify-center mx-auto">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Check className="w-10 h-10 text-[hsl(var(--ok))]" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="space-y-2">
        <h2 className="text-[24px] font-bold">Perfeito! 🎉</h2>
        <p className="text-[14px] text-[hsl(var(--fg-2))] leading-relaxed">
          Seu Atlas Core foi configurado com suas metas e preferências. Você está pronto para começar.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="space-y-2 text-left px-2">
        {[
          { emoji: '✓', text: 'Perfil personalizado criado' },
          { emoji: '✓', text: 'Metas nutricionais calculadas' },
          { emoji: '✓', text: 'Painel inicial montado' },
          { emoji: '✓', text: 'IA contextual pronta' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 text-[13px]">
            <span className="text-[hsl(var(--ok))] font-bold">{item.emoji}</span>
            <span className="text-[hsl(var(--fg))]">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        onClick={onDone} className="btn btn-primary w-full h-12 rounded-2xl text-[14px] gap-2 mt-2">
        <ArrowRight className="w-4 h-4" strokeWidth={2} /> Entrar no app
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SETUP GENERATION SCREEN
// ─────────────────────────────────────────────────────────

function SetupGenerationScreen({ onDone }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      if (i < SETUP_MESSAGES.length - 1) {
        setMsgIdx(i);
      } else {
        setMsgIdx(SETUP_MESSAGES.length - 1);
        setDone(true);
        clearInterval(intervalRef.current);
      }
    }, 700);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="text-center py-6 space-y-8">
      <div className="relative w-20 h-20 mx-auto">
        {/* Spinning ring */}
        <svg className="absolute inset-0 -rotate-90 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border-h))" strokeWidth="4" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--brand))" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="50 164" />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <Check className="w-8 h-8 text-[hsl(var(--ok))]" strokeWidth={2.5} />
            : <Zap className="w-7 h-7 text-[hsl(var(--brand))]" strokeWidth={2} />
          }
        </div>
      </div>

      <div className="space-y-2 min-h-[48px]">
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-[15px] font-semibold text-[hsl(var(--fg))]">
            {SETUP_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        {!done && <p className="text-[12px] text-[hsl(var(--fg-2))]">Configurando seu Atlas Core...</p>}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={onDone} className="btn btn-primary h-12 px-8 rounded-2xl text-[14px] gap-2">
            <ArrowRight className="w-4 h-4" strokeWidth={2} /> Entrar no app
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

const TOTAL_CONTENT_STEPS = 5; // 0=welcome, 1=goal+basics, 2=routine, 3=tracking, 4=preferences

const INITIAL_FORM = {
  sex: 'male', age: '', height: '', current_weight: '', target_weight: '',
  health_goals: [], activity_level: 'moderate',
  training_days_per_week: '', training_experience: '',
  training_equipment: '', injuries: '', dietary_style: '', training_goal: '',
  track_interests: [],
  theme_preference: 'light', ai_tone_preference: 'friendly',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showGeneration, setShowGeneration] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!isAuthenticated || !user) navigate('/Landing', { replace: true });
    // If user already completed onboarding, redirect to home
    if (user?.onboarding_completed) {
      const homeUrl = {
        coach: '/coach-dashboard',
        clinician: '/clinician-dashboard',
        nutritionist: '/nutritionist-dashboard',
        admin: '/AdminPanel',
      }[user?.atlas_role] || '/Today';
      navigate(homeUrl, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, id) => setForm(f => ({
    ...f,
    [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id],
  }));

  const canContinue = () => {
    // Mandatory fields per step
    if (step === 0) return true; // Welcome can always continue
    if (step === 1) return form.health_goals.length > 0 && form.height && form.current_weight && form.age;
    if (step === 2) return !!form.activity_level;
    if (step === 3) return form.track_interests.length > 0; // At least one tracking option
    return true;
  };

  const canSkipStep = () => {
    // Cannot skip mandatory steps (1=biometrics, 2=activity, 3=tracking)
    if ([1, 2, 3].includes(step)) return false;
    return true;
  };

  const saveAndFinish = async () => {
    if (!isAuthenticated || !user) { navigate('/Landing', { replace: true }); return; }
    setSaving(true);
    try {
      const nums = ['age', 'height', 'current_weight', 'target_weight', 'training_days_per_week'];
      const payload = { onboarding_completed: true };
      Object.entries(form).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return;
        if (Array.isArray(v)) { if (v.length) payload[k] = v; }
        else payload[k] = nums.includes(k) ? Number(v) : v;
      });

      // Auto-calculate macro targets
      const w = Number(form.current_weight) || 80;
      const isDeficit = form.health_goals.includes('fat_loss');
      const multiplier = isDeficit ? 28 : (form.health_goals.includes('muscle_gain') ? 35 : 30);
      payload.calories_target = Math.round(w * multiplier);
      payload.protein_target = Math.round(w * 2.2);
      payload.carbs_target = Math.round((payload.calories_target * 0.40) / 4);
      payload.fat_target = Math.round((payload.calories_target * 0.25) / 9);
      payload.water_target = parseFloat((w * 0.035).toFixed(1));

      const existing = await base44.entities.UserProfile.list();
      if (existing?.[0]) await base44.entities.UserProfile.update(existing[0].id, payload);
      else await base44.entities.UserProfile.create(payload);
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    await saveAndFinish();
    setShowGeneration(true);
  };

  const handleGenerationDone = () => {
    setShowGeneration(false);
    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    const homeUrl = {
      coach: '/coach-dashboard',
      clinician: '/clinician-dashboard',
      nutritionist: '/nutritionist-dashboard',
      admin: '/AdminPanel',
    }[user?.atlas_role] || '/Today';
    navigate(homeUrl, { replace: true });
  };

  const isLastStep = step === TOTAL_CONTENT_STEPS - 1;

  const stepContent = () => {
    switch (step) {
      case 0: return <StepWelcome />;
      case 1: return <StepGoalAndBasics form={form} set={set} toggle={toggle} />;
      case 2: return <StepRoutineAndExperience form={form} set={set} />;
      case 3: return <StepTrackingSetup form={form} toggle={toggle} />;
      case 4: return <StepPreferences form={form} set={set} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center p-5">
      <div className="w-full max-w-md">

        {!showGeneration && !showSuccess && (
          <div className="flex justify-between items-center mb-1">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-2 py-1 text-[12px] rounded border border-[hsl(var(--border-h))] bg-[hsl(var(--card))] text-[hsl(var(--fg))]">
              <option value="pt-BR">PT</option>
              <option value="en-US">EN</option>
            </select>
            <button onClick={() => navigate('/Landing', { replace: true })}
              className="p-2 rounded-lg hover:bg-[hsl(var(--shell))] transition-colors text-[hsl(var(--fg-2))]">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}

        <Logo />

        {showSuccess ? (
          <div className="surface rounded-2xl p-8">
            <SuccessScreen onDone={handleSuccessDone} />
          </div>
        ) : showGeneration ? (
          <div className="surface rounded-2xl p-8">
            <SetupGenerationScreen onDone={handleGenerationDone} />
          </div>
        ) : (
          <>
            <StepDots step={step} total={TOTAL_CONTENT_STEPS} />

            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="surface rounded-2xl p-6 mb-4">
                {stepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-2.5">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary h-11 rounded-xl px-4">
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
              {!isLastStep ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
                  className="btn btn-primary flex-1 h-11 rounded-xl text-[14px] gap-1">
                  Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </button>
              ) : (
                <button onClick={handleFinish} disabled={saving}
                  className="btn btn-primary flex-1 h-11 rounded-xl text-[14px] gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" strokeWidth={2} /> Configurar meu Atlas Core</>}
                </button>
              )}
              </div>

              {step === 0 && (
                <p className="text-center text-[11px] text-[hsl(var(--fg-2))] mt-4">
                  {t('onboarding.welcome.terms').replace('{termsOfUse}', `<span class="underline cursor-pointer">${t('common.termsOfUse')}</span>`)}
                </p>
              )}
              {step > 0 && canSkipStep() && (
                <button onClick={() => setStep(s => s + 1)}
                  className="w-full text-center text-[12px] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))] mt-4 py-1 transition-colors">
                  {t('common.skip')}
                </button>
              )}
          </>
        )}
      </div>
    </div>
  );
}