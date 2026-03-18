/**
 * expireTrials — cron job que roda DIARIAMENTE
 * Marca trials expirados como "expired" ou downgrades para "free"
 * Chamada via: create_automation com schedule_type=simple, repeat_unit=days, repeat_interval=1
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];

    // Find all trialing subscriptions that have expired
    const allTrialing = await base44.asServiceRole.entities.Subscription.filter({ 
      status: 'trialing'
    });

    const expired = allTrialing.filter(sub => sub.trial_ends_at && sub.trial_ends_at < today);

    console.log(`expireTrials: found ${expired.length} expired trial(s)`);

    if (expired.length === 0) {
      return Response.json({ expired_count: 0, message: 'No trials to expire' });
    }

    // Update each expired trial
    const updates = expired.map(sub =>
      base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'expired',
        notes: (sub.notes || '') + ' | Trial expired on ' + today,
      })
    );

    await Promise.all(updates);

    console.log(`expireTrials: marked ${expired.length} subscription(s) as expired`);
    return Response.json({ expired_count: expired.length, success: true });

  } catch (error) {
    console.error('expireTrials error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});