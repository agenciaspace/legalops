"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase";
import {
  CHAT_AGENTS,
  STATUS_LABELS,
  type AgentOutput,
  type ChatSource,
} from "@/lib/chat/model";
import {
  ArrowUpRight,
  ArrowLeft,
  FileText,
  FolderOpen,
  Users,
  BookOpen,
  Workflow,
  Plus,
  Eye,
  Trash2,
  Download,
  Check,
  LockKeyhole,
} from "lucide-react";

type WorkspaceRecord = {
  id: string;
  name: string;
  kind: string;
  goals: string;
  professional_role: string;
  team_size: string;
};
type Matter = {
  id: string;
  title: string;
  brief: string;
  status: string;
  visibility: string;
  created_by: string;
  created_at: string;
};
type DocumentRecord = {
  id: string;
  name: string;
  kind: string;
  matter_id: string | null;
  created_at: string;
};
type Agent = { key: string; name: string; mission: string };
type Memory = { id: string; content: string; created_at: string };
type Member = { user_id: string; role: string; created_at: string };
type Run = {
  id: string;
  status: string;
  error: string | null;
  created_at: string;
  context: {
    sources: ChatSource[];
    totalPassages: number;
    selectedPassages: number;
  } | null;
};
type Step = {
  id: string;
  run_id: string;
  ordinal: number;
  agent_key: string;
  status: string;
  output: AgentOutput | null;
  error: string | null;
  model: string | null;
  cost_usd: number | null;
};
type Message = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
};
type Decision = {
  run_id: string;
  outcome: string;
  note: string;
  created_at: string;
};
type WorkspaceState = {
  role: string;
  documents: DocumentRecord[];
  matters: Matter[];
  agents: Agent[];
  memories: Memory[];
  members: Member[];
};
type Tab = "matters" | "base" | "agents" | "team" | "memory";
const initialState: WorkspaceState = {
  role: "member",
  documents: [],
  matters: [],
  agents: [],
  memories: [],
  members: [],
};
const kindNames: Record<string, string> = {
  model: "Modelo",
  policy: "Política",
  reference: "Referência",
  contract: "Minuta",
};
const tabs = [
  { id: "matters" as const, label: "Demandas", icon: FolderOpen },
  { id: "base" as const, label: "Base de conhecimento", icon: BookOpen },
  { id: "agents" as const, label: "Agentes", icon: Workflow },
  { id: "team" as const, label: "Pessoas", icon: Users },
  { id: "memory" as const, label: "Aprendizados", icon: Check },
];

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/chat/${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Não conseguimos conectar. Tente novamente." }));
  if (response.status === 401) {
    location.assign(
      `/chat/entrar?next=${encodeURIComponent(location.pathname + location.search)}`,
    );
    throw new Error("Entre na sua conta para continuar.");
  }
  if (!response.ok)
    throw new Error(data.error || "Não conseguimos concluir agora.");
  return data;
}
const post = (path: string, body: unknown) =>
  api(path, { method: "POST", body: JSON.stringify(body) });

export default function Workspace() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [user, setUser] = useState({ id: "", email: "" });
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [tab, setTab] = useState<Tab>("matters");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newMatter, setNewMatter] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [historyId, setHistoryId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    content: string;
    download: string | null;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const pending = useRef(false);
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const matter = state.matters.find((m) => m.id === matterId);
  const run = runs.find((r) => r.id === historyId) ?? runs[0];
  const isOwner = state.role === "owner";
  const loadWorkspaces = useCallback(async () => {
    const data = await api("workspaces");
    setWorkspaces(data.workspaces);
    setUser({ id: data.user_id, email: data.email });
    setWorkspaceId((current) =>
      data.workspaces.some((w: WorkspaceRecord) => w.id === current)
        ? current
        : (data.workspaces[0]?.id ?? ""),
    );
    return data.workspaces as WorkspaceRecord[];
  }, []);
  const loadState = useCallback(async () => {
    if (!workspaceId) return;
    const data = await api(`state?workspace=${workspaceId}`);
    setState(data);
    setMatterId((current) =>
      data.matters.some((m: Matter) => m.id === current)
        ? current
        : (data.matters[0]?.id ?? ""),
    );
  }, [workspaceId]);
  const loadRuns = useCallback(async () => {
    if (!workspaceId || !matterId) {
      setRuns([]);
      setSteps([]);
      setDecisions([]);
      setMessages([]);
      return;
    }
    const data = await api(`runs?workspace=${workspaceId}&matter=${matterId}`);
    setRuns(data.runs);
    setSteps(data.steps);
    setDecisions(data.decisions);
    setMessages(data.messages ?? []);
  }, [workspaceId, matterId]);
  useEffect(() => {
    let alive = true;
    loadWorkspaces()
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    setInviteToken(new URLSearchParams(location.search).get("invite") ?? "");
    return () => {
      alive = false;
    };
  }, [loadWorkspaces]);
  useEffect(() => {
    setPreview(null);
    setHistoryId("");
    setRuns([]);
    setSteps([]);
    setSelected([]);
    setConsent(false);
    loadState().catch((e) => setError(e.message));
  }, [loadState]);
  useEffect(() => {
    setHistoryId("");
    setPreview(null);
    setConsent(false);
    setSelected(
      state.documents
        .filter((d) => !d.matter_id || d.matter_id === matterId)
        .slice(0, 12)
        .map((d) => d.id),
    );
    loadRuns().catch((e) => setError(e.message));
  }, [loadRuns]); // Selection is initialized when changing demand; uploads update it explicitly.
  const latestRun = runs[0];
  useEffect(() => {
    if (!latestRun || !["queued", "running"].includes(latestRun.status)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (pending.current) {
        timer = setTimeout(tick, 2000);
        return;
      }
      pending.current = true;
      try {
        await post("runs", { action: "advance", run_id: latestRun.id });
        if (!cancelled) {
          await loadRuns();
          await loadState();
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "A execução será retomada em segundo plano.",
          );
      } finally {
        pending.current = false;
        if (!cancelled) timer = setTimeout(tick, 4000);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [latestRun?.id, latestRun?.status, loadRuns, loadState]);
  async function perform(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não conseguimos concluir agora.",
      );
    } finally {
      setBusy("");
    }
  }
  async function provision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform("provision", async () => {
      const result = await post("workspaces", Object.fromEntries(form));
      await loadWorkspaces();
      setWorkspaceId(result.id);
      setCreating(false);
      setTab("base");
      setNotice(
        "Seu espaço e os quatro agentes estão prontos. Importe os modelos e as políticas da organização.",
      );
    });
  }
  async function createMatter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform("matter", async () => {
      const result = await post("matters", {
        ...Object.fromEntries(form),
        workspace_id: workspaceId,
      });
      await loadState();
      setMatterId(result.id);
      setNewMatter(false);
      setNotice(
        "Demanda criada. Importe a minuta e escolha os documentos da análise.",
      );
    });
  }
  async function upload(
    event: React.FormEvent<HTMLFormElement>,
    targetMatter?: string,
  ) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    form.set("workspace_id", workspaceId);
    if (targetMatter) form.set("matter_id", targetMatter);
    await perform("upload", async () => {
      const result = await api("documents", { method: "POST", body: form });
      await loadState();
      setSelected((current) => [...current, result.id].slice(-12));
      element.reset();
      setNotice(
        `Documento importado: ${result.characters.toLocaleString("pt-BR")} caracteres de texto. Você pode conferir o conteúdo antes de analisar.`,
      );
    });
  }
  async function analyze() {
    await perform("run", async () => {
      await post("runs", {
        workspace_id: workspaceId,
        matter_id: matterId,
        source_ids: selected,
        consent,
      });
      setHistoryId("");
      await loadRuns();
      await loadState();
      setNotice(
        "A equipe começou. Você pode sair desta página: as etapas continuam em segundo plano.",
      );
    });
  }
  async function decide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform("decision", async () => {
      await post("decisions", {
        run_id: run!.id,
        outcome: form.get("outcome"),
        note: form.get("note"),
        remember: form.get("remember") === "on",
      });
      await loadRuns();
      await loadState();
      setNotice(
        "Decisão registrada. Para continuar, ajuste os documentos ou o contexto e inicie uma nova análise.",
      );
    });
  }
  const uploadForm = (targetMatter?: string) => (
    <form
      className="chat-upload chat-form"
      onSubmit={(event) => upload(event, targetMatter)}
    >
      <p className="chat-eyebrow">
        {targetMatter
          ? "DOCUMENTOS DESTA DEMANDA"
          : "BASE COMPARTILHADA DA ORGANIZAÇÃO"}
      </p>
      <div className="chat-form-row">
        <label>
          Arquivo
          <input
            type="file"
            name="file"
            accept=".pdf,.docx,.txt,.md,.csv"
            required
          />
          <small>PDF com texto, DOCX, TXT, MD ou CSV · até 8 MB.</small>
        </label>
        <label>
          Tipo
          <select
            name="kind"
            defaultValue={targetMatter ? "contract" : "model"}
          >
            {(targetMatter
              ? ["contract", "reference", "model", "policy"]
              : ["model", "policy", "reference"]
            ).map((k) => (
              <option key={k} value={k}>
                {kindNames[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button disabled={!!busy} className="brand-action chat-button secondary">
        {busy === "upload" ? "Importando…" : "Importar documento"}
      </button>
      <small>
        Até 40 documentos por organização. PDFs digitalizados precisam de OCR.
        Arquivos da base ficam acessíveis aos membros da organização.
      </small>
    </form>
  );
  const documentRows = (docs: DocumentRecord[], choose = false) => (
    <div className="chat-document-list">
      {docs.map((doc) => (
        <div key={doc.id} className="chat-document-row">
          {choose ? (
            <input
              aria-label={`Usar ${doc.name}`}
              type="checkbox"
              checked={selected.includes(doc.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, doc.id]
                    : current.filter((d) => d !== doc.id),
                )
              }
            />
          ) : (
            <FileText size={17} />
          )}
          <div>
            <strong>{doc.name}</strong>
            <small>
              {kindNames[doc.kind]} ·{" "}
              {doc.matter_id ? "Esta demanda" : "Base da organização"}
            </small>
          </div>
          <button
            disabled={!!busy}
            className="chat-icon-button"
            aria-label={`Conferir ${doc.name}`}
            onClick={() =>
              perform("preview", async () =>
                setPreview(
                  await api(`documents?workspace=${workspaceId}&id=${doc.id}`),
                ),
              )
            }
          >
            <Eye size={15} />
          </button>
          {!choose && isOwner && (
            <button
              disabled={!!busy}
              className="chat-icon-button"
              aria-label={`Remover ${doc.name}`}
              onClick={() => {
                if (
                  confirm(
                    "Remover este documento da base? As análises anteriores preservam seus trechos no histórico.",
                  )
                )
                  perform("delete", async () => {
                    await api("documents", {
                      method: "DELETE",
                      body: JSON.stringify({
                        workspace_id: workspaceId,
                        id: doc.id,
                      }),
                    });
                    await loadState();
                    setNotice(
                      "Documento removido da base. Os trechos usados em análises anteriores permanecem no histórico.",
                    );
                  });
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
  const previewPanel = preview && (
    <section className="brand-card chat-panel">
      <div className="brand-page-heading chat-page-heading">
        <h2>{preview.name}</h2>
        <button
          className="brand-text-link chat-inline-link"
          onClick={() => setPreview(null)}
        >
          Fechar
        </button>
      </div>
      {preview.download && (
        <a
          href={preview.download}
          className="brand-text-link chat-inline-link"
          target="_blank"
          rel="noreferrer"
        >
          <Download size={14} /> Baixar original
        </a>
      )}
      <pre className="chat-doc-preview">{preview.content}</pre>
    </section>
  );
  const output = (step: Step, sources: ChatSource[]) => (
    <details
      className="chat-output"
      key={step.id}
      open={step.agent_key === "coordinator"}
    >
      <summary>
        <span className="chat-agent-avatar">
          {CHAT_AGENTS.find((a) => a.key === step.agent_key)?.initials}
        </span>
        {CHAT_AGENTS.find((a) => a.key === step.agent_key)?.name}
        <span>{STATUS_LABELS[step.status] ?? step.status}</span>
      </summary>
      {step.output && (
        <>
          <p className="chat-output-summary">{step.output.summary}</p>
          {step.output.findings.map((finding, index) => (
            <article key={index} className={`chat-finding ${finding.severity}`}>
              <h3>{finding.title}</h3>
              <p>{finding.detail}</p>
              {finding.citations.map((citation, i) => {
                const source = sources.find((s) => s.id === citation.source_id);
                return (
                  <details key={i} className="chat-citation">
                    <summary>
                      Fonte: {source?.name ?? "Documento"} · trecho{" "}
                      {source?.position ?? ""}
                    </summary>
                    <blockquote>{citation.quote}</blockquote>
                  </details>
                );
              })}
              {finding.citations.length === 0 && (
                <p className="chat-subtle">
                  Sugestão ou lacuna sem citação documental.
                </p>
              )}
            </article>
          ))}
          {step.output.missing_information.length > 0 && (
            <>
              <p className="chat-output-label">INFORMAÇÕES QUE FALTAM</p>
              <ul className="chat-output-list">
                {step.output.missing_information.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {step.output.next_actions.length > 0 && (
            <>
              <p className="chat-output-label">PRÓXIMOS PASSOS</p>
              <ul className="chat-output-list">
                {step.output.next_actions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {step.error && step.status !== "completed" && (
        <p className="chat-subtle">{step.error}</p>
      )}
    </details>
  );
  return (
    <>
      <header className="chat-app-header">
        <Link href="/chat">
          <BrandWordmark suffix="chat" />
        </Link>
        <div className="chat-header-right">
          <span>{user.email}</span>
          <Link href="/chat" className="brand-text-link chat-inline-link">
            Sobre a ferramenta <ArrowUpRight size={12} />
          </Link>
          <button
            className="brand-text-link chat-inline-link"
            onClick={() =>
              perform("logout", async () => {
                await createClient().auth.signOut();
                location.assign("/chat");
              })
            }
          >
            Sair
          </button>
        </div>
      </header>
      {loading ? (
        <main className="chat-loading">Preparando seu espaço…</main>
      ) : creating || workspaces.length === 0 ? (
        <main className="chat-onboarding">
          {workspaces.length > 0 && (
            <button
              className="brand-text-link chat-inline-link"
              onClick={() => setCreating(false)}
            >
              <ArrowLeft size={13} /> Voltar ao meu espaço
            </button>
          )}
          <div className="chat-onboarding-steps">
            <span>01 · Seu contexto</span>
            <span>02 · Sua base</span>
            <span>03 · Primeira demanda</span>
          </div>
          <h1>vamos montar sua equipe.</h1>
          <p>
            Conte um pouco sobre a organização. Vamos preparar os agentes de
            triagem, contratos, políticas e coordenação para esse contexto.
          </p>
          {error && (
            <div role="alert" className="chat-notice error chat-top-gap">
              {error}
            </div>
          )}
          {inviteToken && (
            <section className="chat-notice chat-top-gap">
              <div>
                Você recebeu um convite para uma organização.
                <button
                  className="brand-text-link chat-inline-link"
                  onClick={() =>
                    perform("accept", async () => {
                      const result = await post("invitations", {
                        action: "accept",
                        token: inviteToken,
                      });
                      await loadWorkspaces();
                      setWorkspaceId(result.id);
                      setInviteToken("");
                      history.replaceState(null, "", "/chat/workspace");
                    })
                  }
                >
                  Aceitar convite
                </button>
              </div>
            </section>
          )}
          <form
            className="brand-card chat-panel chat-form"
            onSubmit={provision}
          >
            <label>
              Nome da organização
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Seu escritório ou empresa"
              />
            </label>
            <div className="chat-form-row">
              <label>
                Perfil
                <select name="kind">
                  <option value="firm">Escritório de advocacia</option>
                  <option value="department">Departamento jurídico</option>
                </select>
              </label>
              <label>
                Tamanho da equipe
                <select name="team_size">
                  <option value="1">Só eu, por enquanto</option>
                  <option value="2-10">2 a 10 pessoas</option>
                  <option value="11-50">11 a 50 pessoas</option>
                  <option value="51+">Mais de 50 pessoas</option>
                </select>
              </label>
            </div>
            <label>
              Sua atuação
              <input
                name="professional_role"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ex.: sócio, advogada, gerente de Legal Ops"
              />
            </label>
            <label>
              O que a equipe precisa entender?
              <textarea
                name="goals"
                maxLength={3000}
                placeholder="Áreas atendidas, tipos de contratos, prioridades e como vocês trabalham."
              />
              <small>
                Você poderá orientar cada especialista no espaço de agentes.
              </small>
            </label>
            <button className="brand-action chat-button" disabled={!!busy}>
              {busy === "provision"
                ? "Preparando sua equipe…"
                : "Criar espaço e preparar agentes"}
            </button>
            <small>
              Piloto: até cinco análises por dia por organização. A contratação
              e a revisão continuam sob responsabilidade da sua equipe.
            </small>
          </form>
        </main>
      ) : (
        <div className="chat-shell">
          <aside className="chat-sidebar">
            <div>
              <label htmlFor="chat-workspace">Organização</label>
              <select
                id="chat-workspace"
                value={workspaceId}
                onChange={(event) => {
                  setWorkspaceId(event.target.value);
                  setState(initialState);
                  setMatterId("");
                  setRuns([]);
                }}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <nav aria-label="Seu espaço">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  aria-current={tab === item.id ? "page" : undefined}
                  onClick={() => {
                    setTab(item.id);
                    setPreview(null);
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="chat-sidebar-foot">
              <p>PILOTO · CONTRATOS</p>
              <p>
                5 análises por dia
                <br />
                Fontes, histórico e revisão humana.
              </p>
              <button onClick={() => setCreating(true)}>
                + Criar outra organização
              </button>
            </div>
          </aside>
          <main className="brand-page chat-workspace-main">
            {notice && (
              <div role="status" className="chat-notice">
                <span>{notice}</span>
                <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
                  ×
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className="chat-notice error">
                <span>{error}</span>
                <button aria-label="Fechar erro" onClick={() => setError("")}>
                  ×
                </button>
              </div>
            )}
            {inviteToken && (
              <div className="chat-notice">
                <div>
                  Você tem um convite pendente.
                  <button
                    disabled={!!busy}
                    className="brand-text-link chat-inline-link"
                    onClick={() =>
                      perform("accept", async () => {
                        const result = await post("invitations", {
                          action: "accept",
                          token: inviteToken,
                        });
                        await loadWorkspaces();
                        setWorkspaceId(result.id);
                        setInviteToken("");
                        history.replaceState(null, "", "/chat/workspace");
                        setNotice("Você entrou na organização.");
                      })
                    }
                  >
                    Aceitar convite para {user.email}
                  </button>
                </div>
              </div>
            )}
            {tab === "base" && (
              <>
                <div className="brand-page-heading chat-page-heading">
                  <div>
                    <p className="chat-eyebrow">O CONTEXTO DA EQUIPE</p>
                    <h1>sua base de conhecimento.</h1>
                    <p>
                      Modelos, políticas e referências acessíveis aos membros de{" "}
                      {workspace?.name}.
                    </p>
                  </div>
                </div>
                <section className="brand-card chat-panel">
                  <h2>Documentos compartilhados</h2>
                  <p>
                    Confira o texto extraído. Ao iniciar uma análise, você
                    escolhe quais documentos os agentes podem usar.
                  </p>
                  {documentRows(state.documents.filter((d) => !d.matter_id))}
                  {state.documents.filter((d) => !d.matter_id).length === 0 && (
                    <p className="chat-subtle">
                      Sua base ainda está vazia. Comece pelo modelo de contrato
                      e por uma política interna.
                    </p>
                  )}
                  {isOwner ? (
                    uploadForm()
                  ) : (
                    <p className="chat-subtle">
                      O administrador gerencia esta base. Você pode importar
                      documentos nas demandas às quais tem acesso.
                    </p>
                  )}
                </section>
                {previewPanel}
              </>
            )}
            {tab === "agents" && (
              <>
                <div className="brand-page-heading chat-page-heading">
                  <div>
                    <p className="chat-eyebrow">ESPECIALISTAS EM CONJUNTO</p>
                    <h1>sua equipe de agentes.</h1>
                    <p>
                      Defina a missão de cada especialista. Novas análises usam
                      as orientações atualizadas.
                    </p>
                  </div>
                </div>
                <div className="chat-grid-two">
                  {CHAT_AGENTS.map((item, i) => {
                    const agent = state.agents.find((a) => a.key === item.key);
                    return (
                      <section
                        className="brand-card chat-panel chat-agent-config"
                        key={item.key}
                      >
                        <header>
                          <span className={`chat-agent-avatar tone-${i}`}>
                            {item.initials}
                          </span>
                          <h2>{item.name}</h2>
                        </header>
                        <form
                          className="chat-form"
                          key={agent?.mission}
                          onSubmit={(event) => {
                            event.preventDefault();
                            const mission = new FormData(
                              event.currentTarget,
                            ).get("mission");
                            perform("agent", async () => {
                              await api("agents", {
                                method: "PATCH",
                                body: JSON.stringify({
                                  workspace_id: workspaceId,
                                  key: item.key,
                                  mission,
                                }),
                              });
                              await loadState();
                              setNotice(
                                "Missão atualizada para as próximas análises.",
                              );
                            });
                          }}
                        >
                          <label>
                            Missão
                            <textarea
                              name="mission"
                              defaultValue={agent?.mission ?? item.description}
                              readOnly={!isOwner}
                              required
                              minLength={10}
                              maxLength={2000}
                            />
                          </label>
                          {isOwner && (
                            <button
                              className="brand-action chat-button secondary"
                              disabled={!!busy}
                            >
                              Salvar missão
                            </button>
                          )}
                          <small>
                            As regras de fontes, acesso e revisão humana são
                            preservadas.
                          </small>
                        </form>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
            {tab === "team" && (
              <>
                <div className="brand-page-heading chat-page-heading">
                  <div>
                    <p className="chat-eyebrow">PESSOAS DA ORGANIZAÇÃO</p>
                    <h1>trabalho em equipe.</h1>
                    <p>
                      {state.members.length}{" "}
                      {state.members.length === 1
                        ? "pessoa tem"
                        : "pessoas têm"}{" "}
                      acesso à base compartilhada. Demandas privadas ficam com
                      seu responsável.
                    </p>
                  </div>
                </div>
                <div className="chat-grid-two">
                  <section className="brand-card chat-panel">
                    <h2>Membros</h2>
                    {state.members.map((member, i) => (
                      <div className="chat-member-row" key={member.user_id}>
                        <span>
                          {member.user_id === user.id
                            ? `${user.email} · você`
                            : `Membro ${i + 1} · ${member.user_id.slice(0, 8)}`}
                        </span>
                        <span>
                          {member.role === "owner" ? "Administrador" : "Membro"}
                        </span>
                      </div>
                    ))}
                  </section>
                  {isOwner && (
                    <section className="brand-card chat-panel">
                      <h2>Convidar uma pessoa</h2>
                      <p>
                        O convite é vinculado ao email informado e vale por sete
                        dias. Compartilhe o link com a pessoa.
                      </p>
                      <form
                        className="chat-form chat-top-gap"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const email = new FormData(event.currentTarget).get(
                            "email",
                          );
                          perform("invite", async () => {
                            const result = await post("invitations", {
                              workspace_id: workspaceId,
                              email,
                            });
                            setInviteLink(result.url);
                          });
                        }}
                      >
                        <label>
                          Email da pessoa
                          <input
                            name="email"
                            type="email"
                            required
                            maxLength={254}
                          />
                        </label>
                        <button
                          disabled={!!busy}
                          className="brand-action chat-button secondary"
                        >
                          Gerar convite
                        </button>
                      </form>
                      {inviteLink && (
                        <div className="chat-link-box">
                          <label htmlFor="chat-invite-link">
                            Link pronto para compartilhar
                          </label>
                          <input
                            id="chat-invite-link"
                            value={inviteLink}
                            readOnly
                            className="chat-input"
                            onFocus={(event) => event.target.select()}
                          />
                          <button
                            className="brand-text-link chat-inline-link"
                            onClick={() =>
                              perform("copy", async () => {
                                await navigator.clipboard.writeText(inviteLink);
                                setNotice("Convite copiado.");
                              })
                            }
                          >
                            Copiar link
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                </div>
                <button
                  className="brand-text-link chat-inline-link chat-top-gap"
                  onClick={() => setCreating(true)}
                >
                  Criar outra organização
                </button>
              </>
            )}
            {tab === "memory" && (
              <>
                <div className="brand-page-heading chat-page-heading">
                  <div>
                    <p className="chat-eyebrow">ESPECIALIZAÇÃO COM CONTROLE</p>
                    <h1>o que sua equipe aprendeu.</h1>
                    <p>
                      Orientações aprovadas pelo administrador e consultadas nas
                      próximas análises.
                    </p>
                  </div>
                </div>
                <section className="brand-card chat-panel">
                  {state.memories.length === 0 ? (
                    <>
                      <h2>Nenhuma orientação compartilhada ainda.</h2>
                      <p>
                        Ao registrar uma decisão, o administrador pode escolher
                        salvar a orientação para toda a organização. Decisões de
                        cada caso permanecem no histórico, mesmo sem virar regra
                        geral.
                      </p>
                    </>
                  ) : (
                    state.memories.map((memory) => (
                      <article className="chat-memory-item" key={memory.id}>
                        <p>{memory.content}</p>
                        <small>
                          Registrada em{" "}
                          {new Date(memory.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </small>
                        {isOwner && (
                          <button
                            className="brand-text-link chat-inline-link"
                            disabled={!!busy}
                            onClick={() =>
                              perform("memory", async () => {
                                await api("memories", {
                                  method: "DELETE",
                                  body: JSON.stringify({
                                    workspace_id: workspaceId,
                                    id: memory.id,
                                  }),
                                });
                                await loadState();
                                setNotice(
                                  "Orientação removida das próximas análises. O histórico das decisões foi preservado.",
                                );
                              })
                            }
                          >
                            Remover das próximas análises
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </section>
              </>
            )}
            {tab === "matters" && (
              <>
                <div className="brand-page-heading chat-page-heading">
                  <div>
                    <p className="chat-eyebrow">DO PEDIDO À SUA DECISÃO</p>
                    <h1>trabalho em andamento.</h1>
                    <p>
                      {workspace?.name} ·{" "}
                      {workspace?.kind === "firm"
                        ? "Escritório de advocacia"
                        : "Departamento jurídico"}
                    </p>
                  </div>
                  <button
                    className="brand-action chat-button small"
                    onClick={() => setNewMatter((value) => !value)}
                  >
                    <Plus size={15} /> Nova demanda
                  </button>
                </div>
                {newMatter && (
                  <section className="brand-card chat-panel chat-top-gap">
                    <h2>O que vamos analisar?</h2>
                    <form className="chat-form" onSubmit={createMatter}>
                      <label>
                        Nome da demanda
                        <input
                          name="title"
                          required
                          minLength={3}
                          maxLength={160}
                          placeholder="Ex.: contrato de tecnologia — fornecedor Alfa"
                        />
                      </label>
                      <label>
                        Contexto e pedido
                        <textarea
                          name="brief"
                          required
                          minLength={10}
                          maxLength={6000}
                          placeholder="Explique a contratação, o que precisa da revisão e quais são suas dúvidas."
                        />
                      </label>
                      <label>
                        Quem pode acessar
                        <select name="visibility" defaultValue="private">
                          <option value="private">Somente eu</option>
                          <option value="workspace">
                            Membros desta organização
                          </option>
                        </select>
                      </label>
                      <div className="chat-actions-tight">
                        <button
                          disabled={!!busy}
                          className="brand-action chat-button"
                        >
                          Criar demanda
                        </button>
                        <button
                          type="button"
                          className="brand-action chat-button secondary"
                          onClick={() => setNewMatter(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </section>
                )}
                {state.matters.length === 0 && !newMatter ? (
                  <section className="chat-empty">
                    <FolderOpen size={30} />
                    <h2>sua primeira demanda.</h2>
                    <p>
                      Descreva um contrato que precisa de revisão, importe a
                      minuta e escolha os modelos e as políticas que vão
                      orientar a equipe.
                    </p>
                    <button
                      className="brand-action chat-button"
                      onClick={() => setNewMatter(true)}
                    >
                      Abrir primeira demanda <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="brand-text-link chat-inline-link"
                      style={{ display: "flex", margin: "12px auto 0" }}
                      onClick={() => setTab("base")}
                    >
                      Preparar minha base primeiro
                    </button>
                  </section>
                ) : (
                  <div className="chat-matter-layout chat-top-gap">
                    <nav className="chat-matter-list" aria-label="Demandas">
                      {state.matters.map((item) => (
                        <button
                          key={item.id}
                          aria-current={
                            item.id === matterId ? "true" : undefined
                          }
                          onClick={() => setMatterId(item.id)}
                        >
                          <strong>{item.title}</strong>
                          <small>
                            {STATUS_LABELS[item.status]} ·{" "}
                            {item.visibility === "private"
                              ? "Privada"
                              : "Compartilhada"}
                          </small>
                        </button>
                      ))}
                    </nav>
                    {matter && (
                      <div className="chat-matter-detail">
                        <section className="brand-card chat-panel">
                          <div className="chat-matter-meta">
                            <span className="chat-tag">
                              {STATUS_LABELS[matter.status]}
                            </span>
                            <span
                              className="chat-subtle"
                              style={{ marginTop: 0 }}
                            >
                              {matter.visibility === "private" ? (
                                <>
                                  <LockKeyhole
                                    size={11}
                                    style={{
                                      display: "inline",
                                      marginRight: 5,
                                    }}
                                  />{" "}
                                  Somente você
                                </>
                              ) : (
                                "Compartilhada com a organização"
                              )}
                            </span>
                          </div>
                          <h2>{matter.title}</h2>
                          <p className="chat-brief">{matter.brief}</p>
                          <p className="chat-subtle">
                            {new Date(matter.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </section>
                        <section className="brand-card chat-panel">
                          <h2>Conversa sobre esta demanda</h2>
                          <p>
                            Acrescente decisões, correções ou informações. As
                            dez mensagens mais recentes entram no contexto da
                            próxima análise.
                          </p>
                          {messages.map((message) => (
                            <article
                              className="chat-memory-item"
                              key={message.id}
                            >
                              <p>{message.body}</p>
                              <small>
                                {message.author_id === user.id
                                  ? "Você"
                                  : "Membro da equipe"}{" "}
                                ·{" "}
                                {new Date(message.created_at).toLocaleString(
                                  "pt-BR",
                                )}
                              </small>
                            </article>
                          ))}
                          <form
                            className="chat-form chat-top-gap"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const form = event.currentTarget;
                              const body = new FormData(form).get("body");
                              perform("message", async () => {
                                await post("messages", {
                                  workspace_id: workspaceId,
                                  matter_id: matterId,
                                  body,
                                });
                                await loadRuns();
                                form.reset();
                                setNotice(
                                  "Contexto adicionado. A próxima análise considerará esta mensagem.",
                                );
                              });
                            }}
                          >
                            <label>
                              Acrescentar contexto
                              <textarea
                                name="body"
                                minLength={5}
                                maxLength={6000}
                                required
                                placeholder="Ex.: o fornecedor aceitou remover a renovação automática; vamos revisar a nova versão."
                              />
                            </label>
                            <button
                              className="brand-action chat-button secondary"
                              disabled={!!busy}
                            >
                              Salvar mensagem
                            </button>
                          </form>
                        </section>
                        <section className="brand-card chat-panel">
                          <h2>Documentos desta análise</h2>
                          <p>
                            Selecione até 12 documentos. Inclua uma minuta e, se
                            disponíveis, modelos e políticas para comparação.
                          </p>
                          {documentRows(
                            state.documents.filter(
                              (d) => !d.matter_id || d.matter_id === matterId,
                            ),
                            true,
                          )}
                          {uploadForm(matterId)}
                          {(!latestRun ||
                            !["queued", "running", "review"].includes(
                              latestRun.status,
                            )) && (
                            <>
                              <label className="chat-check chat-top-gap">
                                <input
                                  type="checkbox"
                                  checked={consent}
                                  onChange={(event) =>
                                    setConsent(event.target.checked)
                                  }
                                />
                                <span>
                                  Autorizei o uso destes documentos nesta
                                  análise. Os trechos selecionados serão
                                  processados por um provedor externo de IA. Vou
                                  revisar o resultado antes de usá-lo.
                                </span>
                              </label>
                              <div className="chat-actions-tight">
                                <button
                                  className="brand-action chat-button"
                                  disabled={
                                    !!busy || !consent || !selected.length
                                  }
                                  onClick={analyze}
                                >
                                  {busy === "run"
                                    ? "Iniciando…"
                                    : runs.length
                                      ? "Analisar novamente com a equipe"
                                      : "Analisar com a equipe"}{" "}
                                  <ArrowUpRight size={15} />
                                </button>
                                <span
                                  className="chat-subtle"
                                  style={{ marginTop: 0 }}
                                >
                                  {selected.length} documentos selecionados
                                </span>
                              </div>
                              <p className="chat-subtle">
                                A análise usa até 20 trechos selecionados pelo
                                contexto. Até cinco análises por dia por
                                organização.
                              </p>
                            </>
                          )}
                        </section>
                        {previewPanel}
                        {run && (
                          <section className="brand-card chat-panel">
                            <div className="chat-matter-meta">
                              <h2 style={{ margin: 0 }}>A equipe em ação</h2>
                              <span className="chat-tag">
                                {STATUS_LABELS[run.status]}
                              </span>
                            </div>
                            <p>
                              Triagem → contratos → políticas → coordenação. As
                              etapas ficam registradas para você retomar.
                            </p>
                            <div className="chat-step-track">
                              {CHAT_AGENTS.map((agent) => {
                                const step = steps.find(
                                  (s) =>
                                    s.run_id === run.id &&
                                    s.agent_key === agent.key,
                                );
                                return (
                                  <div
                                    key={agent.key}
                                    data-status={step?.status}
                                  >
                                    <strong>{agent.name}</strong>
                                    <span>
                                      {STATUS_LABELS[step?.status ?? "queued"]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {run.context && (
                              <p className="chat-subtle">
                                Cobertura: {run.context.selectedPassages} de{" "}
                                {run.context.totalPassages} trechos disponíveis
                                nos documentos selecionados. Confira as fontes e
                                revise o documento completo quando necessário.
                              </p>
                            )}
                            {steps
                              .filter((s) => s.run_id === run.id)
                              .map((step) =>
                                output(step, run.context?.sources ?? []),
                              )}
                            {run.status === "failed" && (
                              <p className="chat-notice error chat-top-gap">
                                {run.error ??
                                  "Não conseguimos concluir esta análise. Você pode iniciar uma nova tentativa."}
                              </p>
                            )}
                            {run.context && (
                              <details className="chat-output">
                                <summary>Trechos usados pela equipe</summary>
                                {run.context.sources.map((source) => (
                                  <details
                                    className="chat-citation"
                                    key={source.id}
                                  >
                                    <summary>
                                      {source.name} · trecho {source.position}
                                    </summary>
                                    <blockquote>{source.text}</blockquote>
                                  </details>
                                ))}
                              </details>
                            )}
                          </section>
                        )}
                        {run?.status === "review" && (
                          <section className="brand-card chat-panel chat-review-box">
                            <h2>Sua revisão encerra esta etapa.</h2>
                            <p>
                              Confira os apontamentos, as fontes e o contrato.
                              Registre a decisão interna sobre esta análise.
                            </p>
                            <form
                              className="chat-form chat-top-gap"
                              onSubmit={decide}
                            >
                              <label>
                                Decisão
                                <select name="outcome">
                                  <option value="approved">
                                    Concluir análise revisada
                                  </option>
                                  <option value="changes_requested">
                                    Solicitar ajustes e continuar
                                  </option>
                                </select>
                              </label>
                              <label>
                                Decisão, correção ou orientação
                                <textarea
                                  name="note"
                                  required
                                  minLength={5}
                                  maxLength={3000}
                                  placeholder="Registre o que foi decidido e o que precisa mudar."
                                />
                              </label>
                              {isOwner && (
                                <label className="chat-check">
                                  <input name="remember" type="checkbox" />
                                  <span>
                                    Transformar este texto em orientação
                                    compartilhada para toda a organização. Mesmo
                                    em uma demanda privada, esta orientação
                                    ficará visível aos membros e será usada nas
                                    próximas análises.
                                  </span>
                                </label>
                              )}
                              <button
                                className="brand-action chat-button"
                                disabled={!!busy}
                              >
                                Registrar decisão
                              </button>
                              <small>
                                Este registro conclui a análise interna. Não
                                envia nem assina o contrato.
                              </small>
                            </form>
                          </section>
                        )}
                        {run &&
                          decisions
                            .filter((d) => d.run_id === run.id)
                            .map((d) => (
                              <section
                                className="brand-card chat-panel"
                                key={d.run_id}
                              >
                                <p className="chat-eyebrow">
                                  DECISÃO HUMANA ·{" "}
                                  {new Date(d.created_at).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </p>
                                <h2 className="chat-top-gap">
                                  {d.outcome === "approved"
                                    ? "Análise revisada e concluída."
                                    : "Ajustes solicitados."}
                                </h2>
                                <p className="chat-brief">{d.note}</p>
                              </section>
                            ))}
                        {runs.length > 1 && (
                          <details className="chat-run-history">
                            <summary>
                              Histórico · {runs.length} análises
                            </summary>
                            {runs.map((r, i) => (
                              <button
                                key={r.id}
                                onClick={() => setHistoryId(r.id)}
                              >
                                {i === 0 ? "Mais recente" : "Anterior"} ·{" "}
                                {new Date(r.created_at).toLocaleString("pt-BR")}{" "}
                                · {STATUS_LABELS[r.status]}
                              </button>
                            ))}
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </>
  );
}
