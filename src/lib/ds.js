/**
 * Atlas Core — runtime design tokens
 * Used for dynamic className strings (Tailwind can't purge dynamic concatenations).
 * All badge class names MUST exist in index.css.
 */

// Macro nutrition colors — hex only, used in recharts/SVG
export const MACRO_COLORS = {
  protein: '#3b82f6',  /* brand blue */
  carbs:   '#8b5cf6',  /* purple */
  fat:     '#f59e0b',  /* amber */
  fiber:   '#10b981',  /* emerald */
};

// Authorship badge — maps to classes that exist in index.css
export const AUTHOR = {
  ai:           { label: 'Atlas AI',  cls: 'badge badge-ai' },
  coach:        { label: 'Coach',     cls: 'badge badge-blue' },
  user:         { label: 'Você',      cls: 'badge badge-neutral' },
  prescription: { label: 'Prescrito', cls: 'badge badge-ok' },
};

// Plan status badge
export const PLAN_STATUS = {
  active:   { label: 'Ativo',     cls: 'badge badge-ok' },
  archived: { label: 'Arquivado', cls: 'badge badge-neutral' },
  draft:    { label: 'Rascunho',  cls: 'badge badge-warn' },
};