/**
 * activateTrial — Ativado via automation quando um novo usuário se registra
 * Cria um Subscription com status=trialing por 7 dias do plano performance
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let userEmail = body.user_email;
    let userId = body.user_id;
    let userRole = body.user_role || 'athlete';

    // Entity automation payload
    if (body.event?.entity_name === 'User' && body.event?.type === 'create') {
      const data = body.data;
      if (!data) {
        console.error('activateTrial: no data in payload');
        return Response.json({ error: 'No user data' }, { status: 400 });
      }
      userEmail = data.email;
      userId = data.id;
      userRole = data.atlas_role || 'athlete';
    }

    if (!userEmail) {
      return Response.json({ error: 'user_email required' }, { status: 400 });
    }

    // Avoid duplicate trials
    const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
    if (existing.length > 0) {
      console.log(`activateTrial: user ${userEmail} already has subscription, skipping`);
      return Response.json({ skipped: true, reason: 'already_has_subscription' });
    }

    // Map role to trial plan
    const rolePlanMap = {
      'athlete': 'performance',      // athletes get best athlete plan
      'coach': 'coach',              // coaches get Coach plan
      'nutritionist': 'nutritionist', // nutritionists get Nutritionist plan
      'clinician': 'clinician',      // clinicians get Clinician plan
      'admin': 'performance',        // admins get performance
    };

    const planCode = rolePlanMap[userRole] || 'performance';
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const sub = await base44.asServiceRole.entities.Subscription.create({
      user_email: userEmail,
      user_id: userId || null,
      plan_code: planCode,
      status: 'trialing',
      source: 'manual',
      started_at: now.toISOString().split('T')[0],
      trial_ends_at: trialEnd.toISOString().split('T')[0],
      ends_at: trialEnd.toISOString().split('T')[0],
      notes: `Trial automático 7 dias (${userRole}) — criado no registro`,
    });

    console.log(`activateTrial: trial created for ${userEmail} (role=${userRole}, plan=${planCode}), ends ${trialEnd.toISOString().split('T')[0]}`);
    return Response.json({ 
      created: true, 
      subscription_id: sub.id, 
      plan_code: planCode,
      trial_ends_at: trialEnd.toISOString().split('T')[0] 
    });

  } catch (err) {
    console.error('activateTrial error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});