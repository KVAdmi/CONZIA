import Stripe from 'stripe';
import { supabase } from '../supabase/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Planes de CONZIA
export const PLANS = {
  trial: {
    id: 'trial',
    name: 'Trial',
    price: 0,
    duration_days: 7,
    limits: {
      entries_per_day: 1,
      challenges_per_week: 1,
      ai_tokens_per_month: 10000,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 299, // MXN
    stripe_price_id: process.env.STRIPE_PRICE_PLUS!,
    duration_days: 30,
    limits: {
      entries_per_day: 3,
      challenges_per_week: 3,
      ai_tokens_per_month: 50000,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 499, // MXN
    stripe_price_id: process.env.STRIPE_PRICE_PREMIUM!,
    duration_days: 30,
    limits: {
      entries_per_day: 10,
      challenges_per_week: 7,
      ai_tokens_per_month: 150000,
      human_support: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999, // MXN
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE!,
    duration_days: 30,
    limits: {
      entries_per_day: -1, // Unlimited
      challenges_per_week: -1,
      ai_tokens_per_month: 500000,
      human_support: true,
      priority_support: true,
    },
  },
};

export async function createCheckoutSession(
  userId: string,
  planId: keyof typeof PLANS,
  successUrl: string,
  cancelUrl: string
) {
  const plan = PLANS[planId];
  
  if (!plan.stripe_price_id) {
    throw new Error(`Plan ${planId} does not have a Stripe price ID`);
  }
  
  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Will be filled by Stripe
    client_reference_id: userId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripe_price_id,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      plan_id: planId,
    },
  });
  
  return session;
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  
  if (!userId || !planId) {
    throw new Error('Missing user_id or plan_id in session metadata');
  }
  
  const plan = PLANS[planId as keyof typeof PLANS];
  
  // Actualizar perfil del usuario
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: planId,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId);
  
  if (error) throw error;
  
  console.log(`[Stripe] Subscription activated for user ${userId} (plan: ${planId})`);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  
  if (!userId) {
    throw new Error('Missing user_id in subscription metadata');
  }
  
  const status = subscription.status === 'active' ? 'active' : 'inactive';
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: status,
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) throw error;
  
  console.log(`[Stripe] Subscription updated for user ${userId} (status: ${status})`);
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  
  if (!userId) {
    throw new Error('Missing user_id in subscription metadata');
  }
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) throw error;
  
  console.log(`[Stripe] Subscription cancelled for user ${userId}`);
}

export async function cancelSubscription(userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();
  
  if (!profile?.stripe_subscription_id) {
    throw new Error('User does not have an active subscription');
  }
  
  await stripe.subscriptions.cancel(profile.stripe_subscription_id);
  
  console.log(`[Stripe] Subscription cancelled for user ${userId}`);
}

export async function getUserLimits(userId: string): Promise<typeof PLANS[keyof typeof PLANS]['limits']> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();
  
  if (!profile || profile.subscription_status !== 'active') {
    return PLANS.trial.limits;
  }
  
  const plan = PLANS[profile.subscription_plan as keyof typeof PLANS];
  return plan.limits;
}

export async function checkLimit(
  userId: string,
  limitType: 'entries_per_day' | 'challenges_per_week' | 'ai_tokens_per_month'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getUserLimits(userId);
  const limit = limits[limitType];
  
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }
  
  let current = 0;
  
  if (limitType === 'entries_per_day') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count } = await supabase
      .from('desahogo_entries')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .gte('created_at', today.toISOString());
    
    current = count || 0;
  } else if (limitType === 'challenges_per_week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .gte('created_at', weekAgo.toISOString());
    
    current = count || 0;
  } else if (limitType === 'ai_tokens_per_month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { data: entries } = await supabase
      .from('desahogo_entries')
      .select('ai_analysis')
      .eq('profile_id', userId)
      .gte('created_at', monthAgo.toISOString());
    
    // Estimar tokens usados (aproximación)
    current = (entries || []).reduce((sum, entry) => {
      const analysis = entry.ai_analysis as any;
      return sum + (analysis?.tokens_used || 1000);
    }, 0);
  }
  
  return {
    allowed: current < limit,
    current,
    limit,
  };
}
