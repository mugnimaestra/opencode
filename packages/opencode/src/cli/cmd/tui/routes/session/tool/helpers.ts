import type { ToolPart } from "@opencode-ai/sdk/v2"

export function denied(error?: string): boolean {
  if (!error) return false
  return error.includes("rejected permission") || error.includes("specified a rule") || error.includes("user dismissed")
}

export function autoExpand(part: ToolPart, opts?: { error?: boolean; auto?: boolean }): boolean {
  if (part.state.status === "error" && !denied(part.state.error)) {
    return opts?.error !== false
  }
  if (part.state.status === "running" && opts?.auto) {
    return true
  }
  return false
}

export function duration(part: ToolPart): number | undefined {
  if (part.state.status === "completed" || part.state.status === "error") {
    return part.state.time.end - part.state.time.start
  }
  return undefined
}
