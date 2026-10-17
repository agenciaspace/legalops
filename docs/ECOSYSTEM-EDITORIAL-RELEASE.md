# Shared editorial release — 2026-10-17

Leon approved the Club's editorial visual direction and plain Portuguese, then
requested the same language across Club, News, Work, Dev and Chat.

The shared system defines self-hosted Archivo Black wordmarks, Space Grotesk 700
headings, Inter body text, cream/coral/ink, rules and square surfaces. Work and Dev
receive editorial mastheads; News retains its publication structure with the new
shared typography and approved official/stock images with credits. Chat receives
the same system in its dedicated repository. Existing product functions remain.

Sources of truth: `design/legalops.css`, `components/BrandLogo.tsx`,
`components/ProductMasthead.tsx`, and `docs/BRAND-LANGUAGE.md`. Run `npm run
design:sync` to update Dev. Chat mirrors the shared files in its own repository.
Older `--font-quicksand` consumers resolve to the current heading font through a
compatibility variable, so existing layouts keep working.

Validation: 652 application tests, 30 focused News tests after the image change,
production build, Bend proofs, four viewport widths for each public product,
entry/signup/checkout layouts, official-cover load and credits. Chat: 12 tests,
OpenNext build and interactive landing/signup browser checks; its deployed API
boundary is tested by its deployment workflow.
