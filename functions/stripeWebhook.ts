import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Plan code mapping: Stripe price ID -> plan_code for Subscription entity
const PLAN_CODE_MAP = {
  'price_1TBonPRieY0K8YEguhFtOLGB': 'pro',           // Pro
  'price_1TBonPRieY0K8YEgJb2sbJ2e': 'performance',   // Performance
  'price_1TBonPRieY0K8YEg6A2FWB50': 'coach',         // Coach
  'price_1TBonPRieY0K8YEgZSEcQ7n0': 'nutritionist',  // Nutritionist
  'price_1TBonPRieY0K8YEgR4CNK6VA': 'clinician',     // Clinician
};

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get signature from headers
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      console.error('stripeWebhook: Missing stripe-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('stripeWebhook: Signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`stripeWebhook: Received event type=${event.type} id=${event.id}`);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`stripeWebhook: Processing checkout.session.completed session_id=${session.id}`);

      const base44 = createClientFromRequest(req);

      // Extract plan code from line items
      const items = await stripe.checkout.sessions.listLineItems(session.id);
      const item = items.data[0];
      
      if (!item || !item.price) {
        console.error(`stripeWebhook: No line item found in session ${session.id}`);
        return Response.json({ error: 'No line item' }, { status: 400 });
      }

      const priceId = item.price.id;
      const planCode = PLAN_CODE_MAP[priceId];
      
      if (!planCode) {
        console.error(`stripeWebhook: Unknown price ID ${priceId}`);
        return Response.json({ error: 'Unknown price' }, { status: 400 });
      }

      // Get customer email
      const customerEmail = session.customer_email;
      if (!customerEmail) {
        console.error(`stripeWebhook: No customer email in session ${session.id}`);
        return Response.json({ error: 'No customer email' }, { status: 400 });
      }

      // Get subscription object
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const stripeCustomerId = subscription.customer;
      const stripeSubscriptionId = subscription.id;

      console.log(`stripeWebhook: Creating subscription for email=${customerEmail} plan=${planCode} stripe_sub=${stripeSubscriptionId}`);

      // Create or update Subscription record
      try {
        const existing = await base44.asServiceRole.entities.Subscription.filter({
          user_email: customerEmail,
        });

        if (existing && existing.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
            plan_code: planCode,
            status: 'active',
            source: 'stripe',
            started_at: new Date().toISOString().split('T')[0],
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
          });
          console.log(`stripeWebhook: Updated subscription for ${customerEmail}`);
        } else {
          // Create new
          await base44.asServiceRole.entities.Subscription.create({
            user_email: customerEmail,
            plan_code: planCode,
            status: 'active',
            source: 'stripe',
            started_at: new Date().toISOString().split('T')[0],
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
          });
          console.log(`stripeWebhook: Created subscription for ${customerEmail}`);
        }
      } catch (dbErr) {
        console.error(`stripeWebhook: Database error for ${customerEmail}:`, dbErr.message);
        // Don't fail webhook on DB error - return 200 so Stripe doesn't retry
      }
    }

    // Handle customer.subscription.updated (e.g., cancelled)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      console.log(`stripeWebhook: Processing customer.subscription.updated sub_id=${subscription.id} status=${subscription.status}`);

      const base44 = createClientFromRequest(req);

      // Map Stripe status to our status
      const statusMap = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        incomplete: 'past_due',
      };

      const ourStatus = statusMap[subscription.status] || subscription.status;

      try {
        const existing = await base44.asServiceRole.entities.Subscription.filter({
          stripe_subscription_id: subscription.id,
        });

        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
            status: ourStatus,
          });
          console.log(`stripeWebhook: Updated subscription status to ${ourStatus}`);
        }
      } catch (dbErr) {
        console.error(`stripeWebhook: Database error updating ${subscription.id}:`, dbErr.message);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook: Unexpected error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});