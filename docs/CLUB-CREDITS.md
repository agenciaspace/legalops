# Shared Pro credits

The Pro allowance funds generation across the agent, agent summaries, personalized CVs,
cover letters, interview preparation and profile insights. Reading saved content,
community posts, deterministic CV drafts and shared scheduled digests does not generate
a personal charge. Agent summaries have an explicit action selector and tariff.

Approved launch configuration (2026-10-10): 300 included credits per calendar month
(renewal on day 1 at 00:00 UTC). Tariffs per completed generation: agent question 1;
agent summary 2; cover letter and profile insights 3 each; interview preparation and
personalized CV 5 each. All six tariffs, allowance and daily or calendar-month renewal
are configurable at `/club/admin/credits`. The member sees
balance, costs and recent transactions at `/community/credits`. Included credits do
not accumulate. Purchased balances persist across allowance renewal and require Pro.

Approved credit pack: 100 credits for BRL 19.90. Sales enabled on 2026-10-10 following
explicit owner approval. PIX uses the existing account and private receipt bucket.
Orders snapshot price/quantity, accept owner-only uploads, and require authenticated
allowlisted administrators to confirm receipt in the bank. Approval grants credits
atomically once. Credit purchases do not activate or extend Pro.

Funding order is enforced atomically in `reserve_club_credits`:

1. Consume included credits, then purchased credits, combining them for one action.
2. If the combined balance cannot cover the action, use the connected personal OpenAI
   API for the entire action, leaving the insufficient Club balance untouched.
3. Without a connected key, return `INSUFFICIENT_CREDITS` before any generation.

An advisory member lock covers reservations, purchases and refunds. The ledger snapshots
cost and funding; failed Club-funded generations restore exactly the included/purchased
amounts reserved, once. Abandoned reservations older than five minutes are refunded on the next wallet read or reservation. A personal API failure never increases Club balance. Expired Pro
is rejected before billing, regardless of key or purchased balance. Deleting conversations
does not erase the ledger or restore credits. No automatic switch from failed platform
billing to personal API billing. API charges follow OpenAI's own usage accounting, including
any billable provider work before failure; Club does not invoice the API amount.

The old daily usage is migrated into the included allowance. Old agent RPCs remain for
rollout compatibility; new code calls `reserve_club_credit_agent_turn` and settles the
linked credit transaction when persisting the answer. Work AI routes also reserve through
the same wallet. Deterministic CV creation (`useAi:false`) is preserved without generation.

Verification: `supabase/tests/club_credits.sql` runs rollback-only fixtures for ownership,
entitlement, included/purchased/API ordering, shared concurrent generation exclusion,
once-only refunds, fixed purchase quotes, closed sales and repeated approval. Vitest
covers server routing, generation failures, admin boundaries and UI behavior.

## Production verification — 2026-10-10

- 559 application tests passed; TypeScript, Bend, OpenNext build and GitHub deploy passed.
- Rollback-only SQL assertions passed against the linked Supabase project, including
  abandoned reservations and duplicate payment approval.
- Authenticated browser: wallet and six tariffs loaded; sales stayed closed without a
  configured pack; no horizontal overflow at 320, 390, 768 and 1280 pixels.
- One real platform-funded answer consumed one included credit while a deliberately
  invalid personal key was connected. The following summary selected API funding,
  failed with the expected invalid-key response, and consumed zero Club credits.
- Removing the key and submitting another question returned 402 before generation.
- Personal API monetary usage is not inferred from the ledger: it records the funding
  source, and members consult OpenAI for any provider charge.
- The real credit receipt form rejected an invalid PDF before storage. Canceling the
  unpaid fixture order succeeded, and the wallet remained unchanged. No real payment
  or valid personal API key was used; temporary accounts and their data were removed.
- Final deployment: `f01cf73`, Worker `3766db47-a476-4cc6-9c0b-19d74deaaf85`,
  [successful CI](https://github.com/agenciaspace/legalops/actions/runs/38092410460).

Launch settings were applied atomically with `configure_club_credits` and read back
from production to verify all six tariffs, monthly allowance and enabled pack sales.
Earlier production verification below/above refers to the pre-launch closed-sales state.
