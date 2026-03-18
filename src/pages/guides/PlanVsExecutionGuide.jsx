import React from 'react';
import BlogPostLayout from '@/components/content/BlogPostLayout';

export default function PlanVsExecutionGuide() {
  return (
    <BlogPostLayout
      title="Plano vs Execução: Aderência em Profundidade"
      excerpt="Entenda a diferença entre o que você planejou e o que realmente fez — e por que isso importa."
      publishedAt="2026-03-14"
      readingTime={7}
      author="Team Atlas"
      breadcrumb={{ href: '/help', label: 'Help Center' }}
    >
      <h2>O Conceito: Plano vs Execução</h2>
      <p>
        <strong>Plano</strong> é o que seu coach ou você mesmo prescreveu — exercícios, séries, reps, calorias.
      </p>
      <p>
        <strong>Execução</strong> é o que você realmente fez no mundo real.
      </p>
      <p>
        A diferença entre os dois é <strong>aderência</strong> — e é uma das métricas mais importantes de sucesso.
      </p>

      <h2>Por que Plano vs Execução Importa?</h2>
      <ul>
        <li><strong>Para Coaches:</strong> Veja se seus alunos estão fazendo o que prescreveu</li>
        <li><strong>Para Nutricionistas:</strong> Entenda lacunas entre a dieta planejada e o que foi comido</li>
        <li><strong>Para Atletas:</strong> Identifique por que certos planos funcionam — ou não</li>
        <li><strong>Para Clínicos:</strong> Valide compliance com protocolos prescritos</li>
      </ul>

      <h2>Exemplos Reais</h2>

      <h3>Treino: Plano vs Execução</h3>
      <p>
        <strong>Plano prescrito pelo coach:</strong>
      </p>
      <ul>
        <li>4x Supino 8-10 reps @ 100kg</li>
        <li>3x Rosca direta 10-12 reps @ 30kg</li>
        <li>3x Tríceps corda 12-15 reps</li>
        <li>Duração esperada: 45 min, RPE 8</li>
      </ul>

      <p>
        <strong>O que o atleta realmente fez:</strong>
      </p>
      <ul>
        <li>3x Supino 8 reps @ 100kg (parou 1 série cedo)</li>
        <li>3x Rosca direta 10 reps @ 30kg ✓</li>
        <li>3x Tríceps corda 12 reps ✓</li>
        <li>Duração real: 35 min, RPE 7</li>
      </ul>

      <p>
        <strong>Análise:</strong> Aderência 85% — 1 série de supino a menos. Possível causa: cansaço, recuperação inadequada, ou pressão de tempo.
      </p>

      <h3>Nutrição: Plano vs Execução</h3>
      <p>
        <strong>Plano prescrito por nutricionista:</strong>
      </p>
      <ul>
        <li>Café: 500 kcal, 25g proteína</li>
        <li>Almoço: 800 kcal, 40g proteína</li>
        <li>Lanche: 300 kcal, 15g proteína</li>
        <li>Jantar: 700 kcal, 40g proteína</li>
        <li><strong>Total:</strong> 2300 kcal, 120g proteína</li>
      </ul>

      <p>
        <strong>O que o cliente realmente comeu:</strong>
      </p>
      <ul>
        <li>Café: 650 kcal, 20g proteína (comeu mais carboidrato)</li>
        <li>Almoço: 750 kcal, 38g proteína ✓</li>
        <li>Lanche: pulou (0 kcal)</li>
        <li>Jantar: 900 kcal, 45g proteína</li>
        <li><strong>Total:</strong> 2300 kcal, 103g proteína</li>
      </ul>

      <p>
        <strong>Análise:</strong> Calorias OK, mas proteína 13% abaixo. Padrão: pulou lanche, compensou no jantar. 
        Nutricionista pode ajustar cronograma para melhor adesão.
      </p>

      <h2>Como Atlas Calcula Aderência</h2>

      <h3>Para Treinos</h3>
      <p>
        Atlas compara:
      </p>
      <ul>
        <li><strong>Exercícios:</strong> o exercício foi feito?</li>
        <li><strong>Volume:</strong> séries × reps × peso</li>
        <li><strong>RPE:</strong> intensidade percebida</li>
      </ul>
      <p>
        Aderência = exercícios planejados completados / exercícios totais.
      </p>

      <h3>Para Nutrição</h3>
      <p>
        Atlas compara:
      </p>
      <ul>
        <li><strong>Calorias:</strong> consumidas vs meta</li>
        <li><strong>Proteína:</strong> consumida vs alvo</li>
        <li><strong>Carboidratos e Gordura:</strong> vs metas</li>
      </ul>
      <p>
        Aderência = média de aderência de macros.
      </p>

      <h2>Interpretar Seus Dados</h2>

      <h3>Aderência 90-100%</h3>
      <p>
        <strong>Excelente.</strong> Você está comprometido com seu plano. Continue assim.
      </p>

      <h3>Aderência 70-90%</h3>
      <p>
        <strong>Bom.</strong> Pequenas variações são normais. Identifique os lacunas — é falta de tempo? Motivação? Disponibilidade de comida?
      </p>

      <h3>Aderência &lt; 70%</h3>
      <p>
        <strong>Reconsidere.</strong> O plano pode não ser realista para sua vida. Converse com seu coach/nutricionista para ajustar.
      </p>

      <h2>Ação: Como Melhorar Aderência</h2>

      <h3>1. Entenda Por Quê Você Falhou</h3>
      <p>
        Use notas em cada exercício/refeição: "Sem tempo", "Sem ingredientes", "Sem motivação", "Lesionado".
      </p>

      <h3>2. Ajuste o Plano</h3>
      <p>
        Se você sempre pula o mesmo exercício ou refeição, talvez não seja realista. Trabalhe com seu coach para simplificar.
      </p>

      <h3>3. Acompanhe Padrões</h3>
      <p>
        "Eu sempre falho na segunda-feira" ou "Quando durmo pouco, não consigo treinar bem". Use dados para identificar.
      </p>

      <h3>4. Celebre Aderência</h3>
      <p>
        Aderência 80% por 30 dias é extraordinário. Você merece reconhecimento.
      </p>

      <blockquote>
        <strong>Verdade Incômoda:</strong> Um plano perfeito que você falha em seguir é pior que um plano 70% perfeito que você segue consistentemente. 
        Aderência bate perfeição.
      </blockquote>
    </BlogPostLayout>
  );
}