/**
 * ensureTrialActivated — verifica se usuário tem subscription
 * Se não tiver, ativa trial de 7 dias
 * Chamado quando user visita /Today (via frontend fetch)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a subscription
    const existing = await base44.entities.Subscription.filter({ 
      user_email: user.email 
    });

    if (existing.length > 0) {
      console.log(`ensureTrialActivated: user ${user.email} already has subscription`);
      return Response.json({ 
        activated: false, 
        reason: 'already_has_subscription',
        subscription_id: existing[0].id 
      });
    }

    // Map role to trial plan
    const rolePlanMap = {
      'athlete': 'pro',           // athletes get Pro trial
      'coach': 'coach',           // coaches get Coach plan
      'nutritionist': 'nutritionist',
      'clinician': 'clinician',
      'admin': 'pro',
    };

    const planCode = rolePlanMap[user.atlas_role] || 'pro';
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const sub = await base44.entities.Subscription.create({
      user_email: user.email,
      plan_code: planCode,
      status: 'trialing',
      source: 'manual',
      started_at: now.toISOString().split('T')[0],
      trial_ends_at: trialEnd.toISOString().split('T')[0],
      ends_at: trialEnd.toISOString().split('T')[0],
      notes: `7-day trial activated on first app visit`,
    });

    console.log(`ensureTrialActivated: trial created for ${user.email} (role=${user.atlas_role}, plan=${planCode}), ends ${trialEnd.toISOString().split('T')[0]}`);
    
    return Response.json({ 
      activated: true, 
      subscription_id: sub.id, 
      plan_code: planCode,
      trial_ends_at: trialEnd.toISOString().split('T')[0] 
    });

  } catch (error) {
    console.error('ensureTrialActivated error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});