import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export class ChatError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function chatJson(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function chatSession(request: NextRequest, write = false) {
  if (write && request.headers.get("origin") !== request.nextUrl.origin)
    throw new ChatError("Atualize a página antes de continuar.", 403);
  if (
    write &&
    Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024
  )
    throw new ChatError("Use um arquivo de até 8 MB.", 413);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    throw new ChatError("Entre na sua conta para continuar.", 401);
  if (!user.email_confirmed_at)
    throw new ChatError("Confirme seu email antes de continuar.", 403);
  return { supabase, user };
}
export function chatFailure(error: unknown) {
  return chatJson(
    {
      error:
        error instanceof ChatError
          ? error.message
          : "Não conseguimos concluir agora. Tente novamente.",
    },
    error instanceof ChatError ? error.status : 503,
  );
}
export function databaseFailure(
  code: string | undefined,
  message: string | undefined,
) {
  const errors: Record<string, string> = {
    workspace_limit: "Você pode criar até três organizações neste piloto.",
    document_limit: "O piloto aceita até 40 documentos por organização.",
    duplicate_document: "Este conteúdo já foi importado neste espaço.",
    daily_limit:
      "Esta organização usou as cinco análises diárias do piloto. O limite renova às 21h de Brasília.",
    contract_required: "Importe e selecione uma minuta para esta demanda.",
    invalid_sources: "Selecione até 12 documentos acessíveis nesta demanda.",
    owner_required: "Esta configuração é exclusiva do administrador.",
    forbidden: "Você não tem acesso a este conteúdo.",
    not_in_review:
      "Esta análise já recebeu uma decisão ou ainda está em andamento.",
    invalid_invitation:
      "Convite inválido, expirado ou destinado a outro email.",
  };
  const key = Object.keys(errors).find((k) => message?.includes(k));
  if (key)
    throw new ChatError(
      errors[key],
      key === "forbidden" || key === "owner_required" ? 403 : 409,
    );
  if (code === "23505")
    throw new ChatError(
      "Já existe uma análise aguardando conclusão ou revisão nesta demanda.",
      409,
    );
  throw new ChatError(
    "Não conseguimos salvar. Confira os dados e tente novamente.",
    503,
  );
}
