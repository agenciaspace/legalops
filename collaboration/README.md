# Community document collaboration

Self-hosted Hocuspocus + Yjs with the existing Supabase membership. No paid
Tiptap extension is required. MIT integration source:
https://github.com/agenciaspace/clm-bench/tree/main/integrations/legalops

## Run

```sh
npm ci
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY \
COLLAB_DATA_DIR=/var/lib/legalops-collaboration \
PORT=8796 node collaboration/server.mjs
```

The process listens on localhost. Place a WebSocket-capable HTTPS proxy in front.
Here, `wss://legalops.dev/collaboration` passes through Pages and the existing
OpenCLM tunnel to port 8796. Other OpenCLM paths remain on port 8787.
`legalops-collaboration.service` is independent of WhatsApp.

Only the Supabase public key is configured. Every socket sends its user token
in a Hocuspocus authentication message, never the URL. Supabase Auth validates
that token; membership and published section version must be current. Idle
readers and writers are rechecked every 30 seconds. Cursor identity comes from
the authenticated member record, not client-supplied names.

## Draft and review boundaries

Each `clm:<section>:v<version>` room is a **shared member draft**, seeded once
from approved content. Opening an editor loads that draft, including other
members' changes. Yjs updates merge and persist atomically to local files
(0600, directory 0700). Back up this directory; use one active process per
storage directory. Local files are not replicated across machines.

Editing never changes public content. Lead publication uses the transactional
RPC, advances the public version and saves history. Old rooms become stale and
disconnect. The UI preserves previous local text while moving to a new room.
Submitted proposals are snapshots independent of subsequent draft edits.

Comments preserve their selected quote and base version; they are references
to that text, not moving character anchors across future rewrites. Replies,
explicit mentions and in-app notifications stay private to members. Leads
review changed blocks (paragraphs, lists, tables), with accepted blocks merged
on the server. The exact published result is stored in revision history.

The client removes member IDs from mention nodes and unused table defaults.
API and database validate the document tree; renderers never interpret user
HTML. No external messages or emails are sent by this feature.

## Verify

```sh
npm test
npm run test:collaboration
npm run build
```

The integration test uses isolated identities and a temporary directory to
check concurrent peers, trusted presence, invalid authentication, persistence
after restart, and revocation of idle readers.
