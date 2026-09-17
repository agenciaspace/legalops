# Public CLM Bench

Published surface: `https://legalops.dev/bench/` (static Pages project).
Presentation: `/bench/apresentacao`; downloadable deck: `/bench/bench-clm.pdf`.
The Club's event registration routes are separate and unchanged.

## Decision model

- Initial scope: Ironclad and Luminance; workflows, Salesforce, playbooks and repository intelligence.
- Base scores represent the Bench editorial hypothesis supplied for this comparison, not measured performance. Ironclad: 5/5/4/4. Luminance: 2/2/5/5. All scores are user-editable.
- Official vendor documentation was checked on 2026-09-17. It supports the presence of advertised capabilities, not the scores or comparative superiority. Luminance advertises Salesforce integration and workflows. Ironclad also documents playbooks and repository capabilities.
- Score: `100 * sum(weight * score) / (5 * sum(weight))`. Zero weight excludes a criterion. No weights means no score. A margin below five points is an editorial close-result threshold.
- Failed mandatory requirements exclude a vendor from the indication, retaining its score for audit. Pending requirements keep indications provisional. Passing requirements are user declarations, not external verification.
- No fabricated prices, ROI, implementation dates or model accuracy. Cost and implementation require proposals and internal validation.

## Files and privacy

`cloudflare-landing/bench/model.mjs` owns the model, source registry, validation and Markdown report. `calculator.mjs` binds the controls. `deck.js` adds slide navigation to the standalone HTML presentation.

All calculations run in the browser. No backend calls or registration. Shared state lives in a versioned URL fragment (weights, scores and requirement states only). Reset clears shared state. PDF/Markdown exports are available. Fonts follow the existing site's Google Fonts setup.

## Verification and maintenance

Run `npx vitest run __tests__/bench-calculator.test.mjs __tests__/bench-ui.test.mjs` for scoring, presets, vetoes, zero weights, close results, validation, source disclosure and UI change events. The full application suite and production build were also run during delivery.

Browser verification covers desktop/mobile, preset changes, mandatory vetoes, shared-state reload and keyboard slide navigation. The PDF has eight pages. Generate it from the deck with print backgrounds and inspect the eight pages after presentation changes. Pages serves `apresentacao.html` at the extensionless URL.

Deploy via the existing `Deploy legalops.dev Pages` GitHub workflow. Verify the Bench HTML, JS MIME types, PDF and interactive calculator on the public domain after deploy.
