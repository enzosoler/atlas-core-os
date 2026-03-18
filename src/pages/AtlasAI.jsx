import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import UpgradeGate from '@/components/entitlements/UpgradeGate';
import { Brain, Send, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from '@/components/ai/MessageBubble';

const PROMPTS = [
  'Como está minha aderência nutricional?',
  'Analise meu progresso de peso',
  'O que meus exames indicam?',
  'Quais suplementos combinam com meus objetivos?',
  'Gere um resumo semanal',
  'Compare meu plano vs execução',
];

export default function AtlasAI() {
  const { can } = useSubscription();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  // All hooks before any conditional return
  useEffect(() => {
    base44.agents.listConversations({ agent_name: 'atlas_ai' }).then(c => { setConversations(c || []); setLoading(false); });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!active?.id) return;
    const unsub = base44.agents.subscribeToConversation(active.id, d => setMessages(d.messages || []));
    return unsub;
  }, [active?.id]);

  // Check entitlement after all hooks
  if (!can('atlas_ai')) {
    return (
      <div className="h-[calc(100vh-3rem)] lg:h-screen flex items-center justify-center p-5">
        <UpgradeGate feature="atlas_ai" plan="Pro" title="Atlas AI — Plano Pro+" description="Desbloqueie insights contextuais com inteligência artificial poderosa" />
      </div>
    );
  }

  const newConv = async () => {
    const c = await base44.agents.createConversation({ agent_name: 'atlas_ai', metadata: { name: `${new Date().toLocaleDateString('pt-BR')}` } });
    setActive(c); setMessages([]); setConversations(prev => [c, ...prev]);
  };

  const loadConv = async (c) => {
    const full = await base44.agents.getConversation(c.id);
    setActive(full); setMessages(full.messages || []);
  };

  const send = async (text) => {
    const content = text || input.trim();
    if (!content || sending) return;
    setInput(''); setSending(true);
    let conv = active;
    if (!conv) {
      conv = await base44.agents.createConversation({ agent_name: 'atlas_ai', metadata: { name: content.slice(0, 40) } });
      setActive(conv); setConversations(p => [conv, ...p]);
    }
    setMessages(m => [...m, { role: 'user', content }]);
    await base44.agents.addMessage(conv, { role: 'user', content });
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-3rem)] lg:h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-56 border-r border-border bg-[hsl(var(--shell))] shrink-0">
        <div className="p-3 border-b border-border">
          <Button onClick={newConv} variant="outline" className="w-full h-9 rounded-lg text-[13px] gap-1.5 border-border">
            <Plus className="w-3.5 h-3.5" /> Nova conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => loadConv(c)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] truncate transition-colors
                ${active?.id === c.id ? 'bg-[hsl(var(--brand-ai)/0.1)] text-[hsl(var(--brand-ai))]' : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--card))]'}`}>
              {c.metadata?.name || 'Conversa'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-border bg-[hsl(var(--card))] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--brand-ai)/0.1)] flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-[hsl(var(--brand-ai))]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[14px] font-semibold">Atlas AI</p>
            <p className="text-[11px] text-muted-foreground">Coach de saúde e performance</p>
          </div>
          <div className="ml-auto lg:hidden">
            <Button onClick={newConv} size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--brand-ai)/0.1)] flex items-center justify-center">
                <Brain className="w-7 h-7 text-[hsl(var(--brand-ai))]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[17px] font-bold mb-1.5 tracking-tight">Olá! Sou o Atlas AI</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Tenho acesso a todos os seus dados. Posso analisar evolução, comparar planos, gerar insights e muito mais.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => send(p)}
                    className="px-3.5 py-2.5 rounded-xl border border-border text-left text-[12px] text-muted-foreground hover:text-foreground hover:border-[hsl(var(--brand-ai)/0.3)] hover:bg-[hsl(var(--brand-ai)/0.04)] transition-all flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-[hsl(var(--brand-ai))] mt-0.5 shrink-0" strokeWidth={2} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--brand-ai)/0.1)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-ai)/0.6)]" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[hsl(var(--card))] border border-border">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 lg:px-6 pb-4 pt-3 border-t border-border bg-[hsl(var(--card))]">
          <div className="flex gap-2 items-center max-w-3xl mx-auto">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Pergunte algo sobre seus dados…"
              className="flex-1 h-11 rounded-xl bg-[hsl(var(--secondary))] border border-border px-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--brand-ai)/0.5)] transition-colors"
            />
            <Button onClick={() => send()} disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-xl bg-[hsl(var(--brand-ai))] hover:bg-[hsl(var(--brand-ai)/0.85)] text-white shrink-0 p-0">
              <Send className="w-4 h-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}