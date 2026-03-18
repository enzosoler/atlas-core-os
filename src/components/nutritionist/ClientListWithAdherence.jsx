import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * ClientListWithAdherence — detailed client list with adherence %, last meal, current weight
 */
export default function ClientListWithAdherence({ links = [], meals = [], measurements = [] }) {
  const clientData = links.filter(l => l.status === 'accepted').map(link => {
    const clientMeals = meals.filter(m => m.created_by === link.client_email);
    const lastMeal = clientMeals.length > 0 
      ? clientMeals.sort((a, b) => new Date(b.date) - new Date(a.date))[0] 
      : null;
    
    const thisMonthMeals = clientMeals.filter(m => {
      const date = new Date(m.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const expectedDays = new Date().getDate();
    const adherence = expectedDays > 0 ? (thisMonthMeals.length / expectedDays) * 100 : 0;
    
    const clientMeasurements = measurements.filter(m => m.created_by === link.client_email);
    const latestMeasurement = clientMeasurements.length > 0
      ? clientMeasurements.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

    return { link, lastMeal, adherence, latestMeasurement };
  });

  const getAdherenceColor = (pct) => {
    if (pct >= 80) return 'bg-[hsl(var(--ok)/0.1)] border-[hsl(var(--ok)/0.3)]';
    if (pct >= 50) return 'bg-[hsl(var(--warn)/0.08)] border-[hsl(var(--warn)/0.2)]';
    return 'bg-[hsl(var(--err)/0.05)] border-[hsl(var(--err)/0.2)]';
  };

  return (
    <div className="space-y-2">
      {clientData.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-[hsl(var(--fg-2))]">
          Nenhum cliente ativo
        </div>
      ) : (
        clientData.map(({ link, lastMeal, adherence, latestMeasurement }) => (
          <Link
            key={link.id}
            to={`/nutritionist/client/${link.id}`}
            className={`surface p-3.5 flex items-start gap-3 border transition-colors hover:border-[hsl(var(--brand)/0.3)] ${getAdherenceColor(adherence)}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[13px] text-[hsl(var(--fg))]">{link.client_name}</p>
                  <p className="text-[11px] text-[hsl(var(--fg-2))]">{link.client_email}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--brand))]" strokeWidth={2} />
                    <span className="text-[12px] font-bold text-[hsl(var(--fg))]">{Math.round(adherence)}%</span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--fg-2))]">aderência</p>
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 pt-2 border-t border-[hsl(var(--border-h))] text-[11px] text-[hsl(var(--fg-2))]">
                {lastMeal && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                    Última refeição: {formatDistanceToNow(new Date(lastMeal.date), { locale: ptBR, addSuffix: true })}
                  </div>
                )}
                {latestMeasurement?.weight && (
                  <div className="flex items-center gap-1">
                    ⚖️ {latestMeasurement.weight}kg em {new Date(latestMeasurement.date).toLocaleDateString('pt-BR')}
                  </div>
                )}
                {!lastMeal && (
                  <span className="italic text-[hsl(var(--err))]">Sem registros</span>
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}