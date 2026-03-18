/**
 * Premium Locks / Feature Entitlements
 * Define what features are available in each plan
 */

export const FEATURE_LOCKS = {
  // Atlas AI
  atlas_ai: {
    label: 'Atlas AI',
    minPlan: 'pro',
    description: 'Insights contextuais com seus dados',
  },

  // AI Generation
  ai_workout_generation: {
    label: 'Geração de Treino por IA',
    minPlan: 'pro',
    description: 'Crie treinos personalizados automaticamente',
  },
  ai_diet_generation: {
    label: 'Geração de Dieta por IA',
    minPlan: 'pro',
    description: 'Crie planos alimentares personalizados automaticamente',
  },

  // Labs
  lab_exams: {
    label: 'Exames Laboratoriais',
    minPlan: 'pro',
    description: 'Rastreie exames e marcadores de saúde',
  },

  // Progress
  progress_photos: {
    label: 'Fotos de Progresso',
    minPlan: 'pro',
    limits: { free: 5, pro: 'unlimited' },
    description: 'Unlimited photos no Pro (5 no Free)',
  },

  // History
  history: {
    label: 'Histórico Completo',
    minPlan: 'pro',
    limits: { free: '30 days', pro: '1 year', performance: 'unlimited' },
  },

  // Analytics
  advanced_analytics: {
    label: 'Analytics Avançados',
    minPlan: 'pro',
  },

  // Exports
  standard_exports: {
    label: 'Exportar Dados (PDF/CSV)',
    minPlan: 'pro',
  },
  premium_exports: {
    label: 'Relatórios Premium',
    minPlan: 'performance',
  },

  // Protocol tracking
  advanced_protocol_tracking: {
    label: 'Protocolo Avançado',
    minPlan: 'performance',
    description: 'Half-life curves, next dose, stock alerts',
  },

  // Dose timeline
  dose_timeline: {
    label: 'Timeline de Doses',
    minPlan: 'performance',
  },

  // Professional dashboards
  coach_dashboard: {
    label: 'Coach Dashboard',
    minPlan: 'coach',
    roles: ['coach'],
  },
  nutritionist_dashboard: {
    label: 'Nutritionist Dashboard',
    minPlan: 'nutritionist',
    roles: ['nutritionist'],
  },
  clinician_dashboard: {
    label: 'Clinician Dashboard',
    minPlan: 'clinician',
    roles: ['clinician'],
  },

  // Admin
  admin_panel: {
    label: 'Admin Panel',
    minPlan: 'admin',
    roles: ['admin'],
  },

  // Social
  social_cards: {
    label: 'Social Cards Premium',
    minPlan: 'pro',
  },

  // Macro view
  macro_view_premium: {
    label: 'Macro View Premium',
    minPlan: 'pro',
  },
};

// Plan labels for UI
export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
  performance: 'Performance',
  coach: 'Coach',
  nutritionist: 'Nutricionista',
  clinician: 'Clínico',
  admin: 'Admin',
};

// Feature labels extracted from FEATURE_LOCKS
export const FEATURE_LABELS = Object.fromEntries(
  Object.entries(FEATURE_LOCKS).map(([key, lock]) => [key, lock.label])
);

// Plan levels
export const PLAN_LEVELS = {
  free: 0,
  pro: 1,
  performance: 2,
  coach: 3,
  nutritionist: 3,
  clinician: 3,
  admin: 999,
};

/**
 * Check if user can access a feature
 * @param {Object} user - User object with atlas_role
 * @param {Object} subscription - Active subscription with plan_code
 * @param {Array} overrides - Entitlement overrides
 * @param {string} feature - Feature key to check
 */
export function hasFeatureAccess(user, subscription, overrides, feature) {
  const lock = FEATURE_LOCKS[feature];
  if (!lock) return true; // unknown feature = allow

  // Check overrides first
  const override = overrides?.find(o => o.feature_key === feature && o.enabled);
  if (override) return true;

  // Role-based features
  if (lock.roles && !lock.roles.includes(user?.atlas_role)) {
    return false;
  }

  // Plan-based features
  const userPlanCode = subscription?.plan_code || 'free';
  const userLevel = PLAN_LEVELS[userPlanCode] || 0;
  const minLevel = PLAN_LEVELS[lock.minPlan] || 0;

  return userLevel >= minLevel;
}

/**
 * Legacy function for simple plan-level checks
 */
export function canAccessFeature(feature, userPlanCode, userRole = null) {
  const lock = FEATURE_LOCKS[feature];
  if (!lock) return true;

  if (lock.roles && !lock.roles.includes(userRole)) {
    return false;
  }

  const userLevel = PLAN_LEVELS[userPlanCode] || 0;
  const minLevel = PLAN_LEVELS[lock.minPlan] || 0;

  return userLevel >= minLevel;
}