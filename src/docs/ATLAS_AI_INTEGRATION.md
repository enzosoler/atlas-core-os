# Atlas AI — Distributed Integration

## Overview

Atlas AI is no longer a standalone feature page. Instead, contextual AI insights are distributed throughout the app:

- **Today** — Daily recommendation (motivation + actionable insight)
- **Workouts** — Next exercise suggestion (what to do next)
- **Nutrition** — Next meal suggestion (what to eat to hit macros)
- **Progress** — Trend analysis (pace, trajectory, goal projection)
- **Measurements** — Goal projection (when will you hit your target)
- **AtlasAI** (page) — Full chat interface (converse with your data)

---

## Components Created

### 1. AITodayInsight
**Location**: `components/ai/AITodayInsight.jsx`
**Shows on**: `/Today` page (default section)
**Features**:
- Analyzes: meals logged, workout completion, check-in mood/energy, profile goals
- Generates: 1-2 line contextual recommendation for TODAY
- Auto-triggers on page load (if subscribed to atlas_ai)
- Cached (doesn't regenerate on re-render)

### 2. AIWorkoutSuggestion
**Location**: `components/ai/AIWorkoutSuggestion.jsx`
**Shows on**: `/Workouts` page — "Registrado" tab
**Features**:
- Analyzes: exercises already done, training goal
- Generates: "Next exercise" with 1 line instruction (sets, reps, focus)
- Button-triggered (not auto)
- Useful during active workout

### 3. AIMealSuggestion
**Location**: `components/ai/AIMealSuggestion.jsx`
**Shows on**: `/Nutrition` page — "Registrado" tab
**Features**:
- Analyzes: meals logged, remaining macros, goals
- Generates: "Next meal" with simple ingredients + cal estimate
- Button-triggered (not auto)
- Useful for meal planning throughout day

### 4. AIProgressAnalysis
**Location**: `components/ai/AIProgressAnalysis.jsx`
**Shows on**: `/Progress` page (above metrics)
**Features**:
- Analyzes: weight/body fat trends over 4-12 weeks
- Generates: pace assessment + trajectory + actionable tip
- Button-triggered (requires 2+ measurements)
- Shows "moving right direction", "pacing good", etc.

### 5. AIMeasurementProjection
**Location**: `components/ai/AIMeasurementProjection.jsx`
**Shows on**: `/Measurements` page (before chart)
**Features**:
- Analyzes: current weight, target, weekly rate of change
- Generates: "In ~X weeks" or "already achieved!" + motivation
- Button-triggered (requires 3+ measurements + set target)
- Goal-focused projection

---

## Integration Details

### API Calls
All components use `base44.integrations.Core.InvokeLLM` with:
- `model: 'gemini_3_flash'` (fast, cheap, good quality)
- Short prompts (under 200 tokens)
- Structured responses (1-3 lines max)

### Entitlement Check
All components check `can('atlas_ai')` before rendering:
- Free users: components don't show
- Pro+ users: components show + work

### Performance
- **Auto-triggered**: Only AITodayInsight (on page load)
- **Button-triggered**: All others (user clicks "Sugerir...", "Analisar...", etc.)
- **No caching yet** — each generation is fresh (can add localStorage later if needed)

---

## Data Passed to AI

### Today Insight
```
- meals logged count
- workout completed (true/false)
- checkin: mood (1-5), energy (1-5)
- profile: calories_target, training_goal
```

### Workout Suggestion
```
- exercises already done (names)
- profile.training_goal
```

### Meal Suggestion
```
- meals already logged (types: breakfast, lunch, etc.)
- remaining macros: calories, protein, carbs, fat
- profile.training_goal
```

### Progress Analysis
```
- weight change: old → new (kg)
- body fat change: old → new (%)
- days tracked
- profile: target_weight, body_fat_goal, training_goal
```

### Measurement Projection
```
- current weight (kg)
- target weight (kg)
- weekly rate of change (estimated from history)
- measurements count
```

---

## `/AtlasAI` Page (Unchanged)

The full Atlas AI chat page remains at `/AtlasAI`:
- Real-time conversation with your data
- No character limits
- Create/load/persist conversations
- Access from top menu or Today page link

---

## User Experience Flow

### Athlete Flow
1. Opens `/Today` → sees AI insight for the day ("Complete your 3 meals today to hit protein goal")
2. Opens `/Workouts` → logs exercises → clicks "Sugerir exercício" → gets next move
3. Opens `/Nutrition` → logs meals → clicks "Sugerir refeição" → gets meal idea
4. Opens `/Progress` → clicks "Analisar trends" → gets assessment
5. Opens `/Measurements` → clicks "Gerar projeção" → sees goal timeline
6. Opens `/AtlasAI` → deep chat with data

### Coach/Nutritionist Flow
- These pages work for professionals too (shows insights on client's data if coaching)
- Can be used for client progress review
- Insights help with recommendations

---

## Files Modified

- `pages/Today.js` — Added AITodayInsight + improved AI link
- `pages/Workouts.js` — Added AIWorkoutSuggestion in "Registrado" tab
- `pages/Nutrition.js` — Added AIMealSuggestion in "Registrado" tab
- `pages/Progress.js` — Added AIProgressAnalysis before metrics
- `pages/Measurements.js` — Added AIMeasurementProjection before chart

---

## Future Enhancements

- Cache results in localStorage (24h TTL)
- Detect when user opens a new page without logging (skip AI to save credits)
- Add "view analysis" button to see full AI response in modal
- Aggregate insights for weekly/monthly reports
- AI integration with coach/nutritionist dashboards

---

## Testing

### Quick Test
1. Create trial user with Pro plan
2. Log data: meal, workout, measurement, checkin
3. Visit `/Today` → should show insight auto
4. Visit `/Workouts` → click "Sugerir exercício" → should generate
5. Visit `/Nutrition` → click "Sugerir refeição" → should generate
6. Visit `/Progress` → click "Analisar trends" → should generate
7. Visit `/Measurements` → click "Gerar projeção" → should generate
8. Visit `/AtlasAI` → should load chat interface

### Debug
- Check browser console for errors
- Check Network tab for `InvokeLLM` API calls
- Verify `can('atlas_ai')` returns true
- Check that components don't render if not subscribed