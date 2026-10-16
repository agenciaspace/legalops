// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  makeSources,
  parseAgentOutput,
  chatReturnPath,
} from "@/lib/chat/model";
describe("Chat grounding and context selection", () => {
  const docs = [
    {
      id: "doc-a",
      name: "Contract",
      kind: "contract",
      content:
        "A renovação dependerá de acordo escrito entre as partes. ".repeat(
          1000,
        ),
    },
    {
      id: "doc-b",
      name: "Policy",
      kind: "policy",
      content:
        "Contratações com dados pessoais passam pela avaliação de privacidade.",
    },
  ];
  it("bounds passages, covers every selected document and reports partial coverage", () => {
    const result = makeSources(docs, "renovação e privacidade");
    expect(result.sources).toHaveLength(20);
    expect(result.selectedPassages).toBe(20);
    expect(result.totalPassages).toBeGreaterThan(20);
    expect(new Set(result.sources.map((s) => s.document_id)).size).toBe(2);
    expect(result.sources.every((s) => s.text.length <= 1700)).toBe(true);
    expect(new Set(result.sources.map((s) => s.id)).size).toBe(20);
  });
  it("accepts a quote only when it belongs to the cited selected passage", () => {
    const { sources } = makeSources(docs, "renovação");
    const response = {
      summary: "A minuta contém disposição de renovação.",
      findings: [
        {
          title: "Renovação",
          detail: "Confira a cláusula.",
          severity: "attention",
          citations: [
            {
              source_id: sources[0].id,
              quote: "A renovação dependerá de acordo escrito",
            },
          ],
        },
      ],
      next_actions: ["Revisar a minuta."],
      missing_information: [],
    };
    expect(
      parseAgentOutput(JSON.stringify(response), sources).findings,
    ).toHaveLength(1);
    response.findings[0].citations[0].quote =
      "Texto que não existe no documento";
    expect(() => parseAgentOutput(JSON.stringify(response), sources)).toThrow(
      "invalid_citation",
    );
    response.findings[0].citations[0] = {
      source_id: "foreign-document:0",
      quote: "A renovação dependerá de acordo escrito",
    };
    expect(() => parseAgentOutput(JSON.stringify(response), sources)).toThrow(
      "invalid_citation",
    );
  });
  it("rejects malformed, oversized or falsely cited model outputs", () => {
    const { sources } = makeSources(docs, "renovação");
    for (const value of [
      {
        summary: "done",
        findings: [],
        next_actions: [],
        missing_information: [],
      },
      {
        summary: "A summary.",
        findings: [{}],
        next_actions: [],
        missing_information: [],
      },
      {
        summary: "A summary.",
        findings: [],
        next_actions: ["x".repeat(1501)],
        missing_information: [],
      },
    ])
      expect(() => parseAgentOutput(JSON.stringify(value), sources)).toThrow();
  });
  it("preserves only the exact Chat onboarding and invitation return paths", () => {
    expect(chatReturnPath("/chat/workspace")).toBe("/chat/workspace");
    expect(chatReturnPath("/chat/workspace?invite=" + "a".repeat(64))).toBeTruthy();
    for (const path of [
      "//evil.example",
      "/chat/workspace/../../admin",
      "/chat/workspace?next=//evil.example",
      "/chat/workspace?invite=short",
      "/chat/workspace\\foo",
    ])
      expect(chatReturnPath(path)).toBeNull();
  });
});
