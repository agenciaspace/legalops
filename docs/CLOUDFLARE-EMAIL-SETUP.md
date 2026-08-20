# Cloudflare Email Service setup

This repository uses Cloudflare Email Service for application mail and
Cloudflare Email Routing for inbound application aliases.

## 1. Onboard the sending domain

In Cloudflare:

1. Open `Compute > Email Service > Email Sending`.
2. Onboard the zone/domain that authorizes `hello@mail.legalops.work`.
3. Wait for SPF, DKIM and DMARC checks to become active.
4. Create an API token with `Email Sending: Edit` permission.

The API token is used by the Next.js app through the REST API and by Supabase
Auth through authenticated SMTP. Do not commit it.

## 2. Configure application Worker variables

Set these variables as Cloudflare Worker variables/secrets for `legalops-app`:

```text
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_EMAIL_API_TOKEN=
CLOUDFLARE_EMAIL_SENDER_NAME=Legal Ops
CLOUDFLARE_EMAIL_SENDER_EMAIL=hello@mail.legalops.work
CLOUDFLARE_EMAIL_WEBHOOK_TOKEN=
LEGALOPS_ADMIN_EMAILS=leonhatori@gmail.com
```

The API token is server-only. `LEGALOPS_ADMIN_EMAILS` is a comma-separated
allowlist for `POST /api/admin/invitations`.

## 3. Configure Supabase Auth SMTP

In Supabase `Authentication > SMTP Settings`:

```text
Host: smtp.mx.cloudflare.net
Port: 465
Username: api_token
Password: the Cloudflare Email Sending API token
Sender: hello@mail.legalops.work
```

Use implicit TLS. Cloudflare does not use STARTTLS on port 587.

In `Authentication > URL Configuration`, set the canonical site URL and add
the three public domains plus the confirmation callback paths as allowed
redirect URLs. The application sends the current host explicitly when a user
signs up.

The email templates must point to the application callback and include the
Supabase token hash, for example:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

For invitations, use `type=invite` in the invitation template.

## 4. Deploy the inbound Worker

The Worker parses incoming MIME messages and posts a normalized payload to the
Next.js webhook. Set its secret and deploy it from the repository root:

```bash
npx wrangler secret put WEBHOOK_TOKEN --config cloudflare/email-inbound.wrangler.jsonc
npx wrangler deploy --config cloudflare/email-inbound.wrangler.jsonc
```

The secret value must equal `CLOUDFLARE_EMAIL_WEBHOOK_TOKEN` in `legalops-app`.

In Cloudflare `Compute > Email Service > Email Routing`, add a routing rule for
the `reply.legalops.work` alias domain that sends matching messages to the
deployed `legalops-email-inbound` Worker. Verify a destination address if the
dashboard requests one, then send a test message to a generated alias.

## 5. Deploy the application and Workers

After setting the Worker variables:

1. Deploy the Next.js OpenNext app with `npm run deploy:cloudflare`.
2. Deploy `cloudflare/legalops-cron.wrangler.jsonc`.
3. Deploy `cloudflare/email-inbound.wrangler.jsonc` and connect Email Routing.
4. Verify `legalops.club`, `www.legalops.club`, `legalops.work` and
   `legalops.dev` separately.

## 6. Test the invitation

An authenticated account whose email is in `LEGALOPS_ADMIN_EMAILS` can call:

```http
POST /api/admin/invitations
Content-Type: application/json

{"email":"invitee@example.com"}
```

The endpoint sends a Supabase invitation through Cloudflare SMTP and creates a
`complimentary` Club member record. The invitee must land on
`/auth/confirm`, then continue to `/community`.
