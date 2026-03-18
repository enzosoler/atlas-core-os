import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getToday, getGreeting } from '@/lib/atlas-theme';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle, ClipboardCheck,
  UtensilsCrossed, Dumbbell, Package,
  Flame, Brain,
} from 'lucide-react';
import StreakBadge from '@/components/checkin/StreakBadge';
import AITodayInsight from '@/components/ai/AITodayInsight';
import ProfessionalLinks from '@/components/shared/ProfessionalLinks';
import SupportWidget from '@/components/shared/SupportWidget';

const CHECKIN_ROWS = [
  { key: 'mood',             label: 'Humor',   min: 1, max: 5,  unit: '' },
  { key: 'energy',           label: 'Energia', min: 1, max: 5,  unit: '' },
  { key: 'sleep_hours',      label: 'Sono',    min: 3, max: 12, unit: 'h' },
  { key: 'hydration_liters', label: 'Água',    min: 0, max: 5,  unit: 'L' },
];

function CheckinCard({ existing }) {
  const qc = useQueryClient();
  const today = getToday();
  const [vals, setVals] = useState({
    mood:              existing?.mood              || 3,
    energy:            existing?.energy            || 3,
    sleep_hours:       existing?.sleep_hours       || 7,
    hydration_liters:  existing?.hydration_liters  || 2,
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!existing);

  if (!editing && existing) {
    return (
      <div className="sys-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-[hsl(var(--label-primary))]">Check-in feito</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[hsl(var(--tint))] font-medium"
          >
            Editar
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {CHECKIN_ROWS.map(r => (
            <div key={r.key} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-[hsl(var(--label-primary))]">
                {existing[r.key]}{r.unit}
              </span>
              <span className="text-[10px] font-semibold text-[hsl(var(--label-tertiary))] uppercase tracking-wide">
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      if (existing?.id) {
        await base44.entities.DailyCheckin.update(existing.id, { ...vals, date: today });
      } else {
        await base44.entities.DailyCheckin.create({ ...vals, date: today });
      }
      await qc.invalidateQueries({ queryKey: ['checkin'] });
      toast.success('Check-in salvo!');
      setEditing(false);
    } catch (e) {
      toast.error('Erro ao salvar check-in');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sys-card p-5">
      <h2 className="font-semibold text-[hsl(var(--label-primary))] mb-4">Como você está hoje?</h2>
      <div className="space-y-5">
        {CHECKIN_ROWS.map(r => (
          <div key={r.key}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[hsl(var(--label-secondary))]">{r.label}</span>
              <span className="text-sm font-bold text-[hsl(var(--tint))]">
                {vals[r.key]}{r.unit}
              </span>
            </div>
            <Slider
              min={r.min}
              max={r.max}
              step={r.key === 'sleep_hours' ? 0.5 : 1}
              value={[vals[r.key]]}
              onValueChange={([v]) => setVals(prev => ({ ...prev, [r.key]: v }))}
            />
          </div>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-5 w-full bg-[hsl(var(--tint))] text-white font-semibold py-3 rounded-[var(--r-lg)] flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
        {saving ? 'Salvando...' : 'Salvar Check-in'}
      </button>
    </div>
  );
}

export default function TodayPage() {
  const { user } = useAuth();
  const today = getToday();
  const greeting = getGreeting();

  const { data: checkins = [], isLoading: loadingCheckin } = useQuery({
    queryKey: ['checkin', today],
    queryFn: () => base44.entities.DailyCheckin.filter({ date: today }),
    enabled: !!user,
  });

  const { data: recentCheckins = [] } = useQuery({
    queryKey: ['checkin-recent'],
    queryFn: () => base44.entities.DailyCheckin.list('-date', 14),
    enabled: !!user,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-today', today],
    queryFn: () => base44.entities.Workout.filter({ date: today }),
    enabled: !!user,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['meals-today', today],
    queryFn: () => base44.entities.FoodLog.filter({ date: today }),
    enabled: !!user,
  });

  const todayCheckin = checkins[0] || null;

  const quickLinks = [
    { to: '/Workouts',  icon: <Dumbbell className="w-5 h-5" />,        label: 'Treino',    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950' },
    { to: '/Nutrition', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Nutrição',  color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950' },
    { to: '/Protocols', icon: <Package className="w-5 h-5" />,         label: 'Protocolos',color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--sys-bg))]">
      {/* Nav Bar */}
      <div className="sticky top-0 z-40 nav-bar px-5 pt-safe-top">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--label-tertiary))] uppercase tracking-wider">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-title1 font-bold text-[hsl(var(--label-primary))] leading-tight">
              {greeting}, {user?.full_name?.split(' ')[0] || 'Atleta'}
            </h1>
          </div>
          <StreakBadge checkins={recentCheckins} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24 space-y-4 max-w-xl mx-auto pt-4">

        {/* Check-in Card */}
        {loadingCheckin ? (
          <div className="sys-card p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--tint))]" />
          </div>
        ) : (
          <CheckinCard existing={todayCheckin} />
        )}

        {/* Quick Actions */}
        <div className="sys-card p-4">
          <p className="text-xs font-semibold text-[hsl(var(--label-tertiary))] uppercase tracking-wider mb-3">
            Acesso Rápido
          </p>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(({ to, icon, label, color, bg }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-2 p-3 rounded-[var(--r-md)] hover:opacity-80 transition-opacity"
              >
                <div className={`w-12 h-12 rounded-[var(--r-md)] ${bg} flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-[hsl(var(--label-secondary))]">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <AITodayInsight checkin={todayCheckin} meals={meals} workouts={workouts} />

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="sys-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-[hsl(var(--label-tertiary))] uppercase tracking-wide">Treinos</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--label-primary))]">{workouts.length}</p>
            <p className="text-xs text-[hsl(var(--label-tertiary))]">hoje</p>
          </div>
          <div className="sys-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-[hsl(var(--label-tertiary))] uppercase tracking-wide">Refeições</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--label-primary))]">{meals.length}</p>
            <p className="text-xs text-[hsl(var(--label-tertiary))]">registradas hoje</p>
          </div>
        </div>

        {/* Professional Links */}
        <ProfessionalLinks />

        {/* Support */}
        <SupportWidget />

      </div>
    </div>
  );
}
