import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Heart, Share2, Dumbbell, UtensilsCrossed, BarChart3, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

function StatCard({ label, value, unit, color }) {
  return (
    <div className="text-center">
      <p className="kpi-sm" style={{ color }}>{value ?? '—'}</p>
      <p className="t-caption">{label}{unit ? ` (${unit})` : ''}</p>
    </div>
  );
}

function SocialShareCard({ user, stats }) {
  const handleShare = async () => {
    const text = `🏋️ Meu progresso no Atlas Core:\n📊 ${stats.calories ?? 0} kcal hoje\n💪 ${stats.workouts ?? 0} treinos esta semana\n⚖️ ${stats.weight ?? '—'} kg`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meu progresso — Atlas Core', text });
        toast.success('Compartilhado!');
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Stats copiados!');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      await navigator.clipboard.writeText(text);
      toast.success('Stats copiados!');
    }
  };

  return (
    <div className="surface p-5 bg-gradient-to-br from-[hsl(var(--brand)/0.05)] to-[hsl(var(--brand-ai)/0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand)/0.1)] flex items-center justify-center font-bold text-[hsl(var(--brand))] text-[14px]">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-[13px] font-semibold">{user?.full_name || 'Você'}</p>
            <p className="t-caption">Meu card de stats</p>
          </div>
        </div>
        <button onClick={handleShare} className="btn btn-secondary gap-1.5 h-8 text-[12px]">
          <Share2 className="w-3.5 h-3.5" /> Compartilhar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[hsl(var(--border-h))]">
        <StatCard label="Calorias" value={stats.calories} unit="kcal" color="hsl(var(--brand))" />
        <StatCard label="Treinos" value={stats.workouts} unit="/sem" color="hsl(var(--brand-ai))" />
        <StatCard label="Peso" value={stats.weight} unit="kg" color="hsl(var(--ok))" />
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const date = post.created_date ? new Date(post.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--shell))] flex items-center justify-center text-[13px] font-bold text-[hsl(var(--fg-2))]">
          {post.author_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-[13px] font-semibold">{post.author_name || 'Atleta'}</p>
          {date && <p className="t-caption">{date}</p>}
        </div>
        <span className="badge badge-neutral ml-auto capitalize">{post.type?.replace('_', ' ')}</span>
      </div>

      <p className="t-body">{post.content}</p>

      {post.photo_url && (
        <img src={post.photo_url} alt="" className="w-full rounded-xl object-cover max-h-64" />
      )}

      {post.stats_data && (
        <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-[hsl(var(--shell))] t-small">
          {post.stats_data.calories && <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5" />{post.stats_data.calories} kcal</span>}
          {post.stats_data.workouts && <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" />{post.stats_data.workouts} treinos</span>}
          {post.stats_data.weight && <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" />{post.stats_data.weight} kg</span>}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-[hsl(var(--border-h))]">
        <button onClick={() => setLiked(l => !l)} className={`flex items-center gap-1.5 t-small transition-colors ${liked ? 'text-[hsl(var(--err))]' : 'text-[hsl(var(--fg-2))] hover:text-[hsl(var(--err))]'}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} strokeWidth={2} />
          <span>{(post.likes || 0) + (liked ? 1 : 0)}</span>
        </button>
      </div>
    </div>
  );
}

function NewPostBox({ user, onPosted }) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await base44.entities.Post.create({
      content,
      type: 'update',
      author_name: user?.full_name || 'Atleta',
      author_email: user?.email,
      visibility: 'friends',
    });
    setContent('');
    onPosted();
    toast.success('Publicado!');
    setPosting(false);
  };

  return (
    <div className="surface p-4 space-y-3">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Compartilhe seu progresso ou conquista…"
        className="w-full resize-none rounded-xl bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))] px-4 py-3 text-[13px] text-[hsl(var(--fg))] placeholder:text-[hsl(var(--fg-2)/0.5)] outline-none focus:border-[hsl(var(--brand)/0.4)] transition-colors h-24"
      />
      <div className="flex justify-end">
        <button onClick={submit} disabled={!content.trim() || posting} className="btn btn-primary gap-1.5 h-9">
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Publicar
        </button>
      </div>
    </div>
  );
}

export default function Social() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigate('/Landing', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const today = new Date().toISOString().split('T')[0];

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 30),
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['meals-today', today],
    queryFn: () => base44.entities.Meal.filter({ date: today }),
    initialData: [],
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-recent'],
    queryFn: () => base44.entities.Workout.list('-date', 7),
    initialData: [],
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements'],
    queryFn: () => base44.entities.Measurement.list('-date', 1),
    initialData: [],
  });

  const stats = {
    calories: Math.round(meals.reduce((s, m) => s + (m.total_calories || 0), 0)),
    workouts: workouts.filter(w => w.completed).length,
    weight: measurements[0]?.weight ?? null,
  };

  return (
    <div className="p-5 lg:p-8 max-w-2xl space-y-6">
      <div className="pb-5 border-b border-[hsl(var(--border-h))]">
        <h1 className="t-headline">Social</h1>
        <p className="t-small mt-1">Feed de progresso e conquistas</p>
      </div>

      <SocialShareCard user={user} stats={stats} />

      <NewPostBox user={user} onPosted={() => qc.invalidateQueries({ queryKey: ['social-posts'] })} />

      <div>
        <p className="t-label mb-3">Feed recente</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 t-small text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users className="w-5 h-5 text-[hsl(var(--fg-2))]" strokeWidth={1.5} /></div>
            <p className="t-subtitle mb-1">Sem posts ainda</p>
            <p className="t-caption">Seja o primeiro a compartilhar seu progresso!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}