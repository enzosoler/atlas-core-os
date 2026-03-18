import React from 'react';
import { AlertCircle, TrendingDown, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * NutritionistAlertsPanel — shows low adherence, no recent logging, stagnation
 */
export default function NutritionistAlertsPanel({ links, meals = [] }) {
  const alerts = [];

  // Low adherence clients (< 50% logging)
  links.forEach(link => {
    if (link.status !== 'accepted') return;
    const clientMeals = meals.filter(m => m.created_by === link.client_email);
    const thisMonthMeals = clientMeals.filter(m => {
      const date = new Date(m.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const expectedDays = new Date().getDate();
    const adherence = expectedDays > 0 ? (thisMonthMeals.length / expectedDays) * 100 : 0;
    
    if (adherence < 50 && adherence > 0) {
      alerts.push({
        id: `low-adherence-${link.id}`,
        type: 'low-adherence',
        client: link.client_name,
        clientId: link.id,
        value: Math.round(adherence),
        icon: TrendingDown,
      });
    }
  });

  // No recent logging
  links.forEach(link => {
    if (link.status !== 'accepted') return;
    const clientMeals = meals.filter(m => m.created_by === link.client_email);
    if (clientMeals.length === 0) return;
    const lastMeal = clientMeals.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const daysSince = Math.floor((new Date() - new Date(lastMeal.date)) / (1000 * 60 * 60 * 24));
    
    if (daysSince > 3) {
      alerts.push({
        id: `no-logging-${link.id}`,
        type: 'no-logging',
        client: link.client_name,
        clientId: link.id,
        days: daysSince,
        icon: Clock,
      });
    }
  });

  if (alerts.length === 0) {
    return (
      <div className="surface p-4 text-center">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--ok)/0.1)] flex items-center justify-center mx-auto mb-2">
          <Activity className="w-5 h-5 text-[hsl(var(--ok))]" strokeWidth={2} />
        </div>
        <p className="text-[13px] font-semibold text-[hsl(var(--fg))]">Tudo em dia</p>
        <p className="text-[11px] text-[hsl(var(--fg-2))] mt-0.5">Seus clientes estão mantendo ótima aderência</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="t-label">⚠️ Atenção necessária</p>
      {alerts.slice(0, 5).map(alert => {
        const Icon = alert.icon;
        return (
          <Link
            key={alert.id}
            to={`/nutritionist/client/${alert.clientId}`}
            className="surface p-3 flex items-start gap-3 border-[hsl(var(--warn)/0.3)] bg-[hsl(var(--warn)/0.02)] hover:border-[hsl(var(--warn)/0.5)] transition-colors"
          >
            <Icon className="w-4 h-4 text-[hsl(var(--warn))] mt-0.5 shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[hsl(var(--fg))]">{alert.client}</p>
              <p className="text-[11px] text-[hsl(var(--fg-2))]">
                {alert.type === 'low-adherence' && `Aderência baixa: ${alert.value}% este mês`}
                {alert.type === 'no-logging' && `Sem registros há ${alert.days} dias`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}