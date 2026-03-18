/**
 * ATLAS CORE — Shared backend entitlement checker
 * Called by other backend functions to enforce server-side access control.
 * NEVER trust client-side can() checks alone.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Mirror of lib/entitlements.js — must stay in sync
const PLAN_ENTITLEMENTS = {
  free: [
    'today_basic', 'diary', 'nutrition_tracking', 'workout_tracking',
    'measurements', 'my_diet_read', 'my_workout_read', 'profile',
  ],
  pro: [
    'today_basic', 'diary', 'nutrition_tracking', 'workout_tracking',
    'measurements', 'my_diet_read', 'my_workout_read', 'profile',
    'atlas_ai', 'lab_exams', 'progress_photos',
    'ai_diet_generation', 'ai_workout_generation',
    'standard_exports', 'social_cards',
  ],
  performance: [
    'today_basic', 'diary', 'nutrition_tracking', 'workout_tracking',
    'measurements', 'my_diet_read', 'my_workout_read', 'profile',
    'atlas_ai', 'lab_exams', 'progress_photos',
    'ai_diet_generation', 'ai_workout_generation',
    'standard_exports', 'social_cards',
    'advanced_protocol_tracking', 'dose_timeline',
    'premium_exports', 'macro_view_premium',
  ],
  coach: ['coach_dashboard', 'coach_students', 'coach_create_diet', 'coach_edit_diet', 'coach_create_workout', 'coach_edit_workout'],
  nutritionist: ['nutritionist_dashboard', 'nutritionist_clients', 'nutritionist_create_diet', 'nutritionist_edit_diet', 'nutritionist_exports'],
  clinician: ['clinician_dashboard', 'clinician_patients', 'clinician_lab_access', 'clinician_protocol_access', 'clinician_exports'],
};

/**
 * Validates that a user has access to a feature.
 * Fetches subscription + overrides from DB using service role.
 * Returns { allowed: bool, user, reason }
 */
export async function checkFeatureAccess(base44, user, featureKey) {
  if (!user) return { allowed: false, reason: 'unauthenticated' };

  // Admins bypass all checks
  if (user.role === 'admin' || user.atlas_role === 'admin') {
    return { allowed: true, user, reason: 'admin' };
  }

  const now = new Date().toISOString().split('T')[0];

  // Fetch subscription and overrides concurrently using service role (bypasses RLS)
  const [allSubs, allOverrides] = await Promise.all([
    base44.asServiceRole.entities.Subscription.filter({ user_email: user.email }),
    base44.asServiceRole.entities.EntitlementOverride.filter({ user_email: user.email }),
  ]);

  // Find best active subscription
  const activeSub = allSubs.find(s =>
    ['active', 'trialing'].includes(s.status) &&
    (!s.ends_at || s.ends_at >= now)
  );

  const effectivePlan = activeSub?.plan_code || 'free';
  const base = new Set(PLAN_ENTITLEMENTS[effectivePlan] || PLAN_ENTITLEMENTS.free);

  // Apply per-feature overrides
  for (const o of allOverrides) {
    if (o.feature_key !== featureKey) continue;
    if (o.expires_at && o.expires_at < now) continue;
    if (o.enabled) base.add(featureKey);
    else base.delete(featureKey);
  }

  const allowed = base.has(featureKey);
  return {
    allowed,
    user,
    plan: effectivePlan,
    reason: allowed ? 'granted' : `requires plan with ${featureKey} (current: ${effectivePlan})`,
  };
}

// Expose as callable function for debugging/testing
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { feature_key } = await req.json();
    if (!feature_key) return Response.json({ error: 'feature_key required' }, { status: 400 });

    const result = await checkFeatureAccess(base44, user, feature_key);
    return Response.json(result);
  } catch (error) {
    console.error('checkEntitlement error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});