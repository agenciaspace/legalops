import { afterEach, expect, it, vi } from "vitest";
import { sendGoogleWorkspaceEmail } from "@/lib/google-workspace-email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("sends transactional mail through the authenticated Workspace mailbox", async () => {
  vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_ID", "client-id");
  vi.stubEnv("GOOGLE_WORKSPACE_CLIENT_SECRET", "client-secret");
  vi.stubEnv("GOOGLE_WORKSPACE_REFRESH_TOKEN", "refresh-token");
  vi.stubEnv("GOOGLE_WORKSPACE_SENDER_EMAIL", "hi@legalops.club");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access_token: "access-token" }))
    .mockResolvedValueOnce(Response.json({ id: "gmail-message-id" }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    sendGoogleWorkspaceEmail({
      to: ["ana@example.com"],
      subject: "Novo evento",
      textBody: "Detalhes do evento",
      htmlBody: "<p>Detalhes do evento</p>",
    }),
  ).resolves.toMatchObject({ messageId: "gmail-message-id" });

  expect(fetchMock.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
  expect(fetchMock.mock.calls[1][0]).toBe(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
  );
  const gmailBody = JSON.parse(
    (fetchMock.mock.calls[1][1] as RequestInit).body as string,
  ) as { raw: string };
  const mime = Buffer.from(gmailBody.raw, "base64url").toString("utf8");
  expect(mime).toContain("From: legalops.club <hi@legalops.club>");
  expect(mime).toContain("To: ana@example.com");
});
