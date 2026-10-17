# LegalOps brand preview — 2026-10-17

Reviewable, isolated design proposals for legalops.club and legalops.news.
The static Worker has no production bindings, API calls, authentication or database.
Production host routes and the shared brand components are not modified.

## Proposed direction

- **Club / Coral Club (recommended):** a firmer Space Grotesk wordmark, Inter UI,
  warm paper, coral and dark green-black. Community-first messaging, contextual
  product examples and a modular dot motif. Cobalt and Olive are selectable alternatives.
- **News / Sinal Editorial:** paper, ink and acid green, oversized masthead,
  compact editorial columns, monospace metadata and original document collages.
  It retains the family name and typography with a distinct editorial voice.
- References: https://agentes.chat and https://www.404media.co/.
  The supplied agentes.agentes.chat did not resolve. No reference logos, code,
  illustrations or articles were copied from these sites.
- These are proposed changes to the existing Quicksand/cream/coral system;
  they are not adopted production standards.

## Review surfaces

1. `/`: full Club landing, explainer tabs, resources, Pro demo, FAQ.
2. `/community/`: illustrative feed, search, filters, saved items, profiles,
   local-only composer and canned agent examples. Demo state lasts one page session.
3. `/news/`: editorial home, combined category/search and article navigation.
4. `/news/leitura/?id=0`: full article layout, original content and source links.
5. `/brand/`: three Club palettes, wordmark, typography, social applications,
   downloads and News identity. Theme/palette preferences persist locally.

News fixtures reproduce the four existing public legalops.news articles dated
2026-10-16, captured 2026-10-17. Source URLs are retained in articles.json and
the reading experience. The preview does not refresh these fixtures automatically.
Community people and discussions are fictitious and visibly labeled.
The real Bench event is labeled date/format to be confirmed. Newsletter buttons
explain preparation status and link to the existing interest form; they collect no data.

## Assets

SVG collages and pixel motif are original vector compositions. Font files are
self-hosted; OFL licenses are included. Wordmark/social SVG exports retain editable
text and require Space Grotesk for the intended rendering. Export design colors
and typography as JSON from the identity page.

## Development and validation

```sh
python3 -m http.server 8136 --bind 127.0.0.1 --directory brand-preview/site
# In a second shell; use the path to an existing Playwright install:
PLAYWRIGHT_PATH=/absolute/path/to/playwright node brand-preview/qa/verify.cjs
```

38 browser checks: five routes at 320/390/768/1440 px, image loading and horizontal
overflow, palettes/theme, tabs/keyboard, FAQ, combined filtering, saved posts,
thread dialog, local composer, agent demo, people/events, article sources and downloads.
No browser JS/console errors in the accepted run. Also checked JavaScript syntax,
Wrangler dry run and repository-required Bend proofs.

## Publishing

Push `design/club-brand-preview` to run the dedicated preview workflow.
Worker: `legalops-club-brand-preview`. No custom domain or production route.
The preview is publicly reachable by its workers.dev URL and excluded from indexing.
`_headers` defines CSP and robots headers. It contains public and synthetic data only.

Buildless: deploy `site/` directly. The optional Python scripts regenerate shells
and original SVG assets. They do not fetch remote content or production data.
