import React from 'react';
import BlogPostLayout from '@/components/content/BlogPostLayout';

export default function WorkoutLoggingGuide() {
  return (
    <BlogPostLayout
      title="Guia Completo: Logging de Treinos"
      excerpt="Registre treinos com precisão profissional — séries, repetições, peso e RPE. Entenda cada detalhe."
      publishedAt="2026-03-15"
      readingTime={8}
      author="Team Atlas"
      breadcrumb={{ href: '/help', label: 'Help Center' }}
    >
      <h2>Por que Rastrear Treinos?</h2>
      <p>
        Rastrear seus treinos é essencial para:
      </p>
      <ul>
        <li><strong>Progressão</strong> — veja se você está ficando mais forte semana a semana</li>
        <li><strong>Aderência</strong> — mantenha-se consistente com seus planos prescritos</li>
        <li><strong>Análise</strong> — identifique quais exercícios funcionam melhor para você</li>
        <li><strong>Prevenção de Lesões</strong> — veja volumes e RPE para evitar overtraining</li>
      </ul>

      <h2>Anatomia de um Registro de Treino</h2>
      <p>
        Cada exercício tem os seguintes componentes:
      </p>
      
      <h3>1. Nome do Exercício</h3>
      <p>
        Procure no banco de dados de Atlas (supino, leg press, agachamento, etc.). 
        Atlas sugere exercícios baseado em histórico recente e favoritos.
      </p>

      <h3>2. Séries</h3>
      <p>
        Quantas séries você completou. Exemplo: 4 séries de supino.
      </p>

      <h3>3. Repetições</h3>
      <p>
        O número de repetições por série. Você pode registrar:
      </p>
      <ul>
        <li><strong>Exato:</strong> "10 reps" se todas as séries foram 10</li>
        <li><strong>Intervalo:</strong> "8-12 reps" se variou</li>
      </ul>

      <h3>4. Peso</h3>
      <p>
        Em kg ou lbs (você escolhe na configuração). Deixe em branco para exercícios de peso corporal.
      </p>

      <h3>5. RPE (Rate of Perceived Exertion)</h3>
      <p>
        De 1-10, o quanto esforço você percebeu. Isso ajuda a diferenciar treinos de força vs hipertrofia vs cardio.
      </p>
      <ul>
        <li><strong>6-7:</strong> treino leve, muito ainda na reserve</li>
        <li><strong>8-9:</strong> treino moderado a pesado</li>
        <li><strong>9-10:</strong> treino máximo, poucas reps na reserva</li>
      </ul>

      <h2>Passo a Passo: Registrar um Treino Completo</h2>

      <h3>1. Ir para Workouts</h3>
      <p>
        Clique em "Workouts" na sidebar. Você verá um resumo de treinos recentes e uma opção "Novo Treino".
      </p>

      <h3>2. Criar Novo Treino</h3>
      <p>
        Clique em "Novo Treino" ou escolha uma data anterior se estiver registrando retroativamente.
      </p>

      <h3>3. Procurar Exercício</h3>
      <p>
        Comece a digitar o nome do exercício. Atlas sugere:
      </p>
      <ul>
        <li>Exercícios <strong>favoritos</strong> (ao topo)</li>
        <li>Exercícios <strong>recentes</strong></li>
        <li>Resultados de <strong>busca completa</strong></li>
      </ul>
      <p>
        Se o exercício não existir, você pode criar um <strong>exercício customizado</strong>.
      </p>

      <h3>4. Registrar Séries e Reps</h3>
      <p>
        Digite:
      </p>
      <ul>
        <li><strong>Séries:</strong> 4</li>
        <li><strong>Reps:</strong> 8-12 (ou exato, ex: 10)</li>
        <li><strong>Peso:</strong> 100 kg</li>
        <li><strong>RPE:</strong> 8</li>
        <li><strong>Notas (opcional):</strong> "Senti fraco hoje", "Pronto para aumentar peso"</li>
      </ul>

      <h3>5. Adicionar Mais Exercícios</h3>
      <p>
        Clique em "Adicionar Exercício" para continuar sua sessão.
      </p>

      <h3>6. Finalizar e Salvar</h3>
      <p>
        Clique em "Salvar Treino". Atlas calcula:
      </p>
      <ul>
        <li><strong>Volume Total:</strong> séries × reps × peso</li>
        <li><strong>Duração Estimada:</strong> baseado em exercícios</li>
        <li><strong>RPE Médio:</strong> média de todos os exercícios</li>
      </ul>

      <h2>Dicas Profissionais</h2>

      <h3>Use Favoritos</h3>
      <p>
        Clique na estrela para marcar exercícios que você usa frequentemente. Eles aparecem ao topo na próxima vez.
      </p>

      <h3>Registre Progressão</h3>
      <p>
        Aumentar peso, reps ou volume é progressão. Use Atlas para ver tendências de força ao longo de meses.
      </p>

      <h3>Notas São Ouro</h3>
      <p>
        "Senti forte", "Técnica sofrível", "Lesão leve no ombro" — essas notas ajudam você a identificar padrões.
      </p>

      <h3>Compare com Prescrição</h3>
      <p>
        Se seu coach prescreveu um treino, Atlas mostra "Plano vs Execução". Você registrou o que foi prescrito?
      </p>

      <h2>Integração com Check-ins</h2>
      <p>
        Atlas correlaciona seus registros de treino com:
      </p>
      <ul>
        <li>Sono (você dormiu o suficiente?)</li>
        <li>Energia (você estava energizado?)</li>
        <li>Nutrição (comeu o suficiente?)</li>
      </ul>
      <p>
        Com 30+ dias de dados, o Atlas AI pode sugerir "você treina melhor quando dorme 8+ horas".
      </p>

      <blockquote>
        <strong>Lembre-se:</strong> Consistência bate intensidade. Um treino registrado todos os dias é mais valioso 
        que um mega-treino que você esquece. Comece hoje, mantenha o padrão.
      </blockquote>
    </BlogPostLayout>
  );
}