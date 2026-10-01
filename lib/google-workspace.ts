function workspaceConfig() {
  return {
    clientId:
      process.env.GOOGLE_WORKSPACE_CLIENT_ID?.trim() ||
      process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim(),
    clientSecret:
      process.env.GOOGLE_WORKSPACE_CLIENT_SECRET?.trim() ||
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim(),
    refreshToken:
      process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN?.trim() ||
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim(),
  };
}

export function isGoogleWorkspaceConfigured() {
  const config = workspaceConfig();
  return Boolean(config.clientId && config.clientSecret && config.refreshToken);
}

export function isGoogleWorkspaceMailboxConfigured() {
  return Boolean(
    process.env.GOOGLE_WORKSPACE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_WORKSPACE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN?.trim(),
  );
}

export async function getGoogleWorkspaceAccessToken() {
  const config = workspaceConfig();
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error("Google Workspace is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || `Google OAuth failed (${response.status}).`,
    );
  }
  return payload.access_token;
}
