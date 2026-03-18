# Plan vs Execution — Separação Clara

## Overview

Atlas Core agora separa claramente **planos** (criados por coaches/nutricionistas ou IA) de **execução** (treinos/refeições registrados diariamente).

## Pages Structure

### Workouts
- **URL**: `/Workouts`
- **Tabs**:
  - **Plano vs Execução** (default) — Side-by-side comparison
    - Left: `PrescribedWorkout` para hoje (se existe e matches frequency)
    - Right: `Workout` registrado hoje
    - Shows adherence %
  - **Registrado** — All workouts logged for the day
    - Create, edit, delete workouts
    - Manual entry or AI generation
  - **Planejado** — All active prescribed workouts
    - View coach-created plans
    - Frequency, exercises, notes
    - Read-only (managed by coach)

**Entities**:
- `PrescribedWorkout`: coach_email, athlete_email, name, exercises, frequency, active, start_date, end_date
- `Workout`: date, name, exercises, completed, volume_load, perceived_effort, duration_minutes

---

### Nutrition
- **URL**: `/Nutrition`
- **Tabs**:
  - **Meta vs Registrado** (default) — Logged intake vs targets
    - Shows profile targets (calories, macros)
    - Current day's logged meals
    - Prescribed diet (if exists) as reference
    - Adherence %
  - **Registrado** — All meals logged for the day
    - Add, edit, delete meals
    - Food search + quick log
    - AI diet generation
  - **Plano Alimentar** — Prescribed diet details
    - Nutritionist-created plan
    - Meals breakdown by type
    - Macro targets
    - Read-only (managed by nutritionist)

**Entities**:
- `PrescribedDiet`: nutritionist_email, client_email, name, meals[], target_calories, target_protein, target_carbs, target_fat, active, start_date, end_date
- `Meal`: date, meal_type, foods[], total_calories, total_protein, total_carbs, total_fat

---

## Separate Plan Pages (for professionals)

### Coach → Coach Dashboard
- `/coach-dashboard` — Overview of students
- `/coach/students` — Manage student relationships
- `/coach/student/:id` — Student profile + adherence
- `/coach/prescribe-workout/:studentId` — Create PrescribedWorkout

### Nutritionist → Nutritionist Dashboard
- `/nutritionist-dashboard` — Overview of clients
- `/nutritionist/clients` — Manage client relationships
- `/nutritionist/client/:id` — Client profile + adherence
- `/nutritionist/prescribe-diet/:clientId` — Create PrescribedDiet

### Clinician → Clinician Dashboard
- `/clinician-dashboard` — Overview of patients
- `/clinician/patients` — Manage patient relationships
- `/clinician/patient/:id` — Patient profile + lab exams

---

## Components

### `/Workouts` — Components
- **DateNav** — Date picker
- **WorkoutComparison** — Side-by-side planned vs logged (NEW)
  - Shows planned exercises from prescribed workout
  - Shows logged exercises from workout record
  - Shows adherence badge

### `/Nutrition` — Components
- **DateNav** — Date picker
- **DaySummary** — Calorie + macro progress bar (shown in Logged tab)
- **NutritionComparison** (NEW) — Targets vs logged + prescribed diet
  - Shows profile macro targets
  - Shows logged meals macros
  - Shows prescribed diet as reference
  - Shows adherence %
- **MealRow** — Individual meal card
- **FoodSearch** — Search & add food

---

## Data Flow

### Creating a Prescribed Workout
1. Coach visits `/coach/prescribe-workout/:studentId`
2. Fills form: name, exercises, frequency (Mon/Wed/Fri, etc.)
3. Saves to `PrescribedWorkout` with coach_email, athlete_email
4. Athlete sees it in `/Workouts` → "Planejado" tab
5. Athlete executes today's workout → logs to `Workout`
6. Comparison shows plan vs execution

### Creating a Prescribed Diet
1. Nutritionist visits `/nutritionist/prescribe-diet/:clientId`
2. Fills form: name, meals (breakfast/lunch/dinner, etc.), macros
3. Saves to `PrescribedDiet` with nutritionist_email, client_email
4. Client sees it in `/Nutrition` → "Plano Alimentar" tab
5. Client logs meals throughout day → saved to `Meal`
6. Comparison shows targets vs logged

---

## UI Changes

- `/Workouts` and `/Nutrition` now have **3 tabs** at top
- "Plano vs Execução" / "Meta vs Registrado" is **default tab**
- Tabs color-coded: blue for plan info, green for completion
- Side-by-side layout on larger screens
- Empty states for missing plans

---

## Technical Notes

### Query Keys
- `['prescribed-workouts']` — All active workouts for logged-in athlete
- `['prescribed-diets']` — All active diets for logged-in client
- `['workouts', date]` — Logged workouts for specific date
- `['meals', date]` — Logged meals for specific date

### RLS (Row-Level Security)
- PrescribedWorkout: Coach can read/update their own; athlete can read (coach's)
- PrescribedDiet: Nutritionist can read/update their own; client can read (nutritionist's)
- Workout: Only the logged-in user can create/read/update/delete their own
- Meal: Only the logged-in user can create/read/update/delete their own

---

## Files Created/Modified

**New Components**:
- `components/workouts/WorkoutComparison.jsx`
- `components/nutrition/NutritionComparison.jsx`

**Modified Pages**:
- `pages/Workouts.js` — Added tabs + WorkoutComparison
- `pages/Nutrition.js` — Added tabs + NutritionComparison

**Existing Pages** (unchanged, ready for coach/nutritionist/clinician flows):
- `pages/coach/CoachPrescribeWorkout.js`
- `pages/nutritionist/NutritionistPrescribeDiet.js