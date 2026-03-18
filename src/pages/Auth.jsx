import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Activity, Loader2, BarChart3, Dumbbell, FlaskConical, Brain } from 'lucide-react';

const FEATURES = [
  { icon: Dumbbell,    text: 'Treino e dieta em um só lugar' },
  { icon: FlaskConical, text: 'Exames laboratoriais e protocolos' },
  { icon: BarChart3,   text: 'Analytics e evolução real' },
  { icon: Brain,       text: 'IA contextual com seus dados' },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') === 'login';
  const isForgotPassword = searchParams.get('reset') === '1';
  const nextParam = searchParams.get('next');
  const [redirectPending, setRedirectPending] = React.useState(true);

  useEffect(() => {
    // Redirect to Base44 login, preserving requested destination when available
    const nextUrl = nextParam || `${window.location.origin}/Today`;
    const timer = setTimeout(() => {
      try {
        base44.auth.redirectToLogin(nextUrl);
      } catch (error) {
        console.error('Auth redirect failed:', error);
      }
    }, 800);

    const fallbackUiTimer = setTimeout(() => {
      setRedirectPending(false);
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackUiTimer);
    };
  }, [nextParam]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex" style={{ colorScheme: 'light' }}>

      {/* ── Left panel (branding) — hidden on mobile ── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 bg-[#111827] p-10">
        {/* Logo */}
        <Link to="/Landing" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-fit">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center shrink-0">
            <Activity className="w-[17px] h-[17px] text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[16px] font-bold text-white tracking-tight">Atlas Core</span>
        </Link>

        {/* Headline */}
        <div className="space-y-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3B82F6] mb-3">
              Sistema de evolução pessoal
            </p>
            <h2 className="text-[36px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              Seus dados.<br />
              Sua evolução.<br />
              <span className="text-[#3B82F6]">Tudo em um lugar.</span>
            </h2>
            <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-xs">
              Treino, nutrição, exames, medidas e protocolos — centralizados, conectados e com IA contextual.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#3B82F6]" strokeWidth={2} />
                </div>
                <span className="text-[13px] text-[#D1D5DB]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-[#6B7280]">© 2026 Atlas Core. Todos os direitos reservados.</p>
      </div>

      {/* ── Right panel (auth redirect) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">

        {/* Mobile logo */}
        <Link to="/Landing" className="lg:hidden flex items-center gap-2 mb-10 hover:opacity-75 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center shrink-0">
            <Activity className="w-[17px] h-[17px] text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[16px] font-bold text-[#111827] tracking-tight">Atlas Core</span>
        </Link>

        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#111827]/[0.08] p-8 shadow-sm">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/15 flex items-center justify-center mb-6 mx-auto">
              <Activity className="w-6 h-6 text-[#3B82F6]" strokeWidth={2} />
            </div>

            <div className="text-center mb-7">
              <h1 className="text-[24px] font-bold text-[#111827] tracking-tight mb-2">
                {isForgotPassword ? 'Recuperar senha' : isLogin ? 'Bem-vindo de volta' : 'Comece sua evolução'}
              </h1>
              <p className="text-[13px] text-[#667085] leading-relaxed">
                {isForgotPassword
                  ? 'Vamos ajudá-lo a recuperar o acesso…'
                  : isLogin
                  ? 'Fazendo login no Atlas Core…'
                  : 'Criando seu acesso ao Atlas Core…'}
              </p>
            </div>

            {/* Loading state */}
            <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#F6F8FB] border border-[#111827]/[0.06]">
              <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6] shrink-0" />
              <span className="text-[13px] text-[#667085] font-medium">
                {redirectPending ? 'Redirecionando…' : 'O login nao abriu automaticamente'}
              </span>
            </div>

            {!redirectPending && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => base44.auth.redirectToLogin(nextParam || `${window.location.origin}/Today`)}
                  className="w-full h-10 rounded-xl bg-[#3B82F6] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                >
                  Abrir login agora
                </button>
                <p className="text-center text-[11px] text-[#98A2B3]">
                  Se nada acontecer, verifique bloqueadores de popup ou extensoes de autenticacao.
                </p>
              </div>
            )}

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-[#111827]/[0.06]">
              {['Grátis para começar', 'Sem cartão', 'Cancele quando quiser'].map(t => (
                <span key={t} className="text-[10px] text-[#98A2B3] font-medium text-center leading-tight">{t}</span>
              ))}
            </div>
          </div>

          {/* Toggle link */}
          <p className="text-center text-[13px] text-[#667085] mt-5">
            {isForgotPassword ? (
              <>
                Lembrou a senha?{' '}
                <a
                  href="/auth?mode=login"
                  className="text-[#3B82F6] font-semibold hover:underline"
                >
                  Voltar para login
                </a>
              </>
            ) : (
              <>
                {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                <a
                  href={isLogin ? '/auth?mode=signup' : '/auth?mode=login'}
                  className="text-[#3B82F6] font-semibold hover:underline"
                >
                  {isLogin ? 'Criar conta grátis' : 'Fazer login'}
                </a>
              </>
            )}
          </p>

          {/* Forgot password link (only on login) */}
          {isLogin && !isForgotPassword && (
            <div className="text-center mt-3">
              <a
                href="/auth?reset=1"
                className="text-[12px] text-[#98A2B3] hover:text-[#667085] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>
          )}

          <div className="text-center mt-3">
            <Link to="/Landing" className="text-[12px] text-[#98A2B3] hover:text-[#667085] transition-colors">
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
