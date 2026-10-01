// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("uses Supabase's complete confirmation URL in every magic-link locale", () => {
  const template = readFileSync(
    new URL("../supabase/templates/magic_link.html", import.meta.url),
    "utf8",
  );

  expect(template.match(/href="{{ \.ConfirmationURL }}"/g)).toHaveLength(3);
  expect(template).not.toContain(".TokenHash");
  expect(template).not.toContain("{{ if and .RedirectTo");
});
