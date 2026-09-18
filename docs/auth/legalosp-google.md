# Google login — dedicated Legalosp project

The application is ready to use the Google provider of Supabase project `dkjcvemtkxqweagrdmop`.
The button remains hidden until that provider is enabled. Password login remains available.

## Current external blocker (2026-09-18)

Creating GCP project `legalosp-community` (display name `Legalosp`) failed with PROJECT QUOTA EXCEEDED for the connected account. No project or OAuth client was created. Google is currently disabled in Supabase.
Do not reuse OAuth credentials from unrelated projects.

## Complete configuration

1. Create a dedicated Google Cloud project named **Legalosp**, or obtain its existing project ID.
2. In Google Auth Platform configure branding, external audience and only `openid`, `email`, `profile` scopes. Publish the consent screen for community sign-in when ready.
3. Create a **Web application** OAuth client:
   - Authorized JavaScript origin: `https://legalops.club`
   - Authorized redirect URI: `https://dkjcvemtkxqweagrdmop.supabase.co/auth/v1/callback`
4. Set the client ID and secret in Supabase Authentication → Sign In / Providers → Google; enable Google. Configure allowed app redirects `https://legalops.club/auth/confirm` (with the next query parameters used by the app, matching the project's allowlist).
5. Verify a real Google login returns through `/auth/confirm` and `/club/entrar`, including an incomplete profile and a map section destination. OAuth does not grant community access or lead privileges by itself.

Store the client secret only in Supabase provider configuration, never in NEXT_PUBLIC variables or source control.
Official reference: https://supabase.com/docs/guides/auth/social-login/auth-google
