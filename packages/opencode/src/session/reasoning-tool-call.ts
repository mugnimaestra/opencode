import { Log } from "@opencode-ai/core/util/log"

export namespace ReasoningToolCall {
  const log = Log.create({ service: "session.reasoning-tool-call" })

  export type Parsed = {
    tool: string
    input: Record<string, any>
  }

  // Match the entire tool_calls_section block
  const SECTION_RE = /<\|tool_calls_section_begin\|>([\s\S]*?)<\|tool_calls_section_end\|>/g

  // Match individual tool calls within a section
  const CALL_RE =
    /<\|tool_call_begin\|>\s*functions\.(\w+)(?::\d+)?\s*<\|tool_call_argument_begin\|>\s*([\s\S]*?)\s*<\|tool_call_end\|>/g

  export function detect(text: string): boolean {
    return text.includes("<|tool_calls_section_begin|>")
  }

  export function parse(text: string): Parsed[] {
    if (!detect(text)) return []
    const results: Parsed[] = []
    for (const section of text.matchAll(SECTION_RE)) {
      const content = section[1]
      for (const call of content.matchAll(CALL_RE)) {
        const tool = call[1]
        const raw = call[2].trim()
        try {
          const input = JSON.parse(raw)
          results.push({ tool, input })
        } catch (e) {
          log.warn("failed to parse embedded tool call arguments", {
            tool,
            raw,
            error: String(e),
          })
        }
      }
    }
    return results
  }

  export function strip(text: string): string {
    return text.replace(SECTION_RE, "").trim()
  }
}
