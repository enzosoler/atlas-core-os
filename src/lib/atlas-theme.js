// Atlas Core — domain constants and utilities
// Colors removed: use CSS tokens (--brand, --brand-ai, --ok, --warn, --err) directly

export const MEAL_TYPES = {
  breakfast:       { label: 'Café da manhã' },
  morning_snack:   { label: 'Lanche da manhã' },
  lunch:           { label: 'Almoço' },
  afternoon_snack: { label: 'Lanche da tarde' },
  dinner:          { label: 'Jantar' },
  evening_snack:   { label: 'Ceia' },
  pre_workout:     { label: 'Pré-treino' },
  post_workout:    { label: 'Pós-treino' },
};

export const WORKOUT_TYPES = {
  strength:    { label: 'Força' },
  cardio:      { label: 'Cardio' },
  hiit:        { label: 'HIIT' },
  flexibility: { label: 'Flexibilidade' },
  sport:       { label: 'Esporte' },
  other:       { label: 'Outro' },
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getToday = () => new Date().toISOString().split('T')[0];

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};