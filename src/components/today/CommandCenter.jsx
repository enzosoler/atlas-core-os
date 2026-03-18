import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle, Package, Dumbbell, UtensilsCrossed, ClipboardList } from 'lucide-react';

function ActionItem({ icon: Icon, title, subtitle, href, urgent }) {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
      ${urgent
        ? 'bg-destructive/8 border border-destructive/20 hover:bg-destructive/12'
        : 'bg-secondary hover:bg-secondary/80'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgent ? 'bg-destructive/15' : 'bg-card'}`}>
        <Icon className={`w-4 h-4 ${urgent ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium leading-tight ${urgent ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" strokeWidth={2} />
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

export default function CommandCenter({ protocols, supplements, meals, workouts, checkin, profile }) {
  const items = [];

  (protocols || []).filter(p => p.active && p.stock_quantity && p.daily_usage && (p.stock_quantity / p.daily_usage) <= 7).forEach(p => {
    const days = Math.floor(p.stock_quantity / p.daily_usage);
    items.push({ key: `sp-${p.id}`, icon: Package, title: `${p.name} — estoque acaba em ${days}d`, subtitle: 'Reabastecer em breve', href: '/Protocols', urgent: true });
  });
  (supplements || []).filter(s => s.active && s.stock_quantity && s.daily_usage && (s.stock_quantity / s.daily_usage) <= 7).forEach(s => {
    const days = Math.floor(s.stock_quantity / s.daily_usage);
    items.push({ key: `ss-${s.id}`, icon: Package, title: `${s.name} — estoque acaba em ${days}d`, subtitle: 'Reabastecer em breve', href: '/Protocols', urgent: true });
  });

  const todayWorkout = (workouts || []).find(w => !w.completed);
  if (todayWorkout) {
    items.push({ key: 'workout', icon: Dumbbell, title: `Treino pendente: ${todayWorkout.name}`, subtitle: `${todayWorkout.exercises?.length || 0} exercícios`, href: '/Workouts' });
  }

  const calSoFar = (meals || []).reduce((s, m) => s + (m.total_calories || 0), 0);
  const calLeft = (profile?.calories_target || 2200) - calSoFar;
  if (calLeft > 400) {
    items.push({ key: 'cal', icon: UtensilsCrossed, title: `${Math.round(calLeft)} kcal restantes`, subtitle: `${(meals || []).length} refeições registradas hoje`, href: '/Nutrition' });
  }

  if (!checkin) {
    items.push({ key: 'checkin', icon: ClipboardList, title: 'Check-in diário pendente', subtitle: 'Registre humor, energia e sono', href: '/Today' });
  }

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-[hsl(var(--primary))]" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[13px] font-semibold">Tudo em dia</p>
          <p className="text-[11px] text-muted-foreground">Excelente aderência hoje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ação necessária</p>
        <span className="text-[11px] font-semibold text-[hsl(var(--primary))]">{items.length}</span>
      </div>
      <div className="p-2 space-y-1">
        {items.slice(0, 5).map(item => <ActionItem key={item.key} {...item} />)}
      </div>
    </div>
  );
}