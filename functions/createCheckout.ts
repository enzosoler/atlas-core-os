import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Mapeamento canônico: planCode -> Stripe price ID (BRL, mensal)
const PRICE_MAP = {
  athlete_pro:         'price_1TBonPRieY0K8YEguhFtOLGB', // R$29/mês
  athlete_performance: 'price_1TBonPRieY0K8YEgJb2sbJ2e', // R$59/mês
  coach:               'price_1TBonPRieY0K8YEg6A2FWB50', // R$99/mês
  nutritionist:        'price_1TBonPRieY0K8YEgZSEcQ7n0', // R$79/mês
  clinician:           'price_1TBonPRieY0K8YEgR4CNK6VA', // R$129/mês
};

const VALID_PLANS = Object.keys(PRICE_MAP);

Deno.serve(async (req) => {
  try {
    const { plan, success_url, cancel_url, email } = await req.json();

    if (!plan || !VALID_PLANS.includes(plan)) {
      console.error(`createCheckout: plano inválido recebido: "${plan}". Planos válidos: ${VALID_PLANS.join(', ')}`);
      return Response.json({ error: `Plano inválido: "${plan}". Planos disponíveis: ${VALID_PLANS.join(', ')}` }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan];
    const origin = req.headers.get('origin') || 'https://app.atlascore.com';

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${origin}/Today?subscribed=1`,
      cancel_url: cancel_url || `${origin}/Pricing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plan,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          plan,
        },
      },
      allow_promotion_codes: true,
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log(`createCheckout: session=${session.id} plan=${plan} email=${email || 'anon'}`);

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});