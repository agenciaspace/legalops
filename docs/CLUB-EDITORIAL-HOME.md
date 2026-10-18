# Club editorial home

Leon approved the News-inspired editorial identity on 2026-10-17. On 2026-10-18,
after a Pro-focused simplification, he requested more emphasis on the community.
The current home leads with professional exchange, people and encounters. Pro
follows as a concrete next step, with its current offer and existing checkout.

The hero and closing action invite people to join the free community. Three
benefits describe conversations, professional connections and community events.
The mobile action bar keeps joining accessible and links to the Pro section.
There are no fictional conversations, fabricated member counts or event dates.

- Implementation: `app/club/ClubEditorialHome.tsx` and scoped `club-editorial.css`.
- `app/club/page.tsx` reads the same public offer as checkout, with a bounded
  query and closed fallback. Missing, invalid or inactive offers show contact
  instead of a fabricated price or a purchase link.
- Recurring offers show the approved trial and monthly billing; PIX offers
  retain their actual period and manual renewal without claiming a trial.
- Community calls lead to `/cadastro`; Pro purchase leads to `/club/checkout`.
  Signup, email confirmation, profile completion, provider confirmation and
  manual activation remain unchanged. Free membership is not sold as Pro.
- Shared `ClubHeader`, brand fonts and action/card primitives are reused.
- Installed-app session restoration and root host rewriting are unchanged.
- Conditions and availability remain governed by `docs/CLUB-PAID-PILOT.md`.

Regression coverage checks community priority, current price, offer failures,
annual PIX behavior, checkout destinations and free-community access. Before
publishing, check 320, 390, 768 and 1440 px and follow signup and Pro checkout.
