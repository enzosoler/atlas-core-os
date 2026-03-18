import React from 'react';
import BlogPostLayout from '@/components/content/BlogPostLayout';

export default function GettingStartedGuide() {
  return (
    <BlogPostLayout
      title="Primeiros Passos com Atlas Core"
      excerpt="Um guia completo para começar — criar conta, completar onboarding e dominar o dashboard em 5 minutos."
      publishedAt="2026-03-17"
      readingTime={5}
      author="Team Atlas"
      breadcrumb={{ href: '/help', label: 'Help Center' }}
    >
      <h2>Bem-vindo ao Atlas Core</h2>
      <p>
        Atlas Core é sua plataforma unificada para rastreamento de treino, nutrição e saúde. 
        Quer você seja atleta, coach, nutricionista ou clínico, Atlas oferece ferramentas profissionais 
        para acompanhar progresso com precisão.
      </p>

      <h2>Passo 1: Criar sua Conta</h2>
      <p>
        Acesse <strong>atlascore.com</strong> e clique em "Começar Grátis". Você pode se registrar com email, 
        Google ou Apple. Não é necessário cartão de crédito para começar.
      </p>
      <p>
        Após confirmar seu email, você será levado ao onboarding.
      </p>

      <h2>Passo 2: Completar Onboarding</h2>
      <p>
        O onboarding é um tour rápido de 2-3 minutos que cobre:
      </p>
      <ul>
        <li><strong>Seu Perfil</strong> — idade, altura, peso, objetivos de saúde</li>
        <li><strong>Seu Plano</strong> — calorias diárias, macros (proteína, carboidratos, gordura)</li>
        <li><strong>Seu Tipo</strong> — atleta, coach, nutricionista ou clínico</li>
      </ul>
      <p>
        Você pode pular qualquer uma dessas etapas e voltar depois — não há pressa.
      </p>

      <h2>Passo 3: Entender o Dashboard (Today)</h2>
      <p>
        Depois de completar o onboarding, você chegará ao seu dashboard "Today". Este é o coração de Atlas Core.
      </p>

      <h3>Check-in Diário</h3>
      <p>
        Na parte superior, complete seu <strong>check-in diário</strong>. Conte-nos:
      </p>
      <ul>
        <li>Como foi seu humor (1-5)</li>
        <li>Seu nível de energia (1-5)</li>
        <li>Horas de sono</li>
        <li>Litros de água que você bebeu</li>
      </ul>
      <p>
        Esses dados alimentam as análises do Atlas AI — quanto mais você registrar, melhores as insights.
      </p>

      <h3>Nutritional Snapshot</h3>
      <p>
        Veja suas calorias de hoje vs sua meta. Clique para registrar refeições.
      </p>

      <h3>Workout Summary</h3>
      <p>
        Veja seu treino de hoje. Clique para registrar exercícios.
      </p>

      <h2>Passo 4: Registrar sua Primeira Refeição</h2>
      <p>
        Acesse a seção <strong>Nutrition</strong> e clique em "Adicionar Refeição".
      </p>
      <ol>
        <li>Selecione a refeição (café, almoço, lanche, jantar)</li>
        <li>Procure por alimentos — Atlas tem um banco de dados com milhares de itens</li>
        <li>Defina a quantidade (100g, 1 xícara, 1 unidade)</li>
        <li>Salve — Atlas calcula calorias e macros automaticamente</li>
      </ol>

      <h2>Passo 5: Registrar seu Primeiro Treino</h2>
      <p>
        Acesse <strong>Workouts</strong> e clique em "Novo Treino".
      </p>
      <ol>
        <li>Escolha a data do treino</li>
        <li>Procure por exercício (ex: "supino" ou "leg press")</li>
        <li>Registre séries, repetições e peso</li>
        <li>Continue adicionando exercícios até terminar sua sessão</li>
        <li>Salve — Atlas calcula volume total, tempo e RPE</li>
      </ol>

      <h2>Próximos Passos</h2>
      <p>
        Parabéns! Você completou o essencial. Agora:
      </p>
      <ul>
        <li>Leia nossos <strong>Guides</strong> para aprender recursos avançados</li>
        <li>Convide um <strong>Coach ou Nutricionista</strong> para prescrições customizadas</li>
        <li>Explore o <strong>Atlas AI</strong> para análises e recomendações</li>
        <li>Exporte seus dados em <strong>PDF/CSV</strong> sempre que necessário</li>
      </ul>

      <blockquote>
        <strong>Dica:</strong> Rastreamento consistente é a chave. Mesmo que você não visse resultados imediatos, 
        dados de 30-60 dias revelam padrões reais. Comece hoje.
      </blockquote>
    </BlogPostLayout>
  );
}