# Atlas Core — Fase 0 + Fase 1 Roadmap

## 📌 Visão Geral

Este documento detalha a estratégia para corrigir o **core fundacional** (Fase 0) e depois **fortalecer a UX do app** (Fase 1).

**Meta Fase 0**: Fundação sólida — auth, checkout, trial, premium locks, onboarding, plano vs execução.

**Meta Fase 1**: App afiado — routine clarity, workout execution, exercise library, progress/measurements.

---

## 🔧 FASE 0 — CORE FUNDACIONAL

Tudo que quebra confiança ou gera atrito no funnel crítico.

### 0.1 — Auth / Signup / Login ✓ PARECE OK

- [x] Signup funciona
- [x] Login funciona
- [ ] Erro handling visível (email já existe, senha fraca, etc)
- [ ] Forgot password flow
- [ ] Email verification (opcional mas recomendado)
- [ ] Session management (logout limpo, token refresh)

**Status**: Revisar error messages e forgot password.

---

### 0.2 — Onboarding Completo

**Atual**: Existe onboarding, mas pode ser mais guiado.

**Melhorias necessárias**:

- [ ] Step 1: Welcome + value prop
- [ ] Step 2: Goals + basic biometrics
- [ ] Step 3: Training routine + experience
- [ ] Step 4: Tracking interests
- [ ] Step 5: Quick setup (auto-calculate macros, create initial profile)
- [ ] Success screen com CTA para "Go to Dashboard"
- [ ] Permitir skip de steps (mas não pular todos)
- [ ] Auto-redirect para home correta por role (athlete → /Today, coach → /coach-dashboard, etc)

**Spec**:
- Onboarding deve ser **obrigatório na primeira vez**
- Deve salvar profile + criar UserProfile record
- Deve auto-calcular calorie/macro targets
- Deve mostrar celebração no final

---

### 0.3 — Checkout / Stripe Integration

**Atual**: Checkout existe, mas precisa validação de edge cases.

**Checklist**:

- [x] Stripe products criados (Pro, Performance, Coach, Nutrition, Clinical)
- [ ] Checkout session creation function testada
- [ ] 7-day trial auto-aplicando
- [ ] Success redirect funciona
- [ ] Error handling claro (card declined, etc)
- [ ] Metadata com base44_app_id
- [ ] Iframe detection (bloqueia checkout em preview)
- [ ] Email de confirmação via Stripe
- [ ] Webhook para `checkout.session.completed`

**Spec**:
- Usuario sem login → redirect para signup antes de checkout
- Usuario logado → vai direto para Stripe Checkout
- Sucesso → redirect para /Today com banner "Bem-vindo ao Pro!"
- Trial ativo → mostra TrialBanner com dias restantes
- Trial expirado → shows upgrade prompt nas features pro

---

### 0.4 — Email Invites

**Atual**: Function `inviteUser` existe, mas precisa ser exposta no UI.

**Necessário**:

- [ ] Coach pode convidar estudantes por email
- [ ] Nutritionist pode convidar clientes por email
- [ ] Clinician pode convidar pacientes por email
- [ ] Invite link gerado automaticamente
- [ ] Email enviado com link + CTA
- [ ] Recipient vê pending invite ao fazer signup
- [ ] Invite expiração após 30 dias
- [ ] Remetente pode revocar invite

**Spec**:
- Use `base44.users.inviteUser(email, role)` para criar invite
- Use `base44.integrations.Core.SendEmail` para enviar
- Invite link deve ser: `{app_url}/auth?mode=signup&invited_by={coach_email}&role=student`
- Criar entity `Invite` com status (pending, accepted, rejected, expired)

---

### 0.5 — Premium Locks + Entitlements

**Atual**: `useSubscription` existe, checks feitos in components, mas locks não são claros.

**Necessário**:

- [ ] Atlas AI: bloqueado no Free, unlock no Pro+
- [ ] Geração de treino por IA: bloqueado no Free, unlock no Pro+
- [ ] Geração de dieta por IA: bloqueado no Free, unlock no Pro+
- [ ] Exames lab: bloqueado no Free, unlock no Pro+
- [ ] Fotos de progresso: 5 limite no Free, ilimitado no Pro+
- [ ] Histórico: 30 dias no Free, 1 ano no Pro, ilimitado em Performance
- [ ] Analytics avançados: bloqueado no Free, unlock no Pro+
- [ ] Exports PDF/CSV: bloqueado no Free, unlock no Pro+
- [ ] Professional dashboards: só em Coach/Nutrition/Clinical plans

**Spec**:
- Quando feature bloqueada, mostrar `<UpgradeGate>` com mensagem clara
- Exemplo: "Atlas AI — Plano Pro e acima"
- CTA direto para /Pricing
- Não deixar usuário clicar em feature bloqueada, desabilitar button

---

### 0.6 — Trial Management

**Atual**: `activateTrial` function existe, mas precisa validação.

**Checklist**:

- [ ] New free users auto-recebem 7-day trial on Pro
- [ ] Trial expiração calculada corretamente
- [ ] TrialBanner mostra dias restantes
- [ ] Trial expiration → downgrades para Free automaticamente
- [ ] Email lembrando 3 dias antes de expirar
- [ ] Botão clear "Upgrade agora" no banner

**Spec**:
- Trial ativado na primeira vez que user visita /Today
- Trial expiration stored em Subscription record
- Cron job daily que expira trials expirados
- Email via Stripe ou custom function

---

### 0.7 — Plano vs Execução (Separação Clara)

**Atual**: Mix confuso entre "meu plano" e "meu treino de hoje".

**Necessário**:

- [ ] Criar separação visual clara entre:
  - **Prescribed Workouts** → /prescribed-workout (plano criado por coach ou IA)
  - **Today's Execution** → /Workouts (treino de hoje)
  - **Prescribed Diet** → /prescribed-diet (plano criado por nutricionista ou IA)
  - **Today's Nutrition** → /Nutrition (refeições de hoje)

- [ ] /Workouts page deve mostrar:
  - "Planned" tab (exercícios planejados para hoje)
  - "Logged" tab (exercícios executados)
  - Side-by-side comparison: plano vs execução

- [ ] /Nutrition page deve mostrar:
  - Target macros (do profile)
  - Prescribed diet (se houver)
  - Logged meals (de hoje)
  - Adherence %

**Spec**:
- `Workout` entity: `date`, `exercises`, `completed_at`
- `PrescribedWorkout` entity: `coach_id`, `athlete_id`, `exercises`, `frequency`
- `Meal` entity: `date`, `foods`, `meal_type`
- `PrescribedDiet` entity: `nutritionist_id`, `athlete_id`, `days`, `meals`

---

### 0.8 — Atlas AI no Lugar Certo

**Atual**: Atlas AI é home screen hero, deveria estar integrado no app.

**Necessário**:

- [ ] Remove Atlas AI como feature independente
- [ ] Integrar AI insights em:
  - **Today** → "AI Insight" card com recomendação contextual
  - **Workouts** → "AI Suggestion" para próximo exercício
  - **Nutrition** → "AI Meal Suggestion" para refeição seguinte
  - **Progress** → "AI Analysis" dos trends
  - **Measurements** → "AI Projection" para goal

- [ ] Page `/AtlasAI` → mantem como **chat contextual** (conversa com seus dados)

**Spec**:
- AI insights devem usar contexto real (seus treinos, suas refeições, suas medidas)
- Integrar `base44.integrations.Core.InvokeLLM` com dados do usuário
- Cache resultados para não spam API
- Show loading state enquanto processa

---

## ✨ FASE 1 — APP UX IMPROVEMENTS

Tudo que torna o app afiado, claro, confiável e retentor.

### 1.1 — Routine / Plan Structure Clarity

**Atual**: Plano de treino existe, mas é pouco visual.

**Necessário**:

- [ ] Criar `Routine` entity (coleção de workouts)
  - Nome
  - Dias da semana que roda
  - Duração estimada
  - Descrição
  - Exercícios (array)

- [ ] Página `/routines` que mostra:
  - Rotinas disponíveis (criadas por user ou coach)
  - Rutina ativa (em andamento)
  - Opção de criar nova
  - Opção de clonar existente

- [ ] Cada rotina mostra:
  - Dias da semana visual
  - Total de exercícios
  - Duração estimada
  - Último completado
  - CTA para "Start Today's Workout"

**Spec**:
- Criar `Routine` entity com schema claro
- UI: cards bonitos, ícones dos dias, visual clara
- Hoje: rever estrutura de plano atual

---

### 1.2 — Workout Execution Redesign

**Atual**: Workout logging é funcional mas pouco clara.

**Necessário**:

- [ ] Recriar `/Workouts` page com:
  - **Mode 1: Planning** → ver plano, adjustar se necessário
  - **Mode 2: Execution** → logging em tempo real, super claro

- [ ] Execution screen mostra:
  - Exercício atual (foto, nome, muscles)
  - Série x Reps target
  - Série 1/4 input fields (weight, reps, RIR)
  - Buttons: "Set Complete" → proxímo set
  - Rest timer com áudio
  - "Exercise Complete" → próximo exercício
  - No final: "Workout Complete" com summary

- [ ] Exercise detail inline:
  - Imagem/GIF do exercício
  - Form cues curtos
  - Muscles targets
  - Progression options

**Spec**:
- Execution deve ser **one exercise at a time**, super focado
- Rest timer vibra/som ao terminar
- Salva cada set imediatamente
- Permite voltar/corrigir
- No final mostra: total volume, duration, intensity

---

### 1.3 — Exercise Library + Detail Pages

**Atual**: Exercícios existem em ExerciseMaster, mas UX fraca.

**Necessário**:

- [ ] Criar `/exercises` page com:
  - Search/filter por músculo
  - Filter por movimento pattern
  - Filter por equipment
  - Favoritos
  - Recently used

- [ ] Cada exercício mostra:
  - Nome
  - Ícone/emoji do músculo
  - Primary + secondary muscles
  - Dificuldade
  - Equipment
  - Aliases (nomes alternativos)

- [ ] Exercise detail page `/exercise/:id` mostra:
  - Imagem/GIF grande
  - Instruções passo a passo
  - Form cues (principais erros)
  - Progressões (variações)
  - Músculos envolvidos (visual)
  - Seu histórico (personal record, last used)
  - Sugestões de substitutos
  - "Add to Routine" button

**Spec**:
- Usar ExerciseMaster data + ExerciseLog (user history)
- Search: buscar por nome + aliases
- UI: cards visuais, colunas responsivas
- Detail: imagem grande, instruções claras, histórico pessoal

---

### 1.4 — Progress / Measurements Presentation

**Atual**: Measurements existem, mas visualização fraca.

**Necessário**:

- [ ] Criar `/progress` page (ou `/measurements` mais forte) com:
  - **Weight** trend chart (últimos 3 meses)
  - **Body Fat %** trend
  - **Measurements** (cintura, peito, coxa, etc) em gráficos individuais
  - **Photos** timeline (antes/depois visual)
  - **Workout Volume** trend (total weight per month)
  - **Adherence** trend (% dias completados)

- [ ] Cada card mostra:
  - Current value
  - Change (last week/month)
  - Trend arrow (up/down/stable)
  - Goal indicator (quanto falta)
  - Chart (últimas 8 semanas)

- [ ] Photos timeline:
  - Upload nova foto
  - Timeline visual (cards pequenos)
  - Side-by-side comparison (antes/depois)
  - Histórico completo

**Spec**:
- Use `recharts` para charts
- Dados: Measurement + ProgressPhoto entities
- Trends: calcular média móvel (7 dias)
- Goal: mostrar distance to goal em %
- Charts: ultimas 8-12 semanas

---

### 1.5 — Measurements Entry + History

**Atual**: Measurements existem, mas entry pouco guiada.

**Necessário**:

- [ ] Criar modal/form clara para "Log Measurements":
  - Data
  - Weight
  - Body fat %
  - Waist, chest, arms, thighs, hips, neck (opcional)
  - Buttons: Save, Cancel

- [ ] Mostrar histórico em tabela:
  - Data
  - Weight (delta vs anterior)
  - Body fat (delta)
  - Medidas (table format)
  - Edit/delete options

- [ ] Auto-calculate insights:
  - "Perdeu 2kg este mês"
  - "Body fat caiu 0.5%"
  - "Circunferência da cintura -3cm"
  - "Projeção: -5kg em 8 semanas se manter ritmo"

**Spec**:
- Form integrado em `/Measurements` page
- History em tabela ou timeline
- Edit: permitir corrigir uma medida
- Insights: usar simples math (delta, rate, projection)

---

### 1.6 — Daily Checkin (Integrado melhor)

**Atual**: Checkin existe, é no Today page.

**Melhorias**:

- [ ] Fazer checkin **obrigatório diário** (ou ao menos prompt forte)
- [ ] Mostar streak (dias consecutivos)
- [ ] Mostrar histórico (últimos 7 dias)
- [ ] Dados: mood, energy, sleep, hydration, notes
- [ ] Analytics: correlação entre checkin + aderência

**Spec**:
- DailyCheckin entity ja existe
- Adicionar `streak_days` calculado
- Mostrar "7-day checkin history" em cards
- Integrar em Insights (AI analysis dos dados)

---

### 1.7 — Coach View of Athlete Progress

**Atual**: Coach dashboard básico, mas comparação pouca.

**Necessário** (será Fase 3, mas começar prep):

- [ ] Coach vê cada aluno com:
  - Adherence % (plano vs executado)
  - Progress (peso, volume, medidas)
  - Últimas medidas (fotos, métricas)
  - Checkin histórico (sleep, energy, etc)
  - Workout compliance (plano x executado)
  - Ability para enviar message/notes

- [ ] Comparação visual: plano vs real
  - Plano: 4x exercício A, 3x exercício B
  - Real: 3x exercício A, 3x exercício B, 1x exercício C
  - Delta visível

**Spec**:
- This is Fase 3, but start preparing data structure now

---

## 📊 PRIORIDADE & SEQUÊNCIA

### Fase 0 (CRÍTICO — semanas 1-2)

1. **0.2 Onboarding** → completo, salva profile
2. **0.3 Checkout** → validado end-to-end
3. **0.4 Email Invites** → coaches conseguem convidar
4. **0.5 Premium Locks** → features trancadas visíveis
5. **0.6 Trial** → funciona, countdown claro
6. **0.7 Plano vs Execução** → separação clara
7. **0.8 Atlas AI** → integrado, não home hero

### Fase 1 (CORE UX — semanas 3-4)

1. **1.1 Routine Structure** → planos claros
2. **1.2 Workout Execution** → logging super focado
3. **1.3 Exercise Library** → search + detail claro
4. **1.4 Progress Measurements** → visualização forte
5. **1.5 Measurements Entry** → forms guiados
6. **1.6 Daily Checkin** → melhor integrado
7. **1.7 Coach View** → prep (Fase 3)

---

## 🎯 MILESTONES

- **End of Fase 0**: App fundação sólida, checkout funciona, trial/locks claros
- **End of Fase 1**: App afiado, UX clara, logging simples, progress visível
- **Post Fase 1**: Pronto para landing madura + Coach produto (Fase 2-3)

---

## 📝 NEXT STEP

Qual desses items você quer que eu comece a build agora?

Ou prefere que eu organize isso em **tickets/cards** separadas para você ir executando?