// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({
  user: null as { id: string; email_confirmed_at?: string } | null,
  admin: vi.fn(),
}));
vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
  }),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => state.admin(),
}));
vi.mock("@/lib/chat/engine", () => ({ processChatStep: vi.fn() }));
vi.mock("@/lib/chat/documents", () => ({ extractDocument: vi.fn() }));
import { GET, POST } from "@/app/api/chat/[...path]/route";
import { GET as cron } from "@/app/api/cron/chat/route";
beforeEach(() => {
  state.user = null;
  state.admin.mockReset();
  delete process.env.CRON_SECRET;
});
it("rejects guests before touching private data", async () => {
  const response = await GET(
    new NextRequest("https://legalops.club/api/chat/workspaces"),
    { params: { path: ["workspaces"] } },
  );
  expect(response.status).toBe(401);
  expect(state.admin).not.toHaveBeenCalled();
});
it("requires a same-origin write and a confirmed identity", async () => {
  state.user = { id: "actor", email_confirmed_at: "2026-01-01" };
  const response = await POST(
    new NextRequest("https://legalops.club/api/chat/workspaces", {
      method: "POST",
      headers: { origin: "https://evil.example" },
      body: "{}",
    }),
    { params: { path: ["workspaces"] } },
  );
  expect(response.status).toBe(403);
  expect(state.admin).not.toHaveBeenCalled();
  state.user = { id: "actor" };
  const unverified = await POST(
    new NextRequest("https://legalops.club/api/chat/workspaces", {
      method: "POST",
      headers: { origin: "https://legalops.club" },
      body: "{}",
    }),
    { params: { path: ["workspaces"] } },
  );
  expect(unverified.status).toBe(403);
  expect(state.admin).not.toHaveBeenCalled();
});
it("fails closed for missing or wrong background-worker credentials", async () => {
  expect(
    (await cron(new NextRequest("https://legalops.club/api/cron/chat"))).status,
  ).toBe(401);
  process.env.CRON_SECRET = "test-only-secret";
  expect(
    (
      await cron(
        new NextRequest("https://legalops.club/api/cron/chat", {
          headers: { authorization: "Bearer wrong" },
        }),
      )
    ).status,
  ).toBe(401);
  expect(state.admin).not.toHaveBeenCalled();
});
