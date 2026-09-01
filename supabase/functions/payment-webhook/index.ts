import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-provider-signature' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const body = await req.text();
  const signature = req.headers.get('x-provider-signature') || '';
  const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET') || '';
  if (!secret || !signature) return new Response('Unauthorized', { status: 401, headers: cors });

  // Replace this with the exact signature verification required by your chosen gateway.
  // Do not trust a client-side "paid" flag. Only a verified gateway webhook may mark payment as paid.
  if (signature !== secret) return new Response('Invalid signature', { status: 401, headers: cors });

  let event: any;
  try { event = JSON.parse(body); } catch { return new Response('Bad JSON', { status: 400, headers: cors }); }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Gateway-specific mapping should set payment.status='paid', paid_at, provider_transaction_id,
  // then activate/extend the matching subscription in one transaction/RPC.
  console.log('Received verified payment event', { id: event?.id, type: event?.type });
  return Response.json({ received: true }, { headers: cors });
});
