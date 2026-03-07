export const MIME_ICON: Record<string, string> = {
  "image/png": "🖼",
  "image/jpeg": "🖼",
  "image/gif": "🖼",
  "image/webp": "🖼",
  "image/svg+xml": "🖼",
  "application/pdf": "📄",
  "text/plain": "📝",
  "text/html": "📝",
  "text/csv": "📝",
  "application/json": "📝",
}

export const FALLBACK_ICON = "📎"

export function icon(mime: string): string {
  return MIME_ICON[mime] ?? FALLBACK_ICON
}

export function label(filename?: string): string {
  return filename ?? "unnamed"
}
