import Stripe from 'stripe';
import { 
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted 
} from './stripeService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(
  body: string | Buffer,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return { received: false, error: err.message };
  }
  
  console.log(`[Stripe Webhook] Received event: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Payment succeeded for invoice ${invoice.id}`);
        // Aquí puedes enviar email de confirmación
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Payment failed for invoice ${invoice.id}`);
        // Aquí puedes enviar email de alerta
        break;
      }
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    
    return { received: true };
    
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error handling event ${event.type}:`, error);
    return { received: false, error: error.message };
  }
}

// Función para crear endpoint en Express/Fastify
export function createWebhookEndpoint(app: any) {
  app.post('/api/webhooks/stripe', async (req: any, res: any) => {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }
    
    const result = await handleStripeWebhook(req.body, signature);
    
    if (result.received) {
      res.json({ received: true });
    } else {
      res.status(400).send(`Webhook Error: ${result.error}`);
    }
  });
  
  console.log('[Stripe] Webhook endpoint created at /api/webhooks/stripe');
}
