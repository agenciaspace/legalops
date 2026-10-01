import Link from "next/link";
import { requireLegalOpsAdmin } from "@/lib/legalops-admin";
import { createCommunityEvent } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewCommunityEventPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  await requireLegalOpsAdmin("/community/events/new");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 lg:py-12">
      <Link href="/community/events/manage" className="text-xs font-bold text-[#D9470F]">
        ← Gerenciar eventos
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Criar evento</h1>
      <p className="mt-2 text-sm leading-6 text-[#716B65]">
        Ao criar, o evento recebe um link permanente e é sincronizado com o Google Calendar de hi@legalops.club. Eventos remotos ou híbridos também recebem um Google Meet.
      </p>
      {searchParams?.error ? (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {searchParams.error === "fields"
            ? "Revise os campos e confirme que o fim ocorre depois do início."
            : "Não foi possível criar o evento agora."}
        </p>
      ) : null}
      <form action={createCommunityEvent} className="mt-6 space-y-5 rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-7">
        <label className="block text-sm font-semibold">Título<input name="title" required minLength={3} maxLength={180} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
        <label className="block text-sm font-semibold">Descrição<textarea name="description" required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm font-semibold">Organização anfitriã<input name="host_name" required defaultValue="legalops.club" className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Início (Brasília)<input name="starts_at" type="datetime-local" required className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
          <label className="block text-sm font-semibold">Fim (Brasília)<input name="ends_at" type="datetime-local" required className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
        </div>
        <label className="block text-sm font-semibold">Formato<select name="participation_mode" defaultValue="remoto" className="mt-2 min-h-11 w-full rounded-lg border px-3"><option value="remoto">Remoto</option><option value="presencial">Presencial</option><option value="hibrido">Híbrido</option></select></label>
        <label className="block text-sm font-semibold">Local<input name="location_label" required defaultValue="Google Meet" className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
        <label className="block text-sm font-semibold">URL do local (opcional)<input name="location_url" type="url" placeholder="https://..." className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>
        <label className="block text-sm font-semibold">Instruções para participar<textarea name="participation_details" rows={4} maxLength={3000} className="mt-2 w-full rounded-lg border p-3" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input name="is_published" type="checkbox" defaultChecked /> Publicar imediatamente</label>
        <button className="min-h-12 rounded-lg bg-[#24231F] px-5 text-sm font-bold text-white">Criar evento e sincronizar agenda</button>
      </form>
    </main>
  );
}
