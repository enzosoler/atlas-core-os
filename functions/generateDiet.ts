import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
  const activeSub = allSubs.find(s => ['active','trialing'].includes(s.status) && (!s.ends_at || s.ends_at >= now));
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

    await assertFeatureAccess(base44, user, 'ai_diet_generation');

    const body = await req.json();
    const { date, profile, wizard } = body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // wizard = extra answers from the smart wizard (only what was missing)
    const w = wizard || {};

    const mealsPerDay = w.meals_per_day || profile?.meals_per_day || 5;
    const restrictions = w.restrictions || profile?.food_restrictions || profile?.dietary_style || 'nenhuma restrição';
    const allergies = w.allergies || profile?.allergies || 'nenhuma';
    const preferences = w.preferences || profile?.food_preferences || 'variado';
    const avoidances = w.avoidances || profile?.food_avoidances || 'nenhum';
    const objective = w.objective || (profile?.health_goals?.join(', ')) || 'saúde geral';
    const activityLevel = profile?.activity_level || 'moderate';
    const trainingToday = w.training_today !== undefined ? w.training_today : true;

    // Build a rich user context string for the AI
    const userContext = [
      `Idade: ${profile?.age || 30} anos`,
      `Sexo: ${profile?.sex === 'female' ? 'Feminino' : 'Masculino'}`,
      `Peso: ${profile?.current_weight || 80}kg`,
      `Altura: ${profile?.height || 175}cm`,
      `Objetivo: ${objective}`,
      `Nível de atividade: ${activityLevel}`,
      `Experiência de treino: ${profile?.training_experience || 'intermediário'}`,
      `Treinos por semana: ${profile?.training_days_per_week || 4}x`,
      `Tem treino hoje: ${trainingToday ? 'Sim' : 'Não'}`,
      profile?.health_goals?.length ? `Metas de saúde: ${profile.health_goals.join(', ')}` : '',
    ].filter(Boolean).join('\n- ');

    const prompt = `Você é um nutricionista especialista em performance e composição corporal. Gere um plano alimentar COMPLETO para um dia inteiro em português brasileiro.

CONTEXTO DO PACIENTE (use TODOS estes dados, não peça novamente):
- ${userContext}

METAS NUTRICIONAIS PERSONALIZADAS:
- Calorias alvo: ${profile?.calories_target || 2200} kcal
- Proteína alvo: ${profile?.protein_target || 160}g
- Carboidratos alvo: ${profile?.carbs_target || 250}g
- Gordura alvo: ${profile?.fat_target || 70}g

PREFERÊNCIAS E RESTRIÇÕES:
- Restrições alimentares: ${restrictions}
- Alergias: ${allergies}
- Preferências: ${preferences}
- Evitar: ${avoidances}
- Número de refeições: ${mealsPerDay}

REGRAS CRÍTICAS:
1. Gere EXATAMENTE ${mealsPerDay} refeições distribuídas ao longo do dia — NUNCA menos que 3
2. Distribuição: café da manhã, lanche matinal (se >=4 refeições), almoço, lanche da tarde, jantar (ceia se >=6)
3. Se há treino hoje, inclua pré-treino e/ou pós-treino adequados
4. Cada refeição DEVE ter pelo menos 3 alimentos com quantidades em gramas e macros precisos
5. Macros totais do dia devem atingir ≥90% das metas estabelecidas
6. Adapte a quantidade e tipo de carboidratos ao objetivo (${objective})
7. Proteína deve ser distribuída igualmente entre as refeições
8. Use alimentos brasileiros acessíveis e compatíveis com as preferências do paciente
9. PROIBIDO: gerar plano com apenas 1 ou 2 refeições`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          meals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                meal_type: { type: 'string' },
                foods: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' }, amount: { type: 'number' }, unit: { type: 'string' },
                      kcal: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' },
                      fat: { type: 'number' }, fiber: { type: 'number' },
                    }
                  }
                },
                total_calories: { type: 'number' }, total_protein: { type: 'number' },
                total_carbs: { type: 'number' }, total_fat: { type: 'number' }, total_fiber: { type: 'number' },
              }
            }
          }
        }
      }
    });

    const meals = result?.meals || [];
    if (meals.length < 3) {
      throw new Error(`A IA gerou apenas ${meals.length} refeição(ões). Mínimo obrigatório é 3. Tente novamente.`);
    }

    const saved = [];
    for (const meal of meals) {
      const created = await base44.entities.Meal.create({ ...meal, date: targetDate });
      saved.push(created);
    }

    console.log(`generateDiet: ${user.email} generated ${saved.length} meals for ${targetDate}`);
    return Response.json({ success: true, meals: saved, count: saved.length });
  } catch (error) {
    const status = error.status || 500;
    console.error(`generateDiet error [${status}]:`, error.message);
    return Response.json({ error: error.message }, { status });
  }
});