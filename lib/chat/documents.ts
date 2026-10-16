import { extractText, getDocumentProxy } from "unpdf";
import { unzipSync, strFromU8 } from "fflate";

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export async function extractDocument(file: File) {
  if (file.size > MAX_FILE_BYTES)
    throw new Error("Use um arquivo de até 8 MB.");
  const ext = file.name.toLowerCase().split(".").pop();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  let mime = "text/plain";
  if (ext === "pdf") {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      throw new Error("O arquivo não é um PDF válido.");
    const pdf = await getDocumentProxy(bytes.slice());
    try {
      if (pdf.numPages > 80)
        throw new Error("Divida o PDF em arquivos de até 80 páginas.");
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
      mime = "application/pdf";
    } finally {
      await pdf.cleanup();
    }
  } else if (ext === "docx") {
    let oversized = false;
    const files = unzipSync(bytes, {
      filter: (entry) => {
        if (entry.name !== "word/document.xml") return false;
        if (entry.originalSize > 2 * 1024 * 1024) {
          oversized = true;
          return false;
        }
        return true;
      },
    });
    if (oversized || !files["word/document.xml"])
      throw new Error(
        "DOCX inválido ou muito extenso. Exporte uma parte como texto.",
      );
    text = strFromU8(files["word/document.xml"])
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
    mime =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (["txt", "md", "csv"].includes(ext ?? "")) {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.includes("\u0000"))
      throw new Error("Exporte o arquivo como texto UTF-8.");
    mime =
      ext === "md"
        ? "text/markdown"
        : ext === "csv"
          ? "text/csv"
          : "text/plain";
  } else throw new Error("Use PDF com texto, DOCX, TXT, Markdown ou CSV.");
  text = text.replace(/\u0000/g, "").trim();
  if (text.length < 30)
    throw new Error(
      "Não encontramos texto suficiente. Para PDFs digitalizados, faça o OCR antes de importar.",
    );
  if (text.length > 120000)
    throw new Error(
      "O documento ultrapassa 120 mil caracteres. Divida-o antes de importar.",
    );
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
  return { text, mime, hash, bytes };
}
