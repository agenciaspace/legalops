import { describe, expect, it } from "vitest";
import {
  communityEventPath,
  communityEventSlug,
  communityEventUrl,
} from "@/lib/community-event-links";

describe("community event permanent links", () => {
  it("creates a stable public URL from the event slug", () => {
    expect(communityEventPath("bench-netlex-2026")).toBe(
      "/community/events/bench-netlex-2026",
    );
    expect(communityEventUrl("bench-netlex-2026")).toBe(
      "https://legalops.club/community/events/bench-netlex-2026",
    );
  });

  it("creates URL-safe slugs from Portuguese titles", () => {
    expect(communityEventSlug("Gestão jurídica & IA: São Paulo")).toBe(
      "gestao-juridica-ia-sao-paulo",
    );
  });
});
