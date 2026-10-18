# Club editorial home

Leon approved the News-inspired editorial identity on 2026-10-17 and requested
on 2026-10-18 that the landing be simplified around purchasing Pro. The home
keeps the cream/coral/ink palette, shared wordmark and everyday Portuguese.

The page leads with the practical career benefit and a plan card, followed by
three benefits, four purchase questions and one closing call to action. On
mobile, a fixed price/action bar keeps checkout reachable. The free community,
events, sign-in and support remain accessible without competing with the offer.
This focused purchase page supersedes the earlier homepage agenda, sample
conversation, theme switcher and ecosystem showcase.

- Implementation: `app/club/ClubEditorialHome.tsx` and scoped `club-editorial.css`.
- `app/club/page.tsx` reads the same public offer as checkout, with a bounded
  query and closed fallback. Missing, invalid or inactive offers show contact
  instead of a fabricated price or a purchase link.
- Recurring offers show the approved trial and monthly billing; PIX offers
  retain their actual period and manual renewal without claiming a trial.
- All purchase calls lead to `/club/checkout`. Signup, email confirmation,
  profile completion, provider confirmation and manual activation stay intact.
- Shared `ClubHeader`, brand fonts and action/card primitives are reused.
- The installed-app session restoration and root host rewrite are unchanged.
- Conditions and availability remain governed by `docs/CLUB-PAID-PILOT.md`.

Regression coverage checks current price, offer failures, annual PIX behavior,
checkout destinations and free-community access. Before publishing, check the
home at 320, 390, 768 and 1440 px and follow the checkout/signup/login path.
