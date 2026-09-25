# MI customer accounts: turn-on steps

Separate Supabase project for public Market Intelligence customers. Never the SoftMess project.

1. Create project `amp-mi-accounts` (region us-east-1) with the Supabase access token.
2. Run `supabase/migrations/0001_mi_accounts.sql`.
3. Auth settings: email provider on, confirm email on, signups on, min password 8,
   Site URL + redirect URLs = the MI page (preview now; the real domain at the flip).
4. Function secrets: `STRIPE_SECRET_KEY` (restricted key: Checkout Sessions read),
   `MI_ALLOWED_ORIGINS` (preview + real domain).
5. Deploy `verify-checkout` and `use-poll`.
6. Put the project URL + anon (public) key in `js/mi-accounts-config.js`.
7. Before launch: custom SMTP for sign-up and reset emails (the built-in sender allows only a few per hour).

Payment Links already return to `.../market-intelligence?ridge_checkout=success&ridge_sku=...&session_id={CHECKOUT_SESSION_ID}`.
At the domain flip, update those six return URLs and the auth redirect URLs.
