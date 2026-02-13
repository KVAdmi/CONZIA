import Stripe from "stripe";

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  stripe_price_id: string;
}

// Definición de planes
export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: 0,
    currency: "MXN",
    interval: "month",
    features: [
      "7 días de acceso",
      "Desahogo ilimitado",
      "3 interpretaciones de sueños",
      "Acceso a consultorio",
      "Dashboard básico",
    ],
    stripe_price_id: "", // No requiere Stripe
  },
  {
    id: "plus",
    name: "Plus",
    price: 199,
    currency: "MXN",
    interval: "month",
    features: [
      "Acceso completo 30 días",
      "Desahogo ilimitado",
      "10 interpretaciones de sueños",
      "Consultorio con IA avanzada",
      "Dashboard completo con arquetipos",
      "Retos personalizados",
      "Biblioteca de sombra",
    ],
    stripe_price_id: import.meta.env.VITE_STRIPE_PLUS_PRICE_ID || "",
  },
  {
    id: "premium",
    name: "Premium",
    price: 249,
    currency: "MXN",
    interval: "month",
    features: [
      "Todo lo de Plus",
      "Apoyo humano 24/7",
      "Interpretaciones ilimitadas",
      "Espejo Negro (proyecciones)",
      "Teatro de Sombras (arquetipos)",
      "Tests psicológicos avanzados",
      "Sesiones de seguimiento",
      "Prioridad en alertas de crisis",
    ],
    stripe_price_id: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || "",
  },
];

/**
 * Crear sesión de checkout de Stripe
 */
export async function createCheckoutSession(
  planId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  try {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || !plan.stripe_price_id) {
      throw new Error("Plan no válido o no requiere pago");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || "",
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
}

/**
 * Obtener información de suscripción
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error getting subscription:", error);
    return null;
  }
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return false;
  }
}

/**
 * Crear portal de cliente para gestionar suscripción
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return null;
  }
}

/**
 * Verificar límites del plan
 */
export function checkPlanLimits(planId: string, usage: {
  dream_interpretations: number;
}): {
  allowed: boolean;
  limit: number;
  current: number;
} {
  const limits: Record<string, number> = {
    trial: 3,
    plus: 10,
    premium: -1, // ilimitado
  };

  const limit = limits[planId] || 0;
  const current = usage.dream_interpretations;

  return {
    allowed: limit === -1 || current < limit,
    limit,
    current,
  };
}
