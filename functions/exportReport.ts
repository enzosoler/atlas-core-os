import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── Backend entitlement check ──
const PLAN_ENTITLEMENTS = {
  free: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile'],
  pro: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile','atlas_ai','lab_exams','progress_photos','ai_diet_generation','ai_workout_generation','standard_exports','social_cards'],
  performance: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile','atlas_ai','lab_exams','progress_photos','ai_diet_generation','ai_workout_generation','standard_exports','social_cards','advanced_protocol_tracking','dose_timeline','premium_exports','macro_view_premium'],
  coach: ['coach_dashboard','coach_students','coach_create_diet','coach_edit_diet'],
  nutritionist: ['nutritionist_dashboard','nutritionist_clients','nutritionist_create_diet','nutritionist_edit_diet','nutritionist_exports'],
  clinician: ['clinician_dashboard','clinician_patients','clinician_lab_access','clinician_protocol_access','clinician_exports'],
};

async function assertFeatureAccess(base44, user, featureKey) {
  if (!user) throw new Error('Unauthorized');
  if (user.role === 'admin' || user.atlas_role === 'admin') return;

  const now = new Date().toISOString().split('T')[0];
  const [allSubs, allOverrides] = await Promise.all([
    base44.asServiceRole.entities.Subscription.filter({ user_email: user.email }),
    base44.asServiceRole.entities.EntitlementOverride.filter({ user_email: user.email }),
  ]);

  const activeSub = allSubs.find(s =>
    ['active','trialing'].includes(s.status) &&
    (!s.ends_at || s.ends_at >= now) &&
    (!s.trial_ends_at || s.trial_ends_at >= now)
  );
  const effectivePlan = activeSub?.plan_code || 'free';
  const allowed = new Set(PLAN_ENTITLEMENTS[effectivePlan] || PLAN_ENTITLEMENTS.free);

  for (const o of allOverrides) {
    if (o.feature_key !== featureKey) continue;
    if (o.expires_at && o.expires_at < now) continue;
    if (o.enabled) allowed.add(featureKey);
    else allowed.delete(featureKey);
  }

  if (!allowed.has(featureKey)) {
    throw Object.assign(new Error(`Plano atual (${effectivePlan}) não inclui ${featureKey}. Faça upgrade para continuar.`), { status: 403 });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── BACKEND ENTITLEMENT CHECK ──
    // standard_exports = pro+, premium_exports = performance+
    await assertFeatureAccess(base44, user, 'standard_exports');

    const { type, startDate, endDate } = await req.json();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [profiles, measurements, meals, workouts, labExams, protocols, checkins] = await Promise.all([
      base44.entities.UserProfile.list(),
      base44.entities.Measurement.filter({ date: { $gte: start, $lte: end } }, '-date', 100),
      base44.entities.Meal.filter({ date: { $gte: start, $lte: end } }, '-date', 200),
      base44.entities.Workout.filter({ date: { $gte: start, $lte: end } }, '-date', 100),
      base44.entities.LabExam.filter({ exam_date: { $gte: start, $lte: end } }, '-exam_date', 20),
      base44.entities.Protocol.filter({ active: true }),
      base44.entities.DailyCheckin.filter({ date: { $gte: start, $lte: end } }, '-date', 60),
    ]);

    const profile = profiles?.[0] || {};
    const hasData = measurements.length > 0 || meals.length > 0 || workouts.length > 0;

    const prompt = hasData
      ? `Gere um resumo executivo profissional para relatório de saúde e performance.

Período: ${start} a ${end}
Usuário: ${user.full_name}${profile.age ? `, ${profile.age} anos` : ''}${profile.current_weight ? `, ${profile.current_weight}kg` : ''}

Dados registrados:
- Refeições: ${meals.length}
- Treinos: ${workouts.length} (${workouts.filter(w => w.completed).length} concluídos)
- Medições: ${measurements.length}
- Exames: ${labExams.length}
- Protocolos: ${protocols.length}
- Check-ins: ${checkins.length}

${measurements.length > 0 ? `Últimas medições: ${measurements.slice(0, 2).map(m => `${m.date}: ${m.weight ? m.weight + 'kg' : ''}`).join(', ')}` : ''}

Estruture em: (1) Período & Contexto breve, (2) Destaques da Evolução, (3) Aderência, (4) Próximos Passos. Linguagem profissional, dados-driven, sem pessimismo.`
      : `Gere um resumo inicial para um período sem dados ainda registrados. Período: ${start} a ${end}. Usuário: ${user.full_name}. Tom encorajador e premium.`;

    const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    const totalCalories = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
    const totalProtein = meals.reduce((s, m) => s + (m.total_protein || 0), 0);
    const avgWeight = measurements.length > 0
      ? (measurements.reduce((s, m) => s + (m.weight || 0), 0) / measurements.length).toFixed(1)
      : null;
    const latestWeight = measurements[0]?.weight || null;
    const workoutAdherence = workouts.length > 0
      ? Math.round((workouts.filter(w => w.completed).length / workouts.length) * 100)
      : 0;
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    const checkinAdherence = Math.round((checkins.length / days) * 100);

    const reportData = {
      generated_at: new Date().toISOString(),
      user: { name: user.full_name, email: user.email },
      period: { start, end },
      profile,
      summary,
      hasData,
      stats: {
        measurements: measurements.length,
        meals: meals.length,
        workouts_total: workouts.length,
        workouts_completed: workouts.filter(w => w.completed).length,
        lab_exams: labExams.length,
        active_protocols: protocols.length,
        checkins: checkins.length,
      },
      metrics: {
        total_calories: totalCalories,
        total_protein: totalProtein,
        avg_weight: avgWeight,
        latest_weight: latestWeight,
        workout_adherence: workoutAdherence,
        checkin_adherence: checkinAdherence,
      },
      measurements: measurements.slice(0, 10),
      active_protocols: protocols,
      recent_lab_exams: labExams.slice(0, 3),
    };

    console.log(`exportReport: ${user.email} exported report ${start}→${end} (${measurements.length} measurements, ${meals.length} meals)`);
    return Response.json({ success: true, report: reportData });
  } catch (error) {
    const status = error.status || 500;
    console.error(`exportReport error [${status}]:`, error.message);
    return Response.json({ error: error.message }, { status });
  }
});