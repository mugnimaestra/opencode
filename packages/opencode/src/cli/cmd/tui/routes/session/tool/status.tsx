import type { ToolPart } from "@opencode-ai/sdk/v2"

export function status<T>(part: ToolPart, icon: string, theme: { error: T }): { icon: string; color?: T } {
  if (part.state.status === "error") {
    const err = part.state.error
    const denied =
      err?.includes("rejected permission") || err?.includes("specified a rule") || err?.includes("user dismissed")
    if (!denied) return { icon: "✗", color: theme.error }
  }
  return { icon, color: undefined }
}
