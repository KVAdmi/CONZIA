import Stripe from "stripe";
import { update } from "../supabase/client";

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

/**
 * Manejar webhooks de Stripe
 */
export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<{ success: boolean; message: string }> {
  try {
    const webhookSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    // Verificar firma del webhook
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true, message: "Webhook processed" };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Manejar checkout completado
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId) {
    console.error("No user ID in checkout session");
    return;
  }

  // TODO: Actualizar perfil del usuario en Supabase
  console.log("Checkout completed:", { userId, planId, sessionId: session.id });
  
  // Aquí se debe actualizar el perfil del usuario con:
  // - subscription_status: "active"
  // - subscription_plan: planId
  // - subscription_id: session.subscription
  // - stripe_customer_id: session.customer
}

/**
 * Manejar suscripción creada
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("No user ID in subscription");
    return;
  }

  console.log("Subscription created:", { userId, subscriptionId: subscription.id });
  
  // TODO: Actualizar perfil del usuario
}

/**
 * Manejar suscripción actualizada
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("No user ID in subscription");
    return;
  }

  console.log("Subscription updated:", { userId, subscriptionId: subscription.id, status: subscription.status });
  
  // TODO: Actualizar perfil del usuario con nuevo estado
}

/**
 * Manejar suscripción cancelada
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("No user ID in subscription");
    return;
  }

  console.log("Subscription deleted:", { userId, subscriptionId: subscription.id });
  
  // TODO: Actualizar perfil del usuario:
  // - subscription_status: "canceled"
  // - subscription_end_date: subscription.canceled_at
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = (invoice.metadata as any)?.user_id;

  if (!userId) {
    console.error("No user ID in invoice");
    return;
  }

  console.log("Payment succeeded:", { userId, invoiceId: invoice.id, amount: invoice.amount_paid });
  
  // TODO: Registrar pago en tabla de transacciones
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = (invoice.metadata as any)?.user_id;

  if (!userId) {
    console.error("No user ID in invoice");
    return;
  }

  console.log("Payment failed:", { userId, invoiceId: invoice.id });
  
  // TODO: Enviar alerta al usuario y al equipo
  // TODO: Actualizar estado de suscripción si es necesario
}
