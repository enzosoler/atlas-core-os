import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import AIProgressAnalysis from '@/components/ai/AIProgressAnalysis';

function MetricCard({ label, value, unit, change, goal, data }) {
  const isPositive = change > 0;
  const isGoal = goal && Math.abs(goal - value) < Math.abs(goal - (data?.[0]?.value || value));

  return (
    <div className="surface rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="t-small text-[hsl(var(--fg-2))]">{label}</p>
          <p className="t-kpi-sm mt-1">
            {value?.toFixed(1)}
            <span className="text-[14px] font-normal ml-1 text-[hsl(var(--fg-2))]">{unit}</span>
          </p>
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-[12px] font-medium ${isPositive ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--warn))]'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(1)}
          </div>
        )}
      </div>

      {/* Chart */}
      {data && data.length > 1 && (
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="hsl(var(--brand))" fill="url(#colorChart)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Goal */}
      {goal && (
        <div className="pt-2 border-t border-[hsl(var(--border-h))]">
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="text-[hsl(var(--fg-2))]">Meta: {goal}</span>
            <span className={`font-medium ${isGoal ? 'text-[hsl(var(--ok))]' : 'text-[hsl(var(--warn))]'}`}>
              {Math.abs(goal - value).toFixed(1)} para ir
            </span>
          </div>
          <div className="h-1.5 bg-[hsl(var(--shell))] rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--brand))] rounded-full transition-all"
              style={{ width: `${Math.min((value / goal) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Progress() {
  const [timeframe, setTimeframe] = useState('12w'); // 4w, 8w, 12w

  const weeksBack = timeframe === '4w' ? 4 : timeframe === '8w' ? 8 : 12;
  const startDate = subDays(new Date(), weeksBack * 7);

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements-progress', timeframe],
    queryFn: () => base44.entities.Measurement.list('-date', 100),
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile-progress'],
    queryFn: () => base44.entities.UserProfile.list().then(r => r?.[0]),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['progress-photos'],
    queryFn: () => base44.entities.ProgressPhoto.list('-date', 50),
  });

  // Filter by timeframe
  const filteredMeasurements = measurements.filter(m => {
    const mDate = new Date(m.date);
    return mDate >= startDate;
  });

  // Calculate trends
  const latest = filteredMeasurements[0];
  const oldest = filteredMeasurements[filteredMeasurements.length - 1];

  const weightChange = latest && oldest ? latest.weight - oldest.weight : 0;
  const bfChange = latest && oldest ? latest.body_fat - oldest.body_fat : 0;

  // Chart data
  const chartData = filteredMeasurements
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({
      date: format(new Date(m.date), 'MMM d'),
      weight: m.weight,
      bf: m.body_fat,
      waist: m.waist,
    }));

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div>
        <h1 className="t-headline mb-1">Seu Progresso</h1>
        <p className="t-caption">Acompanhe tendências ao longo do tempo</p>
      </div>

      {/* Timeframe toggle */}
      <div className="flex gap-2">
        {['4w', '8w', '12w'].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 h-9 rounded-lg text-[12px] font-medium transition-colors ${
              timeframe === tf
                ? 'bg-[hsl(var(--brand))] text-white'
                : 'bg-[hsl(var(--shell))] text-[hsl(var(--fg-2))] hover:text-[hsl(var(--fg))]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* AI Analysis */}
      <AIProgressAnalysis measurements={filteredMeasurements} profile={profile} />

      {/* Weight */}
      <MetricCard
        label="Peso"
        value={latest?.weight}
        unit="kg"
        change={weightChange}
        goal={profile?.target_weight}
        data={chartData.map(d => ({ date: d.date, value: d.weight }))}
      />

      {/* Body Fat */}
      {latest?.body_fat && (
        <MetricCard
          label="Gordura Corporal"
          value={latest.body_fat}
          unit="%"
          change={bfChange}
          goal={profile?.body_fat_goal}
          data={chartData.map(d => ({ date: d.date, value: d.body_fat }))}
        />
      )}

      {/* Measurements */}
      {latest?.waist && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: 'waist', label: 'Cintura', unit: 'cm' },
            { key: 'chest', label: 'Peito', unit: 'cm' },
            { key: 'arms', label: 'Braço', unit: 'cm' },
            { key: 'thighs', label: 'Coxa', unit: 'cm' },
            { key: 'hips', label: 'Quadril', unit: 'cm' },
            { key: 'neck', label: 'Pescoço', unit: 'cm' },
          ].map(({ key, label, unit }) => {
            const latestVal = latest?.[key];
            const oldestVal = oldest?.[key];
            const change = latestVal && oldestVal ? latestVal - oldestVal : 0;
            return latestVal ? (
              <MetricCard
                key={key}
                label={label}
                value={latestVal}
                unit={unit}
                change={change}
                data={chartData.map(d => ({ date: d.date, value: d[key] }))}
              />
            ) : null;
          })}
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="surface rounded-xl p-5 space-y-4">
          <p className="t-subtitle">Fotos de Progresso</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {photos.map(p => (
              <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-[hsl(var(--shell))] border border-[hsl(var(--border-h))]">
                {p.photo_url ? (
                  <img src={p.photo_url} alt="progress" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[hsl(var(--fg-2))]">
                    <span className="text-[12px]">{format(new Date(p.created_date), 'MMM d')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}