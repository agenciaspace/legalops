import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  chatFailure,
  chatJson,
  chatSession,
  ChatError,
  databaseFailure,
} from "@/lib/chat/access";
import { UUID } from "@/lib/chat/model";
import { extractDocument } from "@/lib/chat/documents";
import { processChatStep } from "@/lib/chat/engine";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
const id = (v: unknown) => {
  if (typeof v !== "string" || !UUID.test(v))
    throw new ChatError("Identificador inválido.");
  return v;
};
const text = (v: unknown, min: number, max: number) => {
  if (typeof v !== "string" || v.trim().length < min || v.trim().length > max)
    throw new ChatError("Confira os campos e o tamanho dos textos.");
  return v.trim();
};
async function digest(token: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
}
type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await chatSession(request);
    const resource = params.path[0];
    if (resource === "workspaces") {
      const result = await supabase
        .from("chat_workspaces")
        .select("*")
        .order("created_at");
      if (result.error) throw result.error;
      return chatJson({
        workspaces: result.data,
        user_id: user.id,
        email: user.email,
      });
    }
    const workspace = id(request.nextUrl.searchParams.get("workspace"));
    const member = await supabase
      .from("chat_members")
      .select("role")
      .eq("workspace_id", workspace)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member.data) throw new ChatError("Organização não encontrada.", 404);
    if (resource === "state") {
      const results = await Promise.all([
        supabase
          .from("chat_documents")
          .select("id,name,kind,matter_id,created_at")
          .eq("workspace_id", workspace)
          .order("created_at", { ascending: false }),
        supabase
          .from("chat_matters")
          .select("*")
          .eq("workspace_id", workspace)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase.from("chat_agents").select("*").eq("workspace_id", workspace),
        supabase
          .from("chat_memories")
          .select("*")
          .eq("workspace_id", workspace)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("chat_members")
          .select("user_id,role,created_at")
          .eq("workspace_id", workspace),
      ]);
      if (results.some((r) => r.error)) throw new Error("state_unavailable");
      return chatJson({
        role: member.data.role,
        documents: results[0].data,
        matters: results[1].data,
        agents: results[2].data,
        memories: results[3].data,
        members: results[4].data,
      });
    }
    if (resource === "runs") {
      const matter = id(request.nextUrl.searchParams.get("matter"));
      const runs = await supabase
        .from("chat_runs")
        .select("*")
        .eq("workspace_id", workspace)
        .eq("matter_id", matter)
        .order("created_at", { ascending: false })
        .limit(12);
      if (runs.error) throw runs.error;
      const runIds = (runs.data ?? []).map((r) => r.id);
      const [steps, decisions] = runIds.length
        ? await Promise.all([
            supabase
              .from("chat_steps")
              .select(
                "id,run_id,ordinal,agent_key,status,output,error,attempts,model,cost_usd,started_at,completed_at",
              )
              .in("run_id", runIds)
              .order("ordinal"),
            supabase.from("chat_decisions").select("*").in("run_id", runIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];
      if (steps.error || decisions.error) throw new Error("runs_unavailable");
      const messages = await supabase
        .from("chat_messages")
        .select("id,body,author_id,created_at")
        .eq("matter_id", matter)
        .order("created_at")
        .limit(100);
      if (messages.error) throw messages.error;
      return chatJson({
        runs: runs.data,
        steps: steps.data,
        decisions: decisions.data,
        messages: messages.data,
      });
    }
    if (resource === "documents") {
      const document = id(request.nextUrl.searchParams.get("id"));
      const result = await supabase
        .from("chat_documents")
        .select("content,name,storage_path")
        .eq("id", document)
        .eq("workspace_id", workspace)
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new ChatError("Documento não encontrado.", 404);
      const signed = result.data.storage_path
        ? await createAdminClient()
            .storage.from("chat-documents")
            .createSignedUrl(result.data.storage_path, 60)
        : null;
      return chatJson({
        name: result.data.name,
        content: result.data.content,
        download: signed?.data?.signedUrl ?? null,
      });
    }
    throw new ChatError("Página não encontrada.", 404);
  } catch (error) {
    return chatFailure(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await chatSession(request, true);
    const admin = createAdminClient();
    const resource = params.path[0];
    if (resource === "documents") {
      const form = await request.formData();
      const workspace = id(form.get("workspace_id"));
      const matter = form.get("matter_id") ? id(form.get("matter_id")) : null;
      const allowed = await supabase
        .from("chat_members")
        .select("role")
        .eq("workspace_id", workspace)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!allowed.data)
        throw new ChatError("Organização não encontrada.", 404);
      if (!matter && allowed.data.role !== "owner")
        throw new ChatError(
          "Somente o administrador pode alterar a base compartilhada.",
          403,
        );
      if (matter) {
        const access = await supabase
          .from("chat_matters")
          .select("id")
          .eq("id", matter)
          .eq("workspace_id", workspace)
          .maybeSingle();
        if (!access.data) throw new ChatError("Demanda não encontrada.", 404);
      }
      const file = form.get("file");
      if (!(file instanceof File)) throw new ChatError("Selecione um arquivo.");
      const kind = form.get("kind");
      if (
        !["model", "policy", "reference", "contract"].includes(String(kind)) ||
        (!matter && kind === "contract")
      )
        throw new ChatError("Selecione o tipo de documento.");
      let extracted: Awaited<ReturnType<typeof extractDocument>>;
      try {
        extracted = await extractDocument(file);
      } catch (error) {
        throw new ChatError(
          error instanceof Error
            ? error.message
            : "Não conseguimos ler este arquivo.",
        );
      }
      const docId = crypto.randomUUID();
      const path = `${workspace}/${docId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
      const uploaded = await admin.storage
        .from("chat-documents")
        .upload(path, extracted.bytes, {
          contentType: extracted.mime,
          upsert: false,
        });
      if (uploaded.error)
        throw new ChatError(
          "Não conseguimos armazenar o arquivo. Tente novamente.",
          503,
        );
      const saved = await admin.rpc("chat_add_document", {
        actor: user.id,
        doc: {
          id: docId,
          workspace_id: workspace,
          matter_id: matter,
          name: file.name.slice(0, 180),
          kind,
          content: extracted.text,
          storage_path: path,
          mime: extracted.mime,
          sha256: extracted.hash,
        },
      });
      if (saved.error) {
        await admin.storage.from("chat-documents").remove([path]);
        databaseFailure(saved.error.code, saved.error.message);
      }
      return chatJson(
        { id: saved.data, characters: extracted.text.length },
        201,
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) throw new ChatError("Dados inválidos.");
    if (resource === "workspaces") {
      if (
        !["firm", "department"].includes(body.kind) ||
        !["1", "2-10", "11-50", "51+"].includes(body.team_size)
      )
        throw new ChatError("Selecione o perfil e o tamanho da equipe.");
      const config = {
        name: text(body.name, 2, 120),
        kind: body.kind,
        professional_role: text(body.professional_role, 2, 100),
        team_size: body.team_size,
        goals: text(body.goals, 0, 3000),
      };
      const result = await admin.rpc("chat_provision", {
        actor: user.id,
        config,
      });
      if (result.error)
        databaseFailure(result.error.code, result.error.message);
      return chatJson({ id: result.data }, 201);
    }
    if (resource === "invitations" && body.action === "accept") {
      if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token))
        throw new ChatError("Convite inválido.");
      const result = await admin.rpc("chat_accept_invitation", {
        actor: user.id,
        verified_email: user.email,
        digest: await digest(body.token),
      });
      if (result.error)
        databaseFailure(result.error.code, result.error.message);
      return chatJson({ id: result.data });
    }
    if (resource === "runs" && body.action === "advance") {
      const run = id(body.run_id);
      const access = await supabase
        .from("chat_runs")
        .select("id")
        .eq("id", run)
        .maybeSingle();
      if (!access.data) throw new ChatError("Análise não encontrada.", 404);
      return chatJson(await processChatStep(run));
    }
    if (resource === "decisions") {
      if (
        !["approved", "changes_requested"].includes(body.outcome) ||
        typeof body.remember !== "boolean"
      )
        throw new ChatError("Escolha uma decisão.");
      const result = await admin.rpc("chat_record_decision", {
        actor: user.id,
        target_run: id(body.run_id),
        verdict: body.outcome,
        explanation: text(body.note, 5, 3000),
        remember: body.remember,
      });
      if (result.error)
        databaseFailure(result.error.code, result.error.message);
      return chatJson({ id: result.data }, 201);
    }
    const workspace = id(body.workspace_id);
    const member = await supabase
      .from("chat_members")
      .select("role")
      .eq("workspace_id", workspace)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member.data) throw new ChatError("Organização não encontrada.", 404);
    if (resource === "matters") {
      const result = await admin
        .from("chat_matters")
        .insert({
          workspace_id: workspace,
          created_by: user.id,
          title: text(body.title, 3, 160),
          brief: text(body.brief, 10, 6000),
          visibility: body.visibility === "workspace" ? "workspace" : "private",
        })
        .select("id")
        .single();
      if (result.error)
        databaseFailure(result.error.code, result.error.message);
      return chatJson({ id: result.data!.id }, 201);
    }
    if (resource === "messages") {
      const matter = id(body.matter_id);
      const access = await supabase
        .from("chat_matters")
        .select("id")
        .eq("id", matter)
        .eq("workspace_id", workspace)
        .maybeSingle();
      if (!access.data) throw new ChatError("Demanda não encontrada.", 404);
      const result = await admin
        .from("chat_messages")
        .insert({
          matter_id: matter,
          author_id: user.id,
          body: text(body.body, 5, 6000),
        })
        .select("id")
        .single();
      if (result.error) throw result.error;
      return chatJson({ id: result.data!.id }, 201);
    }
    if (resource === "runs") {
      if (body.consent !== true)
        throw new ChatError(
          "Confirme a autorização para analisar os documentos selecionados.",
        );
      const matter = id(body.matter_id);
      if (!Array.isArray(body.source_ids) || body.source_ids.length > 12)
        throw new ChatError("Selecione até 12 documentos.");
      const access = await supabase
        .from("chat_matters")
        .select("id")
        .eq("id", matter)
        .eq("workspace_id", workspace)
        .maybeSingle();
      if (!access.data) throw new ChatError("Demanda não encontrada.", 404);
      const result = await admin.rpc("chat_start_run", {
        actor: user.id,
        matter,
        sources: body.source_ids.map(id),
      });
      if (result.error)
        databaseFailure(result.error.code, result.error.message);
      return chatJson({ id: result.data }, 201);
    }
    if (resource === "invitations") {
      if (member.data.role !== "owner")
        throw new ChatError(
          "Somente o administrador pode convidar pessoas.",
          403,
        );
      const email = text(body.email, 5, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new ChatError("Confira o email.");
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (v) => v.toString(16).padStart(2, "0"),
      ).join("");
      const result = await admin.from("chat_invitations").insert({
        workspace_id: workspace,
        email,
        token_hash: await digest(token),
        invited_by: user.id,
      });
      if (result.error) throw result.error;
      // The administrator shares this link; the API does not send unsolicited email.
      return chatJson(
        { url: `https://legalops.club/chat/workspace?invite=${token}` },
        201,
      );
    }
    throw new ChatError("Ação não encontrada.", 404);
  } catch (error) {
    return chatFailure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await chatSession(request, true);
    const body = await request.json();
    const workspace = id(body.workspace_id);
    const member = await supabase
      .from("chat_members")
      .select("role")
      .eq("workspace_id", workspace)
      .eq("user_id", user.id)
      .maybeSingle();
    if (member.data?.role !== "owner")
      throw new ChatError(
        "Somente o administrador pode configurar os agentes.",
        403,
      );
    if (!["intake", "contracts", "policies", "coordinator"].includes(body.key))
      throw new ChatError("Agente inválido.");
    const result = await createAdminClient()
      .from("chat_agents")
      .update({ mission: text(body.mission, 10, 2000) })
      .eq("workspace_id", workspace)
      .eq("key", body.key);
    if (result.error) throw result.error;
    return chatJson({ ok: true });
  } catch (error) {
    return chatFailure(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await chatSession(request, true);
    const body = await request.json();
    const workspace = id(body.workspace_id);
    const target = id(body.id);
    const member = await supabase
      .from("chat_members")
      .select("role")
      .eq("workspace_id", workspace)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member.data) throw new ChatError("Organização não encontrada.", 404);
    const admin = createAdminClient();
    if (params.path[0] === "memories") {
      if (member.data.role !== "owner")
        throw new ChatError(
          "Somente o administrador pode remover orientações.",
          403,
        );
      const result = await admin
        .from("chat_memories")
        .delete()
        .eq("id", target)
        .eq("workspace_id", workspace);
      if (result.error) throw result.error;
    } else if (params.path[0] === "documents") {
      const result = await supabase
        .from("chat_documents")
        .select("created_by,storage_path")
        .eq("id", target)
        .eq("workspace_id", workspace)
        .maybeSingle();
      if (!result.data) throw new ChatError("Documento não encontrado.", 404);
      if (result.data.created_by !== user.id && member.data.role !== "owner")
        throw new ChatError("Você não pode remover este documento.", 403);
      const deleted = await admin
        .from("chat_documents")
        .delete()
        .eq("id", target)
        .eq("workspace_id", workspace);
      if (deleted.error) throw deleted.error;
      if (result.data.storage_path) {
        const removed = await admin.storage
          .from("chat-documents")
          .remove([result.data.storage_path]);
        if (removed.error)
          console.error("[chat] original cleanup pending", target);
      }
    } else throw new ChatError("Ação não encontrada.", 404);
    return chatJson({ ok: true });
  } catch (error) {
    return chatFailure(error);
  }
}
