import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PLAN_ENTITLEMENTS = {
  free: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile'],
  pro: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile','atlas_ai','lab_exams','progress_photos','ai_diet_generation','ai_workout_generation','standard_exports','social_cards'],
  performance: ['today_basic','diary','nutrition_tracking','workout_tracking','measurements','my_diet_read','my_workout_read','profile','atlas_ai','lab_exams','progress_photos','ai_diet_generation','ai_workout_generation','standard_exports','social_cards','advanced_protocol_tracking','dose_timeline','premium_exports','macro_view_premium'],
  coach: ['coach_dashboard','coach_students','coach_create_diet','coach_edit_diet','coach_create_workout','coach_edit_workout'],
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

    await assertFeatureAccess(base44, user, 'ai_workout_generation');

    const body = await req.json();
    const { date, profile, wizard } = body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const w = wizard || {};

    const experience = w.experience || profile?.training_experience || 'intermediário';
    const focus = w.focus || profile?.training_focus || 'hipertrofia';
    const equipment = w.equipment || profile?.training_equipment || 'academia completa';
    const injuries = w.injuries || profile?.injuries || 'nenhuma';
    const daysPerWeek = w.days_per_week || profile?.training_days_per_week || 4;
    const sessionMinutes = w.session_minutes || profile?.training_session_minutes || 60;
    const muscularFocus = w.muscular_focus || 'escolha o melhor grupo para hoje considerando recuperação';
    const methodology = w.methodology || profile?.training_methodology || 'musculação tradicional';

    // Derive training focus from goal
    const goalToFocus = {
      fat_loss: 'definição muscular e gasto calórico elevado',
      muscle_gain: 'hipertrofia e volume de treino',
      recomp: 'recomposição — intensidade moderada-alta',
      performance: 'força e performance atlética',
      health: 'saúde e condicionamento geral',
      longevity: 'longevidade — intensidade controlada',
    };
    const derivedFocus = goalToFocus[(profile?.health_goals || [])[0]] || focus;

    // Determine rep/set scheme by experience
    const repSchemes = {
      beginner: '3 séries × 12–15 reps, RIR 3–4, cargas leves a moderadas',
      intermediate: '4 séries × 8–12 reps, RIR 2–3, progressão linear',
      advanced: '4–5 séries × 6–10 reps, RIR 1–2, técnicas avançadas quando pertinente',
      expert: '5 séries × 5–8 reps, RIR 0–2, periodização intra-semana',
    };
    const repGuideline = repSchemes[experience] || repSchemes.intermediate;

    const prompt = `Você é um personal trainer especialista em hipertrofia, força e recomposição. Gere um treino COMPLETO e ALTAMENTE PERSONALIZADO em português brasileiro.

PERFIL COMPLETO DO ATLETA (use TODOS estes dados):
- Peso corporal: ${profile?.current_weight || 80}kg
- Objetivo principal: ${profile?.training_goal || profile?.health_goals?.join(', ') || 'hipertrofia'}
- Foco derivado do objetivo: ${derivedFocus}
- Nível de experiência: ${experience}
- Equipamentos disponíveis: ${equipment}
- Lesões / limitações: ${injuries}
- Frequência semanal: ${daysPerWeek}x por semana
- Duração da sessão: ${sessionMinutes} minutos
- Metodologia preferida: ${methodology}
- Nível de atividade geral: ${profile?.activity_level || 'moderate'}
- Idade: ${profile?.age || 30} anos
- Sexo: ${profile?.sex === 'female' ? 'Feminino' : 'Masculino'}

FOCO MUSCULAR DESTA SESSÃO: ${muscularFocus}

ESQUEMA DE SÉRIES/REPS INDICADO PARA O NÍVEL:
${repGuideline}

REGRAS CRÍTICAS:
1. Gere 5–7 exercícios adequados ao nível "${experience}" — nem muito fáceis, nem inacessíveis
2. NUNCA inclua exercícios que agravem as lesões/limitações informadas (${injuries})
3. RIR deve refletir o objetivo: força=1–2, hipertrofia=2–3, definição=2–4
4. Cargas realistas baseadas no perfil — iniciantes sem carga excessiva, avançados com progressão real
5. Nome do treino deve refletir o foco muscular (ex: "Peitoral e Tríceps — Volume", não apenas "Treino A")
6. Notas de execução devem ser específicas, não genéricas ("manter neutro lombar" é genérico; "evitar hiperextensão no lockout do supino para preservar o ombro" é útil)
7. Duração total deve ser próxima de ${sessionMinutes} minutos
8. PROIBIDO treino genérico sem personalização — use o perfil acima completamente`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          name:             { type: 'string' },
          type:             { type: 'string', enum: ['strength','cardio','hiit','flexibility','sport','other'] },
          duration_minutes: { type: 'number' },
          perceived_effort: { type: 'number' },
          notes:            { type: 'string' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name:          { type: 'string' },
                muscle_groups: { type: 'array', items: { type: 'string' } },
                equipment:     { type: 'string' },
                notes:         { type: 'string' },
                sets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { reps: { type: 'number' }, weight: { type: 'number' }, rir: { type: 'number' } }
                  }
                }
              }
            }
          },
        }
      }
    });

    const normalizedExercises = (result?.exercises || []).map(ex => ({
      name:          typeof ex.name === 'string' ? ex.name : String(ex.name ?? ''),
      muscle_groups: Array.isArray(ex.muscle_groups) ? ex.muscle_groups.map(String) : [],
      equipment:     typeof ex.equipment === 'string' ? ex.equipment : String(ex.equipment ?? ''),
      notes:         typeof ex.notes === 'string' ? ex.notes : '',
      sets: (Array.isArray(ex.sets) ? ex.sets : []).map(s => ({
        reps:   Number(s.reps)   || 10,
        weight: Number(s.weight) || 0,
        rir:    Number(s.rir)    || 2,
      })),
    }));

    const volumeLoad = normalizedExercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0), 0);

    const workout = await base44.entities.Workout.create({
      name:             typeof result?.name === 'string' ? result.name : 'Treino gerado por IA',
      type:             result?.type || 'strength',
      duration_minutes: Number(result?.duration_minutes) || sessionMinutes,
      perceived_effort: Number(result?.perceived_effort) || 7,
      notes:            typeof result?.notes === 'string' ? result.notes : '',
      exercises:        normalizedExercises,
      date:             targetDate,
      completed:        false,
      volume_load:      volumeLoad,
    });

    console.log(`generateWorkout: ${user.email} generated workout for ${targetDate}`);
    return Response.json({ success: true, workout });
  } catch (error) {
    const status = error.status || 500;
    console.error(`generateWorkout error [${status}]:`, error.message);
    return Response.json({ error: error.message }, { status });
  }
});