# Mada Production Setup

Mada is being moved from browser-local storage to Supabase Auth + Postgres + Edge Functions.

## 1. Create the database

Create a Supabase project, then run `supabase/schema.sql` in the Supabase SQL Editor. Supabase provides Postgres, Auth, Storage and Realtime in one project. See https://supabase.com/docs/guides/database/overview.

## 2. Connect the web app

Copy `config.example.js` to `config.js` and set only:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Do not commit secret/service-role keys.

## 3. Admin account

Create the admin user in Supabase Authentication, for example with email/password. Then set that user's `profiles.role` to `admin` in the SQL Editor. Do not hard-code the admin password in JavaScript or GitHub. If you want the login name `admin1`, use an email such as `admin1@your-domain.example` and set `profiles.username='admin1'`.

## 4. Payment architecture

The browser creates a pending payment through `create-checkout`. The server-side function talks to the payment gateway. The gateway sends a signed webhook to `payment-webhook`. Only a verified webhook may mark a payment as paid and activate the subscription.

For Egypt, a gateway/merchant integration should be used for automatic confirmation. Direct bank or InstaPay transfers cannot be treated as automatically paid merely because a user submits a reference number. Provider capabilities and merchant contracts determine which wallet/bank methods and recurring subscriptions are available.

Paymob documents subscription plans and webhook URLs for subscription events: https://developers.paymob.com/paymob-docs/developers/subscription/create-subscription-plan

## 5. Secrets

Store payment API keys, webhook secrets and Supabase secret keys as Edge Function secrets. Never store:
- wallet PINs
- OTPs
- bank passwords
- card CVV
- payment secret keys
in the repository or browser code.

Supabase Edge Functions support authenticated functions and signed external webhooks; keep JWT verification enabled for user functions and verify provider signatures for webhooks. See https://supabase.com/docs/guides/functions/auth.
