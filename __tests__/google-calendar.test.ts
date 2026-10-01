import { afterEach, expect, it, vi } from "vitest";
import {
  googleCalendarEventLink,
  googleCalendarOrganizerEmail,
  upsertGoogleMeetEvent,
} from "@/lib/google-calendar";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function configureCalendar() {
  vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "client-id");
  vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret");
  vi.stubEnv("GOOGLE_CALENDAR_REFRESH_TOKEN", "refresh-token");
  vi.stubEnv("GOOGLE_CALENDAR_ID", "hi@legalops.club");
}

it("creates one deterministic Calendar event with a unique Meet link", async () => {
  configureCalendar();
  const fetchMock = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") {
        return Response.json({ access_token: "access-token" });
      }
      if (init?.method === "POST") {
        return Response.json({
          id: "legalops12345678",
          htmlLink: "https://calendar.google.com/event?eid=abc",
          conferenceData: {
            entryPoints: [
              {
                entryPointType: "video",
                uri: "https://meet.google.com/abc-defg-hij",
              },
            ],
          },
        });
      }
      return Response.json({}, { status: 404 });
    },
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    upsertGoogleMeetEvent({
      summary: "Bench NetLex · legalops.club",
      description: "Benchmark entre pares.",
      startsAt: "2026-10-10T18:00:00.000Z",
      endsAt: "2026-10-10T19:00:00.000Z",
      timeZone: "America/Sao_Paulo",
      localEventId: "12345678-1234-1234-1234-123456789abc",
      attendees: [{ email: "member@example.com", displayName: "Member" }],
    }),
  ).resolves.toEqual({
    eventId: "legalops12345678",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    htmlLink: "https://calendar.google.com/event?eid=abc",
  });

  const createCall = fetchMock.mock.calls.find(
    ([url, init]) =>
      init?.method === "POST" &&
      String(url).includes("googleapis.com/calendar"),
  );
  expect(String(createCall?.[0])).toContain(
    "/calendars/hi%40legalops.club/events?conferenceDataVersion=1&sendUpdates=all",
  );
  expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
    id: "legalops12345678123412341234123456789abc",
    attendees: [{ email: "member@example.com", displayName: "Member" }],
    conferenceData: {
      createRequest: { conferenceSolutionKey: { type: "hangoutsMeet" } },
    },
  });
});

it("defaults the organizer identity to hi@legalops.club", () => {
  expect(googleCalendarOrganizerEmail()).toBe("hi@legalops.club");
});

it("derives a final Calendar link from a stored Google event id", () => {
  vi.stubEnv("GOOGLE_CALENDAR_ID", "hi@legalops.club");
  expect(googleCalendarEventLink("legalops12345678")).toMatch(
    /^https:\/\/www\.google\.com\/calendar\/event\?eid=/,
  );
});
