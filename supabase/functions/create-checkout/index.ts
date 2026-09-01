import { withSupabase } from 'npm:@supabase/server@^1';

// Provider adapter: connect this function to your licensed payment gateway.
// Keep provider secrets in Supabase Edge Function secrets, never in the browser.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const { planCode = 'premium_monthly' } = await req.json().catch(() => ({}));
    const { data: plan, error: planError } = await ctx.supabase
      .from('subscription_plans').select('*').eq('code', planCode).eq('active', true).single();
    if (planError || !plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

    const { data: payment, error } = await ctx.supabase
      .from('payments')
      .insert({ user_id: ctx.userClaims!.sub, amount_egp: plan.price_egp, provider: 'gateway', status: 'pending', metadata: { plan_code: plan.code } })
      .select('id,amount_egp,status').single();
    if (error) return Response.json({ error: error.message }, { status: 500 });

    // TODO: call the selected Egyptian payment gateway here and return its checkout URL.
    // For automatic confirmation, the gateway must send a signed webhook to payment-webhook.
    return Response.json({ payment, message: 'Checkout scaffold ready; configure a merchant gateway and secrets.' });
  })
};
