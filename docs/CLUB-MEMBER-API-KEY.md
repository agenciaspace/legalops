# Member-provided OpenAI API keys

Members connect an OpenAI API key at `/community/profile#api-key`. The personal
agent shows whether the member's API account or the Club Pro provider is used.
Supabase sign-in, active membership, Pro entitlement and the daily 30-question
quota remain unchanged. ChatGPT subscription access is a separate integration.

## Data and billing boundaries

- Save requires active membership, a same-origin JSON request and explicit
  consent. GET/DELETE need sign-in but remain available after membership expiry.
- The browser submits a password field once and clears it after success/failure.
  No credential is stored in browser storage or returned by an API response.
- A fixed OpenAI model lookup checks the credential without text generation.
  Generation permissions and available balance are established only on use.
- `club_member_api_keys` holds AES-256-GCM ciphertext bound to the member UUID
  as authenticated additional data, last four characters, and update time.
  RLS is enabled; browser roles have no grants. All server queries use the
  verified session owner, never an owner supplied by the caller.
- `CLUB_API_KEY_ENCRYPTION_KEY` is a separate 32-byte hex secret in the Worker.
  Preserve its secure recovery copy. Rotation requires decrypting/re-encrypting
  every row with the old/new keys; replacing it alone breaks existing connections.
- The agent sends authorized context to the fixed `api.openai.com` endpoint,
  using `gpt-4.1-mini`, `store:false`, and at most 1,400 output tokens. Member keys
  are never used by background jobs or another member.
- A connected key always takes priority. Storage/provider failure does not fall
  back to platform billing or trigger an automatic retry. A failed turn releases
  the Club daily reservation; OpenAI may still bill work it already processed.
- Removing the key restores the ordinary Pro provider for future questions.
  An already running request may finish; removal does not revoke the key at OpenAI.

## Deployment and verification

Apply the timestamped migration and install `CLUB_API_KEY_ENCRYPTION_KEY` before
deploying the application. Never print keys or database/provider error bodies.

Focused tests cover owner binding, encryption, consent, invalid credentials,
removal, billing selection, provider failures and form submission. Run
`supabase/tests/club_member_api_keys.sql` to verify grants and real SQL denials.
The full app suite, build and Bend checks must pass before release.

Provider inference uses mocked responses in automated tests. A production
generation check requires a member's authorized, billable API key; do not treat
an invalid-key check as successful live inference.

Official contracts:
- https://developers.openai.com/api/docs/guides/text
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://supabase.com/docs/guides/api/securing-your-api
