import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Loader2, Utensils, AlertTriangle } from 'lucide-react';
import RoleGate from '@/components/rbac/RoleGate';
import NutritionistAlertsPanel from '@/components/nutritionist/NutritionistAlertsPanel';
import ClientListWithAdherence from '@/components/nutritionist/ClientListWithAdherence';

function KPI({ icon: Icon, label, value, detail, link }) {
  const Component = link ? Link : 'div';
  const className = "surface rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-[hsl(var(--brand)/0.3)] transition-colors group";
  
  return (
    <Component to={link || '#'} className={link ? className : className.replace('cursor-pointer hover:border', '')}>
      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand)/0.08)] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[hsl(var(--brand))]" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[hsl(var(--fg-2))] font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[24px] font-bold text-[hsl(var(--fg))] leading-tight">{value}</p>
        {detail && <p className="text-[12px] text-[hsl(var(--fg-2))] mt-1">{detail}</p>}
      </div>
    </Component>
  );
}

export default function NutritionistDashboard() {
  const { user } = useAuth();

  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['nutritionist-clients'],
    queryFn: () => base44.entities.NutritionistClientLink.filter({ nutritionist_email: user?.email }),
  });

  const { data: diets = [], isLoading: loadingDiets } = useQuery({
    queryKey: ['prescribed-diets'],
    queryFn: () => base44.entities.PrescribedDiet.filter({ nutritionist_email: user?.email }),
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['all-meals'],
    queryFn: () => base44.entities.Meal.list('-date', 500),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['all-measurements'],
    queryFn: () => base44.entities.Measurement.list('-date', 100),
  });

  const activeClients = links.filter(l => l.status === 'accepted').length;
  const activeDiets = diets.filter(d => d.active).length;

  return (
    <RoleGate page="NutritionistDashboard">
      <div className="p-5 lg:p-8 max-w-5xl space-y-6">
        {/* Header with Atlas Nutrition branding */}
        <div className="pb-5 border-b border-[hsl(var(--border-h))]">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand)/0.1)] flex items-center justify-center">
              <Utensils className="w-6 h-6 text-[hsl(var(--brand))]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Atlas Nutrition</h1>
              <p className="text-[13px] text-[hsl(var(--fg-2))] mt-1">Gerenciamento de clientes e planos nutricionais</p>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        {loadingLinks || loadingDiets ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[hsl(var(--fg-2))]">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <KPI
              icon={Users}
              label="Clientes Ativos"
              value={activeClients}
              detail={`${links.length} total`}
              link="/nutritionist/clients"
            />
            <KPI
              icon={BarChart3}
              label="Planos Ativos"
              value={activeDiets}
              detail={`${diets.length} total`}
            />
            <KPI
              icon={TrendingUp}
              label="Taxa de Aderência"
              value={links.length > 0 ? Math.round((activeClients / links.length) * 100) : 0}
              detail="%"
            />
          </div>
        )}

        {/* Alerts & Clientes com Aderência */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Alerts panel */}
          <div className="space-y-2">
            <NutritionistAlertsPanel links={links} meals={meals} />
          </div>

          {/* Clients list */}
          <div className="space-y-3">
            <p className="t-label">Clientes com Aderência</p>
            <ClientListWithAdherence links={links} meals={meals} measurements={measurements} />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}