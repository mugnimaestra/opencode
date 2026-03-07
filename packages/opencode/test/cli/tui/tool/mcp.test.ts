import { describe, expect, test } from "bun:test"
import { isMcp, parse } from "../../../../src/cli/cmd/tui/routes/session/tool/mcp-parse"

const servers = {
  "my-filesystem": { status: "connected" },
  github: { status: "connected" },
  "my.server": { status: "connected" },
}

describe("parse", () => {
  test("extracts server and tool from valid MCP tool name", () => {
    expect(parse("my-filesystem_read_file", servers)).toEqual({
      server: "my-filesystem",
      tool: "read_file",
    })
  })

  test("handles single-word tool name", () => {
    expect(parse("github_search", servers)).toEqual({
      server: "github",
      tool: "search",
    })
  })

  test("sanitizes server name with special characters", () => {
    expect(parse("my_server_list", servers)).toEqual({
      server: "my.server",
      tool: "list",
    })
  })

  test("returns undefined for unknown server", () => {
    expect(parse("unknown_tool", servers)).toBeUndefined()
  })

  test("returns undefined for built-in tool names", () => {
    expect(parse("bash", servers)).toBeUndefined()
  })

  test("returns undefined for empty servers", () => {
    expect(parse("some_tool", {})).toBeUndefined()
  })

  test("returns undefined when tool name equals sanitized server name exactly", () => {
    expect(parse("github_", { github: {} })).toBeUndefined()
  })
})

describe("isMcp", () => {
  test("returns true for MCP tool name", () => {
    expect(isMcp("my-filesystem_read_file", servers)).toBe(true)
  })

  test("returns false for built-in tool", () => {
    expect(isMcp("bash", servers)).toBe(false)
  })

  test("returns false for built-in even if server prefix matches", () => {
    expect(isMcp("bash", { ba: {} })).toBe(false)
  })

  test("returns false for unknown non-builtin tool with no server match", () => {
    expect(isMcp("unknown_plugin_tool", servers)).toBe(false)
  })

  test("returns false for empty servers", () => {
    expect(isMcp("some_tool", {})).toBe(false)
  })
})
