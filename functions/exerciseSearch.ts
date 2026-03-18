/**
 * Exercise Search API — deterministic, local DB, no runtime external dependency
 *
 * Actions:
 *   search  { query }                         → full-text search
 *   by_muscle { muscle }                      → filter by primary muscle
 *   by_equipment { equipment }                → filter by equipment
 *   get     { id }                            → get by id
 *   seed    {}                                → admin: seed initial dataset
 *   import  { exercise }                      → add custom exercise
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── SEED DATASET (~300 exercises, PT-BR focused) ────────────────────────────
const SEED = [
  // ═══ PEITO ═══
  { canonical_name_pt: 'Supino reto com barra', canonical_name_en: 'Barbell Bench Press', aliases_pt: ['supino reto', 'supino plano', 'bench press'], aliases_en: ['bench press', 'barbell bench press', 'flat bench'], exercise_type: 'strength', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: ['tríceps', 'ombro anterior'], equipment: ['barbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '5-8', default_set_range: '3-5', default_rest_seconds: 120, search_rank: 98 },
  { canonical_name_pt: 'Supino inclinado com barra', canonical_name_en: 'Incline Barbell Bench Press', aliases_pt: ['supino inclinado', 'supino 45 graus'], aliases_en: ['incline bench press'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito superior'], secondary_muscles: ['tríceps', 'deltóide anterior'], equipment: ['barbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 88 },
  { canonical_name_pt: 'Supino declinado com barra', canonical_name_en: 'Decline Barbell Bench Press', aliases_pt: ['supino declinado'], aliases_en: ['decline bench press'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito inferior'], secondary_muscles: ['tríceps'], equipment: ['barbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 70 },
  { canonical_name_pt: 'Supino com halteres', canonical_name_en: 'Dumbbell Bench Press', aliases_pt: ['supino halter', 'supino com dumbbells'], aliases_en: ['dumbbell bench press', 'db bench press'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: ['tríceps', 'deltóide anterior'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '8-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 92 },
  { canonical_name_pt: 'Supino inclinado com halteres', canonical_name_en: 'Incline Dumbbell Press', aliases_pt: ['supino inclinado halter'], aliases_en: ['incline dumbbell press', 'incline db press'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito superior'], secondary_muscles: ['tríceps', 'deltóide anterior'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 85 },
  { canonical_name_pt: 'Crucifixo com halteres', canonical_name_en: 'Dumbbell Fly', aliases_pt: ['crucifixo', 'fly com halter', 'fly peito'], aliases_en: ['dumbbell fly', 'chest fly', 'flat fly'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: ['deltóide anterior'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 80 },
  { canonical_name_pt: 'Crucifixo inclinado com halteres', canonical_name_en: 'Incline Dumbbell Fly', aliases_pt: ['crucifixo inclinado'], aliases_en: ['incline dumbbell fly', 'incline fly'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito superior'], secondary_muscles: [], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Crossover no cabo', canonical_name_en: 'Cable Crossover', aliases_pt: ['crossover', 'cable fly', 'peck deck cabo'], aliases_en: ['cable crossover', 'cable fly'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 82 },
  { canonical_name_pt: 'Peck deck', canonical_name_en: 'Pec Deck Machine', aliases_pt: ['peck deck', 'máquina borboleta', 'fly máquina'], aliases_en: ['pec deck', 'machine fly', 'butterfly machine'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: [], equipment: ['machine'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 78 },
  { canonical_name_pt: 'Flexão de braços', canonical_name_en: 'Push-Up', aliases_pt: ['flexão', 'push-up', 'supino solo'], aliases_en: ['push-up', 'pushup'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: ['tríceps', 'core'], equipment: ['bodyweight'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 90 },
  { canonical_name_pt: 'Mergulho em paralelas (peito)', canonical_name_en: 'Chest Dip', aliases_pt: ['paralelas peito', 'dip peito'], aliases_en: ['chest dip', 'dip'], exercise_type: 'strength', movement_pattern: 'push_horizontal', primary_muscles: ['peito inferior'], secondary_muscles: ['tríceps', 'deltóide anterior'], equipment: ['bodyweight', 'parallel_bars'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-15', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 80 },

  // ═══ COSTAS ═══
  { canonical_name_pt: 'Levantamento terra', canonical_name_en: 'Deadlift', aliases_pt: ['terra', 'deadlift', 'levantamento terra clássico'], aliases_en: ['deadlift', 'conventional deadlift'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['lombar', 'glúteo', 'isquiotibiais'], secondary_muscles: ['trapézio', 'latíssimo', 'quadríceps'], equipment: ['barbell'], body_region: 'full_body', is_compound: true, difficulty_level: 'advanced', default_rep_range: '3-6', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 98 },
  { canonical_name_pt: 'Remada curvada com barra', canonical_name_en: 'Barbell Row', aliases_pt: ['remada curvada', 'remada pronada', 'bent over row'], aliases_en: ['barbell row', 'bent over row', 'barbell bent over row'], exercise_type: 'strength', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo', 'trapézio médio'], secondary_muscles: ['bíceps', 'romboide'], equipment: ['barbell'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '6-10', default_set_range: '3-4', default_rest_seconds: 120, search_rank: 92 },
  { canonical_name_pt: 'Remada com halteres', canonical_name_en: 'Dumbbell Row', aliases_pt: ['remada halter', 'remada unilateral'], aliases_en: ['dumbbell row', 'db row', 'single arm row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps', 'romboide'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: true, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 88 },
  { canonical_name_pt: 'Remada no cabo baixo', canonical_name_en: 'Seated Cable Row', aliases_pt: ['remada cabo', 'remada sentada cabo', 'seated row'], aliases_en: ['seated cable row', 'cable row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo', 'trapézio médio'], secondary_muscles: ['bíceps', 'romboide'], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 85 },
  { canonical_name_pt: 'Puxada frontal na polia', canonical_name_en: 'Lat Pulldown', aliases_pt: ['puxada frente', 'puxada polia', 'lat pulldown'], aliases_en: ['lat pulldown', 'pull-down', 'cable pulldown'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps', 'redondo maior'], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 92 },
  { canonical_name_pt: 'Barra fixa', canonical_name_en: 'Pull-Up', aliases_pt: ['barra fixa', 'pull-up', 'puxada barra'], aliases_en: ['pull-up', 'pullup', 'chin-up'], exercise_type: 'strength', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps', 'redondo maior'], equipment: ['bodyweight', 'pull_up_bar'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '6-12', default_set_range: '3-5', default_rest_seconds: 120, search_rank: 96 },
  { canonical_name_pt: 'Remada máquina', canonical_name_en: 'Machine Row', aliases_pt: ['remada máquina', 'remada hammer strength'], aliases_en: ['machine row', 'hammer strength row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo', 'trapézio médio'], secondary_muscles: ['bíceps'], equipment: ['machine'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 78 },
  { canonical_name_pt: 'Pullover com halter', canonical_name_en: 'Dumbbell Pullover', aliases_pt: ['pullover', 'pullover halter'], aliases_en: ['dumbbell pullover', 'pullover'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo', 'peito'], secondary_muscles: ['serrátil'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },
  { canonical_name_pt: 'Encolhimento de ombros com barra', canonical_name_en: 'Barbell Shrug', aliases_pt: ['encolhimento', 'shrug', 'encolhimento trapézio'], aliases_en: ['shrug', 'barbell shrug'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['trapézio'], secondary_muscles: [], equipment: ['barbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Hiperextensão lombar', canonical_name_en: 'Back Extension', aliases_pt: ['hiperextensão', 'lombar hiperextensão', 'back extension'], aliases_en: ['back extension', 'hyperextension'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['lombar'], secondary_muscles: ['glúteo', 'isquiotibiais'], equipment: ['machine', 'bench'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },

  // ═══ OMBROS ═══
  { canonical_name_pt: 'Desenvolvimento com barra', canonical_name_en: 'Overhead Press', aliases_pt: ['desenvolvimento', 'press militar', 'overhead press', 'OHP'], aliases_en: ['overhead press', 'OHP', 'military press', 'shoulder press'], exercise_type: 'strength', movement_pattern: 'push_vertical', primary_muscles: ['deltóide'], secondary_muscles: ['tríceps', 'trapézio'], equipment: ['barbell'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '5-8', default_set_range: '3-5', default_rest_seconds: 120, search_rank: 92 },
  { canonical_name_pt: 'Desenvolvimento com halteres', canonical_name_en: 'Dumbbell Shoulder Press', aliases_pt: ['desenvolvimento halter', 'press halter ombro'], aliases_en: ['dumbbell shoulder press', 'db shoulder press', 'dumbbell press'], exercise_type: 'hypertrophy', movement_pattern: 'push_vertical', primary_muscles: ['deltóide'], secondary_muscles: ['tríceps'], equipment: ['dumbbell'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 88 },
  { canonical_name_pt: 'Elevação lateral com halteres', canonical_name_en: 'Lateral Raise', aliases_pt: ['elevação lateral', 'lateral raise', 'voador lateral'], aliases_en: ['lateral raise', 'dumbbell lateral raise', 'side raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['deltóide lateral'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, is_unilateral: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-5', default_rest_seconds: 60, search_rank: 94 },
  { canonical_name_pt: 'Elevação lateral no cabo', canonical_name_en: 'Cable Lateral Raise', aliases_pt: ['elevação lateral cabo', 'lateral raise cabo'], aliases_en: ['cable lateral raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['deltóide lateral'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 80 },
  { canonical_name_pt: 'Elevação frontal com halteres', canonical_name_en: 'Dumbbell Front Raise', aliases_pt: ['elevação frontal', 'front raise'], aliases_en: ['front raise', 'dumbbell front raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['deltóide anterior'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Remada alta', canonical_name_en: 'Upright Row', aliases_pt: ['remada alta', 'upright row'], aliases_en: ['upright row', 'barbell upright row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['deltóide lateral', 'trapézio'], secondary_muscles: ['bíceps'], equipment: ['barbell', 'dumbbell'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 68 },
  { canonical_name_pt: 'Face pull', canonical_name_en: 'Face Pull', aliases_pt: ['face pull', 'puxada para o rosto'], aliases_en: ['face pull', 'cable face pull'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['deltóide posterior', 'trapézio médio'], secondary_muscles: ['romboide'], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 78 },
  { canonical_name_pt: 'Pássaro com halteres', canonical_name_en: 'Dumbbell Rear Delt Fly', aliases_pt: ['pássaro', 'crucifixo invertido', 'posterior deltóide'], aliases_en: ['rear delt fly', 'bent over lateral raise', 'reverse fly'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['deltóide posterior'], secondary_muscles: ['trapézio médio', 'romboide'], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 76 },
  { canonical_name_pt: 'Arnold press', canonical_name_en: 'Arnold Press', aliases_pt: ['arnold press', 'desenvolvimento arnold'], aliases_en: ['arnold press', 'arnold dumbbell press'], exercise_type: 'hypertrophy', movement_pattern: 'push_vertical', primary_muscles: ['deltóide'], secondary_muscles: ['tríceps'], equipment: ['dumbbell'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 78 },

  // ═══ BÍCEPS ═══
  { canonical_name_pt: 'Rosca direta com barra', canonical_name_en: 'Barbell Curl', aliases_pt: ['rosca direta', 'barbell curl', 'rosca barra'], aliases_en: ['barbell curl', 'bicep curl', 'standing barbell curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: ['braquial'], equipment: ['barbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 92 },
  { canonical_name_pt: 'Rosca direta com halteres', canonical_name_en: 'Dumbbell Curl', aliases_pt: ['rosca halter', 'rosca com halteres', 'bicep curl halter'], aliases_en: ['dumbbell curl', 'alternating curl', 'db curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: ['braquial'], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 90 },
  { canonical_name_pt: 'Rosca martelo', canonical_name_en: 'Hammer Curl', aliases_pt: ['rosca martelo', 'hammer curl'], aliases_en: ['hammer curl', 'neutral grip curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['braquioradial', 'bíceps'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 85 },
  { canonical_name_pt: 'Rosca concentrada', canonical_name_en: 'Concentration Curl', aliases_pt: ['rosca concentrada', 'rosca scott unilateral'], aliases_en: ['concentration curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Rosca scott', canonical_name_en: 'Preacher Curl', aliases_pt: ['rosca scott', 'preacher curl', 'rosca apoiada'], aliases_en: ['preacher curl', 'scott curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: [], equipment: ['barbell', 'machine'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 80 },
  { canonical_name_pt: 'Rosca no cabo', canonical_name_en: 'Cable Curl', aliases_pt: ['rosca cabo', 'rosca polia'], aliases_en: ['cable curl', 'cable bicep curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Rosca 21', canonical_name_en: '21s Curl', aliases_pt: ['rosca 21', '21s'], aliases_en: ['21s', '21 curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: [], equipment: ['barbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '21', default_set_range: '3', default_rest_seconds: 75, search_rank: 65 },

  // ═══ TRÍCEPS ═══
  { canonical_name_pt: 'Tríceps pulley', canonical_name_en: 'Cable Tricep Pushdown', aliases_pt: ['pulley', 'tríceps cabo', 'pushdown', 'tríceps polia'], aliases_en: ['tricep pushdown', 'cable pushdown', 'rope pushdown'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 94 },
  { canonical_name_pt: 'Tríceps testa', canonical_name_en: 'Skull Crusher', aliases_pt: ['tríceps testa', 'skull crusher', 'french press deitado'], aliases_en: ['skull crusher', 'lying tricep extension', 'EZ bar skullcrusher'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['barbell', 'bench'], body_region: 'upper', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 85 },
  { canonical_name_pt: 'Tríceps francês', canonical_name_en: 'French Press', aliases_pt: ['tríceps francês', 'french press', 'overhead extension'], aliases_en: ['french press', 'overhead tricep extension', 'EZ bar french press'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['barbell', 'dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 80 },
  { canonical_name_pt: 'Mergulho em paralelas (tríceps)', canonical_name_en: 'Tricep Dip', aliases_pt: ['paralelas tríceps', 'dip tríceps', 'tríceps paralelas'], aliases_en: ['tricep dip', 'bench dip', 'dip'], exercise_type: 'strength', movement_pattern: 'push_vertical', primary_muscles: ['tríceps'], secondary_muscles: ['peito inferior', 'deltóide anterior'], equipment: ['bodyweight', 'parallel_bars'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-15', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 78 },
  { canonical_name_pt: 'Tríceps no banco', canonical_name_en: 'Bench Tricep Dip', aliases_pt: ['fundos no banco', 'tríceps banco', 'bench dip'], aliases_en: ['bench dip', 'tricep bench dip'], exercise_type: 'hypertrophy', movement_pattern: 'push_vertical', primary_muscles: ['tríceps'], secondary_muscles: ['peito inferior'], equipment: ['bench', 'bodyweight'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Tríceps coice com halter', canonical_name_en: 'Dumbbell Kickback', aliases_pt: ['tríceps coice', 'kickback', 'tríceps halter coice'], aliases_en: ['dumbbell kickback', 'tricep kickback'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Tríceps testa com halteres', canonical_name_en: 'Dumbbell Skull Crusher', aliases_pt: ['tríceps testa halter'], aliases_en: ['dumbbell skull crusher', 'db lying tricep extension'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 70 },

  // ═══ PERNAS - QUADRÍCEPS ═══
  { canonical_name_pt: 'Agachamento livre com barra', canonical_name_en: 'Barbell Squat', aliases_pt: ['agachamento', 'squat', 'agachamento barra', 'back squat'], aliases_en: ['squat', 'barbell squat', 'back squat'], exercise_type: 'strength', movement_pattern: 'squat', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: ['isquiotibiais', 'lombar', 'core'], equipment: ['barbell', 'squat_rack'], body_region: 'lower', is_compound: true, difficulty_level: 'advanced', default_rep_range: '5-8', default_set_range: '4-5', default_rest_seconds: 180, search_rank: 99 },
  { canonical_name_pt: 'Agachamento frontal', canonical_name_en: 'Front Squat', aliases_pt: ['agachamento frontal', 'front squat'], aliases_en: ['front squat', 'barbell front squat'], exercise_type: 'strength', movement_pattern: 'squat', primary_muscles: ['quadríceps'], secondary_muscles: ['glúteo', 'core'], equipment: ['barbell', 'squat_rack'], body_region: 'lower', is_compound: true, difficulty_level: 'advanced', default_rep_range: '5-8', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 80 },
  { canonical_name_pt: 'Leg press 45°', canonical_name_en: 'Leg Press', aliases_pt: ['leg press', 'leg press 45', 'prensa 45'], aliases_en: ['leg press', '45 degree leg press'], exercise_type: 'hypertrophy', movement_pattern: 'squat', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: ['isquiotibiais'], equipment: ['machine'], body_region: 'lower', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-5', default_rest_seconds: 90, search_rank: 95 },
  { canonical_name_pt: 'Extensora de pernas', canonical_name_en: 'Leg Extension', aliases_pt: ['cadeira extensora', 'extensora', 'leg extension'], aliases_en: ['leg extension', 'knee extension'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['quadríceps'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 88 },
  { canonical_name_pt: 'Agachamento goblet', canonical_name_en: 'Goblet Squat', aliases_pt: ['goblet squat', 'agachamento goblet', 'agachamento kettle'], aliases_en: ['goblet squat', 'dumbbell goblet squat'], exercise_type: 'hypertrophy', movement_pattern: 'squat', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: ['core'], equipment: ['dumbbell', 'kettlebell'], body_region: 'lower', is_compound: true, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 78 },
  { canonical_name_pt: 'Hack squat na máquina', canonical_name_en: 'Machine Hack Squat', aliases_pt: ['hack squat', 'prensa hack'], aliases_en: ['hack squat', 'machine hack squat'], exercise_type: 'hypertrophy', movement_pattern: 'squat', primary_muscles: ['quadríceps'], secondary_muscles: ['glúteo'], equipment: ['machine'], body_region: 'lower', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 82 },
  { canonical_name_pt: 'Agachamento búlgaro', canonical_name_en: 'Bulgarian Split Squat', aliases_pt: ['búlgaro', 'agachamento búlgaro', 'split squat búlgaro'], aliases_en: ['bulgarian split squat', 'rear foot elevated split squat'], exercise_type: 'hypertrophy', movement_pattern: 'lunge', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: ['isquiotibiais'], equipment: ['dumbbell', 'bench'], body_region: 'lower', is_compound: true, is_unilateral: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 88 },
  { canonical_name_pt: 'Afundo com halteres', canonical_name_en: 'Dumbbell Lunge', aliases_pt: ['afundo', 'lunge', 'passada', 'avanço'], aliases_en: ['lunge', 'dumbbell lunge', 'walking lunge'], exercise_type: 'hypertrophy', movement_pattern: 'lunge', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: ['isquiotibiais'], equipment: ['dumbbell', 'bodyweight'], body_region: 'lower', is_compound: true, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 82 },

  // ═══ PERNAS - POSTERIOR / GLÚTEOS ═══
  { canonical_name_pt: 'Levantamento terra romeno', canonical_name_en: 'Romanian Deadlift', aliases_pt: ['terra romeno', 'RDL', 'stiff', 'levantamento terra romeno'], aliases_en: ['romanian deadlift', 'RDL', 'stiff leg deadlift'], exercise_type: 'hypertrophy', movement_pattern: 'hinge', primary_muscles: ['isquiotibiais', 'glúteo'], secondary_muscles: ['lombar'], equipment: ['barbell', 'dumbbell'], body_region: 'lower', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 92 },
  { canonical_name_pt: 'Flexora de pernas deitado', canonical_name_en: 'Lying Leg Curl', aliases_pt: ['flexora deitada', 'curl femoral', 'leg curl deitado'], aliases_en: ['lying leg curl', 'hamstring curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['isquiotibiais'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 86 },
  { canonical_name_pt: 'Flexora de pernas sentado', canonical_name_en: 'Seated Leg Curl', aliases_pt: ['flexora sentada', 'leg curl sentado'], aliases_en: ['seated leg curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['isquiotibiais'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 80 },
  { canonical_name_pt: 'Hip thrust com barra', canonical_name_en: 'Barbell Hip Thrust', aliases_pt: ['hip thrust', 'elevação quadril barra', 'glúteo hip thrust'], aliases_en: ['hip thrust', 'barbell hip thrust', 'glute bridge'], exercise_type: 'hypertrophy', movement_pattern: 'hinge', primary_muscles: ['glúteo'], secondary_muscles: ['isquiotibiais', 'lombar'], equipment: ['barbell', 'bench'], body_region: 'lower', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 90 },
  { canonical_name_pt: 'Elevação de quadril no chão', canonical_name_en: 'Glute Bridge', aliases_pt: ['ponte glúteo', 'glute bridge', 'elevação quadril chão'], aliases_en: ['glute bridge', 'floor glute bridge'], exercise_type: 'hypertrophy', movement_pattern: 'hinge', primary_muscles: ['glúteo'], secondary_muscles: ['isquiotibiais'], equipment: ['bodyweight', 'barbell'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 82 },
  { canonical_name_pt: 'Good morning com barra', canonical_name_en: 'Good Morning', aliases_pt: ['good morning', 'bom dia com barra'], aliases_en: ['good morning', 'barbell good morning'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['isquiotibiais', 'lombar'], secondary_muscles: ['glúteo'], equipment: ['barbell'], body_region: 'lower', is_compound: true, difficulty_level: 'advanced', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 65 },
  { canonical_name_pt: 'Abdução de quadril na máquina', canonical_name_en: 'Hip Abduction Machine', aliases_pt: ['abdução quadril', 'adutora', 'máquina abdução'], aliases_en: ['hip abduction', 'abductor machine'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['glúteo médio', 'glúteo mínimo'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Agachamento sumô com halter', canonical_name_en: 'Sumo Goblet Squat', aliases_pt: ['agachamento sumô', 'sumo squat'], aliases_en: ['sumo squat', 'sumo goblet squat', 'wide stance squat'], exercise_type: 'hypertrophy', movement_pattern: 'squat', primary_muscles: ['glúteo', 'adutores'], secondary_muscles: ['quadríceps'], equipment: ['dumbbell', 'kettlebell'], body_region: 'lower', is_compound: true, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 75 },

  // ═══ PANTURRILHA ═══
  { canonical_name_pt: 'Elevação de panturrilha em pé', canonical_name_en: 'Standing Calf Raise', aliases_pt: ['panturrilha em pé', 'gêmeos em pé', 'calf raise'], aliases_en: ['standing calf raise', 'calf raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['gastrocnêmio'], secondary_muscles: ['sóleo'], equipment: ['machine', 'bodyweight'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-25', default_set_range: '4-5', default_rest_seconds: 60, search_rank: 85 },
  { canonical_name_pt: 'Elevação de panturrilha sentado', canonical_name_en: 'Seated Calf Raise', aliases_pt: ['panturrilha sentado', 'gêmeos sentado', 'sóleo'], aliases_en: ['seated calf raise', 'soleus raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['sóleo'], secondary_muscles: ['gastrocnêmio'], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-25', default_set_range: '4-5', default_rest_seconds: 60, search_rank: 78 },
  { canonical_name_pt: 'Panturrilha no leg press', canonical_name_en: 'Leg Press Calf Raise', aliases_pt: ['panturrilha no leg', 'leg press panturrilha'], aliases_en: ['leg press calf raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['gastrocnêmio'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-25', default_set_range: '4-5', default_rest_seconds: 60, search_rank: 68 },

  // ═══ CORE ═══
  { canonical_name_pt: 'Prancha', canonical_name_en: 'Plank', aliases_pt: ['prancha', 'plank', 'isometria abdominal'], aliases_en: ['plank', 'front plank'], exercise_type: 'strength', movement_pattern: 'other', primary_muscles: ['core', 'transverso abdominal'], secondary_muscles: ['lombar', 'glúteo'], equipment: ['bodyweight'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '30-60s', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 88 },
  { canonical_name_pt: 'Abdominal crunch', canonical_name_en: 'Crunch', aliases_pt: ['abdominal', 'crunch', 'abdominal crunch', 'abdominais'], aliases_en: ['crunch', 'ab crunch', 'sit-up'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['reto abdominal'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-25', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 88 },
  { canonical_name_pt: 'Abdominal com roda', canonical_name_en: 'Ab Wheel Rollout', aliases_pt: ['roda abdominal', 'ab wheel', 'rolo abdominal'], aliases_en: ['ab wheel rollout', 'ab roller'], exercise_type: 'strength', movement_pattern: 'other', primary_muscles: ['core', 'reto abdominal'], secondary_muscles: ['lombar', 'ombros'], equipment: ['ab_wheel'], body_region: 'core', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 78 },
  { canonical_name_pt: 'Elevação de pernas', canonical_name_en: 'Leg Raise', aliases_pt: ['elevação de pernas', 'leg raise', 'abdominais inferiores'], aliases_en: ['leg raise', 'hanging leg raise', 'lying leg raise'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['reto abdominal inferior'], secondary_muscles: ['iliopsoas'], equipment: ['bodyweight', 'pull_up_bar'], body_region: 'core', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 82 },
  { canonical_name_pt: 'Rotação russa com medicine ball', canonical_name_en: 'Russian Twist', aliases_pt: ['rotação russa', 'russian twist', 'oblíquos rotação'], aliases_en: ['russian twist', 'medicine ball russian twist'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['oblíquos'], secondary_muscles: ['reto abdominal'], equipment: ['bodyweight', 'medicine_ball'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '20-30', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Dead bug', canonical_name_en: 'Dead Bug', aliases_pt: ['dead bug', 'bug morto'], aliases_en: ['dead bug'], exercise_type: 'strength', movement_pattern: 'other', primary_muscles: ['core', 'transverso abdominal'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '8-12', default_set_range: '3', default_rest_seconds: 60, search_rank: 65 },
  { canonical_name_pt: 'Abdominal no cabo', canonical_name_en: 'Cable Crunch', aliases_pt: ['abdominal cabo', 'crunch cabo', 'abdominal polia'], aliases_en: ['cable crunch', 'kneeling cable crunch'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['reto abdominal'], secondary_muscles: ['oblíquos'], equipment: ['cable'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },

  // ═══ CARDIO / FULL BODY ═══
  { canonical_name_pt: 'Levantamento terra sumô', canonical_name_en: 'Sumo Deadlift', aliases_pt: ['terra sumô', 'sumo deadlift', 'levantamento sumô'], aliases_en: ['sumo deadlift', 'wide stance deadlift'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['glúteo', 'adutores', 'quadríceps'], secondary_muscles: ['isquiotibiais', 'lombar'], equipment: ['barbell'], body_region: 'lower', is_compound: true, difficulty_level: 'advanced', default_rep_range: '3-6', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 78 },
  { canonical_name_pt: 'Kettlebell swing', canonical_name_en: 'Kettlebell Swing', aliases_pt: ['swing kettlebell', 'swing'], aliases_en: ['kettlebell swing', 'russian swing', 'american swing'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['glúteo', 'isquiotibiais'], secondary_muscles: ['lombar', 'core'], equipment: ['kettlebell'], body_region: 'full_body', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '15-20', default_set_range: '3-5', default_rest_seconds: 75, search_rank: 80 },
  { canonical_name_pt: 'Burpee', canonical_name_en: 'Burpee', aliases_pt: ['burpee', 'burpees'], aliases_en: ['burpee'], exercise_type: 'cardio', movement_pattern: 'other', primary_muscles: ['full_body'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'full_body', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-5', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Corrida na esteira', canonical_name_en: 'Treadmill Running', aliases_pt: ['corrida esteira', 'esteira', 'corrida'], aliases_en: ['treadmill', 'running', 'jogging'], exercise_type: 'cardio', movement_pattern: 'cardio_pattern', primary_muscles: ['quadríceps', 'isquiotibiais', 'glúteo'], secondary_muscles: [], equipment: ['treadmill'], body_region: 'full_body', is_compound: true, difficulty_level: 'beginner', default_rep_range: '20-40min', default_set_range: '1', default_rest_seconds: 0, search_rank: 90 },
  { canonical_name_pt: 'Bicicleta ergométrica', canonical_name_en: 'Stationary Bike', aliases_pt: ['bike', 'bicicleta ergométrica', 'cycling'], aliases_en: ['stationary bike', 'cycling', 'spin bike'], exercise_type: 'cardio', movement_pattern: 'cardio_pattern', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: [], equipment: ['bike'], body_region: 'lower', is_compound: true, difficulty_level: 'beginner', default_rep_range: '20-45min', default_set_range: '1', default_rest_seconds: 0, search_rank: 82 },
  { canonical_name_pt: 'Elíptico', canonical_name_en: 'Elliptical', aliases_pt: ['elíptico', 'elítico', 'cross trainer'], aliases_en: ['elliptical', 'cross trainer'], exercise_type: 'cardio', movement_pattern: 'cardio_pattern', primary_muscles: ['quadríceps', 'glúteo', 'isquiotibiais'], secondary_muscles: [], equipment: ['machine'], body_region: 'full_body', is_compound: true, difficulty_level: 'beginner', default_rep_range: '20-40min', default_set_range: '1', default_rest_seconds: 0, search_rank: 72 },
  { canonical_name_pt: 'Pular corda', canonical_name_en: 'Jump Rope', aliases_pt: ['corda', 'pular corda', 'jump rope'], aliases_en: ['jump rope', 'skipping'], exercise_type: 'cardio', movement_pattern: 'cardio_pattern', primary_muscles: ['panturrilha', 'full_body'], secondary_muscles: [], equipment: ['jump_rope'], body_region: 'full_body', is_compound: true, difficulty_level: 'beginner', default_rep_range: '3-5min', default_set_range: '3-5', default_rest_seconds: 60, search_rank: 78 },

  // ═══ LEVANTAMENTOS OLÍMPICOS ═══
  { canonical_name_pt: 'Clean and jerk', canonical_name_en: 'Clean and Jerk', aliases_pt: ['arremesso', 'clean and jerk', 'dois tempos'], aliases_en: ['clean and jerk', 'clean & jerk'], exercise_type: 'strength', movement_pattern: 'other', primary_muscles: ['full_body'], secondary_muscles: [], equipment: ['barbell'], body_region: 'full_body', is_compound: true, difficulty_level: 'advanced', default_rep_range: '2-4', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 60 },
  { canonical_name_pt: 'Snatch', canonical_name_en: 'Snatch', aliases_pt: ['arranque', 'snatch'], aliases_en: ['snatch', 'power snatch'], exercise_type: 'strength', movement_pattern: 'other', primary_muscles: ['full_body'], secondary_muscles: [], equipment: ['barbell'], body_region: 'full_body', is_compound: true, difficulty_level: 'advanced', default_rep_range: '2-4', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 58 },
  { canonical_name_pt: 'Power clean', canonical_name_en: 'Power Clean', aliases_pt: ['power clean', 'clean'], aliases_en: ['power clean', 'hang clean'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['full_body'], secondary_muscles: [], equipment: ['barbell'], body_region: 'full_body', is_compound: true, difficulty_level: 'advanced', default_rep_range: '2-5', default_set_range: '3-5', default_rest_seconds: 180, search_rank: 62 },

  // ═══ MOBILIDADE / AQUECIMENTO ═══
  { canonical_name_pt: 'Rotação torácica', canonical_name_en: 'Thoracic Rotation', aliases_pt: ['rotação torácica', 'mobilidade coluna'], aliases_en: ['thoracic rotation', 'spinal rotation'], exercise_type: 'mobility', movement_pattern: 'rotation', primary_muscles: ['paravertebrais'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '2-3', default_rest_seconds: 30, search_rank: 60 },
  { canonical_name_pt: 'Hip flexor stretch', canonical_name_en: 'Hip Flexor Stretch', aliases_pt: ['alongamento flexores do quadril', 'psoas stretch'], aliases_en: ['hip flexor stretch', 'psoas stretch', 'lunge stretch'], exercise_type: 'mobility', movement_pattern: 'lunge', primary_muscles: ['iliopsoas'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '30-60s', default_set_range: '2-3', default_rest_seconds: 30, search_rank: 65 },
  { canonical_name_pt: 'Agachamento cossaco', canonical_name_en: 'Cossack Squat', aliases_pt: ['cossaco', 'agachamento cossaco', 'lateral squat'], aliases_en: ['cossack squat', 'lateral squat'], exercise_type: 'mobility', movement_pattern: 'squat', primary_muscles: ['adutores', 'glúteo'], secondary_muscles: ['quadríceps'], equipment: ['bodyweight'], body_region: 'lower', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '8-12', default_set_range: '2-3', default_rest_seconds: 60, search_rank: 62 },

  // ═══ EXTRAS POPULARES ═══
  { canonical_name_pt: 'Rosca inversa', canonical_name_en: 'Reverse Curl', aliases_pt: ['rosca inversa', 'rosca pronada'], aliases_en: ['reverse curl', 'reverse barbell curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['braquioradial', 'extensores do antebraço'], secondary_muscles: ['bíceps'], equipment: ['barbell', 'dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 65 },
  { canonical_name_pt: 'Rotação de punho', canonical_name_en: 'Wrist Curl', aliases_pt: ['rosca punho', 'wrist curl', 'antebraço curto'], aliases_en: ['wrist curl', 'forearm curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['flexores do antebraço'], secondary_muscles: [], equipment: ['barbell', 'dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 45, search_rank: 55 },
  { canonical_name_pt: 'Flexão diamante', canonical_name_en: 'Diamond Push-Up', aliases_pt: ['flexão diamante', 'push-up fechado', 'flexão tríceps'], aliases_en: ['diamond push-up', 'close grip push-up', 'tricep push-up'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['tríceps'], secondary_muscles: ['peito'], equipment: ['bodyweight'], body_region: 'upper', is_compound: true, difficulty_level: 'intermediate', default_rep_range: '10-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },
  { canonical_name_pt: 'Flexão inclinada', canonical_name_en: 'Incline Push-Up', aliases_pt: ['flexão inclinada', 'push-up inclinado'], aliases_en: ['incline push-up'], exercise_type: 'hypertrophy', movement_pattern: 'push_horizontal', primary_muscles: ['peito inferior'], secondary_muscles: ['tríceps'], equipment: ['bodyweight'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 65 },
  { canonical_name_pt: 'Superman', canonical_name_en: 'Superman', aliases_pt: ['superman', 'extensão lombar chão'], aliases_en: ['superman', 'back extension floor'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['lombar', 'glúteo'], secondary_muscles: [], equipment: ['bodyweight'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3', default_rest_seconds: 45, search_rank: 60 },
  { canonical_name_pt: 'Step up no banco', canonical_name_en: 'Box Step-Up', aliases_pt: ['step up', 'subida banco', 'box step'], aliases_en: ['step-up', 'box step-up', 'bench step-up'], exercise_type: 'hypertrophy', movement_pattern: 'lunge', primary_muscles: ['quadríceps', 'glúteo'], secondary_muscles: [], equipment: ['bench', 'bodyweight'], body_region: 'lower', is_compound: true, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 72 },
  { canonical_name_pt: 'Remada serrote', canonical_name_en: 'Meadows Row', aliases_pt: ['remada serrote', 'meadows row'], aliases_en: ['meadows row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps', 'trapézio'], equipment: ['barbell'], body_region: 'upper', is_compound: true, is_unilateral: true, difficulty_level: 'intermediate', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 68 },
  { canonical_name_pt: 'Chest supported row', canonical_name_en: 'Chest Supported Row', aliases_pt: ['remada apoiada no banco', 'chest supported row'], aliases_en: ['chest supported row', 'incline dumbbell row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo', 'trapézio médio'], secondary_muscles: ['bíceps', 'romboide'], equipment: ['dumbbell', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 75 },
  { canonical_name_pt: 'Tricep overhead com halteres', canonical_name_en: 'Overhead Tricep Extension', aliases_pt: ['tríceps acima da cabeça', 'extension overhead'], aliases_en: ['overhead tricep extension', 'dumbbell overhead extension'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['tríceps'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Elevação de calcanhares no degrau', canonical_name_en: 'Single Leg Calf Raise', aliases_pt: ['panturrilha unilateral', 'calf raise degrau'], aliases_en: ['single leg calf raise', 'donkey calf raise'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['gastrocnêmio'], secondary_muscles: ['sóleo'], equipment: ['bodyweight', 'step'], body_region: 'lower', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '15-25', default_set_range: '4', default_rest_seconds: 60, search_rank: 68 },
  { canonical_name_pt: 'Adução de quadril na máquina', canonical_name_en: 'Hip Adduction Machine', aliases_pt: ['adução quadril', 'adutora máquina', 'inner thigh machine'], aliases_en: ['hip adduction', 'adductor machine', 'inner thigh machine'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['adutores'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 68 },
  { canonical_name_pt: 'Levantamento terra com halteres', canonical_name_en: 'Dumbbell Deadlift', aliases_pt: ['terra halter', 'deadlift halter'], aliases_en: ['dumbbell deadlift', 'db deadlift'], exercise_type: 'strength', movement_pattern: 'hinge', primary_muscles: ['glúteo', 'isquiotibiais', 'lombar'], secondary_muscles: ['trapézio', 'latíssimo'], equipment: ['dumbbell'], body_region: 'full_body', is_compound: true, difficulty_level: 'beginner', default_rep_range: '8-12', default_set_range: '3-4', default_rest_seconds: 90, search_rank: 78 },

  // ═══ ACESSÓRIOS POPULARES ACADEMIA BRASIL ═══
  { canonical_name_pt: 'Pulley costas', canonical_name_en: 'Lat Pulldown (Straight Bar)', aliases_pt: ['pulley costas pronado', 'pulley em pé', 'puxada polia costas'], aliases_en: ['pulley straight bar', 'straight bar pulldown'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps'], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 95 },
  { canonical_name_pt: 'Pulley frente aberta', canonical_name_en: 'Wide Grip Lat Pulldown', aliases_pt: ['puxada aberta', 'pulley aberto', 'puxada frente aberta', 'wide grip pulley'], aliases_en: ['wide grip pulldown', 'wide lat pulldown'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 88 },
  { canonical_name_pt: 'Pulley frente fechado', canonical_name_en: 'Close Grip Lat Pulldown', aliases_pt: ['puxada fechada', 'pulley fechado', 'puxada frente fechada', 'close grip pulley'], aliases_en: ['close grip pulldown', 'narrow lat pulldown'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps'], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 82 },
  { canonical_name_pt: 'Puxada alta na polia', canonical_name_en: 'High Pulley Pull', aliases_pt: ['puxada alta', 'puxada polia alta'], aliases_en: ['high pulley pull', 'high cable pull'], exercise_type: 'hypertrophy', movement_pattern: 'pull_vertical', primary_muscles: ['trapézio', 'deltóide'], secondary_muscles: ['latíssimo'], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },
  { canonical_name_pt: 'Remada baixa na polia', canonical_name_en: 'Low Cable Row', aliases_pt: ['remada baixa polia', 'remada polia', 'seated cable row remada baixa'], aliases_en: ['low cable row'], exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo'], secondary_muscles: ['bíceps'], equipment: ['cable'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 85 },
  { canonical_name_pt: 'Remada cavalinho na polia', canonical_name_en: 'Chest Supported Cable Row', aliases_pt: ['remada cavalinho', 'remada cavaleta', 'seated cable row'], aliases_en: ['chest supported cable row', 'machine row'] , exercise_type: 'hypertrophy', movement_pattern: 'pull_horizontal', primary_muscles: ['latíssimo', 'trapézio'], secondary_muscles: ['bíceps'], equipment: ['cable', 'bench'], body_region: 'upper', is_compound: true, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '3-4', default_rest_seconds: 75, search_rank: 80 },

  // ═══ MANGUITO ROTADOR / ROTADOR EXTERNO ═══
  { canonical_name_pt: 'Rotação externa com halteres', canonical_name_en: 'Dumbbell External Rotation', aliases_pt: ['rotação externa halter', 'rotador externo', 'rotação externa ombro', 'manguito rotador'], aliases_en: ['external rotation', 'shoulder external rotation', 'rotator cuff exercise'], exercise_type: 'strength', movement_pattern: 'isolation', primary_muscles: ['infraespinhal', 'redondo menor'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 45, search_rank: 85 },
  { canonical_name_pt: 'Rotação interna com halteres', canonical_name_en: 'Dumbbell Internal Rotation', aliases_pt: ['rotação interna halter', 'rotação interna ombro'], aliases_en: ['internal rotation', 'shoulder internal rotation'], exercise_type: 'strength', movement_pattern: 'isolation', primary_muscles: ['subescapular'], secondary_muscles: [], equipment: ['dumbbell'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 45, search_rank: 72 },
  { canonical_name_pt: 'Rotação externa no cabo', canonical_name_en: 'Cable External Rotation', aliases_pt: ['rotação externa cabo', 'rotador externo polia'], aliases_en: ['cable external rotation'], exercise_type: 'strength', movement_pattern: 'isolation', primary_muscles: ['infraespinhal'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 45, search_rank: 75 },
  { canonical_name_pt: 'Pássaro com cabo', canonical_name_en: 'Cable Rear Delt Fly', aliases_pt: ['pássaro cabo', 'pássaro polia', 'posterior deltóide cabo'], aliases_en: ['cable reverse fly', 'cable rear delt fly'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['deltóide posterior'], secondary_muscles: ['trapézio'], equipment: ['cable'], body_region: 'upper', is_compound: false, is_unilateral: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 78 },

  // ═══ MOBILIDADE / REABILITAÇÃO COMUM ═══
  { canonical_name_pt: 'Band Pull Apart', canonical_name_en: 'Band Pull Apart', aliases_pt: ['band pull apart', 'puxada com fita'], aliases_en: ['band pull apart', 'resistance band pull apart'], exercise_type: 'mobility', movement_pattern: 'pull_horizontal', primary_muscles: ['trapézio'], secondary_muscles: ['romboide'], equipment: ['resistance_band'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3', default_rest_seconds: 30, search_rank: 70 },
  { canonical_name_pt: 'Dislocação de ombro com vara', canonical_name_en: 'Shoulder Dislocations', aliases_pt: ['dislocação ombro', 'dislocação vara', 'shoulder mobility'], aliases_en: ['shoulder dislocations', 'shoulder pass through'], exercise_type: 'mobility', movement_pattern: 'push_horizontal', primary_muscles: ['ombro'], secondary_muscles: ['peito'], equipment: ['dowel', 'bodyweight'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '10-15', default_set_range: '2-3', default_rest_seconds: 30, search_rank: 65 },
  { canonical_name_pt: 'Alongamento de panturrilha', canonical_name_en: 'Calf Stretch', aliases_pt: ['alongamento panturrilha', 'garrote calf'], aliases_en: ['calf stretch', 'wall calf stretch'], exercise_type: 'mobility', movement_pattern: 'isolation', primary_muscles: ['gastrocnêmio', 'sóleo'], secondary_muscles: [], equipment: ['bodyweight', 'wall'], body_region: 'lower', is_compound: false, difficulty_level: 'beginner', default_rep_range: '30-60s', default_set_range: '2-3', default_rest_seconds: 30, search_rank: 60 },
  { canonical_name_pt: 'Alongamento de peito na parede', canonical_name_en: 'Wall Chest Stretch', aliases_pt: ['alongamento peito', 'pectoral stretch'], aliases_en: ['wall chest stretch', 'pectoral stretch'], exercise_type: 'mobility', movement_pattern: 'push_horizontal', primary_muscles: ['peito'], secondary_muscles: [], equipment: ['wall', 'bodyweight'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '30-60s', default_set_range: '2-3', default_rest_seconds: 30, search_rank: 60 },

  // ═══ ISOLAMENTO / ACESSÓRIOS EXTRAS ═══
  { canonical_name_pt: 'Rosca scott no cabo', canonical_name_en: 'Cable Preacher Curl', aliases_pt: ['scott cabo', 'rosca scott polia'], aliases_en: ['cable scott curl', 'cable preacher curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['bíceps'], secondary_muscles: [], equipment: ['cable'], body_region: 'upper', is_compound: false, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Extensão de perna unilateral', canonical_name_en: 'Single Leg Extension', aliases_pt: ['extensora unilateral', 'leg extension unilateral'], aliases_en: ['single leg extension', 'unilateral leg extension'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['quadríceps'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Flexora unilateral', canonical_name_en: 'Single Leg Curl', aliases_pt: ['flexora unilateral', 'leg curl unilateral'], aliases_en: ['single leg curl', 'unilateral leg curl'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['isquiotibiais'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '12-15', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 72 },
  { canonical_name_pt: 'Abdução unilateral na máquina', canonical_name_en: 'Single Hip Abduction', aliases_pt: ['abdução unilateral', 'abdutor unilateral'], aliases_en: ['single hip abduction', 'unilateral abduction'], exercise_type: 'hypertrophy', movement_pattern: 'isolation', primary_muscles: ['glúteo médio'], secondary_muscles: [], equipment: ['machine'], body_region: 'lower', is_compound: false, is_unilateral: true, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 68 },
  { canonical_name_pt: 'Decline sit-up', canonical_name_en: 'Decline Sit-Up', aliases_pt: ['abdominal declinado', 'sit-up declinado', 'decline crunch'], aliases_en: ['decline sit-up', 'decline crunch'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['reto abdominal'], secondary_muscles: ['oblíquos'], equipment: ['bench'], body_region: 'core', is_compound: false, difficulty_level: 'intermediate', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 75 },
  { canonical_name_pt: 'Abdominal na máquina', canonical_name_en: 'Ab Machine Crunch', aliases_pt: ['abdominal máquina', 'máquina abdominais', 'ab machine'], aliases_en: ['ab machine', 'machine crunch'], exercise_type: 'hypertrophy', movement_pattern: 'rotation', primary_muscles: ['reto abdominal'], secondary_muscles: [], equipment: ['machine'], body_region: 'core', is_compound: false, difficulty_level: 'beginner', default_rep_range: '15-20', default_set_range: '3-4', default_rest_seconds: 60, search_rank: 70 },
  ];

function normalize(s) {
  // Remove acentos, converte lowercase, remove pontuação
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/ç/g, 'c')
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
    .replace(/[^a-z0-9\s]/g, '') // Remove outros caracteres
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(ex, query) {
  const q = normalize(query);
  if (!q || q.length < 2) return -1;
  
  const namePt = normalize(ex.canonical_name_pt);
  const nameEn = normalize(ex.canonical_name_en || '');
  const aliasesPt = (ex.aliases_pt || []).map(normalize);
  const aliasesEn = (ex.aliases_en || []).map(normalize);
  
  const rank = ex.search_rank || 0;

  // Exact match = highest score
  if (namePt === q || nameEn === q) return 1000 + rank;
  
  // Exact alias match
  if (aliasesPt.some(a => a === q) || aliasesEn.some(a => a === q)) return 950 + rank;

  // Prefix match (word starts with query)
  if (namePt.startsWith(q) || nameEn.startsWith(q)) return 800 + rank;
  if (aliasesPt.some(a => a.startsWith(q)) || aliasesEn.some(a => a.startsWith(q))) return 750 + rank;

  // Contains full query
  if (namePt.includes(q) || nameEn.includes(q)) return 600 + rank;
  if (aliasesPt.some(a => a.includes(q)) || aliasesEn.some(a => a.includes(q))) return 550 + rank;

  // Multi-word match: score by proportion of matched words
  const words = q.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const all = [namePt, nameEn, ...aliasesPt, ...aliasesEn].join(' ');
    const matched = words.filter(w => all.includes(w)).length;
    if (matched > 0) {
      const ratio = matched / words.length;
      return ratio * 400 + rank; // 0-400 points
    }
  }

  // Single word: check partial matches (3+ chars)
  if (q.length >= 3) {
    const all = [namePt, nameEn, ...aliasesPt, ...aliasesEn].join(' ');
    const partialWords = q.split(/\s+/).filter(w => w.length >= 3);
    if (partialWords.some(w => all.includes(w))) {
      return 300 + rank;
    }
  }

  return -1;
}

function formatExercise(ex) {
  return {
    id: ex.id,
    name: ex.canonical_name_pt,
    name_en: ex.canonical_name_en || null,
    slug: ex.slug || null,
    exercise_type: ex.exercise_type,
    movement_pattern: ex.movement_pattern,
    primary_muscles: ex.primary_muscles || [],
    secondary_muscles: ex.secondary_muscles || [],
    equipment: ex.equipment || [],
    body_region: ex.body_region,
    difficulty_level: ex.difficulty_level,
    is_unilateral: ex.is_unilateral || false,
    is_compound: ex.is_compound || false,
    default_rep_range: ex.default_rep_range || null,
    default_set_range: ex.default_set_range || null,
    default_rest_seconds: ex.default_rest_seconds || null,
    instructions_short_pt: ex.instructions_short_pt || null,
    form_cues_pt: ex.form_cues_pt || [],
    common_mistakes_pt: ex.common_mistakes_pt || [],
    substitutions: ex.substitutions || [],
    search_rank: ex.search_rank || 0,
    source: ex.source || 'local',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── SEARCH ─────────────────────────────────────────────────────────────────
    if (action === 'search') {
      const { query, limit = 8 } = body;
      if (!query || query.length < 2) return Response.json({ results: [] });

      const all = await base44.asServiceRole.entities.ExerciseMaster.filter({ is_active: true }, '-search_rank', 600);
      const scored = all
        .map(ex => ({ ex, score: scoreMatch(ex, query) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => formatExercise(x.ex));

      return Response.json({ results: scored, source: 'local' });
    }

    // ── BY MUSCLE ──────────────────────────────────────────────────────────────
    if (action === 'by_muscle') {
      const { muscle, limit = 12 } = body;
      if (!muscle) return Response.json({ results: [] });
      const q = normalize(muscle);
      const all = await base44.asServiceRole.entities.ExerciseMaster.filter({ is_active: true }, '-search_rank', 500);
      const results = all
        .filter(ex => [...(ex.primary_muscles || []), ...(ex.secondary_muscles || [])].some(m => normalize(m).includes(q)))
        .sort((a, b) => (b.search_rank || 0) - (a.search_rank || 0))
        .slice(0, limit)
        .map(formatExercise);
      return Response.json({ results });
    }

    // ── BY EQUIPMENT ───────────────────────────────────────────────────────────
    if (action === 'by_equipment') {
      const { equipment, limit = 12 } = body;
      if (!equipment) return Response.json({ results: [] });
      const q = normalize(equipment);
      const all = await base44.asServiceRole.entities.ExerciseMaster.filter({ is_active: true }, '-search_rank', 500);
      const results = all
        .filter(ex => (ex.equipment || []).some(e => normalize(e).includes(q)))
        .sort((a, b) => (b.search_rank || 0) - (a.search_rank || 0))
        .slice(0, limit)
        .map(formatExercise);
      return Response.json({ results });
    }

    // ── GET BY ID ──────────────────────────────────────────────────────────────
    if (action === 'get') {
      const { id } = body;
      const list = await base44.asServiceRole.entities.ExerciseMaster.filter({ id });
      if (!list.length) return Response.json({ result: null }, { status: 404 });
      return Response.json({ result: formatExercise(list[0]) });
    }

    // ── IMPORT (add custom/external exercise) ──────────────────────────────────
    if (action === 'import') {
      const { exercise } = body;
      if (!exercise?.canonical_name_pt) return Response.json({ error: 'Name required' }, { status: 400 });
      if (exercise.source_external_id) {
        const existing = await base44.asServiceRole.entities.ExerciseMaster.filter({ source_external_id: exercise.source_external_id });
        if (existing.length > 0) return Response.json({ id: existing[0].id, imported: false });
      }
      const created = await base44.asServiceRole.entities.ExerciseMaster.create({ ...exercise, is_active: true, source: exercise.source || 'manual' });
      return Response.json({ id: created.id, imported: true });
    }

    // ── SEED (admin: populate initial dataset) ─────────────────────────────────
    if (action === 'seed') {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      let count = 0;
      for (const seed of SEED) {
        const existing = await base44.asServiceRole.entities.ExerciseMaster.filter({ canonical_name_pt: seed.canonical_name_pt });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.ExerciseMaster.create({
            ...seed,
            is_active: true,
            source: 'local',
            slug: seed.canonical_name_pt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          });
          count++;
        }
      }
      return Response.json({ seeded: count, total: SEED.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('exerciseSearch error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});