# Shared Pro credits

The Pro allowance funds generation across the agent, agent summaries, personalized CVs,
cover letters, interview preparation and profile insights. Reading saved content,
community posts, deterministic CV drafts and shared scheduled digests does not generate
a personal charge. Agent summaries have an explicit action selector and tariff.

Initial configuration preserves 30 included credits per UTC day, and starts with one
credit per completed generation for each action. All six tariffs, allowance and daily
or calendar-month renewal are configurable at `/club/admin/credits`. The member sees
balance, costs and recent transactions at `/community/credits`. Included credits do
not accumulate. Purchased balances persist across allowance renewal and require Pro.

Credit pack quantity and price start unset; sales start closed. Admins configure a pack
and explicitly open sales. PIX uses the existing account and private receipt bucket.
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
