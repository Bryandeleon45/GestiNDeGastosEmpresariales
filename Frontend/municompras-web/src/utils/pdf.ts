// Convierte contenido base64 (crudo o ya como data URL) en una URL
// embebible en <iframe>/<embed> para previsualizar PDFs.
export function toPdfSrc(content?: string | null, mime?: string | null): string {
  if (!content) return ""
  const trimmed = content.trim()
  if (/^data:/i.test(trimmed)) return trimmed
  return `data:${mime || "application/pdf"};base64,${trimmed}`
}
