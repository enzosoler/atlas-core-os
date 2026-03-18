/**
 * Food Search API — deterministic, fast, no LLM for macros
 * 
 * Routes:
 *   POST { action: 'search', query: string }          → search foods
 *   POST { action: 'barcode', code: string }           → lookup by barcode
 *   POST { action: 'import', food: object }            → import external food to local DB
 *   POST { action: 'get', id: string }                 → get by ID
 * 
 * Strategy:
 *   1. Search local FoodMaster DB (instant, deterministic)
 *   2. If < 3 results → fallback to Open Food Facts API
 *   3. If still nothing → fallback to LLM (macros only, no names)
 *   4. External results are auto-imported when selected
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Brazilian food seed data (top 100 TACO database foods) ───────────────────
const SEED_FOODS = [
  // Grãos e cereais
  { canonical_name: 'Arroz branco cozido', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 130, protein_per_base: 2.7, carbs_per_base: 28.1, fat_per_base: 0.3, fiber_per_base: 0.3, is_verified: true, search_rank: 95, source_type: 'local', aliases: ['arroz', 'arroz branco'] },
  { canonical_name: 'Arroz integral cozido', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 124, protein_per_base: 2.6, carbs_per_base: 25.8, fat_per_base: 1.0, fiber_per_base: 1.8, is_verified: true, search_rank: 80, source_type: 'local', aliases: ['arroz integral'] },
  { canonical_name: 'Feijão carioca cozido', category: 'protein_plant', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 77, protein_per_base: 4.8, carbs_per_base: 13.6, fat_per_base: 0.5, fiber_per_base: 8.4, is_verified: true, search_rank: 90, source_type: 'local', aliases: ['feijão', 'feijao carioca'] },
  { canonical_name: 'Feijão preto cozido', category: 'protein_plant', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 77, protein_per_base: 4.5, carbs_per_base: 14.0, fat_per_base: 0.5, fiber_per_base: 8.7, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['feijão preto', 'feijao preto'] },
  { canonical_name: 'Lentilha cozida', category: 'protein_plant', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 116, protein_per_base: 9.0, carbs_per_base: 20.1, fat_per_base: 0.4, fiber_per_base: 7.9, is_verified: true, search_rank: 55, source_type: 'local', aliases: ['lentilha'] },
  { canonical_name: 'Aveia em flocos', category: 'grain', serving_base_amount: 40, serving_base_unit: 'g', calories_per_base: 152, protein_per_base: 5.4, carbs_per_base: 26.8, fat_per_base: 2.8, fiber_per_base: 3.6, is_verified: true, search_rank: 80, source_type: 'local', aliases: ['aveia', 'flocos de aveia'] },
  { canonical_name: 'Macarrão cozido', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 131, protein_per_base: 4.3, carbs_per_base: 26.6, fat_per_base: 0.9, fiber_per_base: 1.2, is_verified: true, search_rank: 70, source_type: 'local', aliases: ['massa', 'espaguete', 'pasta'] },
  { canonical_name: 'Pão francês', category: 'grain', serving_base_amount: 50, serving_base_unit: 'g', calories_per_base: 134, protein_per_base: 4.3, carbs_per_base: 26.6, fat_per_base: 0.8, fiber_per_base: 1.1, is_verified: true, search_rank: 85, source_type: 'local', aliases: ['pão', 'pao frances'] },
  { canonical_name: 'Batata doce cozida', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 77, protein_per_base: 1.4, carbs_per_base: 18.3, fat_per_base: 0.1, fiber_per_base: 2.2, is_verified: true, search_rank: 82, source_type: 'local', aliases: ['batata doce', 'batata-doce'] },
  { canonical_name: 'Batata inglesa cozida', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 56, protein_per_base: 1.2, carbs_per_base: 12.6, fat_per_base: 0.1, fiber_per_base: 1.8, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['batata', 'batata inglesa'] },
  { canonical_name: 'Quinoa cozida', category: 'grain', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 120, protein_per_base: 4.4, carbs_per_base: 21.3, fat_per_base: 1.9, fiber_per_base: 2.8, is_verified: true, search_rank: 60, source_type: 'local', aliases: ['quinoa'] },
  // Proteínas animais
  { canonical_name: 'Frango peito grelhado', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 159, protein_per_base: 32.0, carbs_per_base: 0, fat_per_base: 3.2, fiber_per_base: 0, is_verified: true, search_rank: 98, source_type: 'local', aliases: ['frango', 'peito de frango', 'frango grelhado'] },
  { canonical_name: 'Frango coxa grelhada', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 197, protein_per_base: 26.0, carbs_per_base: 0, fat_per_base: 9.6, fiber_per_base: 0, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['coxa de frango'] },
  { canonical_name: 'Carne bovina patinho grelhado', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 219, protein_per_base: 28.0, carbs_per_base: 0, fat_per_base: 12.0, fiber_per_base: 0, is_verified: true, search_rank: 78, source_type: 'local', aliases: ['patinho', 'carne bovina', 'carne vermelha'] },
  { canonical_name: 'Carne bovina alcatra', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 195, protein_per_base: 29.0, carbs_per_base: 0, fat_per_base: 8.5, fiber_per_base: 0, is_verified: true, search_rank: 72, source_type: 'local', aliases: ['alcatra'] },
  { canonical_name: 'Salmão grelhado', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 208, protein_per_base: 28.0, carbs_per_base: 0, fat_per_base: 10.5, fiber_per_base: 0, is_verified: true, search_rank: 70, source_type: 'local', aliases: ['salmão', 'salmon'] },
  { canonical_name: 'Atum em lata (água)', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 116, protein_per_base: 25.5, carbs_per_base: 0, fat_per_base: 0.9, fiber_per_base: 0, is_verified: true, search_rank: 80, source_type: 'local', aliases: ['atum', 'atum em lata'] },
  { canonical_name: 'Ovo inteiro cozido', category: 'protein_animal', serving_base_amount: 60, serving_base_unit: 'g', calories_per_base: 90, protein_per_base: 7.5, carbs_per_base: 0.4, fat_per_base: 6.3, fiber_per_base: 0, is_verified: true, search_rank: 92, source_type: 'local', aliases: ['ovo', 'ovo cozido'] },
  { canonical_name: 'Clara de ovo', category: 'protein_animal', serving_base_amount: 33, serving_base_unit: 'g', calories_per_base: 17, protein_per_base: 3.6, carbs_per_base: 0.2, fat_per_base: 0.1, fiber_per_base: 0, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['clara', 'clara de ovo'] },
  { canonical_name: 'Tilápia grelhada', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 128, protein_per_base: 26.2, carbs_per_base: 0, fat_per_base: 2.3, fiber_per_base: 0, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['tilapia', 'tilápia'] },
  { canonical_name: 'Camarão cozido', category: 'protein_animal', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 99, protein_per_base: 20.9, carbs_per_base: 0.9, fat_per_base: 1.1, fiber_per_base: 0, is_verified: true, search_rank: 55, source_type: 'local', aliases: ['camarão', 'camarao'] },
  // Laticínios
  { canonical_name: 'Leite integral', category: 'dairy', serving_base_amount: 200, serving_base_unit: 'ml', calories_per_base: 122, protein_per_base: 6.6, carbs_per_base: 9.6, fat_per_base: 6.4, fiber_per_base: 0, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['leite'] },
  { canonical_name: 'Iogurte natural integral', category: 'dairy', serving_base_amount: 170, serving_base_unit: 'g', calories_per_base: 102, protein_per_base: 5.9, carbs_per_base: 7.1, fat_per_base: 5.3, fiber_per_base: 0, is_verified: true, search_rank: 70, source_type: 'local', aliases: ['iogurte', 'iogurte natural'] },
  { canonical_name: 'Iogurte grego 0%', category: 'dairy', serving_base_amount: 170, serving_base_unit: 'g', calories_per_base: 85, protein_per_base: 15.0, carbs_per_base: 5.0, fat_per_base: 0.4, fiber_per_base: 0, is_verified: true, search_rank: 80, source_type: 'local', aliases: ['iogurte grego', 'grego'] },
  { canonical_name: 'Queijo cottage', category: 'dairy', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 98, protein_per_base: 11.1, carbs_per_base: 3.4, fat_per_base: 4.3, fiber_per_base: 0, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['cottage'] },
  { canonical_name: 'Whey protein (scoop 30g)', category: 'supplement', serving_base_amount: 30, serving_base_unit: 'g', calories_per_base: 120, protein_per_base: 24.0, carbs_per_base: 3.0, fat_per_base: 1.5, fiber_per_base: 0, is_verified: true, search_rank: 85, source_type: 'local', aliases: ['whey', 'whey protein', 'proteína em pó'] },
  // Gorduras
  { canonical_name: 'Azeite de oliva', category: 'fat_oil', serving_base_amount: 10, serving_base_unit: 'ml', calories_per_base: 88, protein_per_base: 0, carbs_per_base: 0, fat_per_base: 10.0, fiber_per_base: 0, is_verified: true, search_rank: 80, source_type: 'local', aliases: ['azeite', 'azeite extra virgem'] },
  { canonical_name: 'Pasta de amendoim integral', category: 'fat_oil', serving_base_amount: 32, serving_base_unit: 'g', calories_per_base: 191, protein_per_base: 7.0, carbs_per_base: 6.5, fat_per_base: 16.0, fiber_per_base: 1.8, is_verified: true, search_rank: 78, source_type: 'local', aliases: ['pasta de amendoim', 'amendoim pasta', 'peanut butter'] },
  { canonical_name: 'Castanha do Pará', category: 'fat_oil', serving_base_amount: 30, serving_base_unit: 'g', calories_per_base: 196, protein_per_base: 4.3, carbs_per_base: 3.7, fat_per_base: 19.7, fiber_per_base: 2.1, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['castanha', 'castanha do para', 'castanha-do-pará'] },
  { canonical_name: 'Abacate', category: 'fat_oil', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 160, protein_per_base: 2.0, carbs_per_base: 8.5, fat_per_base: 14.7, fiber_per_base: 6.7, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['abacate', 'avocado'] },
  // Frutas
  { canonical_name: 'Banana prata', category: 'fruit', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 98, protein_per_base: 1.3, carbs_per_base: 26.0, fat_per_base: 0.1, fiber_per_base: 2.0, is_verified: true, search_rank: 88, source_type: 'local', aliases: ['banana', 'banana nanica'] },
  { canonical_name: 'Maçã', category: 'fruit', serving_base_amount: 130, serving_base_unit: 'g', calories_per_base: 68, protein_per_base: 0.4, carbs_per_base: 17.4, fat_per_base: 0.3, fiber_per_base: 2.6, is_verified: true, search_rank: 75, source_type: 'local', aliases: ['maçã', 'maca'] },
  { canonical_name: 'Morango', category: 'fruit', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 32, protein_per_base: 0.7, carbs_per_base: 7.7, fat_per_base: 0.3, fiber_per_base: 2.0, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['morango'] },
  // Vegetais
  { canonical_name: 'Brócolis cozido', category: 'vegetable', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 35, protein_per_base: 2.4, carbs_per_base: 7.2, fat_per_base: 0.4, fiber_per_base: 3.3, is_verified: true, search_rank: 72, source_type: 'local', aliases: ['brócolis', 'brocolis'] },
  { canonical_name: 'Espinafre refogado', category: 'vegetable', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 24, protein_per_base: 2.9, carbs_per_base: 3.5, fat_per_base: 0.3, fiber_per_base: 2.2, is_verified: true, search_rank: 60, source_type: 'local', aliases: ['espinafre'] },
  { canonical_name: 'Tomate', category: 'vegetable', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 18, protein_per_base: 0.9, carbs_per_base: 3.9, fat_per_base: 0.2, fiber_per_base: 1.2, is_verified: true, search_rank: 70, source_type: 'local', aliases: ['tomate'] },
  { canonical_name: 'Cenoura crua', category: 'vegetable', serving_base_amount: 100, serving_base_unit: 'g', calories_per_base: 34, protein_per_base: 0.9, carbs_per_base: 7.7, fat_per_base: 0.2, fiber_per_base: 2.8, is_verified: true, search_rank: 65, source_type: 'local', aliases: ['cenoura'] },
];

function normalize(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();
}

function scoreMatch(food, query) {
  const q = normalize(query);
  const name = normalize(food.canonical_name);
  const aliases = (food.aliases || []).map(normalize);

  if (name === q) return 1000 + (food.search_rank || 0);
  if (name.startsWith(q)) return 800 + (food.search_rank || 0);
  if (name.includes(q)) return 600 + (food.search_rank || 0);
  if (aliases.some(a => a === q)) return 900 + (food.search_rank || 0);
  if (aliases.some(a => a.startsWith(q))) return 700 + (food.search_rank || 0);
  if (aliases.some(a => a.includes(q))) return 500 + (food.search_rank || 0);

  // Word-level partial match
  const words = q.split(/\s+/);
  const matchCount = words.filter(w => name.includes(w) || aliases.some(a => a.includes(w))).length;
  if (matchCount > 0) return (matchCount / words.length) * 400 + (food.search_rank || 0);

  return -1;
}

function formatFood(food) {
  return {
    id: food.id,
    name: food.canonical_name,
    brand: food.brand || null,
    category: food.category,
    serving_amount: food.serving_base_amount,
    serving_unit: food.serving_base_unit,
    kcal: food.calories_per_base,
    protein: food.protein_per_base,
    carbs: food.carbs_per_base,
    fat: food.fat_per_base,
    fiber: food.fiber_per_base || 0,
    sodium: food.sodium_per_base || 0,
    source_type: food.source_type,
    is_verified: food.is_verified || false,
    barcode: food.barcode || null,
  };
}

// Search Open Food Facts (Brazilian locale first)
async function searchOpenFoodFacts(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&lc=pt&page_size=8&fields=id,product_name,brands,nutriments,serving_size,serving_quantity,categories_tags,code`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    const products = (data.products || []).filter(p => 
      p.product_name && 
      p.nutriments?.['energy-kcal_100g'] != null &&
      p.nutriments?.proteins_100g != null
    );
    return products.slice(0, 5).map(p => ({
      source_type: 'openfoodfacts',
      source_id: p.code || p.id,
      canonical_name: p.product_name,
      brand: p.brands?.split(',')[0]?.trim() || null,
      category: 'processed',
      serving_base_amount: 100,
      serving_base_unit: 'g',
      calories_per_base: Math.round(p.nutriments['energy-kcal_100g'] || 0),
      protein_per_base: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
      carbs_per_base: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
      fat_per_base: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
      fiber_per_base: Math.round((p.nutriments.fiber_100g || 0) * 10) / 10,
      sodium_per_base: Math.round((p.nutriments.sodium_100g || 0) * 1000 * 10) / 10,
      barcode: p.code || null,
      is_verified: false,
      search_rank: 20,
      locale: 'pt-BR',
    }));
  } catch (err) {
    console.warn('OpenFoodFacts error:', err.message);
    return [];
  }
}

// LLM fallback — only for macros, never for branding
async function llmSearch(query, base44) {
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Retorne dados nutricionais precisos para o alimento brasileiro "${query}". Baseie-se na tabela TACO ou valores IBGE. Retorne até 3 variações (ex: cru, cozido, assado). Não invente marcas ou produtos industrializados.`,
      response_json_schema: {
        type: 'object',
        properties: {
          foods: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                canonical_name: { type: 'string' },
                category: { type: 'string' },
                serving_base_amount: { type: 'number' },
                serving_base_unit: { type: 'string' },
                calories_per_base: { type: 'number' },
                protein_per_base: { type: 'number' },
                carbs_per_base: { type: 'number' },
                fat_per_base: { type: 'number' },
                fiber_per_base: { type: 'number' },
              }
            }
          }
        }
      }
    });
    return (result?.foods || []).map(f => ({
      ...f,
      source_type: 'llm',
      serving_base_amount: f.serving_base_amount || 100,
      serving_base_unit: f.serving_base_unit || 'g',
      is_verified: false,
      search_rank: 5,
      locale: 'pt-BR',
    }));
  } catch (err) {
    console.warn('LLM search error:', err.message);
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── SEARCH ─────────────────────────────────────────────────────────────────
    if (action === 'search') {
      const { query } = body;
      if (!query || query.length < 2) {
        return Response.json({ results: [] });
      }

      // 1. Search local DB
      const localFoods = await base44.asServiceRole.entities.FoodMaster.list('-search_rank', 500);
      const scored = localFoods
        .map(f => ({ food: f, score: scoreMatch(f, query) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => formatFood(x.food));

      if (scored.length >= 3) {
        return Response.json({ results: scored, source: 'local' });
      }

      // 2. Fallback: Open Food Facts (only if local has < 3 results)
      const offResults = await searchOpenFoodFacts(query);
      const combined = [...scored];
      for (const off of offResults) {
        if (!combined.some(r => normalize(r.name) === normalize(off.canonical_name))) {
          combined.push(formatFood(off));
        }
      }

      if (combined.length >= 1) {
        return Response.json({ results: combined.slice(0, 8), source: combined.length === scored.length ? 'local' : 'mixed' });
      }

      // 3. Last resort: LLM (macros only, no hallucinated brands) — only when zero results
      console.log(`foodSearch: LLM fallback for query="${query}"`);
      const llmResults = await llmSearch(query, base44);
      const finalCombined = [...combined, ...llmResults.map(f => formatFood(f))];

      return Response.json({ results: finalCombined.slice(0, 6), source: 'llm' });
    }

    // ── BARCODE ────────────────────────────────────────────────────────────────
    if (action === 'barcode') {
      const { code } = body;
      if (!code) return Response.json({ result: null });

      // Check local first
      const local = await base44.asServiceRole.entities.FoodMaster.filter({ barcode: code });
      if (local.length > 0) {
        return Response.json({ result: formatFood(local[0]), source: 'local' });
      }

      // Fetch from OpenFoodFacts
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const food = {
            source_type: 'openfoodfacts',
            source_id: code,
            canonical_name: p.product_name || p.product_name_pt || 'Produto desconhecido',
            brand: p.brands?.split(',')[0]?.trim() || null,
            category: 'processed',
            serving_base_amount: 100,
            serving_base_unit: 'g',
            calories_per_base: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
            protein_per_base: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
            carbs_per_base: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
            fat_per_base: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
            fiber_per_base: Math.round((p.nutriments?.fiber_100g || 0) * 10) / 10,
            sodium_per_base: Math.round((p.nutriments?.sodium_100g || 0) * 1000 * 10) / 10,
            barcode: code,
            is_verified: false,
            search_rank: 20,
          };
          return Response.json({ result: formatFood(food), source: 'openfoodfacts', raw: food });
        }
      } catch (err) {
        console.warn('Barcode lookup error:', err.message);
      }

      return Response.json({ result: null });
    }

    // ── IMPORT (save external food to local DB) ────────────────────────────────
    if (action === 'import') {
      const { food } = body;
      if (!food?.canonical_name) return Response.json({ error: 'Invalid food data' }, { status: 400 });

      // Avoid duplicates by source_id
      if (food.source_id) {
        const existing = await base44.asServiceRole.entities.FoodMaster.filter({ source_id: food.source_id });
        if (existing.length > 0) {
          return Response.json({ id: existing[0].id, imported: false });
        }
      }

      const created = await base44.asServiceRole.entities.FoodMaster.create({
        ...food,
        locale: food.locale || 'pt-BR',
        is_verified: false,
        search_rank: food.search_rank || 20,
      });
      console.log(`foodSearch: imported "${food.canonical_name}" from ${food.source_type}`);
      return Response.json({ id: created.id, imported: true });
    }

    // ── GET BY ID ──────────────────────────────────────────────────────────────
    if (action === 'get') {
      const { id } = body;
      const foods = await base44.asServiceRole.entities.FoodMaster.filter({ id });
      if (foods.length === 0) return Response.json({ result: null }, { status: 404 });
      return Response.json({ result: formatFood(foods[0]) });
    }

    // ── SEED (admin: populate initial DB from SEED_FOODS) ─────────────────────
    if (action === 'seed') {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      let count = 0;
      for (const seed of SEED_FOODS) {
        const existing = await base44.asServiceRole.entities.FoodMaster.filter({ canonical_name: seed.canonical_name });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.FoodMaster.create({ ...seed, locale: 'pt-BR' });
          count++;
        }
      }
      return Response.json({ seeded: count, total: SEED_FOODS.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('foodSearch error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});