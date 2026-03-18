/**
 * Atlas Core — RBAC (Role-Based Access Control)
 *
 * Roles (atlas_role):
 *   visitor   — unauthenticated, public pages only
 *   athlete   — owns their own data workspace
 *   coach     — training/nutrition for linked athletes
 *   clinician — labs/protocols/macroview for linked athletes
 *   admin     — full access, user/link management
 *
 * Rule: role defines WHAT pages/areas you can access.
 * Link permissions (CoachStudent / ClinicianPatient) define WHAT DATA
 * within a professional's area (coach/clinician) is visible per athlete.
 */

export const ROLES = {
  VISITOR:      'visitor',
  ATHLETE:      'athlete',
  COACH:        'coach',
  NUTRITIONIST: 'nutritionist',
  CLINICIAN:    'clinician',
  ADMIN:        'admin',
};

export const ROLE_LABELS = {
  visitor:      'Visitante',
  athlete:      'Atleta',
  coach:        'Coach',
  nutritionist: 'Nutricionista',
  clinician:    'Clínico',
  admin:        'Admin',
};

export const ROLE_BADGE = {
  visitor:      'badge badge-neutral',
  athlete:      'badge badge-neutral',
  coach:        'badge badge-blue',
  nutritionist: 'badge badge-blue',
  clinician:    'badge badge-ok',
  admin:        'badge badge-err',
};

/**
 * Page-level access control.
 * Each entry lists which roles can load this page at all.
 * Fine-grained data access (per linked athlete) is handled in each page/component.
 */
export const PAGE_ACCESS = {
  // ── Athlete workspace ──────────────────────────────────
  Today:           ['athlete', 'coach', 'clinician', 'admin'],
  Diary:           ['athlete', 'admin'],
  Nutrition:       ['athlete', 'admin'],
  Workouts:        ['athlete', 'admin'],
  Protocols:       ['athlete', 'admin'],
  Measurements:    ['athlete', 'admin'],
  LabExams:        ['athlete', 'admin'],
  ProgressPhotos:  ['athlete', 'admin'],
  MyDiet:          ['athlete', 'admin'],
  MyWorkout:       ['athlete', 'admin'],
  MyPrescribedDiet:    ['athlete', 'admin'],
  MyPrescribedWorkout: ['athlete', 'admin'],
  AtlasAI:         ['athlete', 'admin'],
  Insights:        ['athlete', 'admin'],
  Social:          ['athlete', 'coach', 'clinician', 'admin'],
  Export:          ['athlete', 'coach', 'clinician', 'admin'],
  Profile:         ['athlete', 'coach', 'clinician', 'admin'],

  // ── Coach area ─────────────────────────────────────────
  // Coach sees /today as a landing point (own profile/tools)
  CoachDashboard:      ['coach', 'admin'],
  CoachStudents:       ['coach', 'admin'],
  CoachStudentProfile: ['coach', 'admin'],

  // ── Nutritionist area ──────────────────────────────────
  NutritionistDashboard:      ['nutritionist', 'admin'],
  NutritionistClients:        ['nutritionist', 'admin'],
  NutritionistClientProfile:  ['nutritionist', 'admin'],

  // ── Clinician area ─────────────────────────────────────
  ClinicianDashboard:      ['clinician', 'admin'],
  ClinicianPatients:       ['clinician', 'admin'],
  ClinicianPatientProfile: ['clinician', 'admin'],

  // ── Admin only ─────────────────────────────────────────
  AdminPanel: ['admin'],
};

/**
 * Navigation definition per role.
 * Determines what shows in the sidebar/bottom nav.
 */
export const NAV_BY_ROLE = {
  athlete: [
    { path: '/Today',           label: 'Hoje',         icon: 'Home' },
    { path: '/diary',           label: 'Diário',       icon: 'BookOpen' },
    { path: '/Nutrition',       label: 'Nutrição',     icon: 'UtensilsCrossed' },
    { path: '/Workouts',        label: 'Treinos',      icon: 'Dumbbell' },
    { path: '/my-diet',         label: 'Plano Alimentar',  icon: 'ChefHat' },
    { path: '/my-workout',      label: 'Plano de Treino',  icon: 'ClipboardList' },
    { path: '/Protocols',       label: 'Protocolos',   icon: 'FlaskConical' },
    { path: '/Measurements',    label: 'Medidas',      icon: 'BarChart3' },
    { path: '/progress-photos', label: 'Fotos',        icon: 'Camera' },
    { path: '/LabExams',        label: 'Exames',       icon: 'Heart' },
    { path: '/AtlasAI',         label: 'Atlas AI',     icon: 'Brain' },
    { path: '/Insights',        label: 'Insights',     icon: 'TrendingUp' },
    { path: '/social',          label: 'Social',       icon: 'Users' },
    { path: '/Export',          label: 'Exportar',     icon: 'Download' },
    { path: '/Profile',         label: 'Perfil',       icon: 'User' },
  ],
  coach: [
    { path: '/Today',              label: 'Início',         icon: 'Home' },
    { path: '/coach-dashboard',    label: 'Dashboard',      icon: 'LayoutDashboard' },
    { path: '/coach/students',     label: 'Alunos',         icon: 'Users' },
    { path: '/social',             label: 'Social',         icon: 'MessageSquare' },
    { path: '/Export',             label: 'Exportar',       icon: 'Download' },
    { path: '/Profile',            label: 'Perfil',         icon: 'User' },
  ],
  nutritionist: [
    { path: '/Today',                    label: 'Início',       icon: 'Home' },
    { path: '/nutritionist-dashboard',   label: 'Dashboard',    icon: 'LayoutDashboard' },
    { path: '/nutritionist/clients',     label: 'Clientes',     icon: 'Users' },
    { path: '/social',                   label: 'Social',       icon: 'MessageSquare' },
    { path: '/Export',                   label: 'Exportar',     icon: 'Download' },
    { path: '/Profile',                  label: 'Perfil',       icon: 'User' },
  ],
  clinician: [
    { path: '/Today',                 label: 'Início',        icon: 'Home' },
    { path: '/clinician-dashboard',   label: 'Dashboard',     icon: 'LayoutDashboard' },
    { path: '/clinician/patients',    label: 'Pacientes',     icon: 'Users' },
    { path: '/social',                label: 'Social',        icon: 'MessageSquare' },
    { path: '/Export',                label: 'Exportar',      icon: 'Download' },
    { path: '/Profile',               label: 'Perfil',        icon: 'User' },
  ],
  admin: [
    // ── Athlete area ────────────────────────────
    { path: '/Today',           label: 'Hoje',         icon: 'Home' },
    { path: '/diary',           label: 'Diário',       icon: 'BookOpen' },
    { path: '/Nutrition',       label: 'Nutrição',     icon: 'UtensilsCrossed' },
    { path: '/Workouts',        label: 'Treinos',      icon: 'Dumbbell' },
    { path: '/my-diet',         label: 'Plano Alimentar',  icon: 'ChefHat' },
    { path: '/my-workout',      label: 'Plano de Treino',  icon: 'ClipboardList' },
    { path: '/Protocols',       label: 'Protocolos',   icon: 'FlaskConical' },
    { path: '/Measurements',    label: 'Medidas',      icon: 'BarChart3' },
    { path: '/progress-photos', label: 'Fotos',        icon: 'Camera' },
    { path: '/LabExams',        label: 'Exames',       icon: 'Heart' },
    { path: '/AtlasAI',         label: 'Atlas AI',     icon: 'Brain' },
    { path: '/Insights',        label: 'Insights',     icon: 'TrendingUp' },
    // ── Coach area ───────────────────────────────
    { path: '/coach-dashboard',    label: 'Coach Dashboard',    icon: 'LayoutDashboard' },
    { path: '/coach/students',     label: 'Coach Alunos',       icon: 'Users' },
    // ── Nutritionist area ────────────────────────
    { path: '/nutritionist-dashboard',  label: 'Nutricionista Dashboard', icon: 'LayoutDashboard' },
    { path: '/nutritionist/clients',    label: 'Nutricionista Clientes',  icon: 'Users' },
    // ── Clinician area ──────────────────────────
    { path: '/clinician-dashboard',  label: 'Clínico Dashboard', icon: 'LayoutDashboard' },
    { path: '/clinician/patients',   label: 'Clínico Pacientes', icon: 'Users' },
    // ── Admin area ───────────────────────────────
    { path: '/AdminPanel',  label: 'Admin Panel',    icon: 'ShieldCheck' },
    // ── Shared ──────────────────────────────────
    { path: '/social',      label: 'Social',         icon: 'Users' },
    { path: '/Export',      label: 'Exportar',       icon: 'Download' },
    { path: '/Profile',     label: 'Perfil',         icon: 'User' },
  ],
};

/**
 * Bottom nav (mobile) — max 4 items per role, most used pages
 */
export const BOTTOM_NAV_BY_ROLE = {
  athlete:      ['Today', 'Nutrition', 'Workouts', 'AtlasAI'],
  coach:        ['Today', 'coach-dashboard', 'coach/students', 'Profile'],
  nutritionist: ['Today', 'nutritionist-dashboard', 'nutritionist/clients', 'Profile'],
  clinician:    ['Today', 'clinician-dashboard', 'clinician/patients', 'Profile'],
  admin:        ['Today', 'AdminPanel', 'social', 'Profile'],
};

/** Returns true if the given role can access a page */
export const canAccess = (role, page) => {
  if (role === 'admin') return true;
  const allowed = PAGE_ACCESS[page];
  if (!allowed) return false;
  return allowed.includes(role);
};

/** Returns nav items for a given role */
export const getNavForRole = (role) => NAV_BY_ROLE[role] || NAV_BY_ROLE.athlete;

/** Hook-friendly helper — use inside components */
export const useRBAC = (user) => {
  const role = user?.atlas_role || 'athlete';

  return {
    role,
    isVisitor:      role === 'visitor',
    isAthlete:      role === 'athlete',
    isCoach:        role === 'coach',
    isNutritionist: role === 'nutritionist',
    isClinician:    role === 'clinician',
    isAdmin:        role === 'admin',
    isStaff:        ['coach', 'nutritionist', 'clinician', 'admin'].includes(role),
    can:            (page) => canAccess(role, page),
    nav:            getNavForRole(role),
  };
};