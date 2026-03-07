import type { ToolPart, FilePart } from "@opencode-ai/sdk/v2"

// ---------- ToolPart factories ----------

export function completed(overrides?: {
  tool?: string
  input?: Record<string, unknown>
  output?: string
  title?: string
  metadata?: Record<string, unknown>
  time?: { start: number; end: number; compacted?: number }
  attachments?: FilePart[]
}): ToolPart {
  return {
    id: "part_1",
    sessionID: "ses_1",
    messageID: "msg_1",
    type: "tool",
    callID: "call_1",
    tool: overrides?.tool ?? "bash",
    state: {
      status: "completed",
      input: overrides?.input ?? {},
      output: overrides?.output ?? "",
      title: overrides?.title ?? "some title",
      metadata: overrides?.metadata ?? {},
      time: overrides?.time ?? { start: 0, end: 1000 },
      attachments: overrides?.attachments,
    },
  }
}

export function errored(overrides?: {
  tool?: string
  input?: Record<string, unknown>
  error?: string
  metadata?: Record<string, unknown>
  time?: { start: number; end: number }
}): ToolPart {
  return {
    id: "part_1",
    sessionID: "ses_1",
    messageID: "msg_1",
    type: "tool",
    callID: "call_1",
    tool: overrides?.tool ?? "bash",
    state: {
      status: "error",
      input: overrides?.input ?? {},
      error: overrides?.error ?? "Command failed with exit code 1",
      metadata: overrides?.metadata,
      time: overrides?.time ?? { start: 0, end: 500 },
    },
  }
}

export function running(overrides?: { tool?: string; input?: Record<string, unknown>; title?: string }): ToolPart {
  return {
    id: "part_1",
    sessionID: "ses_1",
    messageID: "msg_1",
    type: "tool",
    callID: "call_1",
    tool: overrides?.tool ?? "bash",
    state: {
      status: "running",
      input: overrides?.input ?? {},
      title: overrides?.title,
      time: { start: Date.now() },
    },
  }
}

export function pending(overrides?: { tool?: string; input?: Record<string, unknown> }): ToolPart {
  return {
    id: "part_1",
    sessionID: "ses_1",
    messageID: "msg_1",
    type: "tool",
    callID: "call_1",
    tool: overrides?.tool ?? "bash",
    state: {
      status: "pending",
      input: overrides?.input ?? {},
      raw: "",
    },
  }
}

// ---------- FilePart factories ----------

export function attachment(overrides?: { mime?: string; filename?: string; url?: string }): FilePart {
  return {
    id: "file_1",
    sessionID: "ses_1",
    messageID: "msg_1",
    type: "file",
    mime: overrides?.mime ?? "image/png",
    filename: overrides?.filename ?? "screenshot.png",
    url: overrides?.url ?? "file:///tmp/screenshot.png",
  }
}

// ---------- Theme stub ----------

export const theme = {
  error: { r: 255, g: 0, b: 0, a: 255 },
  warning: { r: 255, g: 165, b: 0, a: 255 },
  text: { r: 200, g: 200, b: 200, a: 255 },
  textMuted: { r: 128, g: 128, b: 128, a: 255 },
  background: { r: 30, g: 30, b: 30, a: 255 },
  backgroundPanel: { r: 40, g: 40, b: 40, a: 255 },
  backgroundMenu: { r: 50, g: 50, b: 50, a: 255 },
}
