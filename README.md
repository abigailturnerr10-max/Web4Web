# Web4Web

A guided, transparent way to get a website built — pick your site type,
style, and add-ons in a live configurator, see the price update as you go,
and pay securely. React 19 + Vite frontend, Supabase (Postgres + Storage +
Edge Functions) backend, Flutterwave for payment.

## Local development

```
npm install
cp .env.example .env   # fill in real values — see that file and supabase/README.md
npm run dev
```

Every third-party integration (Supabase, Flutterwave, EmailJS, WhatsApp)
degrades to a clearly-labeled placeholder until its `.env` values are set, so
the app runs and is clickable with zero configuration — checkout and content
submission specifically need the Supabase + Flutterwave setup in
`supabase/README.md` to actually work end-to-end.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint

## Project structure

- `src/wizard/` — the public-facing configurator flow (Home → Info →
  Configurator → Timeline → Review → Confirmation)
- `src/wizard/content/` — the post-payment, 10-step content-collection form
  clients fill in at `/submit-content?order=<id>`
- `src/admin/` — the internal admin panel at `/admin` (real Supabase Auth
  login, no separate admin-role table — any confirmed Auth user can sign in)
- `supabase/` — schema, RLS policies, migrations, and Edge Functions; see
  `supabase/README.md` for full backend setup

## Backend

See `supabase/README.md` for the full Supabase setup: running every
migration in order, creating an admin user, and deploying the five Edge
Functions (all server-side payment verification, content-form writes, and
the `client_secrets` vault go through these — the frontend never talks to
Postgres directly for anything that isn't read-only).

## Deploying

This repo has no CI/CD or hosting configuration yet — pick a static host
(Vercel, Netlify, Cloudflare Pages) and point it at `npm run build` /
`dist/`. Set the same `.env` variables as production environment variables
in whichever host you choose (Edge Function secrets are separate — see
`supabase/README.md` step 5, those live in Supabase, not the frontend host).
