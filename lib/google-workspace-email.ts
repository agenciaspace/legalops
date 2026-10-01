import {
  getGoogleWorkspaceAccessToken,
  isGoogleWorkspaceMailboxConfigured,
} from "@/lib/google-workspace";

const DEFAULT_SENDER = "hi@legalops.club";

function base64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of Array.from(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64Url(value: string) {
  return base64Utf8(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodedHeader(value: string) {
  return `=?UTF-8?B?${base64Utf8(value)}?=`;
}

export function isGoogleWorkspaceEmailConfigured() {
  return isGoogleWorkspaceMailboxConfigured();
}

export async function sendGoogleWorkspaceEmail(args: {
  to: string[];
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string;
}) {
  const accessToken = await getGoogleWorkspaceAccessToken();
  const sender =
    process.env.GOOGLE_WORKSPACE_SENDER_EMAIL?.trim().toLowerCase() ||
    DEFAULT_SENDER;
  const boundary = `legalops_${crypto.randomUUID().replace(/-/g, "")}`;
  const headers = [
    `From: legalops.club <${sender}>`,
    `To: ${args.to.join(", ")}`,
    ...(args.replyTo ? [`Reply-To: ${args.replyTo}`] : []),
    `Subject: ${encodedHeader(args.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Utf8(args.textBody),
    ...(args.htmlBody
      ? [
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          "Content-Transfer-Encoding: base64",
          "",
          base64Utf8(args.htmlBody),
        ]
      : []),
    `--${boundary}--`,
    "",
  ];
  const raw = base64Url(`${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`);
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  const payload = (await response.json().catch(() => null)) as {
    id?: string;
  } | null;
  if (!response.ok || !payload?.id) {
    throw new Error(`Google Workspace email request failed (${response.status}).`);
  }
  return { messageId: payload.id, payload };
}
