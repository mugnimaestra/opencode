import { describe, expect, test } from "bun:test"
import { ReasoningToolCall } from "../../src/session/reasoning-tool-call"

describe("ReasoningToolCall.detect", () => {
  test("returns true when text contains tool call section", () => {
    const text =
      "thinking... <|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {} <|tool_call_end|> <|tool_calls_section_end|>"
    expect(ReasoningToolCall.detect(text)).toBe(true)
  })

  test("returns false for plain reasoning text", () => {
    expect(ReasoningToolCall.detect("just some thinking text")).toBe(false)
  })

  test("returns false for empty string", () => {
    expect(ReasoningToolCall.detect("")).toBe(false)
  })
})

describe("ReasoningToolCall.parse", () => {
  test("parses single tool call", () => {
    const text =
      ' <|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:6 <|tool_call_argument_begin|> {"command": "ls -la", "description": "List files"} <|tool_call_end|> <|tool_calls_section_end|>'
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(1)
    expect(result[0].tool).toBe("bash")
    expect(result[0].input).toEqual({ command: "ls -la", description: "List files" })
  })

  test("parses multiple tool calls in one section", () => {
    const text = [
      "<|tool_calls_section_begin|>",
      '<|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "echo hello"} <|tool_call_end|>',
      '<|tool_call_begin|> functions.read:1 <|tool_call_argument_begin|> {"filePath": "/tmp/test.txt"} <|tool_call_end|>',
      "<|tool_calls_section_end|>",
    ].join(" ")
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(2)
    expect(result[0].tool).toBe("bash")
    expect(result[0].input).toEqual({ command: "echo hello" })
    expect(result[1].tool).toBe("read")
    expect(result[1].input).toEqual({ filePath: "/tmp/test.txt" })
  })

  test("parses multiple sections", () => {
    const text = [
      "some reasoning",
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "pwd"} <|tool_call_end|> <|tool_calls_section_end|>',
      "more reasoning",
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.write:0 <|tool_call_argument_begin|> {"filePath": "/tmp/out.txt", "content": "hi"} <|tool_call_end|> <|tool_calls_section_end|>',
    ].join("\n")
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(2)
    expect(result[0].tool).toBe("bash")
    expect(result[1].tool).toBe("write")
  })

  test("handles tool name without index", () => {
    const text =
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.grep <|tool_call_argument_begin|> {"pattern": "foo"} <|tool_call_end|> <|tool_calls_section_end|>'
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(1)
    expect(result[0].tool).toBe("grep")
    expect(result[0].input).toEqual({ pattern: "foo" })
  })

  test("skips malformed JSON arguments", () => {
    const text =
      "<|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {invalid json} <|tool_call_end|> <|tool_calls_section_end|>"
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(0)
  })

  test("returns empty array for text without tool calls", () => {
    expect(ReasoningToolCall.parse("just thinking")).toEqual([])
  })

  test("handles escaped characters in JSON", () => {
    const text =
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "echo \\"hello\\""} <|tool_call_end|> <|tool_calls_section_end|>'
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(1)
    expect(result[0].input.command).toBe('echo "hello"')
  })

  test("handles multiline JSON arguments", () => {
    const text = [
      "<|tool_calls_section_begin|>",
      "<|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|>",
      '{"command": "cd /tmp && ls -la scrapling_env/ 2>/dev/null || echo \\"No venv found\\" && /opt/homebrew/bin/python3.13 -m venv scrapling_env && ls -la scrapling_env/", "description": "Create venv properly"}',
      "<|tool_call_end|>",
      "<|tool_calls_section_end|>",
    ].join("\n")
    const result = ReasoningToolCall.parse(text)
    expect(result).toHaveLength(1)
    expect(result[0].tool).toBe("bash")
    expect(result[0].input.description).toBe("Create venv properly")
  })
})

describe("ReasoningToolCall.strip", () => {
  test("removes tool call sections from text", () => {
    const text =
      'thinking about this <|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "ls"} <|tool_call_end|> <|tool_calls_section_end|> more thinking'
    const result = ReasoningToolCall.strip(text)
    expect(result).toBe("thinking about this  more thinking")
  })

  test("removes multiple sections", () => {
    const text = [
      "start",
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "a"} <|tool_call_end|> <|tool_calls_section_end|>',
      "middle",
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.read:0 <|tool_call_argument_begin|> {"filePath": "b"} <|tool_call_end|> <|tool_calls_section_end|>',
      "end",
    ].join("\n")
    const result = ReasoningToolCall.strip(text)
    expect(result).toBe("start\n\nmiddle\n\nend")
  })

  test("returns original text when no sections present", () => {
    expect(ReasoningToolCall.strip("no tool calls here")).toBe("no tool calls here")
  })

  test("returns empty string when text is only tool calls", () => {
    const text =
      '<|tool_calls_section_begin|> <|tool_call_begin|> functions.bash:0 <|tool_call_argument_begin|> {"command": "ls"} <|tool_call_end|> <|tool_calls_section_end|>'
    expect(ReasoningToolCall.strip(text)).toBe("")
  })
})
