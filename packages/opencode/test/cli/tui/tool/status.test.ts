import { describe, expect, test } from "bun:test"
import { status } from "../../../../src/cli/cmd/tui/routes/session/tool/status"
import { completed, errored, running, pending, theme } from "./fixture"

describe("status", () => {
  test("completed tool returns original icon", () => {
    const result = status(completed(), "$", theme)
    expect(result.icon).toBe("$")
    expect(result.color).toBeUndefined()
  })

  test("running tool returns original icon", () => {
    const result = status(running(), "✱", theme)
    expect(result.icon).toBe("✱")
    expect(result.color).toBeUndefined()
  })

  test("pending tool returns original icon", () => {
    const result = status(pending(), "→", theme)
    expect(result.icon).toBe("→")
    expect(result.color).toBeUndefined()
  })

  test("error tool returns ✗ with error color", () => {
    const result = status(errored(), "$", theme)
    expect(result.icon).toBe("✗")
    expect(result.color).toEqual(theme.error)
  })

  test("error tool with custom error message returns ✗", () => {
    const part = errored({ error: "ENOENT: no such file or directory" })
    const result = status(part, "→", theme)
    expect(result.icon).toBe("✗")
    expect(result.color).toEqual(theme.error)
  })

  describe("permission denied errors return original icon", () => {
    test("rejected permission", () => {
      const part = errored({ error: "The user rejected permission for this tool call" })
      const result = status(part, "$", theme)
      expect(result.icon).toBe("$")
      expect(result.color).toBeUndefined()
    })

    test("specified a rule", () => {
      const part = errored({ error: "The user specified a rule that denied this action" })
      const result = status(part, "→", theme)
      expect(result.icon).toBe("→")
      expect(result.color).toBeUndefined()
    })

    test("user dismissed", () => {
      const part = errored({ error: "The user dismissed the permission prompt" })
      const result = status(part, "✱", theme)
      expect(result.icon).toBe("✱")
      expect(result.color).toBeUndefined()
    })
  })

  test("error message containing denied substring in longer string", () => {
    const part = errored({ error: "Operation failed because user rejected permission for bash" })
    const result = status(part, "$", theme)
    expect(result.icon).toBe("$")
    expect(result.color).toBeUndefined()
  })

  test("preserves tool-specific icons", () => {
    const icons = ["$", "←", "→", "✱", "%", "◇", "◈", "│", "⚙"]
    for (const icon of icons) {
      const result = status(completed(), icon, theme)
      expect(result.icon).toBe(icon)
    }
  })
})
