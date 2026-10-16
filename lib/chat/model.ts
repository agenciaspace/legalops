export const CHAT_AGENTS = [
  {
    key: "intake",
    name: "Triagem",
    initials: "TR",
    description: "Organiza a demanda, o contexto e as informações que faltam.",
  },
  {
    key: "contracts",
    name: "Contratos",
    initials: "CO",
    description: "Compara a minuta com seus modelos e propõe ajustes.",
  },
  {
    key: "policies",
    name: "Políticas",
    initials: "PO",
    description: "Cruza a demanda com as orientações da organização.",
  },
  {
    key: "coordinator",
    name: "Coordenação",
    initials: "CD",
    description: "Conecta as análises e prepara os próximos passos.",
  },
] as const;
export type AgentKey = (typeof CHAT_AGENTS)[number]["key"];
export type ChatSource = {
  id: string;
  document_id: string;
  name: string;
  kind: string;
  text: string;
  position: number;
};
export type AgentOutput = {
  summary: string;
  findings: {
    title: string;
    detail: string;
    severity: "attention" | "info";
    citations: { source_id: string; quote: string }[];
  }[];
  next_actions: string[];
  missing_information: string[];
};
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const STATUS_LABELS: Record<string, string> = {
  draft: "Preparando",
  queued: "Na fila",
  running: "Em andamento",
  review: "Sua revisão",
  completed: "Concluído",
  failed: "Precisa de atenção",
  changes_requested: "Ajustes solicitados",
};
export function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
export function makeSources(
  documents: { id: string; name: string; kind: string; content: string }[],
  query: string,
) {
  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .match(/[a-z]{4,}/g) ?? [],
    ),
  );
  const chunks = documents.flatMap((doc) => {
    const result: (ChatSource & { score: number })[] = [];
    for (
      let offset = 0, index = 0;
      offset < doc.content.length;
      offset += 1400, index++
    ) {
      if (index > 0 && offset + 300 >= doc.content.length) break;
      const text = doc.content.slice(offset, offset + 1700);
      const comparable = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      result.push({
        id: `${doc.id}:${index}`,
        document_id: doc.id,
        name: doc.name,
        kind: doc.kind,
        text,
        position: index + 1,
        score: terms.reduce((n, t) => n + (comparable.includes(t) ? 1 : 0), 0),
      });
    }
    return result;
  });
  // Cover every selected document, then rank the remaining passages. The UI
  // explicitly identifies passage-based analysis rather than claiming full review.
  const selected: ChatSource[] = documents
    .map(
      (doc) =>
        chunks
          .filter((c) => c.document_id === doc.id)
          .sort((a, b) => b.score - a.score)[0],
    )
    .filter(Boolean);
  for (const chunk of [...chunks].sort((a, b) => b.score - a.score)) {
    if (selected.length >= 20) break;
    if (!selected.some((s) => s.id === chunk.id)) selected.push(chunk);
  }
  return {
    sources: selected.map(
      ({ document_id, name, kind, text, position }, index) => ({
        id: `S${index + 1}`,
        document_id,
        name,
        kind,
        text,
        position,
      }),
    ),
    totalPassages: chunks.length,
    selectedPassages: selected.length,
  };
}
export function parseAgentOutput(
  raw: string,
  sources: ChatSource[],
): AgentOutput {
  const value = JSON.parse(
    raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, ""),
  );
  if (
    !value ||
    typeof value.summary !== "string" ||
    value.summary.length < 5 ||
    value.summary.length > 4000 ||
    !Array.isArray(value.findings) ||
    value.findings.length > 12
  )
    throw new Error("invalid_output");
  const strings = (items: unknown): string[] => {
    if (
      !Array.isArray(items) ||
      items.length > 12 ||
      items.some((x) => typeof x !== "string" || x.length > 1500)
    )
      throw new Error("invalid_output");
    return items;
  };
  const findings = value.findings.map((f: Record<string, unknown>) => {
    if (
      typeof f.title !== "string" ||
      f.title.length > 200 ||
      typeof f.detail !== "string" ||
      f.detail.length > 3000 ||
      !["attention", "info"].includes(String(f.severity)) ||
      !Array.isArray(f.citations) ||
      f.citations.length > 6
    )
      throw new Error("invalid_output");
    const citations = f.citations.map(
      (c: { source_id: string; quote?: string }) => {
        if (!c || typeof c.source_id !== "string") throw new Error("invalid_citation");
        const source = sources.find((s) => s.id === c.source_id);
        if (!source) throw new Error("invalid_citation");
        // The model selects a source; the server supplies its exact stored text.
        // Legacy outputs with an explicit quote still require literal verification.
        if (c.quote === undefined) return { source_id: source.id, quote: source.text };
        if (
          typeof c.quote !== "string" ||
          normalizedText(c.quote).length < 12 ||
          c.quote.length > 700 ||
          !normalizedText(source.text).includes(normalizedText(c.quote))
        )
          throw new Error("invalid_citation");
        return { source_id: c.source_id, quote: c.quote };
      },
    );
    return {
      title: f.title,
      detail: f.detail,
      severity: f.severity as "attention" | "info",
      citations,
    };
  });
  return {
    summary: value.summary,
    findings,
    next_actions: strings(value.next_actions),
    missing_information: strings(value.missing_information),
  };
}
export function chatReturnPath(value: unknown): string | null {
  return typeof value === "string" &&
    /^\/chat\/workspace(?:\?invite=[a-f0-9]{64})?$/.test(value)
    ? value
    : null;
}
