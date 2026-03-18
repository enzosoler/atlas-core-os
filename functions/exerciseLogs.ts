/**
 * Exercise Logs API — recentes, favoritos e PRs por usuário
 *
 * Actions:
 *   recent          → últimos 15 exercícios usados
 *   favorites       → exercícios favoritos
 *   toggle_favorite { exercise_master_id }
 *   log_use         { exercise_master_id, exercise_name, weight, reps }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    async function enrichLogs(logs) {
      const results = [];
      for (const log of logs) {
        const list = await base44.asServiceRole.entities.ExerciseMaster.filter({ id: log.exercise_master_id });
        if (list.length > 0) {
          const ex = list[0];
          results.push({
            id: ex.id,
            name: ex.canonical_name_pt,
            exercise_type: ex.exercise_type,
            movement_pattern: ex.movement_pattern,
            primary_muscles: ex.primary_muscles || [],
            equipment: ex.equipment || [],
            body_region: ex.body_region,
            difficulty_level: ex.difficulty_level,
            is_compound: ex.is_compound || false,
            default_rep_range: ex.default_rep_range || null,
            default_set_range: ex.default_set_range || null,
            default_rest_seconds: ex.default_rest_seconds || null,
            log_id: log.id,
            is_favorite: log.is_favorite || false,
            use_count: log.use_count || 1,
            last_used_at: log.last_used_at,
            personal_record_weight: log.personal_record_weight || null,
            personal_record_reps: log.personal_record_reps || null,
            personal_record_date: log.personal_record_date || null,
          });
        }
      }
      return results;
    }

    if (action === 'recent') {
      const logs = await base44.entities.ExerciseLog.list('-last_used_at', 15);
      return Response.json({ results: await enrichLogs(logs) });
    }

    if (action === 'favorites') {
      const logs = await base44.entities.ExerciseLog.filter({ is_favorite: true });
      return Response.json({ results: await enrichLogs(logs) });
    }

    if (action === 'toggle_favorite') {
      const { exercise_master_id } = body;
      const logs = await base44.entities.ExerciseLog.filter({ exercise_master_id });
      if (!logs.length) return Response.json({ error: 'Not in logs yet' }, { status: 404 });
      const updated = await base44.entities.ExerciseLog.update(logs[0].id, { is_favorite: !logs[0].is_favorite });
      return Response.json({ is_favorite: updated.is_favorite });
    }

    if (action === 'log_use') {
      const { exercise_master_id, exercise_name, weight, reps } = body;
      const now = new Date().toISOString();
      const existing = await base44.entities.ExerciseLog.filter({ exercise_master_id });

      if (existing.length > 0) {
        const log = existing[0];
        const updateData = { last_used_at: now, use_count: (log.use_count || 1) + 1 };
        // Update PR if better
        if (weight && (!log.personal_record_weight || weight > log.personal_record_weight)) {
          updateData.personal_record_weight = weight;
          updateData.personal_record_reps = reps || log.personal_record_reps;
          updateData.personal_record_date = now.split('T')[0];
        }
        await base44.entities.ExerciseLog.update(log.id, updateData);
      } else {
        await base44.entities.ExerciseLog.create({
          exercise_master_id,
          exercise_name: exercise_name || 'Exercício',
          last_used_at: now,
          use_count: 1,
          is_favorite: false,
          ...(weight && { personal_record_weight: weight, personal_record_reps: reps, personal_record_date: now.split('T')[0] }),
        });
      }

      // Bump search_rank on ExerciseMaster
      const masterList = await base44.asServiceRole.entities.ExerciseMaster.filter({ id: exercise_master_id });
      if (masterList.length > 0) {
        const ex = masterList[0];
        await base44.asServiceRole.entities.ExerciseMaster.update(ex.id, {
          search_rank: Math.min((ex.search_rank || 0) + 1, 200),
        });
      }

      return Response.json({ logged: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('exerciseLogs error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});