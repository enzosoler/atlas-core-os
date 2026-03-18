/**
 * Food Logs API — recentes e favoritos por usuário
 * 
 * Routes:
 *   POST { action: 'recent' }                                → get recent foods
 *   POST { action: 'favorites' }                             → get favorite foods
 *   POST { action: 'toggle_favorite', food_master_id }      → toggle favorite
 *   POST { action: 'log_use', food_master_id, food_name }   → register food use
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── RECENT ─────────────────────────────────────────────────────────────────
    if (action === 'recent') {
      const logs = await base44.entities.FoodLog.list('-last_used_at', 15);
      // Get food details from FoodMaster for each log
      const results = [];
      for (const log of logs) {
        const foods = await base44.asServiceRole.entities.FoodMaster.filter({ id: log.food_master_id });
        if (foods.length > 0) {
          const f = foods[0];
          results.push({
            id: f.id,
            name: f.canonical_name,
            brand: f.brand || null,
            category: f.category,
            serving_amount: f.serving_base_amount,
            serving_unit: f.serving_base_unit,
            kcal: f.calories_per_base,
            protein: f.protein_per_base,
            carbs: f.carbs_per_base,
            fat: f.fat_per_base,
            fiber: f.fiber_per_base || 0,
            source_type: f.source_type,
            is_verified: f.is_verified || false,
            log_id: log.id,
            is_favorite: log.is_favorite || false,
            use_count: log.use_count || 1,
            last_used_at: log.last_used_at,
            default_amount: log.default_amount || f.serving_base_amount,
            default_unit: log.default_unit || f.serving_base_unit,
          });
        }
      }
      return Response.json({ results });
    }

    // ── FAVORITES ──────────────────────────────────────────────────────────────
    if (action === 'favorites') {
      const logs = await base44.entities.FoodLog.filter({ is_favorite: true });
      const results = [];
      for (const log of logs) {
        const foods = await base44.asServiceRole.entities.FoodMaster.filter({ id: log.food_master_id });
        if (foods.length > 0) {
          const f = foods[0];
          results.push({
            id: f.id,
            name: f.canonical_name,
            brand: f.brand || null,
            category: f.category,
            serving_amount: f.serving_base_amount,
            serving_unit: f.serving_base_unit,
            kcal: f.calories_per_base,
            protein: f.protein_per_base,
            carbs: f.carbs_per_base,
            fat: f.fat_per_base,
            fiber: f.fiber_per_base || 0,
            source_type: f.source_type,
            is_verified: f.is_verified || false,
            log_id: log.id,
            is_favorite: true,
            use_count: log.use_count || 1,
          });
        }
      }
      return Response.json({ results });
    }

    // ── TOGGLE FAVORITE ────────────────────────────────────────────────────────
    if (action === 'toggle_favorite') {
      const { food_master_id } = body;
      const logs = await base44.entities.FoodLog.filter({ food_master_id });
      if (logs.length === 0) {
        return Response.json({ error: 'Food not in logs yet' }, { status: 404 });
      }
      const log = logs[0];
      const updated = await base44.entities.FoodLog.update(log.id, { is_favorite: !log.is_favorite });
      return Response.json({ is_favorite: updated.is_favorite });
    }

    // ── LOG USE ────────────────────────────────────────────────────────────────
    if (action === 'log_use') {
      const { food_master_id, food_name, amount, unit } = body;
      const now = new Date().toISOString();

      // Check existing log entry for this user+food
      const existing = await base44.entities.FoodLog.filter({ food_master_id });
      if (existing.length > 0) {
        const log = existing[0];
        await base44.entities.FoodLog.update(log.id, {
          last_used_at: now,
          use_count: (log.use_count || 1) + 1,
          ...(amount && { default_amount: amount }),
          ...(unit && { default_unit: unit }),
        });
      } else {
        await base44.entities.FoodLog.create({
          food_master_id,
          food_name: food_name || 'Alimento',
          last_used_at: now,
          use_count: 1,
          is_favorite: false,
          ...(amount && { default_amount: amount }),
          ...(unit && { default_unit: unit }),
        });
      }

      // Bump search_rank on FoodMaster
      const masterFoods = await base44.asServiceRole.entities.FoodMaster.filter({ id: food_master_id });
      if (masterFoods.length > 0) {
        const f = masterFoods[0];
        await base44.asServiceRole.entities.FoodMaster.update(f.id, {
          search_rank: Math.min((f.search_rank || 0) + 1, 200),
        });
      }

      return Response.json({ logged: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('foodLogs error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});