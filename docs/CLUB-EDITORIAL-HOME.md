# Club editorial home

Approved by Leon on 2026-10-17: the News-inspired editorial layout, bold wordmark,
cream/coral/ink palette, and everyday Portuguese. The public Club home is native
React and retains the existing root rewrite, sign-in, free signup, Pro checkout,
published-event query and installed-app session restoration.

The sample discussion is visibly fictional. The agenda uses published upcoming
events only; unknown dates stay unconfirmed. No preview toolbar, local composer,
mock membership actions or preview routes are shipped.

- Implementation: `app/club/ClubEditorialHome.tsx` and scoped `club-editorial.css`.
- Event loading: `app/club/page.tsx`; event details and calendar remain real links.
- Shared-family image: `public/brand/club/legalops-family.png` and editable SVG.
- Fonts are self-hosted with their OFL notices.
- Keep words familiar: pedidos, gestão de contratos, guias, ferramentas.
- Keep product names and explain their purpose when needed.

Validation: 652 application tests; public home at 320, 390, 768 and 1440 px;
signup/entry/event destinations, tabs, keyboard navigation, FAQ and theme.
